import eslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.js',
      '**/*.mjs',
      'docs/**',
      '**/vitest.config.ts',
      '**/tsup.config.ts',
      'vitest.workspace.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/__tests__/**'],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': eslint,
    },
    rules: {
      ...eslint.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['apps/cli/**/*.ts', 'apps/stashit/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
