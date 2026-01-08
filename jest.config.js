/**
 * Jest Configuration for Taskmaster Backend
 *
 * This configuration sets up Jest for testing Node.js/Express applications
 * with support for mocking, coverage reporting, and test organization.
 */

module.exports = {
  // Use Node.js test environment for backend testing
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    'components/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],

  // Coverage thresholds
  // Note: Branch coverage is set to 70% due to async callback patterns in the
  // original code that make some error branches difficult to reach in tests.
  // The code has several Promise callbacks that don't always resolve for certain
  // edge cases (a known issue documented in the tests).
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module name mapping for cleaner imports
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles (useful for debugging async issues)
  detectOpenHandles: true
};
