/**
 * Extracts the domain from an email address
 * @param email - Email address to extract domain from
 * @returns Domain string in lowercase or null if invalid
 */
export function extractDomain(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic email validation: must contain exactly one @ symbol
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return null;
  }

  const [, domain] = trimmedEmail.split('@');

  if (!domain || domain.length === 0) {
    return null;
  }

  return domain;
}
