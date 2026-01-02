const cliConfig = require('@backstage/cli/config/eslint-factory')(__dirname);

module.exports = {
  ...cliConfig,
  ignorePatterns: ["migrations/**", ...cliConfig.ignorePatterns],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ...cliConfig.parserOptions,
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: [...(cliConfig.plugins || []), '@typescript-eslint'],
  rules: {
    ...cliConfig.rules,
    "indent": ["error", 2],
    "no-new": ["off"],
  }
};
