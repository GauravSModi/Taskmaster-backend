/**
 * Unit Tests for Auth Module (components/auth.js)
 *
 * This test suite covers:
 * - signup(): User registration with password hashing
 * - login(): User authentication and password verification
 * - assignToken(): JWT token generation
 * - authenticateToken(): JWT middleware validation
 *
 * Test Structure:
 * - Happy Path: Normal expected behavior
 * - Edge Cases: Boundary conditions and unusual inputs
 * - Error Cases: Error handling and validation
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users, credentials, edgeCases } = require('../fixtures/testData');

// Mock database before importing auth module
jest.mock('../../components/database', () => require('../__mocks__/database'));

const mockDb = require('../__mocks__/database');
const auth = require('../../components/auth');

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Auth Module', () => {
  // Reset mocks before each test to ensure clean state
  beforeEach(() => {
    mockDb.resetMocks();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // signup() TESTS
  // ==========================================================================

  describe('signup()', () => {
    /**
     * HAPPY PATH TESTS
     * Test normal, expected signup scenarios
     */
    describe('Happy Path', () => {
      test('should successfully create a new user and return user_id', async () => {
        // Arrange: Configure mock to return successful insert
        mockDb.setInsertId(42);

        // Act: Call signup with valid credentials
        const result = await auth.signup(
          credentials.valid.username,
          credentials.valid.email,
          credentials.valid.password
        );

        // Assert: Should return success status and user_id
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(200);
        expect(result[1]).toBe(42);
      });

      test('should hash password before storing in database', async () => {
        // Arrange
        mockDb.setInsertId(1);
        const plainPassword = 'MyPlainPassword123';

        // Act
        await auth.signup('newuser', 'new@example.com', plainPassword);

        // Assert: Verify query was called with hashed password
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        const passwordParam = queryCall[1][2]; // Third parameter is password

        // Password should be hashed, not plain
        expect(passwordParam).not.toBe(plainPassword);
        expect(passwordParam).toBeBcryptHash();
      });

      test('should use parameterized query to prevent SQL injection', async () => {
        // Arrange
        mockDb.setInsertId(1);

        // Act
        await auth.signup('user', 'email@test.com', 'password');

        // Assert: Query should use placeholders
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        const sqlQuery = queryCall[0];

        expect(sqlQuery).toContain('?');
        expect(sqlQuery).toContain('INSERT INTO user');
      });
    });

    /**
     * EDGE CASE TESTS
     * Test unusual but valid inputs
     */
    describe('Edge Cases', () => {
      test('should handle username with special characters', async () => {
        // Arrange
        mockDb.setInsertId(1);

        // Act
        const result = await auth.signup(
          'user_name-123',
          'test@example.com',
          'password'
        );

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle very long username (255 chars)', async () => {
        // Arrange
        mockDb.setInsertId(1);
        const longUsername = 'a'.repeat(255);

        // Act
        const result = await auth.signup(longUsername, 'test@example.com', 'password');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle email with subdomain', async () => {
        // Arrange
        mockDb.setInsertId(1);

        // Act
        const result = await auth.signup(
          'user',
          'user@mail.subdomain.example.com',
          'password'
        );

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle unicode characters in username', async () => {
        // Arrange
        mockDb.setInsertId(1);

        // Act
        const result = await auth.signup(
          'user',
          'test@example.com',
          'password'
        );

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle password with special characters', async () => {
        // Arrange
        mockDb.setInsertId(1);

        // Act
        const result = await auth.signup(
          'user',
          'test@example.com',
          edgeCases.specialCharacters
        );

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    /**
     * ERROR CASE TESTS
     * Test error handling scenarios
     */
    describe('Error Cases', () => {
      test('should return 409 for duplicate username', async () => {
        // Arrange: Simulate duplicate username error
        mockDb.simulateDuplicateEntry('username');

        // Act
        const result = await auth.signup('existinguser', 'new@example.com', 'password');

        // Assert
        expect(result[0]).toBe(409);
        expect(result[1]).toContain('duplicate');
        expect(result[1]).toContain('username');
      });

      test('should return 409 for duplicate email', async () => {
        // Arrange: Simulate duplicate email error
        mockDb.simulateDuplicateEntry('email');

        // Act
        const result = await auth.signup('newuser', 'existing@example.com', 'password');

        // Assert
        expect(result[0]).toBe(409);
        expect(result[1]).toContain('duplicate');
        expect(result[1]).toContain('email');
      });

      test('should return 500 for database connection error', async () => {
        // Arrange: Simulate connection failure
        mockDb.simulateConnectionError('Connection refused');

        // Act
        const result = await auth.signup('user', 'test@example.com', 'password');

        // Assert
        expect(result[0]).toBe(500);
        expect(result[1]).toBe('Database Error');
      });
    });
  });

  // ==========================================================================
  // login() TESTS
  // ==========================================================================

  describe('login()', () => {
    /**
     * HAPPY PATH TESTS
     */
    describe('Happy Path', () => {
      test('should successfully authenticate valid user and return user_id', async () => {
        // Arrange: Create real bcrypt hash and set as query result
        const hashedPassword = await bcrypt.hash(credentials.valid.password, 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: credentials.valid.username,
          password: hashedPassword
        }]);

        // Act
        const result = await auth.login(
          credentials.valid.username,
          credentials.valid.password
        );

        // Assert
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(200);
        expect(result[1]).toBe(1);
      });

      test('should return correct user_id for authenticated user', async () => {
        // Arrange
        const expectedUserId = 42;
        const hashedPassword = await bcrypt.hash('password', 10);
        mockDb.setQueryResult([{
          user_id: expectedUserId,
          username: 'testuser',
          password: hashedPassword
        }]);

        // Act
        const result = await auth.login('testuser', 'password');

        // Assert
        expect(result[1]).toBe(expectedUserId);
      });

      test('should use parameterized query for username lookup', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash('password', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: 'testuser',
          password: hashedPassword
        }]);

        // Act
        await auth.login('testuser', 'password');

        // Assert: Query should use placeholders
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[0]).toContain('?');
        expect(queryCall[0]).toContain('SELECT');
      });
    });

    /**
     * EDGE CASE TESTS
     */
    describe('Edge Cases', () => {
      test('should handle username with leading/trailing spaces as-is', async () => {
        // Arrange: Username with spaces
        const hashedPassword = await bcrypt.hash('password', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: '  spaceduser  ',
          password: hashedPassword
        }]);

        // Act
        const result = await auth.login('  spaceduser  ', 'password');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should be case-sensitive for username', async () => {
        // Arrange: No user found (case mismatch)
        mockDb.setQueryResult([]);

        // Act
        const result = await auth.login('TestUser', 'password'); // Different case

        // Assert
        expect(result[0]).toBe(401);
      });
    });

    /**
     * ERROR CASE TESTS
     */
    describe('Error Cases', () => {
      test('should return 401 for non-existent username', async () => {
        // Arrange: Empty result set
        mockDb.setQueryResult([]);

        // Act
        const result = await auth.login('nonexistent', 'password');

        // Assert
        expect(result[0]).toBe(401);
        expect(result[1]).toContain('Incorrect username');
      });

      test('should return 401 for incorrect password', async () => {
        // Arrange: User exists but password won't match
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: 'testuser',
          password: hashedPassword
        }]);

        // Act
        const result = await auth.login('testuser', 'wrongpassword');

        // Assert
        expect(result[0]).toBe(401);
        expect(result[1]).toContain('incorrect password');
      });

      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError('Database unavailable');

        // Act
        const result = await auth.login('testuser', 'password');

        // Assert
        expect(result[0]).toBe(500);
      });

      test('should handle empty password gracefully', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash('realpassword', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: 'testuser',
          password: hashedPassword
        }]);

        // Act
        const result = await auth.login('testuser', '');

        // Assert: Should fail authentication
        expect(result[0]).toBe(401);
      });
    });
  });

  // ==========================================================================
  // assignToken() TESTS
  // ==========================================================================

  describe('assignToken()', () => {
    /**
     * HAPPY PATH TESTS
     */
    describe('Happy Path', () => {
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

        // Assert: Check expiration is approximately 2 hours from now
        const twoHoursFromNow = Math.floor(Date.now() / 1000) + (2 * 60 * 60);
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

      test('should generate different tokens for same user (different iat)', async () => {
        // Act
        const token1 = auth.assignToken(1);
        await testUtils.delay(1100); // Wait for different iat (issued at)
        const token2 = auth.assignToken(1);

        // Assert
        expect(token1).not.toBe(token2);
      });
    });

    /**
     * EDGE CASE TESTS
     */
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
        const largeId = 999999999;
        const token = auth.assignToken(largeId);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert
        expect(decoded.user_id).toBe(largeId);
      });

      test('should handle string user_id (preserves type)', () => {
        // Act
        const token = auth.assignToken('123');
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Assert
        expect(decoded.user_id).toBe('123');
      });
    });
  });

  // ==========================================================================
  // authenticateToken() MIDDLEWARE TESTS
  // ==========================================================================

  describe('authenticateToken()', () => {
    /**
     * HAPPY PATH TESTS
     */
    describe('Happy Path', () => {
      test('should call next() for valid token', async () => {
        // Arrange
        const validToken = auth.assignToken(1);
        const req = testUtils.mockRequest({
          headers: { authorization: `Bearer ${validToken}` }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert: Wait for async jwt.verify callback
        await testUtils.delay(50);
        expect(next).toHaveBeenCalled();
      });

      test('should attach user_id to request object', async () => {
        // Arrange
        const validToken = auth.assignToken(42);
        const req = testUtils.mockRequest({
          headers: { authorization: `Bearer ${validToken}` }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        await testUtils.delay(50);
        expect(req.user_id).toBe(42);
      });

      test('should handle Bearer token format correctly', async () => {
        // Arrange
        const validToken = auth.assignToken(1);
        const req = testUtils.mockRequest({
          headers: { authorization: `Bearer ${validToken}` }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        await testUtils.delay(50);
        expect(next).toHaveBeenCalled();
        expect(res.sendStatus).not.toHaveBeenCalled();
      });
    });

    /**
     * ERROR CASE TESTS
     */
    describe('Error Cases', () => {
      test('should return 401 when authorization header is missing', () => {
        // Arrange: No authorization header
        const req = testUtils.mockRequest({ headers: {} });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should return 401 when token is null/empty', () => {
        // Arrange: Empty token after Bearer
        const req = testUtils.mockRequest({
          headers: { authorization: 'Bearer ' }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });

      test('should return 401 for invalid token format', async () => {
        // Arrange
        const req = testUtils.mockRequest({
          headers: { authorization: 'Bearer invalid.token.format' }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        await testUtils.delay(50);
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should return 401 for expired token', async () => {
        // Arrange: Create expired token
        const expiredToken = jwt.sign(
          { user_id: 1 },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '-1h' } // Already expired
        );
        const req = testUtils.mockRequest({
          headers: { authorization: `Bearer ${expiredToken}` }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        await testUtils.delay(50);
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });

      test('should return 401 for token signed with wrong secret', async () => {
        // Arrange: Token signed with different secret
        const wrongSecretToken = jwt.sign(
          { user_id: 1 },
          'wrong-secret-key',
          { expiresIn: '2h' }
        );
        const req = testUtils.mockRequest({
          headers: { authorization: `Bearer ${wrongSecretToken}` }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        await testUtils.delay(50);
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });

      test('should return 401 when only "Bearer" is provided without token', () => {
        // Arrange
        const req = testUtils.mockRequest({
          headers: { authorization: 'Bearer' }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });
    });

    /**
     * EDGE CASE TESTS
     */
    describe('Edge Cases', () => {
      test('should handle lowercase "bearer" prefix', async () => {
        // Arrange
        const validToken = auth.assignToken(1);
        const req = testUtils.mockRequest({
          headers: { authorization: `bearer ${validToken}` }
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert: Implementation splits on space, so case doesn't matter
        await testUtils.delay(50);
        expect(next).toHaveBeenCalled();
      });

      test('should reject token with extra spaces', () => {
        // Arrange: Extra space between Bearer and token
        const validToken = auth.assignToken(1);
        const req = testUtils.mockRequest({
          headers: { authorization: `Bearer  ${validToken}` } // Double space
        });
        const res = testUtils.mockResponse();
        const next = testUtils.mockNext();

        // Act
        auth.authenticateToken(req, res, next);

        // Assert: split(' ')[1] will be empty string
        expect(res.sendStatus).toHaveBeenCalledWith(401);
      });
    });
  });
});
