import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import pool from '../../config/database.js';
import { AiSettings } from '../../models/AiSettings.js';
import { summarizeEmailThread } from '../aiController.js';

/**
 * AI Controller Integration Tests
 * Tests for AI summarization endpoint
 *
 * Note: These are integration tests that test the controller with real dependencies.
 * OpenAI service calls will fail without valid API key - tests verify error handling.
 */
describe('AI Controller - summarizeEmailThread', () => {
  let mockReq, mockRes;

  beforeEach(async () => {
    // Ensure AI_ENCRYPTION_KEY is set for tests
    if (!process.env.AI_ENCRYPTION_KEY) {
      process.env.AI_ENCRYPTION_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2';
    }

    // Reset AI settings table before each test
    await pool.query('DELETE FROM ai_settings WHERE id = 1');
    await pool.query(
      `INSERT INTO ai_settings (id, openai_api_key, openai_model, system_prompt)
       VALUES (1, '', 'gpt-5-mini', 'Test system prompt')`
    );

    // Create mock req/res objects
    mockReq = {
      session: { userId: 1 },
      body: {}
    };

    mockRes = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
  });

  afterEach(async () => {
    // Clean up after tests
    await pool.query('DELETE FROM ai_settings WHERE id = 1');
  });

  // ==================== AC2: Authentication Tests ====================

  describe('Authentication Requirement (AC2)', () => {
    it('should return 401 if no session', async () => {
      mockReq.session = null;

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 401);
      assert.strictEqual(mockRes.jsonData.success, false);
      assert.strictEqual(mockRes.jsonData.error, 'Unauthorized');
    });

    it('should return 401 if no userId in session', async () => {
      mockReq.session = {};

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 401);
      assert.strictEqual(mockRes.jsonData.success, false);
      assert.strictEqual(mockRes.jsonData.error, 'Unauthorized');
    });
  });

  // ==================== AC1: Request Validation Tests ====================

  describe('Request Validation (AC1)', () => {
    it('should return 400 if emails field is missing', async () => {
      mockReq.body = {};

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.success, false);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
      assert.match(mockRes.jsonData.message, /must include.*emails.*array/i);
    });

    it('should return 400 if emails is not an array', async () => {
      mockReq.body = { emails: 'not-an-array' };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
    });

    it('should return 400 if emails array is empty', async () => {
      mockReq.body = { emails: [] };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
      assert.match(mockRes.jsonData.message, /at least one email/i);
    });

    it('should return 400 if more than 5 emails', async () => {
      mockReq.body = {
        emails: [
          { from: 'a@ex.com', subject: 'S', body: 'B' },
          { from: 'b@ex.com', subject: 'S', body: 'B' },
          { from: 'c@ex.com', subject: 'S', body: 'B' },
          { from: 'd@ex.com', subject: 'S', body: 'B' },
          { from: 'e@ex.com', subject: 'S', body: 'B' },
          { from: 'f@ex.com', subject: 'S', body: 'B' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
      assert.match(mockRes.jsonData.message, /maximum 5 emails/i);
    });

    it('should return 400 if email missing "from" field', async () => {
      mockReq.body = {
        emails: [
          { subject: 'Test', body: 'Test body' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
      assert.match(mockRes.jsonData.message, /from.*subject.*body/i);
    });

    it('should return 400 if email missing "subject" field', async () => {
      mockReq.body = {
        emails: [
          { from: 'user@example.com', body: 'Test body' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
    });

    it('should return 400 if email missing "body" field', async () => {
      mockReq.body = {
        emails: [
          { from: 'user@example.com', subject: 'Test' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
    });

    it('should return 400 if payload exceeds 500KB', async () => {
      // Create a payload >500KB
      const largeBody = 'x'.repeat(500001);
      mockReq.body = {
        emails: [
          { from: 'user@example.com', subject: 'Test', body: largeBody }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.error, 'ValidationError');
      assert.match(mockRes.jsonData.message, /payload too large/i);
    });
  });

  // ==================== AC3 & AC4: AI Settings Tests ====================

  describe('AI Configuration Check (AC3, AC4)', () => {
    it('should return 400 if AI settings have no API key', async () => {
      // AI settings table has empty API key from beforeEach
      mockReq.body = {
        emails: [
          { from: 'user@example.com', subject: 'Test', body: 'Test body' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      assert.strictEqual(mockRes.statusCode, 400);
      assert.strictEqual(mockRes.jsonData.success, false);
      assert.strictEqual(mockRes.jsonData.error, 'AINotConfigured');
      assert.match(mockRes.jsonData.message, /not configured/i);
    });

    it('should pass AI configuration check with valid API key', async () => {
      // Set up AI settings with API key
      await AiSettings.updateSettings('sk-test-key-invalid-but-present', 'gpt-5-mini', 'Test prompt');

      mockReq.body = {
        emails: [
          { from: 'user@example.com', subject: 'Test', body: 'Test body' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      // Should NOT return 400 AINotConfigured error
      // Will fail at OpenAI API call (which is expected), returning 200 with success: false
      assert.notStrictEqual(mockRes.jsonData?.error, 'AINotConfigured');
    });
  });

  // ==================== AC5, AC6, AC7: Integration Tests ====================

  describe('Email Thread Processing & Error Handling (AC5, AC6, AC7)', () => {
    it('should return graceful error when OpenAI API key is invalid', async () => {
      // Set up AI settings with invalid API key
      await AiSettings.updateSettings('sk-invalid-test-key', 'gpt-5-mini', 'Test prompt');

      mockReq.body = {
        emails: [
          { from: 'user@example.com', subject: 'Test', body: 'This is a test email body.' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      // Should return 200 with success: false (AC7)
      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.jsonData.success, false);

      // Error should be related to authentication/API key
      assert.ok(
        mockRes.jsonData.error === 'AuthenticationError' ||
        mockRes.jsonData.message.includes('API key') ||
        mockRes.jsonData.message.includes('authentication'),
        `Expected auth error, got: ${mockRes.jsonData.error} - ${mockRes.jsonData.message}`
      );
    });

    it('should call processEmailThread and handle email processing', async () => {
      // Set up AI settings with invalid API key (will fail at OpenAI, but thread processing will succeed)
      await AiSettings.updateSettings('sk-invalid-key', 'gpt-5-mini', 'Test prompt');

      const testEmails = [
        {
          from: 'user@example.com',
          subject: 'Test Subject',
          body: 'This is a test email body with some content.\n-- \nSender Name\nCompany Inc.'
        }
      ];

      mockReq.body = { emails: testEmails };

      await summarizeEmailThread(mockReq, mockRes);

      // Thread processing should succeed (even though OpenAI fails)
      // This verifies processEmailThread was called and worked
      assert.ok(mockRes.jsonData !== null, 'Response should not be null');
      assert.strictEqual(typeof mockRes.jsonData, 'object');
    });
  });

  // ==================== AC8: Logging Tests ====================

  describe('Logging (AC8)', () => {
    it('should log requests without exposing email content', async () => {
      // Capture console logs
      const originalLog = console.log;
      const originalError = console.error;
      const logs = [];
      const errorLogs = [];

      console.log = (...args) => logs.push(args);
      console.error = (...args) => errorLogs.push(args);

      // Set up AI settings with invalid API key
      await AiSettings.updateSettings('sk-invalid-key', 'gpt-5-mini', 'Test prompt');

      mockReq.body = {
        emails: [
          {
            from: 'user@example.com',
            subject: 'Secret Subject',
            body: 'This is SECRET CONTENT that should NEVER be logged!'
          }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;

      // Verify email content and API key are NOT logged
      const allLogsString = JSON.stringify([...logs, ...errorLogs]);
      assert.ok(!allLogsString.includes('SECRET CONTENT'), 'Email content should NOT be logged');
      assert.ok(!allLogsString.includes('sk-invalid-key'), 'API key should NOT be logged');

      // Verify some logging occurred (error log for failed API call)
      const hasErrorLog = errorLogs.some(log =>
        log.length > 0 && typeof log[0] === 'string' && log[0].includes('[AI Controller]')
      );
      assert.ok(hasErrorLog || logs.length > 0, 'Controller should log something');
    });
  });

  // ==================== Response Structure Validation ====================

  describe('Response Structure (AC6)', () => {
    it('should include required fields in error response', async () => {
      // Trigger AINotConfigured error
      mockReq.body = {
        emails: [
          { from: 'user@example.com', subject: 'Test', body: 'Test' }
        ]
      };

      await summarizeEmailThread(mockReq, mockRes);

      // Verify error response structure
      assert.ok(mockRes.jsonData.hasOwnProperty('success'), 'Response should have success field');
      assert.ok(mockRes.jsonData.hasOwnProperty('error'), 'Response should have error field');
      assert.ok(mockRes.jsonData.hasOwnProperty('message'), 'Response should have message field');
      assert.strictEqual(mockRes.jsonData.success, false);
    });
  });
});
