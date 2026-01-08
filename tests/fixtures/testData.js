/**
 * Test Data Fixtures
 *
 * This module provides consistent test data for use across all test files.
 * Using shared fixtures ensures test consistency and makes maintenance easier.
 */

// ============================================================================
// USER FIXTURES
// ============================================================================

const validUser = {
  user_id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'SecureP@ssw0rd123'
};

const validUser2 = {
  user_id: 2,
  username: 'anotheruser',
  email: 'another@example.com',
  password: 'AnotherP@ss456'
};

// Pre-hashed password for 'SecureP@ssw0rd123' (bcrypt)
const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const invalidUserInputs = {
  emptyUsername: { username: '', email: 'test@test.com', password: 'password123' },
  emptyEmail: { username: 'testuser', email: '', password: 'password123' },
  emptyPassword: { username: 'testuser', email: 'test@test.com', password: '' },
  nullUsername: { username: null, email: 'test@test.com', password: 'password123' },
  undefinedEmail: { username: 'testuser', password: 'password123' },
  shortPassword: { username: 'testuser', email: 'test@test.com', password: '123' }
};

// ============================================================================
// NOTE FIXTURES
// ============================================================================

const validNote = {
  note_id: 1,
  user_id: 1,
  title: 'Test Note',
  is_favorite: 0,
  is_note: 0
};

const validNotes = [
  { note_id: 1, user_id: 1, title: 'First Note', is_favorite: 0, is_note: 0 },
  { note_id: 2, user_id: 1, title: 'Second Note', is_favorite: 1, is_note: 0 },
  { note_id: 3, user_id: 1, title: 'My List', is_favorite: 0, is_note: 1 }
];

const validMessage = {
  message_id: 1,
  note_id: 1,
  user_id: 1,
  message_content: 'This is the content of my test note.'
};

// ============================================================================
// TASK/LIST FIXTURES
// ============================================================================

const validList = {
  note_id: 3,
  user_id: 1,
  title: 'Shopping List',
  is_favorite: 0,
  is_note: 1
};

const validTasks = [
  { task_id: 1, note_id: 3, user_id: 1, description: 'Buy milk', is_completed: 0 },
  { task_id: 2, note_id: 3, user_id: 1, description: 'Buy bread', is_completed: 1 },
  { task_id: 3, note_id: 3, user_id: 1, description: 'Buy eggs', is_completed: 0 }
];

const newTaskList = [
  ['newTask1', 'New task description', 0],
  ['newTask2', 'Another new task', 1]
];

const updateTaskList = [
  [1, 'Updated milk description', 1],
  [2, 'Updated bread description', 0],
  ['newTask1', 'Brand new task', 0]
];

const deleteTaskList = [3];

// ============================================================================
// JWT TOKEN FIXTURES
// ============================================================================

const validTokenPayload = {
  user_id: 1,
  exp: Math.floor(Date.now() / 1000) + 7200 // 2 hours from now
};

const expiredTokenPayload = {
  user_id: 1,
  exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
};

// ============================================================================
// AI RESPONSE FIXTURES
// ============================================================================

const validAiPrompt = 'Generate a grocery list for a healthy week';

const validAiResponse = {
  title: 'Weekly Healthy Grocery List',
  points: [
    'Fresh vegetables (spinach, broccoli, carrots)',
    'Lean proteins (chicken breast, salmon)',
    'Whole grains (brown rice, quinoa)',
    'Fresh fruits (apples, berries, bananas)',
    'Dairy (Greek yogurt, milk)',
    'Eggs',
    'Olive oil',
    'Nuts and seeds'
  ]
};

const aiOpenAIResponse = {
  choices: [{
    message: {
      content: JSON.stringify(validAiResponse)
    }
  }]
};

// ============================================================================
// DATABASE RESULT FIXTURES
// ============================================================================

const dbInsertResult = {
  insertId: 1,
  affectedRows: 1
};

const dbUpdateResult = {
  affectedRows: 1,
  changedRows: 1
};

const dbDeleteResult = {
  affectedRows: 1
};

const dbNoRowsAffected = {
  affectedRows: 0
};

const dbDuplicateEntryError = {
  code: 'ER_DUP_ENTRY',
  message: "Duplicate entry 'testuser' for key 'username'"
};

const dbDuplicateEmailError = {
  code: 'ER_DUP_ENTRY',
  message: "Duplicate entry 'test@test.com' for key 'email'"
};

// ============================================================================
// HTTP REQUEST/RESPONSE FIXTURES
// ============================================================================

const authHeaders = {
  valid: { authorization: 'Bearer valid.jwt.token' },
  expired: { authorization: 'Bearer expired.jwt.token' },
  invalid: { authorization: 'Bearer invalid' },
  missing: {},
  malformed: { authorization: 'InvalidFormat' }
};

const apiResponses = {
  success: { success: 200, message: 'Operation successful' },
  unauthorized: { success: 401, message: 'Unauthorized' },
  notFound: { success: 404, message: 'Not found' },
  serverError: { success: 500, message: 'Internal server error' }
};

// ============================================================================
// EDGE CASE FIXTURES
// ============================================================================

const edgeCases = {
  emptyString: '',
  whitespaceOnly: '   ',
  veryLongString: 'a'.repeat(10000),
  specialCharacters: '!@#$%^&*()_+-=[]{}|;\':",./<>?`~',
  unicodeCharacters: '你好世界 🌍 مرحبا العالم',
  sqlInjection: "'; DROP TABLE users; --",
  htmlInjection: '<script>alert("xss")</script>',
  negativeNumber: -1,
  zero: 0,
  floatNumber: 1.5,
  maxSafeInteger: Number.MAX_SAFE_INTEGER,
  emptyArray: [],
  emptyObject: {},
  nullValue: null,
  undefinedValue: undefined
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Users
  validUser,
  validUser2,
  hashedPassword,
  invalidUserInputs,

  // Notes
  validNote,
  validNotes,
  validMessage,

  // Lists/Tasks
  validList,
  validTasks,
  newTaskList,
  updateTaskList,
  deleteTaskList,

  // JWT
  validTokenPayload,
  expiredTokenPayload,

  // AI
  validAiPrompt,
  validAiResponse,
  aiOpenAIResponse,

  // Database results
  dbInsertResult,
  dbUpdateResult,
  dbDeleteResult,
  dbNoRowsAffected,
  dbDuplicateEntryError,
  dbDuplicateEmailError,

  // HTTP
  authHeaders,
  apiResponses,

  // Edge cases
  edgeCases
};
