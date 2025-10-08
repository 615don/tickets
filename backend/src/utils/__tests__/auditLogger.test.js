import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { logAudit } from '../auditLogger.js';
import { query } from '../../config/database.js';
import { User } from '../../models/User.js';

/**
 * Audit Logger Tests
 * Tests for audit log creation and data integrity
 */
describe('Audit Logger Tests', () => {
  let testUserId;
  let testUserEmail;

  // Clean up test data before and after each test
  beforeEach(async () => {
    await query("DELETE FROM audit_logs WHERE user_email LIKE $1", ['test_%@example.com']);
    await query("DELETE FROM users WHERE email LIKE $1", ['test_%@example.com']);

    // Create test user for audit logging
    const user = await User.create('test_audit@example.com', 'ValidPass123!', 'Audit Test User');
    testUserId = user.id;
    testUserEmail = user.email;
  });

  afterEach(async () => {
    await query("DELETE FROM audit_logs WHERE user_email LIKE $1", ['test_%@example.com']);
    await query("DELETE FROM users WHERE email LIKE $1", ['test_%@example.com']);
  });

  describe('Successful Email Update Audit Logs', () => {
    it('should create audit log entry for successful email update', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: 'test_new@example.com',
        action: 'email_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2',
        [testUserId, 'email_update']
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];
      assert.strictEqual(log.user_id, testUserId);
      assert.strictEqual(log.user_email, 'test_new@example.com');
      assert.strictEqual(log.action, 'email_update');
      assert.strictEqual(log.ip_address, '127.0.0.1');
      assert.strictEqual(log.success, true);
      assert.strictEqual(log.error_message, null);
      assert.ok(log.timestamp);
      assert.ok(log.created_at);
    });

    it('should include all required fields in successful audit log', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update',
        ipAddress: '192.168.1.1',
        success: true
      });

      const result = await query(
        'SELECT user_id, user_email, action, ip_address, success, error_message, timestamp FROM audit_logs WHERE user_id = $1',
        [testUserId]
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];

      // Verify all fields are present
      assert.ok(typeof log.user_id === 'number');
      assert.ok(typeof log.user_email === 'string');
      assert.ok(typeof log.action === 'string');
      assert.ok(typeof log.ip_address === 'string');
      assert.ok(typeof log.success === 'boolean');
      assert.ok(log.timestamp instanceof Date);
    });
  });

  describe('Failed Email Update Audit Logs', () => {
    it('should create audit log entry for failed email update (wrong password)', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update_failed',
        ipAddress: '127.0.0.1',
        success: false,
        errorMessage: 'Current password is incorrect'
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2',
        [testUserId, 'email_update_failed']
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];
      assert.strictEqual(log.user_id, testUserId);
      assert.strictEqual(log.user_email, testUserEmail);
      assert.strictEqual(log.action, 'email_update_failed');
      assert.strictEqual(log.success, false);
      assert.strictEqual(log.error_message, 'Current password is incorrect');
    });

    it('should create audit log entry for failed email update (duplicate email)', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update_failed',
        ipAddress: '127.0.0.1',
        success: false,
        errorMessage: 'This email is already registered'
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1',
        [testUserId]
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];
      assert.strictEqual(log.success, false);
      assert.strictEqual(log.error_message, 'This email is already registered');
    });
  });

  describe('Successful Password Update Audit Logs', () => {
    it('should create audit log entry for successful password update', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'password_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2',
        [testUserId, 'password_update']
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];
      assert.strictEqual(log.user_id, testUserId);
      assert.strictEqual(log.action, 'password_update');
      assert.strictEqual(log.success, true);
      assert.strictEqual(log.error_message, null);
    });
  });

  describe('Failed Password Update Audit Logs', () => {
    it('should create audit log entry for failed password update (wrong password)', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'password_update_failed',
        ipAddress: '127.0.0.1',
        success: false,
        errorMessage: 'Current password is incorrect'
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2',
        [testUserId, 'password_update_failed']
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];
      assert.strictEqual(log.success, false);
      assert.strictEqual(log.error_message, 'Current password is incorrect');
    });

    it('should create audit log entry for failed password update (weak password)', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'password_update_failed',
        ipAddress: '127.0.0.1',
        success: false,
        errorMessage: 'Password requirements not met: must contain uppercase, lowercase, number, special character'
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1',
        [testUserId]
      );

      assert.strictEqual(result.rows.length, 1);
      const log = result.rows[0];
      assert.strictEqual(log.success, false);
      assert.ok(log.error_message.includes('Password requirements'));
    });
  });

  describe('Audit Log Data Integrity', () => {
    it('should handle IPv6 addresses', async () => {
      const ipv6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update',
        ipAddress: ipv6Address,
        success: true
      });

      const result = await query(
        'SELECT ip_address FROM audit_logs WHERE user_id = $1',
        [testUserId]
      );

      assert.strictEqual(result.rows[0].ip_address, ipv6Address);
    });

    it('should store timestamp automatically', async () => {
      const beforeTime = new Date();

      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      const afterTime = new Date();

      const result = await query(
        'SELECT timestamp FROM audit_logs WHERE user_id = $1',
        [testUserId]
      );

      const logTime = new Date(result.rows[0].timestamp);
      assert.ok(logTime >= beforeTime);
      assert.ok(logTime <= afterTime);
    });

    it('should allow querying audit logs by user', async () => {
      // Create multiple audit log entries
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      await logAudit({
        userId: testUserId,
        userEmail: 'test_new@example.com',
        action: 'password_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      await logAudit({
        userId: testUserId,
        userEmail: 'test_new@example.com',
        action: 'email_update_failed',
        ipAddress: '127.0.0.1',
        success: false,
        errorMessage: 'Test error'
      });

      // Query all logs for user
      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC',
        [testUserId]
      );

      assert.strictEqual(result.rows.length, 3);
      assert.strictEqual(result.rows[0].action, 'email_update_failed'); // Most recent
      assert.strictEqual(result.rows[1].action, 'password_update');
      assert.strictEqual(result.rows[2].action, 'email_update');
    });

    it('should allow querying audit logs by action type', async () => {
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'password_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      // Query only email updates
      const result = await query(
        "SELECT * FROM audit_logs WHERE action LIKE $1",
        ['email_update%']
      );

      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].action, 'email_update');
    });

    it('should handle audit logging errors gracefully', async () => {
      // Attempt to log with invalid user ID (should not throw)
      await logAudit({
        userId: 999999, // Non-existent user
        userEmail: 'test@example.com',
        action: 'email_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      // Should fail silently and log to console
      // No exception should be thrown
    });
  });

  describe('Audit Log Immutability', () => {
    it('should document that audit logs are append-only', async () => {
      // Create an audit log
      await logAudit({
        userId: testUserId,
        userEmail: testUserEmail,
        action: 'email_update',
        ipAddress: '127.0.0.1',
        success: true
      });

      const result = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1',
        [testUserId]
      );

      const logId = result.rows[0].id;

      // Audit logs should never be updated or deleted in production
      // This test documents the expected behavior
      // In practice, UPDATE and DELETE operations should be restricted by database permissions

      // Verify the log exists
      assert.ok(logId);
      assert.strictEqual(result.rows.length, 1);

      // Note: We don't test actual UPDATE/DELETE here as that would require
      // database permission changes. This test documents the requirement.
    });
  });
});
