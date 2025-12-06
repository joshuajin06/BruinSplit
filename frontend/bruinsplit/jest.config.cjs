module.exports = {
  testEnvironment: 'jsdom',
<<<<<<< HEAD
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.jsx?$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/styleMock.js',
  },
  transform: {
    '^.+\\.(jsx?)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  testMatch: [
    '**/__tests__/**/*.test.jsx',
    '**/__tests__/**/*.test.js',
    '**/*.test.jsx',
    '**/*.test.js',
    '!**/__tests__/integration.test.js'
=======
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/styleMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  testMatch: [
    '**/__tests__/**/*.test.[tj]s?(x)',
    '!**/__tests__/integration.test.js',
    '**/?(*.)+(spec|test).[tj]s?(x)'
>>>>>>> 0502c2c1dfd6d4a11ee68b9151211411d7be9f4d
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
