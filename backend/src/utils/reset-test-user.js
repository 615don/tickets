/**
 * Quick script to reset the test user's password
 * Usage: node src/utils/reset-test-user.js
 */

import bcrypt from 'bcrypt';
import pool from '../config/database.js';

async function resetTestUser() {
  const email = 'test@example.com';
  const newPassword = 'password123'; // Simple test password

  try {
    console.log('🔄 Resetting test user password...\n');

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name',
      [passwordHash, email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found. Creating new test user...\n');

      const createResult = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, passwordHash, 'Test User']
      );

      console.log('✅ Test user created successfully!\n');
      console.log('Email:', createResult.rows[0].email);
      console.log('Password:', newPassword);
      console.log('Name:', createResult.rows[0].name);
    } else {
      console.log('✅ Password reset successfully!\n');
      console.log('Email:', result.rows[0].email);
      console.log('Password:', newPassword);
      console.log('Name:', result.rows[0].name);
    }

    console.log('\nYou can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetTestUser();
