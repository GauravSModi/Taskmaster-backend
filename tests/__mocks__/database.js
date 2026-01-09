/**
 * Database Mock Module
 *
 * Provides a complete mock of the MySQL database connection pool
 * for testing without requiring a real database connection.
 *
 * USAGE:
 *   const mockDb = require('../__mocks__/database');
 *
 *   // Set up expected query result (for SELECT queries)
 *   mockDb.setQueryResult([{ id: 1, name: 'Test' }]);
 *
 *   // Set up expected insert result
 *   mockDb.setInsertId(42);
 *
 *   // Simulate errors
 *   mockDb.simulateConnectionError('Connection refused');
 *   mockDb.simulateDuplicateEntry('email');
 *
 *   // Reset between tests
 *   mockDb.resetMocks();
 */

// ============================================================================
// MOCK STATE
// ============================================================================

let mockQueryResult = null;       // Result to return from queries
let mockQueryError = null;        // Error to throw from queries
let mockConnectionError = null;   // Error to throw on connection
let mockInsertId = 1;             // insertId for INSERT queries
let mockAffectedRows = 1;         // affectedRows for UPDATE/DELETE

// ============================================================================
// MOCK CONNECTION
// ============================================================================

/**
 * Mock database connection object
 * Simulates MySQL connection with query and release methods
 */
const mockConnection = {
  query: jest.fn((sql, params, callback) => {
    // Handle both (sql, callback) and (sql, params, callback) signatures
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    // Simulate async database operation
    setImmediate(() => {
      if (mockQueryError) {
        callback(mockQueryError, null);
      } else if (mockQueryResult !== null) {
        // Return explicit query result (for SELECT)
        callback(null, mockQueryResult);
      } else {
        // Return insert/update result object
        callback(null, {
          insertId: mockInsertId,
          affectedRows: mockAffectedRows,
          changedRows: mockAffectedRows
        });
      }
    });
  }),

  release: jest.fn()
};

// ============================================================================
// MOCK CONNECTION POOL
// ============================================================================

/**
 * Error connection - returns errors for all queries
 * Used when simulating connection errors to prevent null reference errors
 */
const errorConnection = {
  query: jest.fn((sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
    }
    // Don't call callback - the error was already handled in getConnection
    // This prevents the code from proceeding with null connection
  }),
  release: jest.fn()
};

/**
 * Mock connection pool object
 * Simulates MySQL connection pool with getConnection method
 */
const mockPool = {
  getConnection: jest.fn((callback) => {
    setImmediate(() => {
      if (mockConnectionError) {
        // Pass error and a dummy connection that does nothing
        // This matches the source code's pattern of not returning after error
        callback(mockConnectionError, errorConnection);
      } else {
        callback(null, mockConnection);
      }
    });
  }),

  query: jest.fn((sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    setImmediate(() => {
      if (mockQueryError) {
        callback(mockQueryError, null);
      } else if (mockQueryResult !== null) {
        callback(null, mockQueryResult);
      } else {
        callback(null, {
          insertId: mockInsertId,
          affectedRows: mockAffectedRows
        });
      }
    });
  }),

  escape: jest.fn((value) => `'${value}'`)
};

// ============================================================================
// MOCK CONTROL FUNCTIONS
// ============================================================================

/**
 * Set the result to return from query operations (for SELECT)
 * @param {Array|Object} result - Query result
 */
const setQueryResult = (result) => {
  mockQueryResult = result;
};

/**
 * Set the error to throw from query operations
 * @param {Error} error - Error to throw
 */
const setQueryError = (error) => {
  mockQueryError = error;
};

/**
 * Set the error to throw on connection
 * @param {Error} error - Connection error
 */
const setConnectionError = (error) => {
  mockConnectionError = error;
};

/**
 * Set the insertId for INSERT queries
 * @param {number} id - Insert ID to return
 */
const setInsertId = (id) => {
  mockInsertId = id;
};

/**
 * Set the affectedRows for UPDATE/DELETE queries
 * @param {number} rows - Number of affected rows
 */
const setAffectedRows = (rows) => {
  mockAffectedRows = rows;
};

/**
 * Reset all mock state to defaults
 * Call this in beforeEach() to ensure clean state between tests
 */
const resetMocks = () => {
  mockQueryResult = null;
  mockQueryError = null;
  mockConnectionError = null;
  mockInsertId = 1;
  mockAffectedRows = 1;
  mockConnection.query.mockClear();
  mockConnection.release.mockClear();
  mockPool.getConnection.mockClear();
  mockPool.query.mockClear();
};

// ============================================================================
// ERROR SIMULATION HELPERS
// ============================================================================

/**
 * Simulate a database connection error
 * @param {string} message - Error message
 */
const simulateConnectionError = (message = 'Database connection failed') => {
  mockConnectionError = new Error(message);
  mockConnectionError.code = 'ECONNREFUSED';
};

/**
 * Simulate a duplicate entry error (unique constraint violation)
 * @param {string} field - Field that has duplicate ('username' or 'email')
 */
const simulateDuplicateEntry = (field) => {
  const error = new Error(`Duplicate entry 'value' for key '${field}'`);
  error.code = 'ER_DUP_ENTRY';
  error.errno = 1062;
  mockQueryError = error;
};

/**
 * Simulate a query timeout error
 */
const simulateTimeout = () => {
  const error = new Error('Query execution was interrupted, maximum statement execution time exceeded');
  error.code = 'ER_QUERY_TIMEOUT';
  mockQueryError = error;
};

/**
 * Simulate a foreign key constraint error
 */
const simulateForeignKeyError = () => {
  const error = new Error('Cannot delete or update a parent row: a foreign key constraint fails');
  error.code = 'ER_ROW_IS_REFERENCED_2';
  mockQueryError = error;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main export (matches real database.js structure)
  conn: mockPool,

  // Exposed for direct access in tests
  mockConnection,
  mockPool,

  // Control functions
  setQueryResult,
  setQueryError,
  setConnectionError,
  setInsertId,
  setAffectedRows,
  resetMocks,

  // Error simulation
  simulateConnectionError,
  simulateDuplicateEntry,
  simulateTimeout,
  simulateForeignKeyError
};
