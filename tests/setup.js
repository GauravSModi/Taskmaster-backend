/**
 * Jest Test Setup
 *
 * This file runs before each test suite and configures the test environment.
 * It sets up environment variables, global utilities, and custom matchers.
 */

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

// Set test environment variables BEFORE any module imports
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.OPENAI_API_KEY = 'test-openai-api-key-sk-xxxxx';
process.env.LOCAL_HOST = 'localhost';
process.env.LOCAL_USER = 'test_user';
process.env.LOCAL_PASSWORD = 'test_password';
process.env.LOCAL_DATABASE = 'test_taskmaster';

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

global.testUtils = {
  /**
   * Creates a delay for async testing
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Resolves after delay
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generates a random string for unique test data
   * @param {number} length - Length of string to generate
   * @returns {string} Random alphanumeric string
   */
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
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
   * Creates a mock Express response object with chainable methods
   * @returns {Object} Mock response object
   */
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
  },

  /**
   * Creates a mock next function for middleware testing
   * @returns {jest.Mock} Mock next function
   */
  mockNext: () => jest.fn()
};

// ============================================================================
// CUSTOM JEST MATCHERS
// ============================================================================

expect.extend({
  /**
   * Validates that a value is a properly formatted JWT token
   * JWT format: xxxxx.yyyyy.zzzzz (three base64url parts separated by dots)
   */
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    return {
      message: () => pass
        ? `expected ${received} not to be a valid JWT format`
        : `expected ${received} to be a valid JWT format (xxxxx.yyyyy.zzzzz)`,
      pass
    };
  },

  /**
   * Validates that a value is a status tuple [statusCode, result]
   * Used for validating function return formats
   */
  toBeStatusTuple(received) {
    const pass = Array.isArray(received) &&
                 received.length >= 1 &&
                 typeof received[0] === 'number' &&
                 received[0] >= 100 &&
                 received[0] < 600;
    return {
      message: () => pass
        ? `expected ${JSON.stringify(received)} not to be a status tuple`
        : `expected ${JSON.stringify(received)} to be a status tuple [httpStatus, result?]`,
      pass
    };
  },

  /**
   * Validates that a value is a valid HTTP status code
   */
  toBeValidHttpStatus(received) {
    const pass = typeof received === 'number' &&
                 received >= 100 &&
                 received < 600;
    return {
      message: () => pass
        ? `expected ${received} not to be a valid HTTP status code`
        : `expected ${received} to be a valid HTTP status code (100-599)`,
      pass
    };
  },

  /**
   * Validates that a bcrypt hash is properly formatted
   */
  toBeBcryptHash(received) {
    const bcryptRegex = /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
    const pass = typeof received === 'string' && bcryptRegex.test(received);
    return {
      message: () => pass
        ? `expected ${received} not to be a bcrypt hash`
        : `expected ${received} to be a valid bcrypt hash`,
      pass
    };
  }
});

// ============================================================================
// GLOBAL HOOKS
// ============================================================================

// Suppress console output during tests (uncomment for cleaner output)
// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'error').mockImplementation(() => {});
//   jest.spyOn(console, 'warn').mockImplementation(() => {});
// });

// afterAll(() => {
//   jest.restoreAllMocks();
// });

// Clean up after all tests
afterAll(async () => {
  // Allow time for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
