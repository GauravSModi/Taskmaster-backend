/**
 * Unit Tests for Auth Module (components/auth.js)
 *
 * Tests cover:
 * - signup(): User registration with validation and duplicate handling
 * - login(): User authentication with credential verification
 * - assignToken(): JWT token generation
 * - authenticateToken(): JWT middleware for route protection
 *
 * Note: hashPass() and validateUser() are internal functions tested
 * indirectly through signup() and login() tests.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validUser, validUser2, dbInsertResult, dbDuplicateEntryError, dbDuplicateEmailError } = require('../fixtures/testData');

// Mock the database module before importing auth
jest.mock('../../components/database', () => require('../__mocks__/database'));
const mockDb = require('../__mocks__/database');

// Import auth module after mocking
const auth = require('../../components/auth');

describe('Auth Module', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockDb.resetMocks();
    jest.clearAllMocks();
  });

  // ============================================================================
  // signup() TESTS
  // ============================================================================

  describe('signup()', () => {
    describe('Happy Path Tests', () => {
      test('should successfully create a new user with valid credentials', async () => {
        // Arrange: Set up mock to return successful insert
        mockDb.setQueryResult({ insertId: 1, affectedRows: 1 });

        // Act: Call signup with valid credentials
        const result = await auth.signup(
          validUser.username,
          validUser.email,
          validUser.password
        );

        // Assert: Should return success status and user_id
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(200);
        expect(result[1]).toBe(1);
      });

      test('should hash password before storing in database', async () => {
        // Arrange
        const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');
        mockDb.setQueryResult({ insertId: 1, affectedRows: 1 });

        // Act
        await auth.signup('newuser', 'new@email.com', 'plaintextpassword');

        // Assert: bcrypt.hash should be called with password and salt rounds
        expect(bcryptHashSpy).toHaveBeenCalledWith('plaintextpassword', 10);
        bcryptHashSpy.mockRestore();
      });

      test('should use parameterized query to prevent SQL injection', async () => {
        // Arrange
        mockDb.setQueryResult({ insertId: 1 });

        // Act
        await auth.signup('user', 'email@test.com', 'password');

        // Assert: Query should use placeholders
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[0]).toContain('?');
      });
    });

    describe('Edge Cases', () => {
      test('should handle username with special characters', async () => {
        // Arrange
        mockDb.setQueryResult({ insertId: 1 });

        // Act
        const result = await auth.signup(
          "user'with\"special",
          'email@test.com',
          'password123'
        );

        // Assert: Should escape special characters and succeed
        expect(result[0]).toBe(200);
        expect(mockDb.conn.escape).toHaveBeenCalled();
      });

      test('should handle very long username', async () => {
        // Arrange
        const longUsername = 'a'.repeat(255);
        mockDb.setQueryResult({ insertId: 1 });

        // Act
        const result = await auth.signup(longUsername, 'email@test.com', 'password');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle unicode characters in credentials', async () => {
        // Arrange
        mockDb.setQueryResult({ insertId: 1 });

        // Act
        const result = await auth.signup('用户名', 'email@test.com', '密码123');

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 409 for duplicate username', async () => {
        // Arrange: Simulate duplicate username error
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          const error = new Error(dbDuplicateEntryError.message);
          error.code = 'ER_DUP_ENTRY';
          error.message = "Duplicate entry 'testuser' for key 'username'";
          callback(error, null);
        });

        // Act
        const result = await auth.signup('testuser', 'new@email.com', 'password');

        // Assert
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(409);
        expect(result[1]).toBe('duplicate username');
      });

      test('should return 409 for duplicate email', async () => {
        // Arrange: Simulate duplicate email error
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          const error = new Error(dbDuplicateEmailError.message);
          error.code = 'ER_DUP_ENTRY';
          error.message = "Duplicate entry 'test@test.com' for key 'email'";
          callback(error, null);
        });

        // Act
        const result = await auth.signup('newuser', 'existing@email.com', 'password');

        // Assert
        expect(result[0]).toBe(409);
        expect(result[1]).toBe('duplicate email');
      });

      test('should return 500 for database connection error', async () => {
        // Arrange: Simulate connection error
        mockDb.simulateConnectionError(new Error('Connection refused'));

        // Act
        const result = await auth.signup('user', 'email@test.com', 'password');

        // Assert
        expect(result[0]).toBe(500);
        expect(result[1]).toBe('Database Error');
      });
    });
  });

  // ============================================================================
  // login() TESTS
  // ============================================================================

  describe('login()', () => {
    describe('Happy Path Tests', () => {
      test('should successfully login with valid credentials', async () => {
        // Arrange: Mock user exists in database
        const hashedPass = await bcrypt.hash(validUser.password, 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: validUser.username,
          password: hashedPass
        }]);

        // Act
        const result = await auth.login(validUser.username, validUser.password);

        // Assert
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(200);
        expect(result[1]).toBe(1);
      });

      test('should return user_id on successful login', async () => {
        // Arrange
        const hashedPass = await bcrypt.hash('correctpassword', 10);
        mockDb.setQueryResult([{
          user_id: 42,
          username: 'testuser',
          password: hashedPass
        }]);

        // Act
        const result = await auth.login('testuser', 'correctpassword');

        // Assert
        expect(result[1]).toBe(42);
      });
    });

    describe('Edge Cases', () => {
      test('should handle username with leading/trailing spaces as-is', async () => {
        // Arrange: Mock to check if spaces are preserved
        const hashedPass = await bcrypt.hash('password', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: '  spaced  ',
          password: hashedPass
        }]);

        // Act
        const result = await auth.login('  spaced  ', 'password');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should be case-sensitive for username matching', async () => {
        // Arrange: Username not found (case mismatch handled by DB)
        mockDb.setQueryResult([]);

        // Act
        const result = await auth.login('TestUser', 'password');

        // Assert
        expect(result[0]).toBe(401);
      });
    });

    describe('Error Cases', () => {
      test('should return 401 for non-existent username', async () => {
        // Arrange: No user found
        mockDb.setQueryResult([]);

        // Act
        const result = await auth.login('nonexistent', 'password');

        // Assert
        expect(result[0]).toBe(401);
        expect(result[1]).toBe('Login unsuccessful: Incorrect username');
      });

      test('should return 401 for incorrect password', async () => {
        // Arrange: User exists but password doesn't match
        const correctHash = await bcrypt.hash('correctpassword', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: 'testuser',
          password: correctHash
        }]);

        // Act
        const result = await auth.login('testuser', 'wrongpassword');

        // Assert
        expect(result[0]).toBe(401);
        expect(result[1]).toBe('Login unsuccessful: User found, incorrect password');
      });

      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError(new Error('Database unavailable'));

        // Act
        const result = await auth.login('user', 'password');

        // Assert
        expect(result[0]).toBe(500);
        expect(result[1]).toBe('Database Error');
      });

      test('should handle empty password gracefully', async () => {
        // Arrange
        const hashedPass = await bcrypt.hash('realpassword', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: 'testuser',
          password: hashedPass
        }]);

        // Act
        const result = await auth.login('testuser', '');

        // Assert: Should fail password comparison
        expect(result[0]).toBe(401);
      });
    });
  });

  // ============================================================================
  // assignToken() TESTS
  // ============================================================================

  describe('assignToken()', () => {
    describe('Happy Path Tests', () => {
      test('should generate a valid JWT token', () => {
        // Act
        const token = auth.assignToken(1);

        // Assert
        expect(token).toBeValidJWT();
      });

      test('should include user_id in token payload', () => {
        // Act
        const token = auth.assignToken(42);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert
        expect(decoded.user_id).toBe(42);
      });

      test('should set token expiration to 2 hours', () => {
        // Act
        const token = auth.assignToken(1);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert: exp should be approximately 2 hours from now
        const twoHoursFromNow = Math.floor(Date.now() / 1000) + 7200;
        expect(decoded.exp).toBeGreaterThan(twoHoursFromNow - 10);
        expect(decoded.exp).toBeLessThan(twoHoursFromNow + 10);
      });

      test('should generate unique tokens for different users', () => {
        // Act
        const token1 = auth.assignToken(1);
        const token2 = auth.assignToken(2);

        // Assert
        expect(token1).not.toBe(token2);
      });
    });

    describe('Edge Cases', () => {
      test('should handle user_id of 0', () => {
        // Act
        const token = auth.assignToken(0);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert
        expect(decoded.user_id).toBe(0);
      });

      test('should handle large user_id values', () => {
        // Act
        const largeId = 9999999999;
        const token = auth.assignToken(largeId);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert
        expect(decoded.user_id).toBe(largeId);
      });

      test('should handle string user_id (converts to string in payload)', () => {
        // Act
        const token = auth.assignToken('123');
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert
        expect(decoded.user_id).toBe('123');
      });
    });
  });

  // ============================================================================
  // authenticateToken() MIDDLEWARE TESTS
  // ============================================================================

  describe('authenticateToken()', () => {
    // Helper to create valid token
    const createValidToken = (userId = 1) => auth.assignToken(userId);

    describe('Happy Path Tests', () => {
      test('should call next() for valid token', (done) => {
        // Arrange
        const token = createValidToken(42);
        const req = global.testUtils.mockRequest({
          headers: { authorization: `Bearer ${token}` }
        });
        const res = global.testUtils.mockResponse();
        const next = jest.fn(() => {
          // Assert: next should be called with user_id attached
          expect(req.user_id).toBe(42);
          done();
        });

        // Act
        auth.authenticateToken(req, res, next);
      });

      test('should attach user_id to request object', (done) => {
        // Arrange
        const token = createValidToken(123);
        const req = global.testUtils.mockRequest({
          headers: { authorization: `Bearer ${token}` }
        });
        const res = global.testUtils.mockResponse();
        const next = jest.fn(() => {
          // Assert: user_id should be attached
          expect(req.user_id).toBe(123);
          done();
        });

        // Act
        auth.authenticateToken(req, res, next);
      });

      test('should handle Bearer token format correctly', (done) => {
        // Arrange
        const token = createValidToken(1);
        const req = global.testUtils.mockRequest({
          headers: { authorization: `Bearer ${token}` }
        });
        const res = global.testUtils.mockResponse();
        const next = jest.fn(() => done());

        // Act
        auth.authenticateToken(req, res, next);
      });
    });

    describe('Error Cases', () => {
      test('should return 401 when authorization header is missing', () => {
        // Arrange
        const req = global.testUtils.mockRequest({ headers: {} });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should return 401 when token is null', () => {
        // Arrange
        const req = global.testUtils.mockRequest({
          headers: { authorization: 'Bearer ' }
        });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });

      test('should return 401 for invalid token', async () => {
        // Arrange
        const req = global.testUtils.mockRequest({
          headers: { authorization: 'Bearer invalid.token.here' }
        });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Allow async jwt.verify callback to execute
        await new Promise(resolve => setTimeout(resolve, 20));

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should return 401 for expired token', async () => {
        // Arrange: Create an already expired token
        const expiredToken = jwt.sign(
          { user_id: 1 },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '-1h' } // Expired 1 hour ago
        );
        const req = global.testUtils.mockRequest({
          headers: { authorization: `Bearer ${expiredToken}` }
        });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Allow async jwt.verify callback to execute
        await new Promise(resolve => setTimeout(resolve, 20));

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should return 401 for token signed with wrong secret', async () => {
        // Arrange
        const wrongSecretToken = jwt.sign({ user_id: 1 }, 'wrong-secret', { expiresIn: '2h' });
        const req = global.testUtils.mockRequest({
          headers: { authorization: `Bearer ${wrongSecretToken}` }
        });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Allow async jwt.verify callback to execute
        await new Promise(resolve => setTimeout(resolve, 20));

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should return 401 when authorization header has wrong format', () => {
        // Arrange: Missing "Bearer" prefix
        const token = createValidToken(1);
        const req = global.testUtils.mockRequest({
          headers: { authorization: token }
        });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert: Should fail because split(' ')[1] would be undefined
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });
    });

    describe('Edge Cases', () => {
      test('should handle lowercase "bearer" prefix', (done) => {
        // Arrange
        const token = createValidToken(1);
        const req = global.testUtils.mockRequest({
          headers: { authorization: `bearer ${token}` } // lowercase
        });
        const res = global.testUtils.mockResponse();
        const next = jest.fn(() => {
          // Assert: Token extraction works because split(' ')[1] gets the token
          done();
        });

        // Act
        auth.authenticateToken(req, res, next);
      });

      test('should handle extra spaces in authorization header', () => {
        // Arrange
        const token = createValidToken(1);
        const req = global.testUtils.mockRequest({
          headers: { authorization: `Bearer  ${token}` } // extra space
        });
        const res = global.testUtils.mockResponse();
        const next = global.testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert: split(' ')[1] would get empty string, triggering 401
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });
    });
  });
});
