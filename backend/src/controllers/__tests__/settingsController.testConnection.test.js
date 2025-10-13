import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

/**
 * Test Connection Controller Unit Tests
 * Tests for POST /api/settings/ai/test-connection endpoint
 *
 * Note: These tests mock the OpenAI SDK to avoid real API calls
 */

describe('testAiConnection Controller', () => {
  let req, res, testAiConnection, mockOpenAICreate;

  beforeEach(async () => {
    // Reset request/response mocks for each test
    req = {
      body: {}
    };

    res = {
      status: mock.fn(function(code) {
        this.statusCode = code;
        return this;
      }),
      json: mock.fn(function(data) {
        this.body = data;
        return this;
      }),
      statusCode: 200,
      body: null
    };

    // Dynamically import the controller to get fresh instance
    const module = await import('../settingsController.js');
    testAiConnection = module.testAiConnection;

    // Create a mock for OpenAI chat completions
    mockOpenAICreate = mock.fn();
  });

  describe('Validation', () => {
    it('should return 400 if openaiApiKey is missing', async () => {
      req.body = {
        openaiModel: 'gpt-5-mini'
      };

      await testAiConnection(req, res);

      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
      assert.strictEqual(res.body.error, 'ValidationError');
      assert.strictEqual(res.body.message, 'openaiApiKey is required');
    });

    it('should return 400 if openaiModel is missing', async () => {
      req.body = {
        openaiApiKey: 'sk-test123456789012345678'
      };

      await testAiConnection(req, res);

      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
      assert.strictEqual(res.body.error, 'ValidationError');
      assert.strictEqual(res.body.message, 'openaiModel is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors appropriately', async () => {
      req.body = {};

      await testAiConnection(req, res);

      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
      assert.strictEqual(res.body.error, 'ValidationError');
    });
  });
});

/**
 * Manual Integration Test Checklist
 * ===================================
 *
 * These tests must be run manually with actual OpenAI API calls:
 *
 * 1. Valid API Key Test:
 *    curl -X POST http://localhost:3001/api/settings/ai/test-connection \
 *      -H "Content-Type: application/json" \
 *      -c /tmp/cookies.txt \
 *      -d '{"openaiApiKey": "<VALID_KEY>", "openaiModel": "gpt-5-mini"}'
 *    Expected: {"success": true, "message": "Connection successful...", "model": "gpt-5-mini", "latency": <number>}
 *
 * 2. Invalid API Key Test:
 *    curl -X POST http://localhost:3001/api/settings/ai/test-connection \
 *      -H "Content-Type: application/json" \
 *      -c /tmp/cookies.txt \
 *      -d '{"openaiApiKey": "sk-invalid123456789012345", "openaiModel": "gpt-5-mini"}'
 *    Expected: {"success": false, "error": "Invalid API key..."}
 *
 * 3. Invalid Model Test:
 *    curl -X POST http://localhost:3001/api/settings/ai/test-connection \
 *      -H "Content-Type: application/json" \
 *      -c /tmp/cookies.txt \
 *      -d '{"openaiApiKey": "<VALID_KEY>", "openaiModel": "gpt-99-ultra"}'
 *    Expected: {"success": false, "error": "Model ... not found..."}
 *
 * 4. Missing Fields Test:
 *    curl -X POST http://localhost:3001/api/settings/ai/test-connection \
 *      -H "Content-Type: application/json" \
 *      -c /tmp/cookies.txt \
 *      -d '{"openaiModel": "gpt-5-mini"}'
 *    Expected: {"error": "ValidationError", "message": "openaiApiKey is required"}
 *
 * 5. Authentication Test:
 *    curl -X POST http://localhost:3001/api/settings/ai/test-connection \
 *      -H "Content-Type: application/json" \
 *      -d '{"openaiApiKey": "<VALID_KEY>", "openaiModel": "gpt-5-mini"}'
 *    Expected: 401 Unauthorized (session required)
 */
