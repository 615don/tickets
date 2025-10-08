import pool from '../config/database.js';

/**
 * Log an audit entry for security-sensitive operations
 * @param {Object} params
 * @param {number} params.userId - User ID performing the action
 * @param {string} params.userEmail - User email at time of action
 * @param {string} params.action - Action type (email_update, password_update, email_update_failed, password_update_failed)
 * @param {string} params.ipAddress - IP address of the request
 * @param {boolean} params.success - Whether the action succeeded
 * @param {string|null} params.errorMessage - Error message if action failed
 */
export async function logAudit({ userId, userEmail, action, ipAddress, success, errorMessage = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_email, action, ip_address, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, userEmail, action, ipAddress, success, errorMessage]
    );
  } catch (error) {
    // Log to console but don't fail the request if audit logging fails
    console.error('Audit logging failed:', error);
  }
}
