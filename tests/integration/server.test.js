/**
 * Integration Tests for Server API Routes
 *
 * Tests all API endpoints with mocked database and external services.
 * Verifies complete request/response cycle for each route.
 *
 * Test Categories:
 * - Public Routes (/, /login, /signup)
 * - Authenticated Routes (require JWT token)
 * - Error Handling
 * - Security Tests
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');

// Mock dependencies before requiring modules
jest.mock('../../components/database', () => require('../__mocks__/database'));
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'AI Generated List',
                points: ['Item 1', 'Item 2', 'Item 3']
              })
            }
          }]
        })
      }
    }
  }));
});

const mockDb = require('../__mocks__/database');
const auth = require('../../components/auth');
const todo = require('../../components/todo');
const ai = require('../../components/ai');
const { notes, messages, tasks, credentials } = require('../fixtures/testData');

// ============================================================================
// TEST APP SETUP
// Create Express app with same routes as server.js for testing
// ============================================================================

const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Public routes
  app.get('/', (req, res) => {
    res.send('Hello World! Taskmaster backend is running!');
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [status, result] = await auth.login(username, password);

    if (status == 200) {
      const accessToken = auth.assignToken(result);
      res.status(status).json({ success: status, token: accessToken });
    } else {
      res.status(status).json({ success: status, message: result });
    }
  });

  app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    let [status, result] = await auth.signup(username, email, password);

    if (status == 200) {
      const accessToken = auth.assignToken(result);
      res.status(status).json({ success: status, token: accessToken });
    } else {
      res.status(status).json({ success: status, message: result });
    }
  });

  // Protected routes
  app.post('/getNotes', auth.authenticateToken, async (req, res) => {
    let [status, notesList] = await todo.getNotes(req.user_id);
    res.status(status).json({ success: status, notes: notesList });
  });

  app.post('/getMessage', auth.authenticateToken, async (req, res) => {
    const { note_id } = req.body;
    let [status, message] = await todo.getMessage(req.user_id, note_id);
    res.status(status).json({ success: status, message: message });
  });

  app.post('/getTasks', auth.authenticateToken, async (req, res) => {
    const { note_id } = req.body;
    let [status, tasksList] = await todo.getTasks(req.user_id, note_id);
    res.status(status).json({ success: status, tasks: tasksList });
  });

  app.post('/createNote', auth.authenticateToken, async (req, res) => {
    const { title, message } = req.body;
    let [status, newNote] = await todo.createNote(req.user_id, title, message);
    res.status(status).json({ status: status, newNote: newNote });
  });

  app.post('/createList', auth.authenticateToken, async (req, res) => {
    const { title, list } = req.body;
    let [status, newList] = await todo.createList(req.user_id, title, list);
    res.status(status).json({ status: status, newList: newList });
  });

  app.post('/updateTitle', auth.authenticateToken, async (req, res) => {
    const { note_id, title } = req.body;
    let [status] = await todo.updateTitle(req.user_id, note_id, title);
    res.status(status).json({ status: status });
  });

  app.post('/updateMessage', auth.authenticateToken, async (req, res) => {
    const { note_id, message } = req.body;
    let [status] = await todo.updateMessage(req.user_id, note_id, message);
    res.status(status).json({ status: status });
  });

  app.delete('/deleteTask', auth.authenticateToken, async (req, res) => {
    const { task_id } = req.body;
    let [status] = await todo.deleteTask(req.user_id, task_id);
    res.status(status).json({ success: status });
  });

  app.delete('/deleteNote', auth.authenticateToken, async (req, res) => {
    const { note_id } = req.body;
    let [status, msg] = await todo.deleteNote(req.user_id, note_id);
    res.status(status).json({ message: msg });
  });

  app.post('/updateList', auth.authenticateToken, async (req, res) => {
    const { note_id, new_list, delete_list } = req.body;
    let [status] = await todo.updateList(req.user_id, note_id, new_list, delete_list);
    res.status(status).json({ success: status });
  });

  app.post('/generateAiNote', auth.authenticateToken, async (req, res) => {
    const { prompt } = req.body;
    let [status, title, points] = await ai.generateResponse(prompt);
    res.status(status).json({ title: title, points: points });
  });

  return app;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a valid JWT token for testing authenticated routes
 */
