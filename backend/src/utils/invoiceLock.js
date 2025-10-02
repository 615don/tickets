import { InvoiceLock } from '../models/InvoiceLock.js';

/**
 * Extracts month in YYYY-MM-01 format from a work date
 * @param {string|Date} workDate - Work date in any format
 * @returns {string} Month in YYYY-MM-01 format
 */
export function extractMonth(workDate) {
  let dateStr = workDate;

  // Convert Date object to string if needed
  if (workDate instanceof Date) {
    dateStr = workDate.toISOString().split('T')[0];
  }

  // Extract YYYY-MM from date string and add -01
  if (typeof dateStr === 'string' && dateStr.length >= 7) {
    return `${dateStr.substring(0, 7)}-01`;
  }

  throw new Error('Invalid work date format');
}

/**
 * Validates that a work date's month is not locked
 * Throws 403 error if month is locked
 * @param {string|Date} workDate - Work date to validate
 * @throws {Error} If month is locked (statusCode: 403, type: InvoiceLockError)
 */
export async function validateNotLocked(workDate) {
  const month = extractMonth(workDate);
  const isLocked = await InvoiceLock.isMonthLocked(month);

  if (isLocked) {
    const monthDisplay = month.substring(0, 7); // YYYY-MM format for display
    const error = new Error(`Cannot modify time entries for locked month ${monthDisplay}`);
    error.statusCode = 403;
    error.type = 'InvoiceLockError';
    throw error;
  }
}
