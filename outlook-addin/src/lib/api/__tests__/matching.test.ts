import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { matchContactByEmail } from '../matching.js';
import type { MatchContactResponse } from '../../../types.js';

describe('matchContactByEmail', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should return array of contacts for single match', async () => {
    const mockResponse: MatchContactResponse[] = [
      {
        contact: {
          id: 42,
          name: 'John Smith',
          email: 'john.smith@acme.com',
          clientId: 5,
        },
        client: {
          id: 5,
          name: 'Acme Corp',
          isActive: true,
        },
      },
    ];

    // Mock fetch to return successful response
    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })) as unknown as typeof fetch;

    const result = await matchContactByEmail('john.smith@acme.com');

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].contact.id, 42);
    assert.strictEqual(result[0].contact.name, 'John Smith');
    assert.strictEqual(result[0].contact.email, 'john.smith@acme.com');
    assert.strictEqual(result[0].client.id, 5);
    assert.strictEqual(result[0].client.name, 'Acme Corp');
  });

  it('should return empty array for no match', async () => {
    // Mock fetch to return empty array
    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [],
    })) as unknown as typeof fetch;

    const result = await matchContactByEmail('unknown@example.com');

    assert.strictEqual(result.length, 0);
  });

  it('should return multiple matches for disambiguation scenario', async () => {
    const mockResponse: MatchContactResponse[] = [
      {
        contact: {
          id: 1,
          name: 'John Smith',
          email: 'john@example.com',
          clientId: 1,
        },
        client: {
          id: 1,
          name: 'Client A',
          isActive: true,
        },
      },
      {
        contact: {
          id: 2,
          name: 'John Smith',
          email: 'john@example.com',
          clientId: 2,
        },
        client: {
          id: 2,
          name: 'Client B',
          isActive: true,
        },
      },
    ];

    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })) as unknown as typeof fetch;

    const result = await matchContactByEmail('john@example.com');

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].client.name, 'Client A');
    assert.strictEqual(result[1].client.name, 'Client B');
  });

  it('should throw error with correct message for 401 Unauthorized', async () => {
    // Mock fetch to return 401 error
    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 401,
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => matchContactByEmail('test@example.com'),
      {
        message: 'Authentication required. Please log in.',
      }
    );
  });

  it('should throw error with correct message for 400 Bad Request', async () => {
    // Mock fetch to return 400 error
    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 400,
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => matchContactByEmail('invalid-email'),
      {
        message: 'Invalid email format.',
      }
    );
  });

  it('should throw error with correct message for 500 Internal Server Error', async () => {
    // Mock fetch to return 500 error
    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 500,
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => matchContactByEmail('test@example.com'),
      {
        message: 'Server error. Please try again later.',
      }
    );
  });

  it('should handle network error', async () => {
    // Mock fetch to reject (simulate network failure)
    global.fetch = mock.fn(async () => {
      throw new Error('Network request failed');
    }) as unknown as typeof fetch;

    await assert.rejects(
      async () => matchContactByEmail('test@example.com'),
      {
        message: 'Network request failed',
      }
    );
  });

  it('should handle invalid JSON response', async () => {
    // Mock fetch to return invalid JSON
    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      },
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => matchContactByEmail('test@example.com'),
      {
        name: 'SyntaxError',
      }
    );
  });

  it('should properly encode email parameter in URL', async () => {
    const emailWithSpecialChars = 'test+user@example.com';
    let capturedUrl = '';

    // Mock fetch to capture the URL
    global.fetch = mock.fn(async (url: string | URL) => {
      capturedUrl = typeof url === 'string' ? url : url.toString();
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    }) as unknown as typeof fetch;

    await matchContactByEmail(emailWithSpecialChars);

    assert.ok(capturedUrl.includes('test%2Buser%40example.com'));
  });

  it('should include correct headers in request', async () => {
    let capturedHeaders: HeadersInit | undefined;

    // Mock fetch to capture the headers
    global.fetch = mock.fn(async (_url: string | URL, options?: RequestInit) => {
      capturedHeaders = options?.headers;
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    }) as unknown as typeof fetch;

    await matchContactByEmail('test@example.com');

    assert.ok(capturedHeaders);
    const headers = capturedHeaders as Record<string, string>;
    assert.strictEqual(headers['Content-Type'], 'application/json');
  });

  it('should include credentials in request', async () => {
    let capturedCredentials: RequestCredentials | undefined;

    // Mock fetch to capture the credentials option
    global.fetch = mock.fn(async (_url: string | URL, options?: RequestInit) => {
      capturedCredentials = options?.credentials;
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    }) as unknown as typeof fetch;

    await matchContactByEmail('test@example.com');

    assert.strictEqual(capturedCredentials, 'include');
  });
});
