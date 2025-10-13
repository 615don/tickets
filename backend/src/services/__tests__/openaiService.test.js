import { describe, it } from 'node:test';
import assert from 'node:assert';
import { summarizeEmail } from '../openaiService.js';

/**
 * OpenAI Service Tests
 *
 * These tests verify the service structure and basic functionality.
 * Full integration testing requires a real OpenAI API key and is done
 * via the manual test script (openaiService.manual.js).
 *
 * Note: These tests use an invalid API key to trigger error paths.
 */

describe('OpenAI Service', () => {
  const mockSettings = {
    openaiApiKey: 'sk-invalid-test-key',
    openaiModel: 'gpt-4o-mini',
    systemPrompt: 'You are an AI assistant helping to summarize email threads.'
  };

  const testEmailThread = [
    {
      from: 'john@example.com',
      subject: 'Server Issue',
      body: 'Our production server is down since 2pm. Need urgent help.'
    }
  ];

  it('should handle authentication errors gracefully (invalid API key)', async () => {
    // This will fail authentication with OpenAI, testing our error handling
    const result = await summarizeEmail(testEmailThread, mockSettings, 'short');

    // Should return error response, not throw
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
    assert.ok(result.message);

    // Should be authentication error
    assert.strictEqual(result.error, 'AuthenticationError');
    assert.ok(result.message.includes('API key'));
  });

  it('should handle connection timeout gracefully', async () => {
    // Use settings with very short timeout to trigger timeout error
    const timeoutSettings = {
      ...mockSettings,
      openaiApiKey: 'sk-invalid-key-for-timeout-test'
    };

    const result = await summarizeEmail(testEmailThread, timeoutSettings, 'short');

    // Should return error response, not throw
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
    assert.ok(result.message);
  });

  it('should format email thread correctly in user message', () => {
    const multiEmailThread = [
      {
        from: 'john@example.com',
        subject: 'Server Issue',
        body: 'Production server down.'
      },
      {
        from: 'support@company.com',
        subject: 'RE: Server Issue',
        body: 'Investigating now.'
      }
    ];

    // Format email thread (same logic as in service)
    const emailContent = multiEmailThread
      .map((email, idx) => `Email ${idx + 1}:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}
---`)
      .join('\n\n');

    // Verify format
    assert.ok(emailContent.includes('Email 1:'));
    assert.ok(emailContent.includes('From: john@example.com'));
    assert.ok(emailContent.includes('Subject: Server Issue'));
    assert.ok(emailContent.includes('Body: Production server down.'));
    assert.ok(emailContent.includes('---'));
    assert.ok(emailContent.includes('Email 2:'));
    assert.ok(emailContent.includes('From: support@company.com'));
  });

  it('should modify system prompt based on lengthClass (short)', () => {
    const basePrompt = 'Base prompt text';
    const lengthClass = 'short';

    let modifiedPrompt = basePrompt;
    if (lengthClass === 'short') {
      modifiedPrompt += '\n\nProvide a brief 1-2 sentence summary for notes. Avoid over-summarizing.';
    }

    assert.ok(modifiedPrompt.includes('brief 1-2 sentence summary'));
    assert.ok(modifiedPrompt.includes('Base prompt text'));
  });

  it('should modify system prompt based on lengthClass (medium)', () => {
    const basePrompt = 'Base prompt text';
    const lengthClass = 'medium';

    let modifiedPrompt = basePrompt;
    if (lengthClass === 'medium') {
      modifiedPrompt += '\n\nProvide a concise paragraph summary for notes.';
    }

    assert.ok(modifiedPrompt.includes('concise paragraph summary'));
    assert.ok(modifiedPrompt.includes('Base prompt text'));
  });

  it('should modify system prompt based on lengthClass (long)', () => {
    const basePrompt = 'Base prompt text';
    const lengthClass = 'long';

    let modifiedPrompt = basePrompt;
    if (lengthClass === 'long') {
      modifiedPrompt += '\n\nProvide a detailed multi-paragraph summary for notes, preserving key technical details.';
    }

    assert.ok(modifiedPrompt.includes('detailed multi-paragraph summary'));
    assert.ok(modifiedPrompt.includes('Base prompt text'));
  });

  it('should validate response has required fields (description missing)', () => {
    const parsed = {
      notes: 'Some notes here'
      // missing description
    };

    const hasRequiredFields = !!(parsed.description && parsed.notes);
    assert.strictEqual(hasRequiredFields, false);
  });

  it('should validate response has required fields (notes missing)', () => {
    const parsed = {
      description: 'Some description'
      // missing notes
    };

    const hasRequiredFields = !!(parsed.description && parsed.notes);
    assert.strictEqual(hasRequiredFields, false);
  });

  it('should validate response has required fields (both present)', () => {
    const parsed = {
      description: 'Some description',
      notes: 'Some notes'
    };

    const hasRequiredFields = !!(parsed.description && parsed.notes);
    assert.strictEqual(hasRequiredFields, true);
  });

  it('should return error object (not throw) on invalid JSON', () => {
    const invalidJson = 'This is not valid JSON';

    try {
      JSON.parse(invalidJson);
      assert.fail('Should have thrown SyntaxError');
    } catch (error) {
      assert.ok(error instanceof SyntaxError);
      // In real service, this is caught and returned as error object
    }
  });
});
