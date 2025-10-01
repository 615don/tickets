import { query } from '../config/database.js';

/**
 * Check if a specific month is locked for editing
 * @param {string|Date} workDate - Work date in YYYY-MM-DD format or Date object
 * @returns {Promise<boolean>} - True if month is locked, false otherwise
 */
async function isMonthLocked(workDate) {
  // Convert Date object to string if needed
  let dateStr = workDate;
  if (workDate instanceof Date) {
    dateStr = workDate.toISOString().split('T')[0];
  }

  // Extract month as YYYY-MM-01
  const monthStart = dateStr.substring(0, 7) + '-01';

  const result = await query(
    'SELECT id FROM invoice_locks WHERE month = $1',
    [monthStart]
  );

  return result.rows.length > 0;
}

export const InvoiceLock = {
  isMonthLocked
};
