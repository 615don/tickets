import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { User } from '../User.js';
import { query } from '../../config/database.js';

describe('User Model - Unit Tests', () => {
  // Clean up test data before and after each test
  beforeEach(async () => {
    await query("DELETE FROM users WHERE email LIKE $1", ['test_%@example.com']);
    await query("DELETE FROM session WHERE sess->>'userEmail' LIKE $1", ['test_%@example.com']);
  });

  afterEach(async () => {
    await query("DELETE FROM users WHERE email LIKE $1", ['test_%@example.com']);
    await query("DELETE FROM session WHERE sess->>'userEmail' LIKE $1", ['test_%@example.com']);
  });

  describe('User.updateEmail', () => {
    it('should update email successfully', async () => {
      // Create test user
      const user = await User.create('test_update@example.com', 'ValidPass123!', 'Test User');

      // Update email
      const updatedUser = await User.updateEmail(user.id, 'test_updated@example.com');

      assert.strictEqual(updatedUser.email, 'test_updated@example.com');
      assert.strictEqual(updatedUser.id, user.id);
      assert.strictEqual(updatedUser.name, 'Test User');
      assert.ok(updatedUser.updated_at);

      // Verify email was updated in database
      const dbUser = await User.findById(user.id);
      assert.strictEqual(dbUser.email, 'test_updated@example.com');
    });

    it('should throw error for duplicate email', async () => {
      // Create two test users
      const user1 = await User.create('test_user1@example.com', 'ValidPass123!', 'User 1');
      const user2 = await User.create('test_user2@example.com', 'ValidPass123!', 'User 2');

      // Try to update user2's email to user1's email
      await assert.rejects(
        async () => {
          await User.updateEmail(user2.id, 'test_user1@example.com');
        },
        {
          message: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        }
      );

      // Verify user2's email was not changed
      const dbUser = await User.findById(user2.id);
      assert.strictEqual(dbUser.email, 'test_user2@example.com');
    });

    it('should throw error for non-existent user', async () => {
      await assert.rejects(
        async () => {
          await User.updateEmail(999999, 'test_nonexistent@example.com');
        },
        {
          message: 'User not found'
        }
      );
    });

    it('should allow updating to same email', async () => {
      // Create test user
      const user = await User.create('test_same@example.com', 'ValidPass123!', 'Test User');

      // Update to same email (should succeed)
      const updatedUser = await User.updateEmail(user.id, 'test_same@example.com');

      assert.strictEqual(updatedUser.email, 'test_same@example.com');
    });
  });

  describe('User.updatePassword', () => {
    it('should update password successfully', async () => {
      // Create test user
      const user = await User.create('test_password@example.com', 'OldPass123!', 'Test User');

      // Update password
      const result = await User.updatePassword(user.id, 'OldPass123!', 'NewPass123!');

      assert.strictEqual(result, true);

      // Verify old password no longer works
      const dbUser = await User.findByEmail('test_password@example.com');
      const oldPasswordWorks = await User.verifyPassword('OldPass123!', dbUser.password_hash);
      assert.strictEqual(oldPasswordWorks, false);

      // Verify new password works
      const newPasswordWorks = await User.verifyPassword('NewPass123!', dbUser.password_hash);
      assert.strictEqual(newPasswordWorks, true);
    });

    it('should reject weak new password', async () => {
      // Create test user
      const user = await User.create('test_weak@example.com', 'ValidPass123!', 'Test User');

      // Try to update to weak password
      await assert.rejects(
        async () => {
          await User.updatePassword(user.id, 'ValidPass123!', 'weak');
        },
        {
          message: /Password requirements/
        }
      );

      // Verify password was not changed
      const dbUser = await User.findByEmail('test_weak@example.com');
      const oldPasswordWorks = await User.verifyPassword('ValidPass123!', dbUser.password_hash);
      assert.strictEqual(oldPasswordWorks, true);
    });

    it('should reject incorrect current password', async () => {
      // Create test user
      const user = await User.create('test_wrongpass@example.com', 'ValidPass123!', 'Test User');

      // Try to update with wrong current password
      await assert.rejects(
        async () => {
          await User.updatePassword(user.id, 'WrongPass123!', 'NewPass123!');
        },
        {
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        }
      );

      // Verify password was not changed
      const dbUser = await User.findByEmail('test_wrongpass@example.com');
      const oldPasswordWorks = await User.verifyPassword('ValidPass123!', dbUser.password_hash);
      assert.strictEqual(oldPasswordWorks, true);
    });

    it('should throw error for non-existent user', async () => {
      await assert.rejects(
        async () => {
          await User.updatePassword(999999, 'ValidPass123!', 'NewPass123!');
        },
        {
          message: 'User not found'
        }
      );
    });

    it('should reject password without uppercase letter', async () => {
      const user = await User.create('test_nouppercase@example.com', 'ValidPass123!', 'Test User');

      await assert.rejects(
        async () => {
          await User.updatePassword(user.id, 'ValidPass123!', 'newpass123!');
        },
        (error) => {
          assert.ok(error.message.includes('uppercase'));
          return true;
        }
      );
    });

    it('should reject password without special character', async () => {
      const user = await User.create('test_nospecial@example.com', 'ValidPass123!', 'Test User');

      await assert.rejects(
        async () => {
          await User.updatePassword(user.id, 'ValidPass123!', 'NewPass123');
        },
        (error) => {
          assert.ok(error.message.includes('special character'));
          return true;
        }
      );
    });
  });
});
