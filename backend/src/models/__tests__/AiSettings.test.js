import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AiSettings } from '../AiSettings.js';

describe('AiSettings Model', () => {
  let mockPool;
  let mockEncrypt;
  let mockDecrypt;

  beforeEach(() => {
    // Reset mocks before each test
    mock.restoreAll();
  });

  describe('getSettings()', () => {
    it('should return default settings when table is empty', async () => {
      // Mock empty database response
      const mockQuery = mock.fn(() => Promise.resolve({ rows: [] }));
      mock.module('../config/database.js', {
        namedExports: {
          default: { query: mockQuery }
        }
      });

      const settings = await AiSettings.getSettings();

      assert.strictEqual(settings.openaiApiKey, '');
      assert.strictEqual(settings.openaiModel, 'gpt-5-mini');
      assert.ok(settings.systemPrompt.length > 0);
      assert.strictEqual(settings.configured, false);
    });

    it('should decrypt and return settings when row exists', async () => {
      const encryptedKey = 'abc123:def456:ghi789';
      const decryptedKey = 'sk-test123456789';

      // Mock database response with encrypted key
      const mockQuery = mock.fn(() => Promise.resolve({
        rows: [{
          openai_api_key: encryptedKey,
          openai_model: 'gpt-5',
          system_prompt: 'Test prompt'
        }]
      }));

      mock.module('../config/database.js', {
        namedExports: {
          default: { query: mockQuery }
        }
      });

      // Mock decrypt function
      mock.module('../utils/encryption.js', {
        namedExports: {
          decrypt: mock.fn(() => decryptedKey),
          encrypt: mock.fn()
        }
      });

      const settings = await AiSettings.getSettings();

      assert.strictEqual(settings.openaiApiKey, decryptedKey);
      assert.strictEqual(settings.openaiModel, 'gpt-5');
      assert.strictEqual(settings.systemPrompt, 'Test prompt');
      assert.strictEqual(settings.configured, true);
    });

    it('should return configured: false when API key is empty string', async () => {
      // Mock database response with empty key
      const mockQuery = mock.fn(() => Promise.resolve({
        rows: [{
          openai_api_key: '',
          openai_model: 'gpt-5-mini',
          system_prompt: 'Test prompt'
        }]
      }));

      mock.module('../config/database.js', {
        namedExports: {
          default: { query: mockQuery }
        }
      });

      const settings = await AiSettings.getSettings();

      assert.strictEqual(settings.openaiApiKey, '');
      assert.strictEqual(settings.configured, false);
    });
  });

  describe('updateSettings()', () => {
    it('should save settings with encrypted API key', async () => {
      const plainKey = 'sk-test123456789';
      const encryptedKey = 'abc123:def456:ghi789';

      let capturedQuery = null;
      let capturedParams = null;

      const mockQuery = mock.fn((query, params) => {
        capturedQuery = query;
        capturedParams = params;
        return Promise.resolve({ rows: [] });
      });

      mock.module('../config/database.js', {
        namedExports: {
          default: { query: mockQuery }
        }
      });

      mock.module('../utils/encryption.js', {
        namedExports: {
          encrypt: mock.fn(() => encryptedKey),
          decrypt: mock.fn()
        }
      });

      const result = await AiSettings.updateSettings(plainKey, 'gpt-5-mini', 'Test prompt');

      // Verify encrypted key was used in query
      assert.ok(capturedParams[0] === encryptedKey);
      assert.strictEqual(capturedParams[1], 'gpt-5-mini');
      assert.strictEqual(capturedParams[2], 'Test prompt');

      // Verify result contains unencrypted key
      assert.strictEqual(result.openaiApiKey, plainKey);
      assert.strictEqual(result.configured, true);
    });

    it('should throw validation error for empty API key', async () => {
      await assert.rejects(
        async () => {
          await AiSettings.updateSettings('', 'gpt-5-mini', 'Test prompt');
        },
        {
          message: 'openaiApiKey is required'
        }
      );
    });

    it('should throw validation error for invalid model name', async () => {
      await assert.rejects(
        async () => {
          await AiSettings.updateSettings('sk-test123', 'gpt-4', 'Test prompt');
        },
        {
          message: /Invalid openaiModel/
        }
      );
    });

    it('should throw validation error for empty system prompt', async () => {
      await assert.rejects(
        async () => {
          await AiSettings.updateSettings('sk-test123', 'gpt-5-mini', '');
        },
        {
          message: 'systemPrompt is required'
        }
      );
    });
  });
});
