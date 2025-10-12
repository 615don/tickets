import type { MatchContactResponse, MatchClientResponse } from '../../types';
import { apiClient } from '../api-client';

/**
 * Match a contact by email address
 * Calls GET /api/contacts/match-email endpoint
 *
 * @param email - Email address to match against contacts database
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to array of matching contacts (may be empty if no match)
 * @throws Error with descriptive message for authentication, validation, or server errors
 *
 * Story 4.1: Email-to-Contact Matching Integration
 */
export async function matchContactByEmail(email: string, signal?: AbortSignal): Promise<MatchContactResponse[]> {
  return apiClient<MatchContactResponse[]>(
    `/api/contacts/match-email?email=${encodeURIComponent(email)}`,
    { signal }
  );
}

/**
 * Match a client by domain
 * Calls GET /api/clients/match-domain endpoint
 *
 * @param domain - Domain to match against client_domains table
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to matching client or null if no match
 * @throws Error with descriptive message for authentication, validation, or server errors
 *
 * Story 4.2: Domain-to-Client Fallback Matching
 */
export async function matchClientByDomain(domain: string, signal?: AbortSignal): Promise<MatchClientResponse | null> {
  const data = await apiClient<MatchClientResponse[]>(
    `/api/clients/match-domain?domain=${encodeURIComponent(domain)}`,
    { signal }
  );

  // API returns array, but domain is unique per client (database constraint)
  // Return first element or null if empty
  return data.length > 0 ? data[0] : null;
}
