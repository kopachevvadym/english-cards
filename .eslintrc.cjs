/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    // Next.js provides the TS/JS parser + sensible defaults
    'next',
    'next/core-web-vitals',

    // Storybook lint rules for stories
    'plugin:storybook/recommended',
  ],
  // Avoid linting build output / vendored assets
  ignorePatterns: ['.next/', 'node_modules/', 'storybook-static/'],
}
