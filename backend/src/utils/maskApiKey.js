/**
 * Masks an API key for safe display in logs, API responses, and UI
 *
 * @param {string} apiKey - The API key to mask
 * @returns {string} Masked API key in format: prefix***suffix
 *
 * @example
 * maskApiKey('sk-proj-abc123def456ghi789') // Returns: 'sk-***ghi789'
 * maskApiKey('sk-test') // Returns: '***' (too short)
 * maskApiKey('') // Returns: '***' (empty)
 */
export function maskApiKey(apiKey) {
  // Return *** for empty or too-short keys
  if (!apiKey || apiKey.length < 12) {
    return '***';
  }

  // Extract first 3 characters (prefix, e.g., "sk-")
  const prefix = apiKey.substring(0, 3);

  // Extract last 8 characters (suffix for identification)
  const suffix = apiKey.substring(apiKey.length - 8);

  // Return format: prefix***suffix
  return `${prefix}***${suffix}`;
}
