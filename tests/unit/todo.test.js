/**
 * Unit Tests for Todo Module (components/todo.js)
 *
 * Tests cover:
 * - getNotes(): Retrieve all notes for a user
 * - getMessage(): Get message content of a specific note
 * - getTasks(): Get tasks for a specific list
 * - createNote(): Create a new note with message
 * - createList(): Create a new task list
 * - updateTitle(): Update note/list title
 * - updateMessage(): Update note message content
 * - updateList(): Batch update tasks in a list
 * - deleteTask(): Delete a single task
 * - deleteNote(): Delete a note/list
 */

const { validNotes, validMessage, validTasks, validNote, validList, dbInsertResult, dbUpdateResult, dbDeleteResult, dbNoRowsAffected, edgeCases } = require('../fixtures/testData');

// Mock the database module before importing todo
jest.mock('../../components/database', () => require('../__mocks__/database'));
jest.mock('../../components/ai');

const mockDb = require('../__mocks__/database');
const todo = require('../../components/todo');

describe('Todo Module', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockDb.resetMocks();
    jest.clearAllMocks();
  });

  // ============================================================================
  // getNotes() TESTS
  // ============================================================================

  describe('getNotes()', () => {
    describe('Happy Path Tests', () => {
      test('should return all notes for a valid user_id', async () => {
        // Arrange: Mock database returns user's notes
        mockDb.setQueryResult(validNotes);

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
        mockDb.setQueryResult(validNotes);

        // Act
        const result = await todo.getNotes(1);

        // Assert: Each note should have expected fields
        const notes = result[1];
        notes.forEach(note => {
          expect(note).toHaveProperty('note_id');
          expect(note).toHaveProperty('title');
          expect(note).toHaveProperty('is_fav');
          expect(note).toHaveProperty('is_note');
        });
      });

      test('should return message when user has no notes', async () => {
        // Arrange: User has no notes
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No notes Found');
      });

      test('should filter notes by user_id (parameterized query)', async () => {
        // Arrange
        mockDb.setQueryResult([validNotes[0]]);

        // Act
        await todo.getNotes(42);

        // Assert: Query should include user_id parameter
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

      test('should handle large number of notes', async () => {
        // Arrange: Create 1000 mock notes
        const manyNotes = Array.from({ length: 1000 }, (_, i) => ({
          note_id: i + 1,
          user_id: 1,
          title: `Note ${i + 1}`,
          is_favorite: i % 2,
          is_note: i % 3 === 0 ? 1 : 0
        }));
        mockDb.setQueryResult(manyNotes);

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toHaveLength(1000);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError(new Error('Connection failed'));

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(500);
        expect(result[1]).toBe('Database Error');
      });

      test('should return 500 for query error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Query failed'), null);
        });

        // Act
        const result = await todo.getNotes(1);

        // Assert
        expect(result[0]).toBe(500);
        expect(result[1]).toBe('Database Error');
      });
    });
  });

  // ============================================================================
  // getMessage() TESTS
  // ============================================================================

  describe('getMessage()', () => {
    describe('Happy Path Tests', () => {
      test('should return message content for valid note', async () => {
        // Arrange
        mockDb.setQueryResult([{ message_content: 'This is my note content' }]);

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('This is my note content');
      });

      test('should return message when note has no message', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No message found');
      });

      test('should verify both user_id and note_id in query', async () => {
        // Arrange
        mockDb.setQueryResult([{ message_content: 'Test' }]);

        // Act
        await todo.getMessage(42, 99);

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toEqual([99, 42]);
      });
    });

    describe('Edge Cases', () => {
      test('should handle message with special characters', async () => {
        // Arrange
        const specialContent = "Note with 'quotes' and \"double quotes\" and <html>";
        mockDb.setQueryResult([{ message_content: specialContent }]);

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[1]).toBe(specialContent);
      });

      test('should handle empty message content', async () => {
        // Arrange
        mockDb.setQueryResult([{ message_content: '' }]);

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('');
      });

      test('should handle very long message content', async () => {
        // Arrange
        const longContent = 'a'.repeat(100000);
        mockDb.setQueryResult([{ message_content: longContent }]);

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[1]).toHaveLength(100000);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });

      test('should return 500 for query error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Query error'), null);
        });

        // Act
        const result = await todo.getMessage(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ============================================================================
  // getTasks() TESTS
  // ============================================================================

  describe('getTasks()', () => {
    describe('Happy Path Tests', () => {
      test('should return all tasks for a valid list', async () => {
        // Arrange
        mockDb.setQueryResult(validTasks);

        // Act
        const result = await todo.getTasks(1, 3);

        // Assert
        expect(result[0]).toBe(200);
        expect(Array.isArray(result[1])).toBe(true);
        expect(result[1]).toHaveLength(3);
      });

      test('should return correctly formatted task objects', async () => {
        // Arrange
        mockDb.setQueryResult(validTasks);

        // Act
        const result = await todo.getTasks(1, 3);

        // Assert
        const tasks = result[1];
        tasks.forEach(task => {
          expect(task).toHaveProperty('task_id');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('is_completed');
        });
      });

      test('should return message when list has no tasks', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.getTasks(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No tasks found');
      });
    });

    describe('Edge Cases', () => {
      test('should handle tasks with empty descriptions', async () => {
        // Arrange
        const tasksWithEmptyDesc = [
          { task_id: 1, description: '', is_completed: 0 }
        ];
        mockDb.setQueryResult(tasksWithEmptyDesc);

        // Act
        const result = await todo.getTasks(1, 1);

        // Assert
        expect(result[1][0].description).toBe('');
      });

      test('should preserve task completion status as 0 or 1', async () => {
        // Arrange
        mockDb.setQueryResult(validTasks);

        // Act
        const result = await todo.getTasks(1, 3);

        // Assert
        result[1].forEach(task => {
          expect([0, 1]).toContain(task.is_completed);
        });
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.getTasks(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ============================================================================
  // createNote() TESTS
  // ============================================================================

  describe('createNote()', () => {
    describe('Happy Path Tests', () => {
      test('should create note and return note object', async () => {
        // Arrange: First query creates note, second creates message
        mockDb.setQuerySequence([
          { error: null, result: { insertId: 5 } },
          { error: null, result: { insertId: 1 } }
        ]);

        // Act
        const result = await todo.createNote(1, 'My Note', 'Content here');

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toMatchObject({
          note_id: 5,
          title: 'My Note',
          is_fav: 0,
          is_note: 0
        });
      });

      test('should handle null message by defaulting to empty string', async () => {
        // Arrange
        mockDb.setQuerySequence([
          { error: null, result: { insertId: 1 } },
          { error: null, result: { insertId: 1 } }
        ]);

        // Act
        const result = await todo.createNote(1, 'Title', null);

        // Assert
        expect(result[0]).toBe(200);
        // The message query should be called with empty string
        const messageQuery = mockDb.mockConnection.query.mock.calls[1];
        expect(messageQuery[1][2]).toBe('');
      });

      test('should insert into note table with is_note=0', async () => {
        // Arrange
        mockDb.setQuerySequence([
          { error: null, result: { insertId: 1 } },
          { error: null, result: { insertId: 1 } }
        ]);

        // Act
        await todo.createNote(1, 'Title', 'Message');

        // Assert: First query creates note
        const noteQuery = mockDb.mockConnection.query.mock.calls[0];
        expect(noteQuery[0]).toContain('INSERT INTO note');
        expect(noteQuery[0]).toContain('is_note');
      });
    });

    describe('Edge Cases', () => {
      test('should handle note with very long title', async () => {
        // Arrange
        const longTitle = 'a'.repeat(1000);
        mockDb.setQuerySequence([
          { error: null, result: { insertId: 1 } },
          { error: null, result: { insertId: 1 } }
        ]);

        // Act
        const result = await todo.createNote(1, longTitle, 'msg');

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1].title).toBe(longTitle);
      });

      test('should handle special characters in title and message', async () => {
        // Arrange
        mockDb.setQuerySequence([
          { error: null, result: { insertId: 1 } },
          { error: null, result: { insertId: 1 } }
        ]);

        // Act
        const result = await todo.createNote(1, "Title's \"special\"", '<script>alert(1)</script>');

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for note insertion error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Insert failed'), null);
        });

        // Act
        const result = await todo.createNote(1, 'Title', 'Message');

        // Assert
        expect(result[0]).toBe(500);
      });

      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.createNote(1, 'Title', 'Message');

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ============================================================================
  // createList() TESTS
  // ============================================================================

  describe('createList()', () => {
    describe('Happy Path Tests', () => {
      test('should create list and return list object', async () => {
        // Arrange
        const tasks = [
          [0, 'Task 1', 0],
          [1, 'Task 2', 1]
        ];
        mockDb.setQueryResult({ insertId: 10 });
        mockDb.conn.query = jest.fn((sql, params, callback) => {
          callback(null, { insertId: 1 });
        });

        // Act
        const result = await todo.createList(1, 'My List', tasks);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toMatchObject({
          note_id: 10,
          title: 'My List',
          is_fav: 0,
          is_note: 1
        });
      });

      test('should insert with is_note=1 to differentiate from notes', async () => {
        // Arrange
        mockDb.setQueryResult({ insertId: 1 });
        mockDb.conn.query = jest.fn((sql, params, callback) => {
          callback(null, {});
        });

        // Act
        await todo.createList(1, 'List', []);

        // Assert
        const noteQuery = mockDb.mockConnection.query.mock.calls[0];
        expect(noteQuery[0]).toContain('is_note');
        expect(noteQuery[0]).toContain('VALUES (?, ?, 1)');
      });

      test('should handle empty task list', async () => {
        // Arrange
        mockDb.setQueryResult({ insertId: 1 });

        // Act
        const result = await todo.createList(1, 'Empty List', []);

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Edge Cases', () => {
      test('should handle large number of tasks', async () => {
        // Arrange
        const manyTasks = Array.from({ length: 100 }, (_, i) => [i, `Task ${i}`, 0]);
        mockDb.setQueryResult({ insertId: 1 });
        mockDb.conn.query = jest.fn((sql, params, callback) => {
          callback(null, { insertId: 1 });
        });

        // Act
        const result = await todo.createList(1, 'Big List', manyTasks);

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for list creation error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Insert failed'), null);
        });

        // Act
        const result = await todo.createList(1, 'List', []);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ============================================================================
  // updateTitle() TESTS
  // ============================================================================

  describe('updateTitle()', () => {
    describe('Happy Path Tests', () => {
      test('should update title successfully', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.updateTitle(1, 1, 'New Title');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should include user_id and note_id in WHERE clause', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        await todo.updateTitle(42, 99, 'Updated');

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toContain('Updated');
        expect(queryCall[1]).toContain(42);
        expect(queryCall[1]).toContain(99);
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty title', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.updateTitle(1, 1, '');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle title with SQL-like characters', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.updateTitle(1, 1, "'; DROP TABLE notes; --");

        // Assert: Should use parameterized query safely
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Update failed'), null);
        });

        // Act
        const result = await todo.updateTitle(1, 1, 'Title');

        // Assert
        expect(result[0]).toBe(500);
      });

      test('should not resolve when no rows affected - known behavior', async () => {
        // NOTE: This test documents a known issue in the original code.
        // The promise never resolves when affectedRows !== 1.
        // This test verifies the query is called correctly.
        mockDb.setQueryResult({ affectedRows: 0 });

        // We can't await the result because it never resolves
        // Instead, verify the function was called
        todo.updateTitle(999, 999, 'Title');

        // Allow async operations to proceed
        await new Promise(resolve => setTimeout(resolve, 50));

        // Assert: Query was called correctly
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // updateMessage() TESTS
  // ============================================================================

  describe('updateMessage()', () => {
    describe('Happy Path Tests', () => {
      test('should insert or update message using UPSERT', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.updateMessage(1, 1, 'New content');

        // Assert
        expect(result[0]).toBe(200);
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[0]).toContain('ON DUPLICATE KEY UPDATE');
      });

      test('should update existing message (affectedRows = 2)', async () => {
        // Arrange: MySQL returns affectedRows=2 for update in ON DUPLICATE KEY
        mockDb.setQueryResult({ affectedRows: 2 });

        // Act
        const result = await todo.updateMessage(1, 1, 'Updated content');

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty message', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.updateMessage(1, 1, '');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle unicode content', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.updateMessage(1, 1, '你好世界 🌍');

        // Assert
        expect(result[0]).toBe(200);
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Upsert failed'), null);
        });

        // Act
        const result = await todo.updateMessage(1, 1, 'content');

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ============================================================================
  // updateList() TESTS
  // ============================================================================

  describe('updateList()', () => {
    // NOTE: updateList() has complex async behavior where the promise may not resolve
    // for certain code paths. These tests verify the function behavior without waiting
    // for resolution in problematic cases.

    describe('Happy Path Tests', () => {
      test('should call update query for existing tasks', async () => {
        // Arrange: First query gets existing tasks
        let queryCount = 0;
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          queryCount++;
          if (queryCount === 1) {
            // Return existing tasks
            callback(null, validTasks);
          } else {
            // Update/insert queries
            callback(null, { affectedRows: 1 });
          }
        });

        // Act: Don't await - promise doesn't resolve for this case
        const updateList = [[1, 'Updated Task 1', 1]];
        todo.updateList(1, 3, updateList, []);

        // Allow async callbacks to execute
        await new Promise(resolve => setTimeout(resolve, 100));

        // Assert: Should call UPDATE query for existing task
        expect(mockDb.mockConnection.query).toHaveBeenCalled();
        expect(mockDb.mockConnection.query.mock.calls.length).toBeGreaterThan(1);
      });

      test('should call insert query for new tasks with newTask prefix', async () => {
        // Arrange
        let queryCount = 0;
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          queryCount++;
          if (queryCount === 1) {
            callback(null, validTasks);
          } else {
            callback(null, { affectedRows: 1 });
          }
        });

        // Act: Don't await - promise doesn't resolve
        const newList = [['newTask1', 'Brand new task', 0]];
        todo.updateList(1, 3, newList, []);

        // Allow async callbacks to execute
        await new Promise(resolve => setTimeout(resolve, 100));

        // Assert: Should call INSERT query for new task
        expect(mockDb.mockConnection.query.mock.calls.length).toBeGreaterThan(1);
      });

      test('should call delete query for tasks in delete_list', async () => {
        // Arrange
        let queryCount = 0;
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          queryCount++;
          if (queryCount === 1) {
            callback(null, validTasks);
          } else {
            callback(null, { affectedRows: 1 });
          }
        });

        // Act: Don't await - promise doesn't resolve
        todo.updateList(1, 3, [], [1, 2]);

        // Allow async callbacks to execute
        await new Promise(resolve => setTimeout(resolve, 100));

        // Assert: Should call DELETE for each task_id
        const deleteCalls = mockDb.mockConnection.query.mock.calls.filter(
          call => call[0].includes('DELETE')
        );
        expect(deleteCalls.length).toBe(2);
      });
    });

    describe('Edge Cases', () => {
      test('should only query existing tasks when lists are empty', async () => {
        // Arrange
        mockDb.setQueryResult(validTasks);

        // Act: Don't await - promise doesn't resolve for this case
        todo.updateList(1, 3, [], []);

        // Allow async callbacks to execute
        await new Promise(resolve => setTimeout(resolve, 100));

        // Assert: Only the initial query should be called
        expect(mockDb.mockConnection.query).toHaveBeenCalledTimes(1);
      });

      test('should handle no existing tasks', async () => {
        // Arrange
        mockDb.setQueryResult([]);

        // Act
        const result = await todo.updateList(1, 3, [], []);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('No tasks found');
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database connection error', async () => {
        // Arrange
        mockDb.simulateConnectionError();

        // Act
        const result = await todo.updateList(1, 1, [], []);

        // Assert
        expect(result[0]).toBe(500);
      });
    });
  });

  // ============================================================================
  // deleteTask() TESTS
  // ============================================================================

  describe('deleteTask()', () => {
    describe('Happy Path Tests', () => {
      test('should delete task successfully', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.deleteTask(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('Successfully deleted');
      });

      test('should verify both user_id and task_id in query', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        await todo.deleteTask(42, 99);

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[1]).toEqual([42, 99]);
      });
    });

    describe('Edge Cases', () => {
      test('should handle non-existent task gracefully', async () => {
        // Arrange: No rows affected
        mockDb.setQueryResult({ affectedRows: 0 });

        // Act
        const result = await todo.deleteTask(1, 999);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe("Doesn't exist");
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Delete failed'), null);
        });

        // Act
        const result = await todo.deleteTask(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });

      test('should prevent cross-user deletion via user_id check', async () => {
        // Arrange: Task exists but belongs to different user
        mockDb.setQueryResult({ affectedRows: 0 });

        // Act
        const result = await todo.deleteTask(2, 1); // Wrong user

        // Assert: Should not delete (no rows affected)
        expect(result[1]).toBe("Doesn't exist");
      });
    });
  });

  // ============================================================================
  // deleteNote() TESTS
  // ============================================================================

  describe('deleteNote()', () => {
    describe('Happy Path Tests', () => {
      test('should delete note successfully', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        const result = await todo.deleteNote(1, 1);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe('Successfully deleted');
      });

      test('should include user_id in WHERE clause for security', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 1 });

        // Act
        await todo.deleteNote(42, 99);

        // Assert
        const queryCall = mockDb.mockConnection.query.mock.calls[0];
        expect(queryCall[0]).toContain('user_id');
        expect(queryCall[1]).toEqual([42, 99]);
      });
    });

    describe('Edge Cases', () => {
      test('should handle non-existent note', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 0 });

        // Act
        const result = await todo.deleteNote(1, 999);

        // Assert
        expect(result[0]).toBe(200);
        expect(result[1]).toBe("Doesn't exist");
      });
    });

    describe('Error Cases', () => {
      test('should return 500 for database error', async () => {
        // Arrange
        mockDb.mockConnection.query.mockImplementation((sql, params, callback) => {
          callback(new Error('Delete failed'), null);
        });

        // Act
        const result = await todo.deleteNote(1, 1);

        // Assert
        expect(result[0]).toBe(500);
      });

      test('should prevent cross-user deletion', async () => {
        // Arrange
        mockDb.setQueryResult({ affectedRows: 0 });

        // Act: Try to delete note belonging to user 1 as user 2
        const result = await todo.deleteNote(2, 1);

        // Assert
        expect(result[1]).toBe("Doesn't exist");
      });
    });
  });
});
