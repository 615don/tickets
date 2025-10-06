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
   * @param {Array} invoiceMetadata - Array of invoice metadata objects (optional)
   * @returns {Promise<Object>} Created invoice lock record
   */
  async create(month, xeroInvoiceIds = [], invoiceMetadata = []) {
    const normalizedMonth = normalizeMonth(month);

    const result = await query(
      `INSERT INTO invoice_locks (month, xero_invoice_ids, invoice_metadata, locked_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, month, xero_invoice_ids, invoice_metadata, locked_at`,
      [normalizedMonth, JSON.stringify(xeroInvoiceIds), JSON.stringify(invoiceMetadata)]
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
  },

  /**
   * Removes a specific invoice from a lock by its Xero invoice ID
   * @param {number} lockId - Invoice lock ID
   * @param {string} xeroInvoiceId - Xero invoice ID to remove
   * @returns {Promise<Object|null>} Updated lock record or null if lock doesn't exist
   */
  async removeInvoiceFromLock(lockId, xeroInvoiceId) {
    // Get current lock
    const getLockResult = await query(
      'SELECT id, month, xero_invoice_ids, invoice_metadata FROM invoice_locks WHERE id = $1',
      [lockId]
    );

    if (getLockResult.rows.length === 0) {
      return null;
    }

    const lock = getLockResult.rows[0];
    const currentInvoiceIds = lock.xero_invoice_ids || [];
    const currentMetadata = lock.invoice_metadata || [];

    // Remove the invoice ID from the array
    const updatedInvoiceIds = currentInvoiceIds.filter(id => id !== xeroInvoiceId);
    const updatedMetadata = currentMetadata.filter(meta => meta.xeroInvoiceId !== xeroInvoiceId);

    // If no invoices left, delete the entire lock
    if (updatedInvoiceIds.length === 0) {
      await query('DELETE FROM invoice_locks WHERE id = $1', [lockId]);
      return { deleted: true };
    }

    // Otherwise, update the lock with remaining invoices
    const result = await query(
      `UPDATE invoice_locks
       SET xero_invoice_ids = $1, invoice_metadata = $2
       WHERE id = $3
       RETURNING id, month, xero_invoice_ids, invoice_metadata, locked_at`,
      [JSON.stringify(updatedInvoiceIds), JSON.stringify(updatedMetadata), lockId]
    );

    return result.rows[0];
  }
};
