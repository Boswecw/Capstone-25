module.exports = {
  env: {
    es2021: true,
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Allow console.log in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // Handle unused vars with patterns
    'no-unused-vars': ['error', { 
      'ignoreRestSiblings': true,
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/test*.js', '**/scripts/*.js'],
      rules: {
        'no-unused-vars': 'warn', // More lenient for test files
      },
    },
  ],
};