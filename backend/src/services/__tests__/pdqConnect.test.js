/**
 * Tests for PDQ Connect API Service
 */

import { describe, it, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert';
import { lookupPDQDeviceBySerial } from '../pdqConnect.js';

// Mock environment variable
const MOCK_API_KEY = 'test_pdq_api_key_123';

describe('PDQ Connect Service', () => {
  let originalEnv;
  let originalFetch;

  before(() => {
    // Save original environment
    originalEnv = process.env.PDQ_API_KEY;
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    // Set mock API key
    process.env.PDQ_API_KEY = MOCK_API_KEY;
  });

  afterEach(() => {
    // Restore fetch if mocked
    if (global.fetch !== originalFetch) {
      global.fetch = originalFetch;
    }
  });

  after(() => {
    // Restore original environment
    process.env.PDQ_API_KEY = originalEnv;
  });

  describe('lookupPDQDeviceBySerial', () => {
    it('should return pdqDeviceId on successful lookup', async () => {
      const mockResponse = {
        data: [
          {
            id: 'dvc_abc123def456',
            hostname: 'DESKTOP-ABC',
            name: 'DESKTOP-ABC.WORKGROUP',
            serialNumber: 'PF2KNMR2',
            os: 'Windows 10 Pro',
            model: 'ThinkPad P14s Gen 1',
            manufacturer: 'LENOVO'
          }
        ],
        meta: {
          totalCount: 1
        }
      };

      let fetchCalls = [];
      global.fetch = async (url, options) => {
        fetchCalls.push({ url, options });
        return {
          ok: true,
          status: 200,
          json: async () => mockResponse
        };
      };

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.pdqDeviceId, 'dvc_abc123def456');
      assert.strictEqual(result.error, null);

      // Verify fetch was called with correct parameters
      assert.strictEqual(fetchCalls.length, 1);
      const callUrl = fetchCalls[0].url;
      assert.ok(callUrl.includes('https://app.pdq.com/v1/api/devices'));
      assert.ok(callUrl.includes('filter%5BserialNumber%5D=PF2KNMR2'));

      const callOptions = fetchCalls[0].options;
      assert.strictEqual(callOptions.headers.Authorization, `Bearer ${MOCK_API_KEY}`);
    });

    it('should handle serial number not found (empty data array)', async () => {
      const mockResponse = {
        data: [],
        meta: {
          totalCount: 0
        }
      };

      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await lookupPDQDeviceBySerial('NOTFOUND123');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'Serial number not found in PDQ. Please enter manually if known.');
    });

    it('should handle 401 authentication error', async () => {
      global.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          errors: [
            {
              status: 401,
              detail: 'Unauthorized'
            }
          ]
        })
      });

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'PDQ API key not configured or invalid');
    });

    it('should handle 404 not found response', async () => {
      global.fetch = async () => ({
        ok: false,
        status: 404,
        json: async () => ({})
      });

      const result = await lookupPDQDeviceBySerial('NOTFOUND');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'Serial number not found in PDQ. Please enter manually if known.');
    });

    it('should handle network timeout', async () => {
      global.fetch = async () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      };

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'Unable to connect to PDQ API. Please enter manually.');
    });

    it('should handle network error', async () => {
      global.fetch = async () => {
        throw new Error('fetch failed');
      };

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'Unable to connect to PDQ API. Please enter manually.');
    });

    it('should handle missing API key', async () => {
      process.env.PDQ_API_KEY = '';

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'PDQ API key not configured or invalid');
    });

    it('should handle empty serial number', async () => {
      const result = await lookupPDQDeviceBySerial('');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'Serial number is required');
    });

    it('should sanitize serial number (trim whitespace)', async () => {
      const mockResponse = {
        data: [
          {
            id: 'dvc_test123',
            serialNumber: 'PF2KNMR2'
          }
        ],
        meta: { totalCount: 1 }
      };

      let fetchCalls = [];
      global.fetch = async (url, options) => {
        fetchCalls.push({ url, options });
        return {
          ok: true,
          status: 200,
          json: async () => mockResponse
        };
      };

      const result = await lookupPDQDeviceBySerial('  PF2KNMR2  ');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.pdqDeviceId, 'dvc_test123');

      // Verify trimmed serial was used in URL
      const callUrl = fetchCalls[0].url;
      assert.ok(callUrl.includes('filter%5BserialNumber%5D=PF2KNMR2'));
      assert.ok(!callUrl.includes('%20')); // No spaces
    });

    it('should reject serial number with invalid characters', async () => {
      const result = await lookupPDQDeviceBySerial('PF2<script>alert(1)</script>');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.ok(result.error.includes('invalid characters'));
    });

    it('should handle 429 rate limit error', async () => {
      global.fetch = async () => ({
        ok: false,
        status: 429,
        json: async () => ({})
      });

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'PDQ API rate limit exceeded. Please try again later.');
    });

    it('should handle device found but missing id field', async () => {
      const mockResponse = {
        data: [
          {
            hostname: 'DESKTOP-ABC',
            serialNumber: 'PF2KNMR2'
            // Missing 'id' field
          }
        ],
        meta: { totalCount: 1 }
      };

      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'PDQ device data is incomplete. Please enter manually.');
    });

    it('should handle other HTTP error codes', async () => {
      global.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      const result = await lookupPDQDeviceBySerial('PF2KNMR2');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.pdqDeviceId, null);
      assert.strictEqual(result.error, 'Unable to connect to PDQ API. Please enter manually.');
    });
  });
});
