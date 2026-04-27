module.exports = {
  extends: ['react-app', 'react-app/jest', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'testing-library/no-container': 'warn',
    'testing-library/no-node-access': 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['e2e/**/*.ts'],
      rules: {
        'testing-library/no-await-sync-queries': 'off',
        'testing-library/prefer-screen-queries': 'off',
        'no-console': 'off',
      },
    },
  ],
};
