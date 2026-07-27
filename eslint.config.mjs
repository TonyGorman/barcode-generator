import babelParser from '@babel/eslint-parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'scripts/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          plugins: ['@babel/plugin-syntax-typescript', '@babel/plugin-syntax-jsx'],
        },
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      complexity: ['error', 10],
      // Naming enforcement: fail on declaration names outside the agreed conventions.
      'id-match': ['error', '^(?:_?[a-z][a-zA-Z0-9]*|_?[A-Z][a-zA-Z0-9]*|[A-Z][A-Z0-9_]*)$', {
        onlyDeclarations: true,
        properties: false,
        ignoreDestructuring: true,
      }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
