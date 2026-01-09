/**
 * Jest Configuration
 *
 * Configures Jest for testing the Taskmaster backend application.
 */
module.exports = {
  // Use Node.js test environment
  testEnvironment: 'node',

  // Run setup file before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Module paths for cleaner imports
  moduleDirectories: ['node_modules', 'src'],

  // Coverage configuration
  // Focus on business logic components, exclude infrastructure
  collectCoverageFrom: [
    'components/auth.js',
    'components/todo.js',
    'components/ai.js',
    '!components/database.js',  // Infrastructure - mocked in tests
    '!server.js',               // Entry point - tested via integration tests
    '!**/node_modules/**'
  ],

  // Coverage thresholds (80% minimum for business logic)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Per-file thresholds for components
    './components/auth.js': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './components/todo.js': {
      branches: 65,
      functions: 90,
      lines: 80,
      statements: 80
    },
    './components/ai.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Module name mapper for mocking
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
