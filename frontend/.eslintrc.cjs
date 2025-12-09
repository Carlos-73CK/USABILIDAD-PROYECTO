module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jsx-a11y', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  settings: { react: { version: '18.0' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'jsx-a11y/no-redundant-roles': 'warn',
    'react/prop-types': 'off',
  },
}
