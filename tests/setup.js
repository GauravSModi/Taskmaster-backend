/**
 * Jest Test Setup
 *
 * This file runs before each test suite and sets up the testing environment.
 * It configures environment variables, global mocks, and test utilities.
 */

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-secret-key-for-jwt-signing';
process.env.OPENAI_API_KEY = 'test-openai-api-key';
process.env.LOCAL_HOST = 'localhost';
process.env.LOCAL_USER = 'test';
process.env.LOCAL_PASSWORD = 'test';
process.env.LOCAL_DATABASE = 'test_db';

// Suppress console output during tests (uncomment for cleaner output)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  /**
   * Creates a delay for async testing
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after delay
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generates a random string for unique test data
   * @param {number} length - Length of string
   * @returns {string} Random string
   */
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  /**
   * Creates a mock Express request object
   * @param {Object} options - Request options
   * @returns {Object} Mock request object
   */
  mockRequest: (options = {}) => ({
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user_id: options.user_id || null,
    ...options
  }),

  /**
   * Creates a mock Express response object
   * @returns {Object} Mock response object with jest spies
   */
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    return res;
  },

  /**
   * Creates a mock next function for middleware testing
   * @returns {Function} Mock next function
   */
  mockNext: () => jest.fn()
};

// Extend Jest matchers for better assertions
expect.extend({
  /**
   * Custom matcher to check if a value is a valid JWT token format
   */
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtRegex.test(received);
    return {
      message: () => pass
        ? `expected ${received} not to be a valid JWT format`
        : `expected ${received} to be a valid JWT format`,
      pass
    };
  },

  /**
   * Custom matcher to check if response follows [status, result] tuple format
   */
  toBeStatusTuple(received) {
    const pass = Array.isArray(received) &&
                 received.length >= 1 &&
                 typeof received[0] === 'number';
    return {
      message: () => pass
        ? `expected ${JSON.stringify(received)} not to be a status tuple`
        : `expected ${JSON.stringify(received)} to be a status tuple [status, result]`,
      pass
    };
  }
});

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup logic here
});
