module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {},
  overrides: [
    {
      files: ['app/**/*.{js,jsx,ts,tsx}', 'lib/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-console': 'error',
      },
    },
    {
      files: ['tests/**/*.{js,jsx,ts,tsx}', 'scripts/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}

