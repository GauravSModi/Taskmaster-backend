/**
 * Test Data Fixtures
 *
 * Centralized test data for consistent testing across all test suites.
 * Provides sample data for users, notes, tasks, messages, and edge cases.
 */

// ============================================================================
// USER FIXTURES
// ============================================================================

const users = {
  valid: {
    user_id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePass123!'
  },
  alternate: {
    user_id: 2,
    username: 'anotheruser',
    email: 'another@example.com',
    password: 'AnotherPass456!'
  },
  // Bcrypt hash of 'SecurePass123!' with salt rounds 10
  hashedPassword: '$2b$10$abcdefghijklmnopqrstuv.abcdefghijklmnopqrstuv12345678'
};

const credentials = {
  valid: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePass123!'
  },
  invalid: {
    username: 'nonexistent',
    password: 'wrongpassword'
  },
  wrongPassword: {
    username: 'testuser',
    password: 'WrongPassword!'
  }
};

// ============================================================================
// NOTE FIXTURES
// ============================================================================

const notes = {
  single: {
    note_id: 1,
    user_id: 1,
    title: 'Test Note',
    is_favorite: 0,
    is_note: 0
  },
  list: {
    note_id: 2,
    user_id: 1,
    title: 'Shopping List',
    is_favorite: 1,
    is_note: 1
  },
  multiple: [
    { note_id: 1, user_id: 1, title: 'First Note', is_favorite: 0, is_note: 0 },
    { note_id: 2, user_id: 1, title: 'Second Note', is_favorite: 1, is_note: 0 },
    { note_id: 3, user_id: 1, title: 'Task List', is_favorite: 0, is_note: 1 }
  ],
  formatted: [
    { note_id: 1, title: 'First Note', is_fav: 0, is_note: 0 },
    { note_id: 2, title: 'Second Note', is_fav: 1, is_note: 0 },
    { note_id: 3, title: 'Task List', is_fav: 0, is_note: 1 }
  ]
};

// ============================================================================
// MESSAGE FIXTURES
// ============================================================================

const messages = {
  valid: {
    message_id: 1,
    note_id: 1,
    user_id: 1,
    message_content: 'This is the content of my test note. It contains important information.'
  },
  empty: {
    message_id: 2,
    note_id: 2,
    user_id: 1,
    message_content: ''
  },
  long: {
    message_id: 3,
    note_id: 3,
    user_id: 1,
    message_content: 'A'.repeat(5000)
  }
};

// ============================================================================
// TASK FIXTURES
// ============================================================================

const tasks = {
  single: {
    task_id: 1,
    note_id: 2,
    description: 'Buy groceries',
    is_completed: 0,
    user_id: 1
  },
  multiple: [
    { task_id: 1, note_id: 2, description: 'Buy milk', is_completed: 0, user_id: 1 },
    { task_id: 2, note_id: 2, description: 'Buy bread', is_completed: 1, user_id: 1 },
    { task_id: 3, note_id: 2, description: 'Buy eggs', is_completed: 0, user_id: 1 }
  ],
  formatted: [
    { task_id: 1, description: 'Buy milk', is_completed: 0 },
    { task_id: 2, description: 'Buy bread', is_completed: 1 },
    { task_id: 3, description: 'Buy eggs', is_completed: 0 }
  ],
  newTasks: [
    ['newTask1', 'New item 1', 0],
    ['newTask2', 'New item 2', 0]
  ],
  existingTasks: [
    [1, 'Updated milk', 1],
    [2, 'Updated bread', 0]
  ]
};

// ============================================================================
// DATABASE RESULT FIXTURES
// ============================================================================

const dbResults = {
  insert: {
    insertId: 1,
    affectedRows: 1,
    changedRows: 0
  },
  update: {
    insertId: 0,
    affectedRows: 1,
    changedRows: 1
  },
  delete: {
    insertId: 0,
    affectedRows: 1,
    changedRows: 0
  },
  noMatch: {
    insertId: 0,
    affectedRows: 0,
    changedRows: 0
  }
};

// ============================================================================
// AI FIXTURES
// ============================================================================

const ai = {
  validPrompt: 'Create a grocery list for the week',
  validResponse: {
    title: 'Weekly Grocery List',
    points: [
      'Milk',
      'Eggs',
      'Bread',
      'Butter',
      'Cheese',
      'Fruits',
      'Vegetables'
    ]
  },
  openAIResponse: {
    choices: [{
      message: {
        content: JSON.stringify({
          title: 'Weekly Grocery List',
          points: ['Milk', 'Eggs', 'Bread', 'Butter', 'Cheese']
        })
      }
    }]
  },
  emptyChoices: {
    choices: []
  },
  malformedResponse: {
    choices: [{
      message: {
        content: 'This is not valid JSON'
      }
    }]
  }
};

// ============================================================================
// JWT TOKEN FIXTURES
// ============================================================================

const tokens = {
  // These are example tokens - actual tokens generated in tests
  validFormat: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.signature',
  invalidFormat: 'not-a-valid-token',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.signature'
};

// ============================================================================
// EDGE CASE FIXTURES
// ============================================================================

const edgeCases = {
  // String edge cases
  emptyString: '',
  whitespaceOnly: '   ',
  singleChar: 'a',
  veryLongString: 'x'.repeat(10000),

  // Special characters
  specialCharacters: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~',
  unicodeCharacters: '\u4e2d\u6587\u65e5\u672c\u8a9e\ud55c\uad6d\uc5b4',
  emojiCharacters: '\uD83D\uDE00\uD83D\uDC4D\u2764\uFE0F',
  newlines: 'line1\nline2\rline3\r\nline4',
  tabs: 'col1\tcol2\tcol3',

  // Security test cases
  sqlInjection: "'; DROP TABLE users; --",
  xssAttempt: '<script>alert("xss")</script>',
  htmlTags: '<div onclick="malicious()">Click me</div>',

  // Numeric edge cases
  zero: 0,
  negativeOne: -1,
  negativeNumber: -999,
  maxSafeInteger: Number.MAX_SAFE_INTEGER,
  minSafeInteger: Number.MIN_SAFE_INTEGER,
  floatNumber: 3.14159,

  // Null/undefined
  nullValue: null,
  undefinedValue: undefined,

  // Arrays
  emptyArray: [],
  singleElementArray: ['only one'],
  largeArray: Array.from({ length: 1000 }, (_, i) => `item${i}`)
};

// ============================================================================
// HTTP RESPONSE FIXTURES
// ============================================================================

const httpResponses = {
  success: { status: 200, success: 200 },
  created: { status: 201, success: 201 },
  badRequest: { status: 400, message: 'Bad Request' },
  unauthorized: { status: 401, message: 'Unauthorized' },
  forbidden: { status: 403, message: 'Forbidden' },
  notFound: { status: 404, message: 'Not Found' },
  conflict: { status: 409, message: 'Conflict' },
  serverError: { status: 500, message: 'Internal Server Error' }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  users,
  credentials,
  notes,
  messages,
  tasks,
  dbResults,
  ai,
  tokens,
  edgeCases,
  httpResponses
};
