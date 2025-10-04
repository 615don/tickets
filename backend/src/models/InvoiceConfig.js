import pool from '../config/database.js';

const VALID_STATUSES = ['DRAFT', 'AUTHORISED'];

/**
 * InvoiceConfig model for managing invoice configuration settings
 * This is a singleton table with only one row (id=1)
 */
export const InvoiceConfig = {
  /**
   * Get current invoice configuration
   * Creates default if not exists
   * @returns {Promise<{xeroInvoiceStatus: string}>}
   */
  async getConfig() {
    const result = await pool.query(
      'SELECT xero_invoice_status FROM invoice_config WHERE id = 1'
    );

    if (result.rows.length === 0) {
      // Create default config
      await pool.query(
        'INSERT INTO invoice_config (id, xero_invoice_status) VALUES (1, $1)',
        ['DRAFT']
      );
      return { xeroInvoiceStatus: 'DRAFT' };
    }

    return { xeroInvoiceStatus: result.rows[0].xero_invoice_status };
  },

  /**
   * Update invoice configuration
   * @param {string} xeroInvoiceStatus - DRAFT | AUTHORISED
   * @returns {Promise<{xeroInvoiceStatus: string}>}
   * @throws {Error} If invalid status provided
   */
  async updateConfig(xeroInvoiceStatus) {
    if (!VALID_STATUSES.includes(xeroInvoiceStatus)) {
      throw new Error(
        `Invalid xeroInvoiceStatus. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }

    await pool.query(
      'UPDATE invoice_config SET xero_invoice_status = $1, updated_at = NOW() WHERE id = 1',
      [xeroInvoiceStatus]
    );

    return { xeroInvoiceStatus };
  }
};
