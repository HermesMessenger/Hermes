module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    createDefaultProgram: true,
    ecmaVersion: 2018,
    sourceType: 'module',
    'project': [
      './tsconfig.json',
      './src/tests/tsconfig.json', // Same as server tsconfig
      './src/web/tsconfig.json'
    ]
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    'arrow-parens': ['error', 'as-needed'],
    'padding-line-between-statements': ['error',
      { blankLine: 'always', prev: '*', next: ['return', 'throw'] },
      ...whitespaceRule('const', 'let'),
      ...whitespaceRule('import', 'export')
    ]
  }
}

function whitespaceRule (...rules) {
  return [
    { blankLine: 'always', prev: rules, next: '*'},
    { blankLine: 'any', prev: rules, next: rules}    
  ]
}
