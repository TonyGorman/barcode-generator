import js from '@eslint/js'
import typescriptParser from '@typescript-eslint/parser'
import tseslint from 'typescript-eslint'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import sonarjsPlugin from 'eslint-plugin-sonarjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'scripts/**', 'src/**/*.d.ts'],
  },

  js.configs.recommended,

  // TypeScript strict configs
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // SonarJS plugin
  {
    plugins: {
      sonarjs: sonarjsPlugin,
    },
    rules: {
      ...sonarjsPlugin.configs.recommended.rules,
    },
  },

  // TypeScript files configuration
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Console should not be used directly, to ensure our logging is done in a structured way
      'no-console': 'error',

      // typescript-eslint's no-unused-vars replaces the base rule for TS files
      'no-unused-vars': 'off',

      complexity: ['error', 10],

      // Naming enforcement: fail on declaration names outside the agreed conventions.
      'id-match': [
        'error',
        '^(?:_?[a-z][a-zA-Z0-9]*|_?[A-Z][a-zA-Z0-9]*|[A-Z][A-Z0-9_]*)$',
        {
          onlyDeclarations: true,
          properties: false,
          ignoreDestructuring: true,
        },
      ],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ! assertions are idiomatic in tests; conflicts with non-nullable-type-assertion-style auto-fix
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Enforce type aliases for object shape declarations.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // DOM/testing-library query patterns are safe but sonarjs can't see that
      'sonarjs/null-dereference': 'off',
      // ReactNode functions returning null/undefined is idiomatic React
      'sonarjs/function-return-type': 'off',
      // parameterised tests are a style preference, not enforced here
      'sonarjs/parameterized-tests': 'off',

      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowAny: false,
          allowNullish: false,
          allowRegExp: false,
          allowNever: false,
        },
      ],
    },
  },
)
