import fs from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.resolve(process.cwd(), 'src');

const HOOK_FILE_PATTERN = /^use[A-Z][a-zA-Z0-9]*\.(ts|tsx)$/;
const COMPONENT_TSX_PATTERN = /^[A-Z][a-zA-Z0-9]*\.tsx$/;
const BOOLEAN_PREFIX_PATTERN = /^(is|has|can|should)[A-Z][a-zA-Z0-9]*$/;
const TEST_FILE_PATTERN = /\.(test|spec)\.tsx?$/;

const EXPORTED_HOOK_PATTERN = /^\s*export\s+(?:const|function)\s+([A-Za-z_][A-Za-z0-9_]*)/;
const BOOLEAN_TYPED_VARIABLE_PATTERN = /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*boolean\b/;
const BOOLEAN_LITERAL_VARIABLE_PATTERN = /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:true|false)\b/;
const BOOLEAN_RETURN_FUNCTION_PATTERN = /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*:\s*boolean\b/;

/** @typedef {{ filePath: string; line: number; message: string }} LintIssue */

/** @type {LintIssue[]} */
const errors = [];
/** @type {LintIssue[]} */
const warnings = [];

const toPosix = (value) => value.split(path.sep).join('/');

const walkFiles = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
};

const getRelativePath = (absolutePath) => {
  return toPosix(path.relative(process.cwd(), absolutePath));
};

const isTsSourceFile = (filePath) => {
  return /\.tsx?$/.test(filePath) && !filePath.endsWith('.d.ts');
};

const isComponentTsxFile = (relativePath, baseName) => {
  if (!relativePath.startsWith('src/components/')) {
    return false;
  }

  if (!baseName.endsWith('.tsx')) {
    return false;
  }

  if (TEST_FILE_PATTERN.test(baseName)) {
    return false;
  }

  return true;
};

const pushIssue = (bucket, filePath, line, message) => {
  bucket.push({ filePath, line, message });
};

const shouldSkipFileForAstChecks = (relativePath) => {
  return relativePath.startsWith('src/test/');
};

const checkFileNameConventions = (absolutePath) => {
  const relativePath = getRelativePath(absolutePath);
  const baseName = path.basename(absolutePath);

  if (relativePath.startsWith('src/hooks/')) {
    if (TEST_FILE_PATTERN.test(baseName)) {
      return;
    }

    if (!HOOK_FILE_PATTERN.test(baseName)) {
      pushIssue(
        errors,
        relativePath,
        1,
        `Hook file names must match useXxx.ts/tsx. Found ${baseName}.`,
      );
    }
  }

  if (isComponentTsxFile(relativePath, baseName) && !COMPONENT_TSX_PATTERN.test(baseName)) {
    pushIssue(
      errors,
      relativePath,
      1,
      `Component TSX file names in src/components must be PascalCase. Found ${baseName}.`,
    );
  }
};

const checkHookExportName = (relativePath, name, lineNumber) => {
  if (!relativePath.startsWith('src/hooks/')) {
    return;
  }

  if (!/^use[A-Z][a-zA-Z0-9]*$/.test(name)) {
    pushIssue(
      errors,
      relativePath,
      lineNumber,
      `Exported hooks in src/hooks must be prefixed with useXxx. Found ${name}.`,
    );
  }
};

const checkBooleanIdentifierName = (relativePath, name, lineNumber) => {
  if (name === '_exhaustiveCheck') {
    return;
  }

  if (!BOOLEAN_PREFIX_PATTERN.test(name)) {
    pushIssue(
      warnings,
      relativePath,
      lineNumber,
      `Boolean-like identifier should start with is/has/can/should. Found ${name}.`,
    );
  }
};

const checkSourceConventions = (absolutePath) => {
  const relativePath = getRelativePath(absolutePath);

  if (!isTsSourceFile(absolutePath) || shouldSkipFileForAstChecks(relativePath)) {
    return;
  }

  const sourceText = fs.readFileSync(absolutePath, 'utf8');
  const lines = sourceText.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    const exportedHookMatch = line.match(EXPORTED_HOOK_PATTERN);
    if (exportedHookMatch) {
      checkHookExportName(relativePath, exportedHookMatch[1], lineNumber);
    }

    const boolTypedVarMatch = line.match(BOOLEAN_TYPED_VARIABLE_PATTERN);
    if (boolTypedVarMatch) {
      checkBooleanIdentifierName(relativePath, boolTypedVarMatch[1], lineNumber);
    }

    const boolLiteralVarMatch = line.match(BOOLEAN_LITERAL_VARIABLE_PATTERN);
    if (boolLiteralVarMatch) {
      checkBooleanIdentifierName(relativePath, boolLiteralVarMatch[1], lineNumber);
    }

    const boolFnMatch = line.match(BOOLEAN_RETURN_FUNCTION_PATTERN);
    if (boolFnMatch) {
      checkBooleanIdentifierName(relativePath, boolFnMatch[1], lineNumber);
    }
  });
};

const allSourceFiles = walkFiles(SRC_ROOT);
for (const filePath of allSourceFiles) {
  checkFileNameConventions(filePath);
  checkSourceConventions(filePath);
}

const printIssueList = (label, issueList) => {
  if (issueList.length === 0) {
    return;
  }

  console.log(`\n${label}:`);
  for (const issue of issueList) {
    console.log(`- ${issue.filePath}:${issue.line} ${issue.message}`);
  }
};

printIssueList('Naming Errors', errors);
printIssueList('Naming Warnings', warnings);

if (errors.length > 0) {
  console.error(`\nNaming lint failed with ${errors.length} error(s).`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn(`\nNaming lint completed with ${warnings.length} warning(s).`);
}
