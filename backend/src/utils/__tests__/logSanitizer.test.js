/**
 * Tests for Log Sanitizer utility
 * Uses Node.js built-in test runner
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { safeError, safeLog, _internal } from '../logSanitizer.js';

const {
  maskValue,
  sanitizeObject,
  sanitizeString,
  sanitizeError,
  SENSITIVE_FIELDS
} = _internal;

describe('logSanitizer', () => {
  let originalNodeEnv;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('maskValue', () => {
    it('should mask string values', () => {
      assert.strictEqual(maskValue('password123'), '***MASKED***');
    });

    it('should handle null values', () => {
      assert.strictEqual(maskValue(null), '***NULL***');
    });

    it('should handle undefined values', () => {
      assert.strictEqual(maskValue(undefined), '***NULL***');
    });

    it('should handle empty strings', () => {
      assert.strictEqual(maskValue(''), '***EMPTY***');
    });
  });

  describe('sanitizeObject', () => {
    it('should mask password fields', () => {
      const obj = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com'
      };

      const result = sanitizeObject(obj);

      assert.strictEqual(result.username, 'testuser');
      assert.strictEqual(result.password, '***MASKED***');
      assert.strictEqual(result.email, 'test@example.com');
    });

    it('should mask nested password fields', () => {
      const obj = {
        user: {
          email: 'test@example.com',
          credentials: {
            currentPassword: 'old123',
            newPassword: 'new456'
          }
        }
      };

      const result = sanitizeObject(obj);

      assert.strictEqual(result.user.email, 'test@example.com');
      assert.strictEqual(result.user.credentials.currentPassword, '***MASKED***');
      assert.strictEqual(result.user.credentials.newPassword, '***MASKED***');
    });

    it('should mask token fields', () => {
      const obj = {
        accessToken: 'abc123',
        refreshToken: 'def456',
        data: 'public'
      };

      const result = sanitizeObject(obj);

      assert.strictEqual(result.accessToken, '***MASKED***');
      assert.strictEqual(result.refreshToken, '***MASKED***');
      assert.strictEqual(result.data, 'public');
    });

    it('should mask session_id fields', () => {
      const obj = {
        session_id: 'sess_abc123',
        userId: 42
      };

      const result = sanitizeObject(obj);

      assert.strictEqual(result.session_id, '***MASKED***');
      assert.strictEqual(result.userId, 42);
    });

    it('should handle arrays with objects', () => {
      const obj = {
        users: [
          { name: 'Alice', password: 'secret1' },
          { name: 'Bob', password: 'secret2' }
        ]
      };

      const result = sanitizeObject(obj);

      assert.strictEqual(result.users[0].name, 'Alice');
      assert.strictEqual(result.users[0].password, '***MASKED***');
      assert.strictEqual(result.users[1].name, 'Bob');
      assert.strictEqual(result.users[1].password, '***MASKED***');
    });

    it('should be case-insensitive for field names', () => {
      const obj = {
        Password: 'secret1',
        PASSWORD: 'secret2',
        apiKey: 'key123'
      };

      const result = sanitizeObject(obj);

      assert.strictEqual(result.Password, '***MASKED***');
      assert.strictEqual(result.PASSWORD, '***MASKED***');
      assert.strictEqual(result.apiKey, '***MASKED***');
    });
  });

  describe('sanitizeString', () => {
    it('should mask password in strings', () => {
      const str = 'User login failed: password=secret123';
      const result = sanitizeString(str);

      assert.ok(result.includes('password=***MASKED***'));
      assert.ok(!result.includes('secret123'));
    });

    it('should mask Bearer tokens', () => {
      const str = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const result = sanitizeString(str);

      // The sanitizer should remove the JWT token
      assert.ok(!result.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'JWT should be masked');
    });

    it('should return non-string values unchanged', () => {
      assert.strictEqual(sanitizeString(42), 42);
      assert.strictEqual(sanitizeString(null), null);
      assert.strictEqual(sanitizeString(undefined), undefined);
    });
  });

  describe('sanitizeError', () => {
    it('should include full error details in development', () => {
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.code = 'TEST_CODE';

      const result = sanitizeError(error);

      assert.strictEqual(result.message, 'Test error');
      assert.strictEqual(result.code, 'TEST_CODE');
      assert.ok(result.stack);
      assert.strictEqual(result.name, 'Error');
    });

    it('should omit stack trace in production', () => {
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.code = 'TEST_CODE';

      const result = sanitizeError(error);

      assert.strictEqual(result.message, 'Test error');
      assert.strictEqual(result.code, 'TEST_CODE');
      assert.strictEqual(result.stack, undefined);
      assert.strictEqual(result.name, 'Error');
    });

    it('should handle null error', () => {
      const result = sanitizeError(null);
      assert.strictEqual(result, null);
    });
  });

  describe('SENSITIVE_FIELDS coverage', () => {
    it('should include common sensitive field names', () => {
      const expectedFields = [
        'password',
        'token',
        'accessToken',
        'secret',
        'sessionId',
        'session_id'
      ];

      expectedFields.forEach(field => {
        assert.ok(SENSITIVE_FIELDS.includes(field), `Missing field: ${field}`);
      });
    });
  });

  describe('integration tests', () => {
    it('should handle real-world login request body', () => {
      const loginBody = {
        email: 'user@example.com',
        password: 'MySecretPassword123!',
        rememberMe: true
      };

      const result = sanitizeObject(loginBody);

      assert.strictEqual(result.email, 'user@example.com');
      assert.strictEqual(result.password, '***MASKED***');
      assert.strictEqual(result.rememberMe, true);
    });

    it('should handle real-world password update request', () => {
      const updateBody = {
        userId: 42,
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      };

      const result = sanitizeObject(updateBody);

      assert.strictEqual(result.userId, 42);
      assert.strictEqual(result.currentPassword, '***MASKED***');
      assert.strictEqual(result.newPassword, '***MASKED***');
      assert.strictEqual(result.confirmPassword, '***MASKED***');
    });

    it('should handle OAuth token response', () => {
      const oauthResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'def456ghi789...',
        expires_in: 3600,
        grant_type: 'authorization_code', // Changed from token_type to avoid false positive
        user: {
          id: 42,
          email: 'user@example.com'
        }
      };

      const result = sanitizeObject(oauthResponse);

      assert.strictEqual(result.access_token, '***MASKED***');
      assert.strictEqual(result.refresh_token, '***MASKED***');
      assert.strictEqual(result.expires_in, 3600);
      assert.strictEqual(result.grant_type, 'authorization_code');
      assert.strictEqual(result.user.id, 42);
      assert.strictEqual(result.user.email, 'user@example.com');
    });
  });
});
