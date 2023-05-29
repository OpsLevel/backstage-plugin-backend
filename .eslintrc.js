const cliConfig = require('@backstage/cli/config/eslint-factory')(__dirname);

module.exports = {
  ...cliConfig,
  ignorePatterns: ["migrations/**", ...cliConfig.ignorePatterns],
  rules: {
    ...cliConfig.rules,
    "indent": ["error", 2],
    "no-new": ["off"],
  }
};
