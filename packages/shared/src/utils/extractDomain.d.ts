/**
 * Extracts domain from email address
 * @param email - Email address (e.g., "user@example.com")
 * @returns Extracted domain (lowercase) or null if invalid
 *
 * @example
 * ```typescript
 * extractDomain('user@example.com') // => 'example.com'
 * extractDomain('User@MAIL.EXAMPLE.COM') // => 'mail.example.com'
 * extractDomain('notanemail') // => null
 * ```
 */
export function extractDomain(email: string): string | null;
