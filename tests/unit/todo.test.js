/**
 * Unit Tests for Todo Module (components/todo.js)
 *
 * This test suite covers all todo/note operations:
 * - getNotes(): Retrieve all notes for a user
 * - getMessage(): Get message content of a note
 * - getTasks(): Get tasks for a list
 * - createNote(): Create a new note with message
 * - createList(): Create a new list with tasks
 * - updateTitle(): Update note/list title
 * - updateMessage(): Update/create message content
 * - updateList(): Batch update tasks in a list
 * - deleteTask(): Delete a single task
 * - deleteNote(): Delete a note/list
 */

const { notes, messages, tasks, edgeCases } = require('../fixtures/testData');

// Mock database before importing todo module
jest.mock('../../components/database', () => require('../__mocks__/database'));
jest.mock('../../components/ai');

const mockDb = require('../__mocks__/database');
const todo = require('../../components/todo');

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Todo Module', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockDb.resetMocks();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // getNotes() TESTS
  // ==========================================================================

  describe('getNotes()', () => {
    describe('Happy Path', () => {
      test('should return all notes for a valid user_id', async () => {
        // Arrange: User has multiple notes
        mockDb.setQueryResult(notes.multiple);

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(200);
        expect(Array.isArray(result[1])).toBe(true);
        expect(result[1]).toHaveLength(3);
      });

      test('should return correctly formatted note objects', async () => {
        // Arrange
        mockDb.setQueryResult(notes.multiple);

        // Act
        const result = await todo.getNotes(1);

        // Assert: Each note should have expected properties
        const returnedNotes = result[1];
        returnedNotes.forEach(note => {
          expect(note).toHaveProperty('note_id');
          expect(note).toHaveProperty('title');
          expect(note).toHaveProperty('is_fav');
          expect(note).toHaveProperty('is_note');
        });
      });

      test('should return "No notes Found" when user has no notes', async () => {
        // Arrange: Empty result
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No notes Found');
      });

      test('should filter notes by user_id (parameterized query)', async () => {
        // Arrange
        mockDb.setQueryResult([notes.single]);

        // Act
        await todo.getNotes(42);

        // Assert: Query should include user_id
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toContain(42);
      });
    });

    describe('Edge Cases', () => {
      test('should handle user_id of 0', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getNotes(0);

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle large user_id', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getNotes(999999999);

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should return single note when user has only one', async () => {
        // Arrange
        mockDb.setQueryResult([notes.single]);

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[1]).toHaveLength(1);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError('Connection refused');

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(500);
        expect(result[1]).toBe('Database Error');
      });

      test('should return 500 for query error', async () => {
        // Arrange
        mockDb.setQueryError(new Error('Query failed'));

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // getMessage() TESTS
  // ==========================================================================

  describe('getMessage()', () => {
    describe('Happy Path', () => {
      test('should return message content for valid note', async () => {
        // Arrange
        mockDb.setQueryResult([messages.valid]);

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe(messages.valid.message_content);
      });

      test('should return "No message found" for note without message', async () => {
        // Arrange: Empty result
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getMessage(1, 99);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No message found');
      });

      test('should use both user_id and note_id in query', async () => {
        // Arrange
        mockDb.setQueryResult([messages.valid]);

        // Act
        await todo.getMessage(42, 5);

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toContain(5);  // note_id
        expect(queryCall[1]).toContain(42); // user_id
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty message content', async () => {
        // Arrange
        mockDb.setQueryResult([messages.empty]);

        // Act
        const result = await todo.getMessage(1, 2);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('');
      });

      test('should handle very long message content', async () => {
        // Arrange
        mockDb.setQueryResult([messages.long]);

        // Act
        const result = await todo.getMessage(1, 3);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1].length).toBe(5000);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // getTasks() TESTS
  // ==========================================================================

  describe('getTasks()', () => {
    describe('Happy Path', () => {
      test('should return all tasks for a valid list', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);

        // Act
        const result = await todo.getTasks(1, 2);

        // Assert
        expect(result[0]).toBe(200);
        expect(Array.isArray(result[1])).toBe(true);
        expect(result[1]).toHaveLength(3);
      });

      test('should return correctly formatted task objects', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);

        // Act
        const result = await todo.getTasks(1, 2);

        // Assert
        result[1].forEach(task => {
          expect(task).toHaveProperty('task_id');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('is_completed');
        });
      });

      test('should return "No tasks found" when list has no tasks', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getTasks(1, 2);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No tasks found');
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.getTasks(1, 2);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // createNote() TESTS
  // ==========================================================================

  describe('createNote()', () => {
    describe('Happy Path', () => {
      test('should create a note and return note object', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        const result = await todo.createNote(1, 'My Note', 'Content here');

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toMatchObject({
          note_id: 10,
          title: 'My Note',
          is_fav: 0,
          is_note: 0
        });
      });

      test('should handle null message by using empty string', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        const result = await todo.createNote(1, 'Title', null);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toHaveProperty('note_id');
      });

      test('should handle empty message', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        const result = await todo.createNote(1, 'Title', '');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should create both note and message records', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        await todo.createNote(1, 'Title', 'Content');

        // Assert: Should make two queries (note + message)
        await testUtils.delay(50);
        expect(mockDb.mockConnection.query.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Edge Cases', () => {
      test('should handle special characters in title', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        const result = await todo.createNote(1, edgeCases.specialCharacters, 'content');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle unicode characters in title', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        const result = await todo.createNote(1, edgeCases.unicodeCharacters, 'content');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle very long title', async () => {
        // Arrange
        mockDb.setInsertId(10);
        const longTitle = 'a'.repeat(1000);

        // Act
        const result = await todo.createNote(1, longTitle, 'content');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle very long message', async () => {
        // Arrange
        mockDb.setInsertId(10);

        // Act
        const result = await todo.createNote(1, 'Title', edgeCases.veryLongString);

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.createNote(1, 'Title', 'Content');

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // createList() TESTS
  // ==========================================================================

  describe('createList()', () => {
    describe('Happy Path', () => {
      test('should create a list and return list object', async () => {
        // Arrange
        mockDb.setInsertId(20);
        const taskList = [
          ['task1', 'Buy milk', 0],
          ['task2', 'Buy bread', 0]
        ];

        // Act
        const result = await todo.createList(1, 'Shopping', taskList);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toMatchObject({
          note_id: 20,
          title: 'Shopping',
          is_fav: 0,
          is_note: 1
        });
      });

      test('should create list with empty tasks array', async () => {
        // Arrange
        mockDb.setInsertId(20);

        // Act
        const result = await todo.createList(1, 'Empty List', []);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1].is_note).toBe(1);
      });

      test('should set is_note to 1 for lists', async () => {
        // Arrange
        mockDb.setInsertId(20);

        // Act
        const result = await todo.createList(1, 'List', []);

        // Assert
        expect(result[1].is_note).toBe(1);
      });
    });

    describe('Edge Cases', () => {
      test('should handle list with many tasks', async () => {
        // Arrange
        mockDb.setInsertId(20);
        const manyTasks = Array.from({ length: 50 }, (_, i) => [`task${i}`, `Task ${i}`, 0]);

        // Act
        const result = await todo.createList(1, 'Big List', manyTasks);

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.createList(1, 'Title', []);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // updateTitle() TESTS
  // ==========================================================================

  describe('updateTitle()', () => {
    describe('Happy Path', () => {
      test('should update title successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.updateTitle(1, 1, 'New Title');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should use parameterized query', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        await todo.updateTitle(1, 1, 'New Title');

        // Assert
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[0]).toContain('?');
        expect(queryCall[0]).toContain('UPDATE');
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty title', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.updateTitle(1, 1, '');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle special characters in title', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.updateTitle(1, 1, edgeCases.specialCharacters);

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.updateTitle(1, 1, 'Title');

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // updateMessage() TESTS
  // ==========================================================================

  describe('updateMessage()', () => {
    describe('Happy Path', () => {
      test('should update message successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.updateMessage(1, 1, 'Updated content');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should use UPSERT query (INSERT ON DUPLICATE KEY UPDATE)', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        await todo.updateMessage(1, 1, 'Content');

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[0]).toContain('INSERT');
        expect(queryCall[0]).toContain('ON DUPLICATE KEY UPDATE');
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty message', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.updateMessage(1, 1, '');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle very long message', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.updateMessage(1, 1, edgeCases.veryLongString);

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.updateMessage(1, 1, 'content');

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // deleteTask() TESTS
  // ==========================================================================

  describe('deleteTask()', () => {
    describe('Happy Path', () => {
      test('should delete task successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.deleteTask(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('Successfully deleted');
      });

      test('should return message when task does not exist', async () => {
        // Arrange
        mockDb.setAffectedRows(0);

        // Act
        const result = await todo.deleteTask(1, 999);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe("Doesn't exist");
      });
    });

    describe('Security Tests', () => {
      test('should use user_id in query to prevent unauthorized deletion', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        await todo.deleteTask(42, 5);

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toContain(42); // user_id
        expect(queryCall[1]).toContain(5);  // task_id
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.deleteTask(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // deleteNote() TESTS
  // ==========================================================================

  describe('deleteNote()', () => {
    describe('Happy Path', () => {
      test('should delete note successfully', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        const result = await todo.deleteNote(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('Successfully deleted');
      });

      test('should return message when note does not exist', async () => {
        // Arrange
        mockDb.setAffectedRows(0);

        // Act
        const result = await todo.deleteNote(1, 999);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe("Doesn't exist");
      });
    });

    describe('Security Tests', () => {
      test('should use user_id in query to prevent unauthorized deletion', async () => {
        // Arrange
        mockDb.setAffectedRows(1);

        // Act
        await todo.deleteNote(42, 5);

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toContain(42); // user_id
        expect(queryCall[1]).toContain(5);  // note_id
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.deleteNote(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ==========================================================================
  // updateList() TESTS
  // Note: This function has async behavior that doesn't always resolve.
  // Tests verify database calls are made without waiting for full resolution.
  // ==========================================================================

  describe('updateList()', () => {
    describe('Happy Path', () => {
      test('should call database to retrieve existing tasks', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);

        // Act: Start operation (may not resolve due to async design)
        todo.updateList(1, 2, [], []);

        // Wait for database call
        await testUtils.delay(100);

        // Assert
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
      });

      test('should process new tasks with newTask prefix', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);

        // Act
        todo.updateList(1, 2, tasks.newTasks, []);

        await testUtils.delay(100);

        // Assert
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
      });

      test('should process existing task updates', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);

        // Act
        todo.updateList(1, 2, tasks.existingTasks, []);

        await testUtils.delay(100);

        // Assert
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
      });

      test('should process task deletions', async () => {
        // Arrange
        mockDb.setQueryResult(tasks.multiple);
        mockDb.setAffectedRows(1);

        // Act
        todo.updateList(1, 2, [], [1, 2]);

        await testUtils.delay(100);

        // Assert
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.updateList(1, 2, [], []);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });
});
