import { describe, it, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { restoreBackup } from '../backupController.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('restoreBackup Controller', () => {
  let mockReq;
  let mockRes;
  let mockPool;
  const testDir = '/tmp/restore-test';

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      file: {
        path: '/tmp/test-backup.zip',
        size: 1024 * 1024, // 1MB
      },
      session: {
        userId: 1,
      },
    };

    // Setup mock response
    mockRes = {
      headersSent: false,
      statusCode: 200,
      _json: null,
      _status: null,
      status(code) {
        this._status = code;
        this.statusCode = code;
        return this;
      },
      json(data) {
        this._json = data;
        return this;
      },
    };

    // Setup mock pool
    mockPool = {
      query: mock.fn(() => Promise.resolve({ rows: [] })),
    };
  });

  afterEach(async () => {
    // Cleanup test files
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should return 400 if no file is uploaded', async () => {
    mockReq.file = null;

    await restoreBackup(mockReq, mockRes);

    assert.strictEqual(mockRes._status, 400);
    assert.strictEqual(mockRes._json.error, 'ValidationError');
    assert.ok(mockRes._json.message.includes('No backup file provided'));
  });

  it('should return 413 if file exceeds 100MB', async () => {
    // Create a test file path
    const testFile = '/tmp/test-large-backup.zip';
    await fs.promises.writeFile(testFile, Buffer.alloc(101 * 1024 * 1024)); // 101MB

    mockReq.file.path = testFile;
    mockReq.file.size = 101 * 1024 * 1024;

    await restoreBackup(mockReq, mockRes);

    assert.strictEqual(mockRes._status, 413);
    assert.strictEqual(mockRes._json.error, 'PayloadTooLarge');
    assert.ok(mockRes._json.message.includes('100MB'));

    // Cleanup
    await fs.promises.unlink(testFile).catch(() => {});
  });

  it('should return 400 if ZIP file is invalid', async () => {
    // Create an invalid ZIP file
    const testFile = '/tmp/test-invalid.zip';
    await fs.promises.writeFile(testFile, 'not a zip file');

    mockReq.file.path = testFile;

    await restoreBackup(mockReq, mockRes);

    assert.strictEqual(mockRes._status, 400);
    assert.strictEqual(mockRes._json.error, 'ValidationError');
    assert.ok(mockRes._json.message.includes('Invalid ZIP file'));

    // Cleanup
    await fs.promises.unlink(testFile).catch(() => {});
  });

  it('should return 400 if ZIP structure is invalid (missing database.sql)', async () => {
    // Create a valid ZIP but with missing database.sql
    const testFile = '/tmp/test-missing-db.zip';
    const zip = new AdmZip();
    zip.addFile('environment-config.json', Buffer.from(JSON.stringify({
      XERO_CLIENT_ID: 'test',
    })));
    zip.writeZip(testFile);

    mockReq.file.path = testFile;

    await restoreBackup(mockReq, mockRes);

    assert.strictEqual(mockRes._status, 400);
    assert.strictEqual(mockRes._json.error, 'ValidationError');
    assert.ok(mockRes._json.message.includes('Expected database.sql and environment-config.json'));

    // Cleanup
    await fs.promises.unlink(testFile).catch(() => {});
  });

  it('should return 400 if ZIP structure is invalid (missing environment-config.json)', async () => {
    // Create a valid ZIP but with missing environment-config.json
    const testFile = '/tmp/test-missing-config.zip';
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SELECT 1;'));
    zip.writeZip(testFile);

    mockReq.file.path = testFile;

    await restoreBackup(mockReq, mockRes);

    assert.strictEqual(mockRes._status, 400);
    assert.strictEqual(mockRes._json.error, 'ValidationError');
    assert.ok(mockRes._json.message.includes('Expected database.sql and environment-config.json'));

    // Cleanup
    await fs.promises.unlink(testFile).catch(() => {});
  });

  it('should return 400 if environment-config.json is invalid JSON', async () => {
    // Create a valid ZIP but with invalid JSON
    const testFile = '/tmp/test-invalid-json.zip';
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SELECT 1;'));
    zip.addFile('environment-config.json', Buffer.from('not valid json'));
    zip.writeZip(testFile);

    mockReq.file.path = testFile;

    await restoreBackup(mockReq, mockRes);

    assert.strictEqual(mockRes._status, 400);
    assert.strictEqual(mockRes._json.error, 'ValidationError');
    assert.ok(mockRes._json.message.includes('invalid environment configuration'));

    // Cleanup
    await fs.promises.unlink(testFile).catch(() => {});
  });

  it('should successfully validate a proper backup ZIP structure', async () => {
    // Note: This test validates ZIP structure only, not actual psql execution
    // Full integration test would require a real database and psql command

    const testFile = '/tmp/test-valid-backup.zip';
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SELECT 1;'));
    zip.addFile('environment-config.json', Buffer.from(JSON.stringify({
      XERO_CLIENT_ID: 'test_id',
      XERO_CLIENT_SECRET: 'test_secret',
      XERO_REDIRECT_URI: 'http://localhost:3001/auth/xero/callback',
      ENCRYPTION_KEY: 'test_key',
      SESSION_SECRET: 'test_session',
    })));
    zip.writeZip(testFile);

    mockReq.file.path = testFile;

    // This will fail at psql execution but should pass validation
    await restoreBackup(mockReq, mockRes);

    // Should fail at psql stage, not validation
    // If we get a 500 error, it means validation passed
    assert.ok(mockRes._status === 500 || mockRes._status === 200);
    if (mockRes._status === 500) {
      // Expected to fail at psql execution in test environment
      assert.ok(
        mockRes._json.message.includes('psql') ||
        mockRes._json.message.includes('database') ||
        mockRes._json.message.includes('restore')
      );
    }

    // Cleanup
    await fs.promises.unlink(testFile).catch(() => {});
  });
});
