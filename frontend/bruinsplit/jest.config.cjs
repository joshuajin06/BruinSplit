module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.jsx?$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(jsx?)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  testMatch: [
    '**/__tests__/**/*.test.jsx',
    '**/__tests__/**/*.test.js',
    '**/e2e_tests/**/*.test.jsx',
    '**/e2e_tests/**/*.test.js',
    '!**/__tests__/integration.test.js'
  ],
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx}',
    'src/pages/api/**/*.{js,jsx}',
    '!src/**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  verbose: true,
  testTimeout: 10000,
  globals: {
    NODE_ENV: 'test'
  }
};
