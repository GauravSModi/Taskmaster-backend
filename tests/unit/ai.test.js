/**
 * Unit Tests for AI Module (components/ai.js)
 *
 * This test suite covers:
 * - generateResponse(): Generate AI-powered lists using OpenAI API
 * - Environment variable validation
 * - Response parsing and error handling
 *
 * Uses mocked OpenAI API to test without making real API calls.
 */

const { ai, edgeCases } = require('../fixtures/testData');

// Mock OpenAI before importing the AI module
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

// Get reference to mocked OpenAI
const OpenAI = require('openai');

// ============================================================================
// TEST SUITE
// ============================================================================

describe('AI Module', () => {
  let aiModule;
  let mockOpenAICreate;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset modules to get fresh instance
    jest.resetModules();

    // Re-mock OpenAI
    jest.doMock('openai', () => {
      const mockCreate = jest.fn();
      return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));
    });

    // Import AI module (uses mocked OpenAI)
    aiModule = require('../../components/ai');

    // Get reference to mock function
    const OpenAIMock = require('openai');
    const mockInstance = new OpenAIMock();
    mockOpenAICreate = mockInstance.chat.completions.create;
  });

  // ==========================================================================
  // generateResponse() TESTS
  // ==========================================================================

  describe('generateResponse()', () => {
    /**
     * HAPPY PATH TESTS
     */
    describe('Happy Path', () => {
      test('should return status, title, and points from valid AI response', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(ai.validPrompt);

        // Assert
        expect(result).toBeStatusTuple();
        expect(result[0]).toBe(200);
        expect(typeof result[1]).toBe('string'); // title
        expect(Array.isArray(result[2])).toBe(true); // points
      });

      test('should return correct title from AI response', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(ai.validPrompt);

        // Assert
        expect(result[1]).toBe('Weekly Grocery List');
      });

      test('should return correct points array from AI response', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(ai.validPrompt);

        // Assert
        expect(result[2]).toEqual(['Milk', 'Eggs', 'Bread', 'Butter', 'Cheese']);
      });

      test('should be an async function', () => {
        // Assert
        expect(aiModule.generateResponse.constructor.name).toBe('AsyncFunction');
      });

      test('should call OpenAI API with correct parameters', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('Test prompt');

        // Assert
        expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
        const callArgs = mockOpenAICreate.mock.calls[0][0];

        expect(callArgs.model).toBe('gpt-3.5-turbo');
        expect(callArgs.temperature).toBe(0.7);
        expect(callArgs.max_tokens).toBe(500);
        expect(callArgs.top_p).toBe(1);
      });
    });

    /**
     * SYSTEM INSTRUCTIONS TESTS
     */
    describe('System Instructions', () => {
      test('should include instruction for JSON format response', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('test');

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        const systemMessage = callArgs.messages.find(m => m.role === 'system');
        expect(systemMessage.content).toContain('JSON');
      });

      test('should include instruction for max 15 items', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('test');

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        const systemMessage = callArgs.messages.find(m => m.role === 'system');
        expect(systemMessage.content).toContain('15');
      });

      test('should include user prompt in messages', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);
        const prompt = 'Create a shopping list';

        // Act
        await aiModule.generateResponse(prompt);

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        const userMessage = callArgs.messages.find(m => m.role === 'user');
        expect(userMessage.content).toBe(prompt);
      });
    });

    /**
     * EDGE CASE TESTS
     */
    describe('Edge Cases', () => {
      test('should handle empty prompt', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse('');

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle very long prompt', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(edgeCases.veryLongString);

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle prompt with special characters', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(edgeCases.specialCharacters);

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle unicode characters in prompt', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(edgeCases.unicodeCharacters);

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle prompt with newlines', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        const result = await aiModule.generateResponse(edgeCases.newlines);

        // Assert
        expect(result[0]).toBe(200);
      });

      test('should handle response with empty points array', async () => {
        // Arrange
        const emptyPointsResponse = {
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Empty List',
                points: []
              })
            }
          }]
        };
        mockOpenAICreate.mockResolvedValue(emptyPointsResponse);

        // Act
        const result = await aiModule.generateResponse('empty list');

        // Assert
        expect(result[0]).toBe(200);
        expect(result[2]).toEqual([]);
      });

      test('should handle response with maximum 15 points', async () => {
        // Arrange
        const maxPointsResponse = {
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Max List',
                points: Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`)
              })
            }
          }]
        };
        mockOpenAICreate.mockResolvedValue(maxPointsResponse);

        // Act
        const result = await aiModule.generateResponse('max list');

        // Assert
        expect(result[2]).toHaveLength(15);
      });
    });

    /**
     * ERROR CASE TESTS
     */
    describe('Error Cases', () => {
      test('should throw error when OpenAI API fails', async () => {
        // Arrange
        const apiError = new Error('OpenAI API Error');
        mockOpenAICreate.mockRejectedValue(apiError);

        // Act & Assert
        await expect(aiModule.generateResponse('test')).rejects.toThrow('OpenAI API Error');
      });

      test('should throw error for malformed JSON response', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.malformedResponse);

        // Act & Assert
        await expect(aiModule.generateResponse('test')).rejects.toThrow();
      });

      test('should return undefined when choices array is empty', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.emptyChoices);

        // Act
        const result = await aiModule.generateResponse('test');

        // Assert
        expect(result).toBeUndefined();
      });

      test('should handle response without title property', async () => {
        // Arrange
        const noTitleResponse = {
          choices: [{
            message: {
              content: JSON.stringify({ points: ['Item 1'] })
            }
          }]
        };
        mockOpenAICreate.mockResolvedValue(noTitleResponse);

        // Act
        const result = await aiModule.generateResponse('test');

        // Assert
        expect(result[1]).toBeUndefined();
      });

      test('should handle response without points property', async () => {
        // Arrange
        const noPointsResponse = {
          choices: [{
            message: {
              content: JSON.stringify({ title: 'Title Only' })
            }
          }]
        };
        mockOpenAICreate.mockResolvedValue(noPointsResponse);

        // Act
        const result = await aiModule.generateResponse('test');

        // Assert
        expect(result[2]).toBeUndefined();
      });

      test('should handle network timeout error', async () => {
        // Arrange
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'ETIMEDOUT';
        mockOpenAICreate.mockRejectedValue(timeoutError);

        // Act & Assert
        await expect(aiModule.generateResponse('test')).rejects.toThrow('Request timeout');
      });

      test('should handle rate limit error', async () => {
        // Arrange
        const rateLimitError = new Error('Rate limit exceeded');
        rateLimitError.status = 429;
        mockOpenAICreate.mockRejectedValue(rateLimitError);

        // Act & Assert
        await expect(aiModule.generateResponse('test')).rejects.toThrow('Rate limit exceeded');
      });
    });

    /**
     * CONFIGURATION TESTS
     */
    describe('API Configuration', () => {
      test('should use GPT-3.5-turbo model', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('test');

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        expect(callArgs.model).toBe('gpt-3.5-turbo');
      });

      test('should use temperature of 0.7', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('test');

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        expect(callArgs.temperature).toBe(0.7);
      });

      test('should use max_tokens of 500', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('test');

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        expect(callArgs.max_tokens).toBe(500);
      });

      test('should use top_p of 1', async () => {
        // Arrange
        mockOpenAICreate.mockResolvedValue(ai.openAIResponse);

        // Act
        await aiModule.generateResponse('test');

        // Assert
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        expect(callArgs.top_p).toBe(1);
      });
    });
  });

  // ==========================================================================
  // ENVIRONMENT VARIABLE TESTS
  // ==========================================================================

  describe('Environment Variables', () => {
    test('should require OPENAI_API_KEY environment variable', () => {
      // Arrange: Save and remove env variable
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.OPENAI_API_KEY;

      // Reset modules and mock dotenv to prevent .env file loading
      jest.resetModules();
      jest.doMock('dotenv', () => ({ config: jest.fn() }));

      // Act & Assert
      expect(() => {
        require('../../components/ai');
      }).toThrow('Missing required environment variables');

      // Restore env
      process.env = originalEnv;
    });
  });
});

// ============================================================================
// RESPONSE PARSING TESTS (Standalone)
// ============================================================================

describe('AI Response Parsing', () => {
  describe('Valid Response Parsing', () => {
    test('should parse standard JSON response correctly', () => {
      // Arrange
      const jsonString = JSON.stringify({
        title: 'Test Title',
        points: ['Point 1', 'Point 2', 'Point 3']
      });

      // Act
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed.title).toBe('Test Title');
      expect(parsed.points).toHaveLength(3);
    });

    test('should handle response with special characters in points', () => {
      // Arrange
      const jsonString = JSON.stringify({
        title: 'Special List',
        points: ['Item with "quotes"', "Item with 'apostrophe'", 'Item with\nnewline']
      });

      // Act
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed.points).toHaveLength(3);
    });

    test('should handle response with unicode in points', () => {
      // Arrange
      const jsonString = JSON.stringify({
        title: 'Unicode List',
        points: ['Item 1']
      });

      // Act
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed.points).toContain('Item 1');
    });
  });

  describe('Invalid Response Handling', () => {
    test('should throw on invalid JSON', () => {
      // Arrange
      const invalidJson = 'not valid json at all';

      // Act & Assert
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    test('should throw on truncated JSON', () => {
      // Arrange
      const truncatedJson = '{"title": "Test", "points": [';

      // Act & Assert
      expect(() => JSON.parse(truncatedJson)).toThrow();
    });

    test('should throw on JSON with trailing comma', () => {
      // Arrange
      const trailingCommaJson = '{"title": "Test", "points": ["item",]}';

      // Act & Assert
      expect(() => JSON.parse(trailingCommaJson)).toThrow();
    });

    test('should handle null values in points array', () => {
      // Arrange
      const jsonWithNulls = JSON.stringify({
        title: 'Test',
        points: ['Item 1', null, 'Item 3']
      });

      // Act
      const parsed = JSON.parse(jsonWithNulls);

      // Assert
      expect(parsed.points).toContain(null);
      expect(parsed.points).toHaveLength(3);
    });
  });
});
