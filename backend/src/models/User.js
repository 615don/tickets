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
  }
};
