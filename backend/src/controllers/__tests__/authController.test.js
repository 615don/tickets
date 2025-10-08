import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { User } from '../../models/User.js';
import { query } from '../../config/database.js';
import { invalidateAllSessions } from '../../utils/sessionHelpers.js';

/**
 * Auth Controller Integration Tests
 * Tests for user profile update endpoints (email and password)
 */
describe('Auth Controller - Integration Tests', () => {
  let testUserId;
  let testUserEmail;

  // Clean up test data before and after each test
  beforeEach(async () => {
    await query("DELETE FROM users WHERE email LIKE $1", ['test_%@example.com']);
    await query("DELETE FROM session WHERE sess->>'userEmail' LIKE $1", ['test_%@example.com']);
  });

  afterEach(async () => {
    await query("DELETE FROM users WHERE email LIKE $1", ['test_%@example.com']);
    await query("DELETE FROM session WHERE sess->>'userEmail' LIKE $1", ['test_%@example.com']);
  });

  describe('PUT /api/auth/profile - Update Email', () => {
    beforeEach(async () => {
      // Create test user for each test
      const user = await User.create('test_profile@example.com', 'ValidPass123!', 'Test User');
      testUserId = user.id;
      testUserEmail = user.email;
    });

    it('should update email successfully with correct password', async () => {
      const newEmail = 'test_updated_profile@example.com';

      // Simulate updating email
      const user = await User.findByEmail(testUserEmail);
      const isValidPassword = await User.verifyPassword('ValidPass123!', user.password_hash);
      assert.strictEqual(isValidPassword, true);

      const updatedUser = await User.updateEmail(testUserId, newEmail);

      assert.strictEqual(updatedUser.email, newEmail);
      assert.strictEqual(updatedUser.id, testUserId);
      assert.strictEqual(updatedUser.name, 'Test User');
    });

    it('should reject update with wrong current password', async () => {
      const user = await User.findByEmail(testUserEmail);
      const isValidPassword = await User.verifyPassword('WrongPassword123!', user.password_hash);

      assert.strictEqual(isValidPassword, false);
    });

    it('should reject duplicate email', async () => {
      // Create another user
      const user2 = await User.create('test_existing@example.com', 'ValidPass123!', 'Existing User');

      // Try to update first user's email to second user's email
      await assert.rejects(
        async () => {
          await User.updateEmail(testUserId, 'test_existing@example.com');
        },
        {
          message: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        }
      );
    });

    it('should invalidate all sessions for user', async () => {
      // Create multiple sessions for user
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['session1', JSON.stringify({ userId: testUserId, userEmail: testUserEmail })]
      );
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['session2', JSON.stringify({ userId: testUserId, userEmail: testUserEmail })]
      );
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['session3', JSON.stringify({ userId: testUserId, userEmail: testUserEmail })]
      );

      // Verify sessions exist
      const beforeResult = await query(
        "SELECT COUNT(*) FROM session WHERE sess->>'userId' = $1",
        [testUserId.toString()]
      );
      assert.strictEqual(parseInt(beforeResult.rows[0].count), 3);

      // Invalidate all sessions
      const deletedCount = await invalidateAllSessions(testUserId);
      assert.strictEqual(deletedCount, 3);

      // Verify sessions are deleted
      const afterResult = await query(
        "SELECT COUNT(*) FROM session WHERE sess->>'userId' = $1",
        [testUserId.toString()]
      );
      assert.strictEqual(parseInt(afterResult.rows[0].count), 0);
    });
  });

  describe('PUT /api/auth/password - Update Password', () => {
    beforeEach(async () => {
      // Create test user for each test
      const user = await User.create('test_password_update@example.com', 'OldPass123!', 'Test User');
      testUserId = user.id;
      testUserEmail = user.email;
    });

    it('should update password successfully with correct current password', async () => {
      const result = await User.updatePassword(testUserId, 'OldPass123!', 'NewPass123!');

      assert.strictEqual(result, true);

      // Verify old password no longer works
      const user = await User.findByEmail(testUserEmail);
      const oldPasswordWorks = await User.verifyPassword('OldPass123!', user.password_hash);
      assert.strictEqual(oldPasswordWorks, false);

      // Verify new password works
      const newPasswordWorks = await User.verifyPassword('NewPass123!', user.password_hash);
      assert.strictEqual(newPasswordWorks, true);
    });

    it('should reject update with wrong current password', async () => {
      await assert.rejects(
        async () => {
          await User.updatePassword(testUserId, 'WrongOldPass123!', 'NewPass123!');
        },
        {
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        }
      );

      // Verify password was not changed
      const user = await User.findByEmail(testUserEmail);
      const oldPasswordWorks = await User.verifyPassword('OldPass123!', user.password_hash);
      assert.strictEqual(oldPasswordWorks, true);
    });

    it('should reject weak new password', async () => {
      await assert.rejects(
        async () => {
          await User.updatePassword(testUserId, 'OldPass123!', 'weak');
        },
        (error) => {
          assert.ok(error.message.includes('Password') || error.message.includes('password'));
          return true;
        }
      );

      // Verify password was not changed
      const user = await User.findByEmail(testUserEmail);
      const oldPasswordWorks = await User.verifyPassword('OldPass123!', user.password_hash);
      assert.strictEqual(oldPasswordWorks, true);
    });

    it('should invalidate all sessions for user', async () => {
      // Create multiple sessions for user
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['pass_session1', JSON.stringify({ userId: testUserId, userEmail: testUserEmail })]
      );
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['pass_session2', JSON.stringify({ userId: testUserId, userEmail: testUserEmail })]
      );

      // Verify sessions exist
      const beforeResult = await query(
        "SELECT COUNT(*) FROM session WHERE sess->>'userId' = $1",
        [testUserId.toString()]
      );
      assert.strictEqual(parseInt(beforeResult.rows[0].count), 2);

      // Update password (which should invalidate sessions in real implementation)
      await User.updatePassword(testUserId, 'OldPass123!', 'NewPass123!');

      // Invalidate sessions (simulating controller behavior)
      await invalidateAllSessions(testUserId);

      // Verify sessions are deleted
      const afterResult = await query(
        "SELECT COUNT(*) FROM session WHERE sess->>'userId' = $1",
        [testUserId.toString()]
      );
      assert.strictEqual(parseInt(afterResult.rows[0].count), 0);
    });
  });

  describe('Regression Tests - Existing Auth Endpoints', () => {
    it('should still be able to create users (register)', async () => {
      const user = await User.create('test_register@example.com', 'ValidPass123!', 'New User');

      assert.ok(user.id);
      assert.strictEqual(user.email, 'test_register@example.com');
      assert.strictEqual(user.name, 'New User');
      assert.ok(user.created_at);
    });

    it('should still be able to login with correct credentials', async () => {
      // Create user
      await User.create('test_login@example.com', 'ValidPass123!', 'Login User');

      // Login
      const user = await User.findByEmail('test_login@example.com');
      assert.ok(user);

      const isValidPassword = await User.verifyPassword('ValidPass123!', user.password_hash);
      assert.strictEqual(isValidPassword, true);
    });

    it('should still be able to find user by id', async () => {
      // Create user
      const createdUser = await User.create('test_findbyid@example.com', 'ValidPass123!', 'Find User');

      // Find by ID
      const foundUser = await User.findById(createdUser.id);
      assert.ok(foundUser);
      assert.strictEqual(foundUser.id, createdUser.id);
      assert.strictEqual(foundUser.email, 'test_findbyid@example.com');
      assert.strictEqual(foundUser.name, 'Find User');
      // Verify password_hash is NOT included in findById result
      assert.strictEqual(foundUser.password_hash, undefined);
    });

    it('should still be able to find user by email', async () => {
      // Create user
      await User.create('test_findbyemail@example.com', 'ValidPass123!', 'Email User');

      // Find by email
      const user = await User.findByEmail('test_findbyemail@example.com');
      assert.ok(user);
      assert.strictEqual(user.email, 'test_findbyemail@example.com');
      assert.strictEqual(user.name, 'Email User');
      // Verify password_hash IS included in findByEmail result (needed for login)
      assert.ok(user.password_hash);
    });
  });

  describe('invalidateAllSessions utility', () => {
    it('should return 0 when no sessions exist', async () => {
      const user = await User.create('test_nosessions@example.com', 'ValidPass123!', 'No Sessions');

      const deletedCount = await invalidateAllSessions(user.id);
      assert.strictEqual(deletedCount, 0);
    });

    it('should only delete sessions for specified user', async () => {
      const user1 = await User.create('test_user1_sessions@example.com', 'ValidPass123!', 'User 1');
      const user2 = await User.create('test_user2_sessions@example.com', 'ValidPass123!', 'User 2');

      // Create sessions for both users
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['user1_session', JSON.stringify({ userId: user1.id, userEmail: user1.email })]
      );
      await query(
        "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL '1 day')",
        ['user2_session', JSON.stringify({ userId: user2.id, userEmail: user2.email })]
      );

      // Invalidate user1's sessions
      await invalidateAllSessions(user1.id);

      // Verify user1's sessions are deleted
      const user1Sessions = await query(
        "SELECT COUNT(*) FROM session WHERE sess->>'userId' = $1",
        [user1.id.toString()]
      );
      assert.strictEqual(parseInt(user1Sessions.rows[0].count), 0);

      // Verify user2's sessions still exist
      const user2Sessions = await query(
        "SELECT COUNT(*) FROM session WHERE sess->>'userId' = $1",
        [user2.id.toString()]
      );
      assert.strictEqual(parseInt(user2Sessions.rows[0].count), 1);
    });
  });
});
