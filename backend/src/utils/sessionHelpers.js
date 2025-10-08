import { query } from '../config/database.js';

/**
 * Invalidate all sessions for a given user
 * @param {number} userId - The user ID whose sessions should be invalidated
 * @returns {Promise<number>} - Number of sessions deleted
 */
export async function invalidateAllSessions(userId) {
  const result = await query(
    "DELETE FROM session WHERE sess->>'userId' = $1",
    [userId.toString()]
  );

  return result.rowCount;
}
