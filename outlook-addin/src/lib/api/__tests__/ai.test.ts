/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { summarizeEmail } from '../ai.ts';

describe('summarizeEmail', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should return AI-generated summary on success', async () => {
    const mockResponse = {
      description: 'Website 503 error troubleshooting',
      notes: 'Client reported website showing 503 error. Investigated server logs and identified database connection pool exhaustion.',
      truncated: false,
      emailCount: 1,
    };

    // Mock fetch to handle both CSRF token request and AI request
    global.fetch = mock.fn(async (url: any) => {
      // CSRF token request
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-token' }),
        };
      }
      // AI summarization request
      return {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      };
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'john@acme.com',
        subject: 'Website down',
        body: 'Our website is showing a 503 error...',
      },
    ];

    const result = await summarizeEmail(emails);

    assert.strictEqual(result.success, undefined); // success field only present on errors
    assert.strictEqual(result.description, 'Website 503 error troubleshooting');
    assert.strictEqual(result.notes.includes('503 error'), true);
    assert.strictEqual(result.truncated, false);
    assert.strictEqual(result.emailCount, 1);
  });

  it('should return error response when AI not configured (400)', async () => {
    // Mock fetch to handle CSRF and return 400 for AI request
    global.fetch = mock.fn(async (url: any) => {
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-token' }),
        };
      }
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: 'AINotConfigured',
          message: 'AI summarization is not configured. Please configure OpenAI API key in settings.',
        }),
      };
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'test@test.com',
        subject: 'Test',
        body: 'Test body',
      },
    ];

    const result = await summarizeEmail(emails);

    // Should return graceful error response, NOT throw
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'RequestFailed');
    assert.strictEqual(result.description, '');
    assert.strictEqual(result.notes, '');
  });

  it('should throw error for 401 Unauthorized', async () => {
    // Mock fetch to handle CSRF and return 401 for AI request
    global.fetch = mock.fn(async (url: any) => {
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-token' }),
        };
      }
      return {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      };
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'test@test.com',
        subject: 'Test',
        body: 'Test body',
      },
    ];

    // 401 should throw (user must authenticate)
    await assert.rejects(
      async () => await summarizeEmail(emails),
      {
        message: 'Authentication required. Please log in to the web app.',
      }
    );
  });

  it('should handle AI service failure gracefully (200 with success: false)', async () => {
    // Mock AI service returning error (rate limit, timeout, etc.)
    const mockErrorResponse = {
      success: false,
      error: 'RateLimitError',
      message: 'OpenAI rate limit exceeded. Please try again in a few moments.',
    };

    global.fetch = mock.fn(async (url: any) => {
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-token' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => mockErrorResponse,
      };
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'test@test.com',
        subject: 'Test',
        body: 'Test body',
      },
    ];

    const result = await summarizeEmail(emails);

    // Should return error response with populated error fields from backend
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'RateLimitError');
    assert.strictEqual(result.message, 'OpenAI rate limit exceeded. Please try again in a few moments.');
  });

  it('should handle network failure gracefully', async () => {
    // Mock fetch to throw network error
    global.fetch = mock.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'test@test.com',
        subject: 'Test',
        body: 'Test body',
      },
    ];

    const result = await summarizeEmail(emails);

    // Should return graceful error response, NOT throw
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'RequestFailed');
    assert.strictEqual(result.description, '');
    assert.strictEqual(result.notes, '');
  });

  it('should validate response shape with type guard', async () => {
    // Mock fetch to return malformed response (missing required fields)
    global.fetch = mock.fn(async (url: any) => {
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-token' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          // Missing description and notes
          truncated: false,
          emailCount: 1,
        }),
      };
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'test@test.com',
        subject: 'Test',
        body: 'Test body',
      },
    ];

    const result = await summarizeEmail(emails);

    // Type guard should detect invalid response
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'InvalidResponse');
    assert.strictEqual(result.message, 'AI service returned unexpected format');
  });

  it('should reject requests with no emails', async () => {
    await assert.rejects(
      async () => await summarizeEmail([]),
      {
        message: 'At least one email required for summarization',
      }
    );
  });

  it('should reject requests with more than 5 emails', async () => {
    const emails = Array(6).fill({
      from: 'test@test.com',
      subject: 'Test',
      body: 'Test body',
    });

    await assert.rejects(
      async () => await summarizeEmail(emails),
      {
        message: 'Maximum 5 emails allowed per summarization request',
      }
    );
  });

  it('should call correct API endpoint with correct payload', async () => {
    let capturedUrl = '';
    let capturedOptions: any = {};

    global.fetch = mock.fn(async (url: any, options: any) => {
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-token' }),
        };
      }
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          description: 'Test description',
          notes: 'Test notes',
          truncated: false,
          emailCount: 1,
        }),
      };
    }) as unknown as typeof fetch;

    const emails = [
      {
        from: 'john@acme.com',
        subject: 'Issue',
        body: 'Description',
      },
    ];

    await summarizeEmail(emails);

    // Verify correct endpoint
    assert.strictEqual(capturedUrl.includes('/api/ai/summarize-email'), true);

    // Verify correct method
    assert.strictEqual(capturedOptions.method, 'POST');

    // Verify correct payload structure
    const payload = JSON.parse(capturedOptions.body);
    assert.strictEqual(payload.emails.length, 1);
    assert.strictEqual(payload.emails[0].from, 'john@acme.com');
    assert.strictEqual(payload.emails[0].subject, 'Issue');
    assert.strictEqual(payload.emails[0].body, 'Description');
  });
});
