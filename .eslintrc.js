const cliConfig = require('@backstage/cli/config/eslint-factory')(__dirname);

module.exports = {
  ...cliConfig,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ...cliConfig.parserOptions,
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [...(cliConfig.plugins || []), '@typescript-eslint'],
  ignorePatterns: ["migrations/**", "dist/**", "dist-types/**", ...cliConfig.ignorePatterns],
  rules: {
    ...cliConfig.rules,
    "indent": ["error", 2],
    "no-new": ["off"],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    ...(cliConfig.overrides || []),
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
};