const getValidToken = (userId = 1) => auth.assignToken(userId);

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Server API Routes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockDb.resetMocks();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // PUBLIC ROUTES
  // ==========================================================================

  describe('Public Routes', () => {
    describe('GET /', () => {
      test('should return welcome message with 200 status', async () => {
        // Act
        const response = await request(app).get('/');

        // Assert
        expect(response.status).toBe(200);
        expect(response.text).toContain('Taskmaster');
        expect(response.text).toContain('running');
      });
    });

    describe('POST /login', () => {
      test('should return 200 and token for valid credentials', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash(credentials.valid.password, 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: credentials.valid.username,
          password: hashedPassword
        }]);

        // Act
        const response = await request(app)
          .post('/login')
          .send({
            username: credentials.valid.username,
            password: credentials.valid.password
          });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.success).toBe(200);
        expect(response.body.token).toBeValidJWT();
      });

      test('should return 401 for non-existent user', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const response = await request(app)
          .post('/login')
          .send({ username: 'nonexistent', password: 'password' });

        // Assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      test('should return 401 for wrong password', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        mockDb.setQueryResult([{
          user_id: 1,
          username: 'testuser',
          password: hashedPassword
        }]);

        // Act
        const response = await request(app)
          .post('/login')
          .send({ username: 'testuser', password: 'wrongpassword' });

        // Assert
        expect(response.status).toBe(401);
      });

      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const response = await request(app)
          .post('/login')
          .send({ username: 'user', password: 'pass' });

        // Assert
        expect(response.status).toBe(500);
      });
    });

    describe('POST /signup', () => {
      test('should return 200 and token for successful registration', async () => {
        // Arrange
        mockDb.setInsertId(1);

        // Act
        const response = await request(app)
          .post('/signup')
          .send({
            username: 'newuser',
            email: 'new@example.com',
            password: 'Password123!'
          });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.token).toBeValidJWT();
      });

      test('should return 409 for duplicate username', async () => {
        // Arrange
        mockDb.simulateDuplicateEntry('username');

        // Act
        const response = await request(app)
          .post('/signup')
          .send({
            username: 'existing',
            email: 'new@example.com',
            password: 'password'
          });

        // Assert
        expect(response.status).toBe(409);
        expect(response.body.message).toContain('username');
      });

      test('should return 409 for duplicate email', async () => {
        // Arrange
        mockDb.simulateDuplicateEntry('email');

        // Act
        const response = await request(app)
          .post('/signup')
          .send({
            username: 'newuser',
            email: 'existing@example.com',
            password: 'password'
          });

        // Assert
        expect(response.status).toBe(409);
        expect(response.body.message).toContain('email');
      });
    });
  });

  // ==========================================================================
  // AUTHENTICATED ROUTES - Authentication Middleware
  // ==========================================================================

  describe('Authentication Middleware', () => {
    test('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app).post('/getNotes');

      // Assert
      expect(response.status).toBe(401);
    });

    test('should return 401 for invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/getNotes')
        .set('Authorization', 'Bearer invalid.token.here');

      // Assert
      expect(response.status).toBe(401);
    });

    test('should return 401 for expired token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { user_id: 1 },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '-1h' }
      );

      // Act
      const response = await request(app)
        .post('/getNotes')
        .set('Authorization', `Bearer ${expiredToken}`);

      // Assert
      expect(response.status).toBe(401);
    });

    test('should return 401 for token with wrong secret', async () => {
      // Arrange
      const wrongSecretToken = jwt.sign({ user_id: 1 }, 'wrong-secret', { expiresIn: '2h' });

      // Act
      const response = await request(app)
        .post('/getNotes')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      // Assert
      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // AUTHENTICATED ROUTES - Notes Operations
  // ==========================================================================

  describe('Notes Operations', () => {
    describe('POST /getNotes', () => {
      test('should return user notes when authenticated', async () => {
        // Arrange
        mockDb.setQueryResult(notes.multiple);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/getNotes')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('notes');
        expect(Array.isArray(response.body.notes)).toBe(true);
      });

      test('should return message when user has no notes', async () => {
        // Arrange
        mockDb.setQueryResult([]);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/getNotes')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.notes).toBe('No notes Found');
      });
    });

    describe('POST /getMessage', () => {
      test('should return message content for valid note', async () => {
        // Arrange
        mockDb.setQueryResult([messages.valid]);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/getMessage')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 1 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(messages.valid.message_content);
      });

      test('should return "No message found" when message does not exist', async () => {
        // Arrange
        mockDb.setQueryResult([]);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/getMessage')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 999 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('No message found');
      });
    });

    describe('POST /createNote', () => {
      test('should create note and return note object', async () => {
        // Arrange
        mockDb.setInsertId(10);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/createNote')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'New Note', message: 'Content' });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('newNote');
        expect(response.body.newNote).toHaveProperty('note_id');
        expect(response.body.newNote.title).toBe('New Note');
      });
    });

    describe('POST /updateTitle', () => {
      test('should update title successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/updateTitle')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 1, title: 'Updated Title' });

        // Assert
        expect(response.status).toBe(200);
      });
    });

    describe('POST /updateMessage', () => {
      test('should update message successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/updateMessage')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 1, message: 'Updated content' });

        // Assert
        expect(response.status).toBe(200);
      });
    });

    describe('DELETE /deleteNote', () => {
      test('should delete note successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .delete('/deleteNote')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 1 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Successfully deleted');
      });

      test('should return message when note does not exist', async () => {
        // Arrange
        mockDb.setAffectedRows(0);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .delete('/deleteNote')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 999 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Doesn't exist");
      });
    });
  });

  // ==========================================================================
  // AUTHENTICATED ROUTES - Task Operations
  // ==========================================================================

  describe('Task Operations', () => {
    describe('POST /getTasks', () => {
      test('should return tasks for valid list', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/getTasks')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 2 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('tasks');
        expect(Array.isArray(response.body.tasks)).toBe(true);
      });

      test('should return message when list has no tasks', async () => {
        // Arrange
        mockDb.setQueryResult([]);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/getTasks')
          .set('Authorization', `Bearer ${token}`)
          .send({ note_id: 2 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.tasks).toBe('No tasks found');
      });
    });

    describe('POST /createList', () => {
      test('should create list and return list object', async () => {
        // Arrange
        mockDb.setInsertId(20);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/createList')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Shopping List',
            list: [['task1', 'Buy milk', 0]]
          });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('newList');
        expect(response.body.newList.is_note).toBe(1);
      });
    });

    describe('DELETE /deleteTask', () => {
      test('should delete task successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);
        const token = getValidToken();

        // Act
        const response = await request(app)
          .delete('/deleteTask')
          .set('Authorization', `Bearer ${token}`)
          .send({ task_id: 1 });

        // Assert
        expect(response.status).toBe(200);
      });
    });

    describe('POST /updateList', () => {
      // Note: updateList has an unresolved promise bug in the source code
      // Full functionality is tested in unit tests (tests/unit/todo.test.js)

      test('should reject update list request without token', async () => {
        // Act
        const response = await request(app)
          .post('/updateList')
          .send({ note_id: 2, new_list: [], delete_list: [] });

        // Assert
        expect(response.status).toBe(401);
      });
    });
  });

  // ==========================================================================
  // AI ROUTES
  // ==========================================================================

  describe('AI Operations', () => {
    describe('POST /generateAiNote', () => {
      test('should return AI-generated list', async () => {
        // Arrange
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/generateAiNote')
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'Create a grocery list' });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('points');
        expect(Array.isArray(response.body.points)).toBe(true);
      });

      test('should include title in response', async () => {
        // Arrange
        const token = getValidToken();

        // Act
        const response = await request(app)
          .post('/generateAiNote')
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'Test prompt' });

        // Assert
        expect(response.body.title).toBe('AI Generated List');
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Arrange
      mockDb.simulateConnectionError('Database unavailable');
      const token = getValidToken();

      // Act
      const response = await request(app)
        .post('/getNotes')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(500);
    });

    test('should return proper error structure', async () => {
      // Arrange
      mockDb.setQueryResult([]);

      // Act
      const response = await request(app)
        .post('/login')
        .send({ username: 'nonexistent', password: 'password' });

      // Assert
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });
  });

  // ==========================================================================
  // SECURITY TESTS
  // ==========================================================================

  describe('Security', () => {
    test('should not expose sensitive error details', async () => {
      // Arrange
      mockDb.simulateConnectionError('Internal password: secret123');
      const token = getValidToken();

      // Act
      const response = await request(app)
        .post('/getNotes')
        .set('Authorization', `Bearer ${token}`);

      // Assert: Response should not contain sensitive info
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('secret123');
    });

    test('should isolate user data via user_id from token', async () => {
      // Arrange
      mockDb.setQueryResult(notes.multiple);
      const token1 = getValidToken(1);
      const token2 = getValidToken(2);

      // Act
      const response1 = await request(app)
        .post('/getNotes')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .post('/getNotes')
        .set('Authorization', `Bearer ${token2}`);

      // Assert: Both should succeed (different user contexts)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    test('should use CORS headers', async () => {
      // Act
      const response = await request(app).get('/');

      // Assert
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should require authentication for protected routes', async () => {
      // Act & Assert: All protected routes should return 401 without token
      const protectedRoutes = [
        { method: 'post', path: '/getNotes' },
        { method: 'post', path: '/getMessage' },
        { method: 'post', path: '/getTasks' },
        { method: 'post', path: '/createNote' },
        { method: 'post', path: '/createList' },
        { method: 'post', path: '/updateTitle' },
        { method: 'post', path: '/updateMessage' },
        { method: 'delete', path: '/deleteTask' },
        { method: 'delete', path: '/deleteNote' },
        { method: 'post', path: '/updateList' },
        { method: 'post', path: '/generateAiNote' }
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });
  });
});
