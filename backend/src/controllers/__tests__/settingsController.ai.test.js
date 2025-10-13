import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../config/database.js';
import { AiSettings } from '../../models/AiSettings.js';
import { maskApiKey } from '../../utils/maskApiKey.js';

/**
 * AI Settings Controller Integration Tests
 * Tests for AI configuration endpoints
 */

describe('AI Settings API', () => {
  // Set up encryption key for tests
  beforeEach(async () => {
    // Ensure ENCRYPTION_KEY is set for tests
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2';
    }

    // Clean up test data before each test
    await pool.query('DELETE FROM ai_settings WHERE id = 1');
    await pool.query(
      `INSERT INTO ai_settings (id, openai_api_key, openai_model, system_prompt)
       VALUES (1, '', 'gpt-5-mini', 'Test prompt')`
    );
  });

  describe('GET /api/settings/ai', () => {
    test('returns default settings when unconfigured', async () => {
      const settings = await AiSettings.getSettings();

      assert.equal(settings.openaiApiKey, '');
      assert.equal(settings.openaiModel, 'gpt-5-mini');
      assert.equal(settings.systemPrompt, 'Test prompt');
      assert.equal(settings.configured, false);
    });

    test('returns masked API key when configured', async () => {
      const testKey = 'sk-test123456789abcdef';

      // Save settings with API key
      await AiSettings.updateSettings(testKey, 'gpt-5-mini', 'Test prompt');

      // Get settings
      const settings = await AiSettings.getSettings();

      // Verify key is NOT masked in model response (model returns plain key)
      assert.equal(settings.openaiApiKey, testKey);

      // Verify masking utility works
      const masked = maskApiKey(testKey);
      assert.match(masked, /^sk-\*\*\*\w{8}$/);
      assert.ok(masked.includes('***'));
      assert.equal(settings.configured, true);
    });

    test('configured is true when API key exists', async () => {
      await AiSettings.updateSettings('sk-test123', 'gpt-5-mini', 'Test prompt');

      const settings = await AiSettings.getSettings();
      assert.equal(settings.configured, true);
    });
  });

  describe('POST /api/settings/ai', () => {
    test('saves settings with valid inputs', async () => {
      const testKey = 'sk-testapikey123456789';
      const testModel = 'gpt-5';
      const testPrompt = 'Custom test prompt';

      await AiSettings.updateSettings(testKey, testModel, testPrompt);

      // Verify saved
      const settings = await AiSettings.getSettings();
      assert.equal(settings.openaiApiKey, testKey);
      assert.equal(settings.openaiModel, testModel);
      assert.equal(settings.systemPrompt, testPrompt);
    });

    test('throws validation error for missing API key', async () => {
      await assert.rejects(
        async () => {
          await AiSettings.updateSettings('', 'gpt-5-mini', 'Test prompt');
        },
        {
          message: 'openaiApiKey is required'
        }
      );
    });

    test('throws validation error for invalid model', async () => {
      await assert.rejects(
        async () => {
          await AiSettings.updateSettings('sk-test123', 'gpt-4', 'Test prompt');
        },
        {
          message: /Invalid openaiModel/
        }
      );
    });

    test('throws validation error for empty system prompt', async () => {
      await assert.rejects(
        async () => {
          await AiSettings.updateSettings('sk-test123', 'gpt-5-mini', '');
        },
        {
          message: 'systemPrompt is required'
        }
      );
    });

    test('accepts all valid model names', async () => {
      const validModels = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'];

      for (const model of validModels) {
        await AiSettings.updateSettings('sk-test123', model, 'Test prompt');
        const settings = await AiSettings.getSettings();
        assert.equal(settings.openaiModel, model);
      }
    });
  });

  describe('API Key Encryption', () => {
    test('API key is encrypted in database', async () => {
      const plainKey = 'sk-plaintext123456789';

      await AiSettings.updateSettings(plainKey, 'gpt-5-mini', 'Test prompt');

      // Check raw database value
      const result = await pool.query(
        'SELECT openai_api_key FROM ai_settings WHERE id = 1'
      );

      const storedKey = result.rows[0].openai_api_key;

      // Verify it's NOT plaintext
      assert.notEqual(storedKey, plainKey);

      // Verify format is iv:authTag:ciphertext (hex strings separated by colons)
      assert.match(storedKey, /^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);

      // Verify we can decrypt it back
      const settings = await AiSettings.getSettings();
      assert.equal(settings.openaiApiKey, plainKey);
    });

    test('decryption fails gracefully with wrong encryption key', async () => {
      const plainKey = 'sk-test123456789';

      await AiSettings.updateSettings(plainKey, 'gpt-5-mini', 'Test prompt');

      // Change encryption key
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff';

      // Try to get settings with wrong key
      const settings = await AiSettings.getSettings();

      // Model should return empty key on decryption failure
      assert.equal(settings.openaiApiKey, '');
      assert.equal(settings.configured, false);

      // Restore original key
      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('Singleton Pattern', () => {
    test('only one row exists in ai_settings table', async () => {
      // Verify single row exists
      const result = await pool.query('SELECT COUNT(*) FROM ai_settings');
      assert.equal(result.rows[0].count, '1');

      // Attempt to insert second row with id=2 should fail due to CHECK constraint
      await assert.rejects(
        async () => {
          await pool.query(
            `INSERT INTO ai_settings (id, openai_api_key, openai_model, system_prompt)
             VALUES (2, '', 'gpt-5-mini', 'Test')`
          );
        },
        {
          message: /check/i // PostgreSQL CHECK constraint violation
        }
      );
    });

    test('updates modify existing row instead of creating new rows', async () => {
      await AiSettings.updateSettings('sk-first', 'gpt-5-mini', 'First');
      await AiSettings.updateSettings('sk-second', 'gpt-5', 'Second');

      const result = await pool.query('SELECT COUNT(*) FROM ai_settings');
      assert.equal(result.rows[0].count, '1');

      const settings = await AiSettings.getSettings();
      assert.equal(settings.openaiApiKey, 'sk-second');
      assert.equal(settings.openaiModel, 'gpt-5');
    });
  });
});
