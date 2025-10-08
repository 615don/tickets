import { query } from '../config/database.js';
import bcrypt from 'bcrypt';
import { validatePasswordStrength, getPasswordErrorMessage } from '../utils/passwordValidation.js';

const SALT_ROUNDS = 10;

export const User = {
  // Create a new user
  async create(email, password, name = null) {
    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(getPasswordErrorMessage(validation.errors));
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, name, created_at`,
      [email, passwordHash, name]
    );

    return result.rows[0];
  },

  // Find user by email
  async findByEmail(email) {
    const result = await query(
      'SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  },

  // Find user by ID
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  },

  // Verify password
  async verifyPassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  },

  // Update user
  async update(id, updates) {
    const allowedFields = ['name', 'email'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, updated_at`,
      values
    );

    return result.rows[0];
  },

  // Update email with uniqueness check
  async updateEmail(id, email) {
    // Check if email already exists for another user
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (existingUser.rows.length > 0) {
      const error = new Error('Email already exists');
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    // Update email
    const result = await query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, created_at, updated_at',
      [email, id]
    );

    if (!result.rows[0]) {
      throw new Error('User not found');
    }

    return result.rows[0];
  },

  // Update password with validation
  async updatePassword(id, currentPassword, newPassword) {
    // Get user with password hash
    const userResult = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [id]
    );

    if (!userResult.rows[0]) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      const error = new Error('Current password is incorrect');
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Error(getPasswordErrorMessage(validation.errors));
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, id]
    );

    return true;
  }
};
