/**
 * Mock Database Module
 *
 * This mock replaces the actual MySQL database connection for testing.
 * It provides a controllable mock connection pool that can be configured
 * per test to return specific results or simulate errors.
 */

// Default mock connection behavior
const mockConnection = {
  query: jest.fn(),
  release: jest.fn()
};

// Mock connection pool
const mockPool = {
  getConnection: jest.fn((callback) => {
    callback(null, mockConnection);
  }),
  query: jest.fn(),
  escape: jest.fn((value) => `'${value}'`)
};

/**
 * Helper to configure mock query responses
 *
 * @param {*} error - Error to return (null for success)
 * @param {*} result - Result to return on success
 */
mockConnection.query.mockImplementation((sql, params, callback) => {
  // Default: return empty result
  if (callback) {
    callback(null, []);
  }
});

/**
 * Helper function to reset all mocks between tests
 */
const resetMocks = () => {
  mockConnection.query.mockReset();
  mockConnection.release.mockReset();
  mockPool.getConnection.mockReset();
  mockPool.query.mockReset();
  mockPool.escape.mockReset();

  // Restore default implementations
  mockPool.getConnection.mockImplementation((callback) => {
    callback(null, mockConnection);
  });
  mockPool.escape.mockImplementation((value) => `'${value}'`);
  mockConnection.query.mockImplementation((sql, params, callback) => {
    if (callback) callback(null, []);
  });
};

/**
 * Helper to simulate database connection error
 */
const simulateConnectionError = (error = new Error('Database connection failed')) => {
  mockPool.getConnection.mockImplementation((callback) => {
    callback(error, null);
  });
};

/**
 * Helper to configure specific query result
 *
 * @param {*} result - Result to return
 * @param {Error|null} error - Error to throw (optional)
 */
const setQueryResult = (result, error = null) => {
  mockConnection.query.mockImplementation((sql, params, callback) => {
    if (callback) {
      callback(error, result);
    }
  });
};

/**
 * Helper to set up sequential query results
 *
 * @param {Array} results - Array of {error, result} objects
 */
const setQuerySequence = (results) => {
  let callCount = 0;
  mockConnection.query.mockImplementation((sql, params, callback) => {
    const current = results[callCount] || { error: null, result: [] };
    callCount++;
    if (callback) {
      callback(current.error, current.result);
    }
  });
};

module.exports = {
  conn: mockPool,
  mockConnection,
  resetMocks,
  simulateConnectionError,
  setQueryResult,
  setQuerySequence
};
