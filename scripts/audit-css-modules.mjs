import fs from 'node:fs'
import path from 'node:path'

const componentsDir = path.resolve('src/components')

const collectFilesRecursive = (rootDir, matcher) => {
  const matches = []
  const stack = [rootDir]

  while (stack.length > 0) {
    const currentDir = stack.pop()
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }

      if (entry.isFile() && matcher(entry.name)) {
        matches.push(fullPath)
      }
    }
  }

  return matches
}

const tsxFiles = collectFilesRecursive(componentsDir, (fileName) => fileName.endsWith('.tsx'))
const styleFiles = collectFilesRecursive(componentsDir, (fileName) => /\.module\.(scss|css)$/.test(fileName))

const usageByModule = new Map()

for (const fullPath of tsxFiles) {
  const source = fs.readFileSync(fullPath, 'utf8')
  const importMatches = [
    ...source.matchAll(/import\s+(\w+)\s+from\s+['"]((?:\.|\.\.)\/[^'"]+\.module\.(scss|css))['"]/g),
  ]

  for (const match of importMatches) {
    const alias = match[1]
    const relativePath = match[2]
    const modulePath = path.normalize(path.resolve(path.dirname(fullPath), relativePath))

    if (!usageByModule.has(modulePath)) {
      usageByModule.set(modulePath, new Set())
    }

    const usedClasses = usageByModule.get(modulePath)
    const classMatchRegex = new RegExp(`${alias}\\.([A-Za-z_][A-Za-z0-9_]*)`, 'g')

    for (const classMatch of source.matchAll(classMatchRegex)) {
      usedClasses.add(classMatch[1])
    }
  }
}

const issues = []

for (const styleFile of styleFiles) {
  const source = fs.readFileSync(styleFile, 'utf8')
  const declaredClasses = new Set(
    [...source.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)\s*(?=[,{])/g)].map((match) => match[1]),
  )
  const usedClasses = usageByModule.get(path.normalize(styleFile)) ?? new Set()

  const unused = [...declaredClasses].filter((className) => !usedClasses.has(className)).sort()
  const missing = [...usedClasses].filter((className) => !declaredClasses.has(className)).sort()

  if (unused.length > 0 || missing.length > 0) {
    issues.push({ file: path.relative(process.cwd(), styleFile), unused, missing })
  }
}

if (issues.length === 0) {
  console.log('CSS module audit passed: no missing or unused class names found.')
  process.exit(0)
}

console.error('CSS module audit found issues:')
for (const issue of issues) {
  console.error(`\n- ${issue.file}`)

  if (issue.unused.length > 0) {
    console.error(`  unused: ${issue.unused.join(', ')}`)
  }

  if (issue.missing.length > 0) {
    console.error(`  missing: ${issue.missing.join(', ')}`)
  }
}

process.exit(1)
