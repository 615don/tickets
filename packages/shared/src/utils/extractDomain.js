/**
 * Extracts domain from email address
 * @param {string} email - Email address (e.g., "user@example.com")
 * @returns {string | null} - Extracted domain (lowercase) or null if invalid
 *
 * @example
 * extractDomain('user@example.com') // => 'example.com'
 * extractDomain('User@MAIL.EXAMPLE.COM') // => 'mail.example.com'
 * extractDomain('notanemail') // => null
 */
export function extractDomain(email) {
  // Trim whitespace from input
  const trimmed = email.trim();

  // Return null for empty strings
  if (!trimmed) {
    return null;
  }

  // Count @ symbols - must be exactly one
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return null;
  }

  // Split on @ symbol
  const parts = trimmed.split('@');
  const domain = parts[1];

  // Validate domain is not empty (after trimming)
  const trimmedDomain = domain ? domain.trim() : '';
  if (!trimmedDomain) {
    return null;
  }

  // Return lowercase domain for consistency with database storage
  return trimmedDomain.toLowerCase();
}
