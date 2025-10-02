import { query } from '../config/database.js';

/**
 * Normalizes month input to YYYY-MM-01 format
 * @param {string} month - Month string (YYYY-MM or YYYY-MM-DD)
 * @returns {string} Normalized month in YYYY-MM-01 format
 */
function normalizeMonth(month) {
  if (!month || typeof month !== 'string') {
    throw new Error('Month must be a non-empty string');
  }

  // If already in YYYY-MM-DD format, extract YYYY-MM and add -01
  if (month.length === 10) {
    return `${month.substring(0, 7)}-01`;
  }

  // If in YYYY-MM format, add -01
  if (month.length === 7) {
    return `${month}-01`;
  }

  throw new Error('Invalid month format. Expected YYYY-MM or YYYY-MM-DD');
}

export const InvoiceLock = {
  /**
   * Creates a new invoice lock for a specific month
   * @param {string} month - Month to lock (YYYY-MM or YYYY-MM-DD)
   * @param {string[]} xeroInvoiceIds - Array of Xero invoice IDs
   * @returns {Promise<Object>} Created invoice lock record
   */
  async create(month, xeroInvoiceIds = []) {
    const normalizedMonth = normalizeMonth(month);

    const result = await query(
      `INSERT INTO invoice_locks (month, xero_invoice_ids, locked_at)
       VALUES ($1, $2, NOW())
       RETURNING id, month, xero_invoice_ids, locked_at`,
      [normalizedMonth, JSON.stringify(xeroInvoiceIds)]
    );

    return result.rows[0];
  },

  /**
   * Checks if a specific month is locked
   * @param {string} month - Month to check (YYYY-MM or YYYY-MM-DD)
   * @returns {Promise<boolean>} True if month is locked, false otherwise
   */
  async isMonthLocked(month) {
    const normalizedMonth = normalizeMonth(month);

    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM invoice_locks WHERE month = $1) as exists',
      [normalizedMonth]
    );

    return result.rows[0].exists;
  },

  /**
   * Gets invoice lock record for a specific month
   * @param {string} month - Month to retrieve (YYYY-MM or YYYY-MM-DD)
   * @returns {Promise<Object|null>} Invoice lock record or null if not found
   */
  async getByMonth(month) {
    const normalizedMonth = normalizeMonth(month);

    const result = await query(
      'SELECT id, month, xero_invoice_ids, locked_at FROM invoice_locks WHERE month = $1',
      [normalizedMonth]
    );

    return result.rows[0] || null;
  },

  /**
   * Gets all invoice locks
   * @returns {Promise<Array>} Array of all invoice lock records
   */
  async getAll() {
    const result = await query(
      'SELECT id, month, xero_invoice_ids, locked_at FROM invoice_locks ORDER BY month DESC'
    );

    return result.rows;
  }
};
