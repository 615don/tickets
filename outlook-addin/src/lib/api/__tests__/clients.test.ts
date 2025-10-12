import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { fetchClients } from '../clients.ts';

describe('fetchClients', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should return array of clients sorted alphabetically', async () => {
    const mockBackendResponse = [
      {
        id: 2,
        company_name: 'Zebra Corp',
      },
      {
        id: 1,
        company_name: 'Acme Corp',
      },
      {
        id: 3,
        company_name: 'Beta Industries',
      },
    ];

    // Mock fetch to return successful response
    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => mockBackendResponse,
    })) as unknown as typeof fetch;

    const result = await fetchClients();

    // Should sort alphabetically
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].id, 1);
    assert.strictEqual(result[0].name, 'Acme Corp');
    assert.strictEqual(result[1].id, 3);
    assert.strictEqual(result[1].name, 'Beta Industries');
    assert.strictEqual(result[2].id, 2);
    assert.strictEqual(result[2].name, 'Zebra Corp');
  });

  it('should return empty array when no clients exist', async () => {
    // Mock fetch to return empty array
    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [],
    })) as unknown as typeof fetch;

    const result = await fetchClients();

    assert.strictEqual(result.length, 0);
  });

  it('should throw error for 401 Unauthorized', async () => {
    // Mock fetch to return 401 response
    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => await fetchClients(),
      {
        message: 'Authentication required. Please log in to the web app.',
      }
    );
  });

  it('should throw error for 500 Internal Server Error', async () => {
    // Mock fetch to return 500 response
    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => await fetchClients(),
      {
        message: /HTTP 500/,
      }
    );
  });

  it('should throw error for network failure', async () => {
    // Mock fetch to reject (simulate network failure)
    global.fetch = mock.fn(async () => {
      throw new Error('Network request failed');
    }) as unknown as typeof fetch;

    await assert.rejects(
      async () => await fetchClients(),
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
        throw new Error('Unexpected token < in JSON at position 0');
      },
    })) as unknown as typeof fetch;

    await assert.rejects(
      async () => await fetchClients(),
      {
        message: 'Unexpected token < in JSON at position 0',
      }
    );
  });

  it('should map backend field names to frontend types', async () => {
    const mockBackendResponse = [
      {
        id: 5,
        company_name: 'Test Company',
      },
    ];

    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => mockBackendResponse,
    })) as unknown as typeof fetch;

    const result = await fetchClients();

    // Verify field mapping: company_name → name
    assert.strictEqual(result[0].name, 'Test Company');
    // Verify backend field name was not included in mapped result
    assert.strictEqual('company_name' in result[0], false);
  });
});
