import type { MatchContactResponse, MatchClientResponse } from '../../types';

// Get API base URL from environment variable or use relative URL for development
const API_BASE_URL = import.meta.env?.VITE_API_URL || '';

/**
 * Match a contact by email address
 * Calls GET /api/contacts/match-email endpoint
 *
 * @param email - Email address to match against contacts database
 * @returns Promise resolving to array of matching contacts (may be empty if no match)
 * @throws Error with descriptive message for authentication, validation, or server errors
 *
 * Story 4.1: Email-to-Contact Matching Integration
 */
export async function matchContactByEmail(email: string): Promise<MatchContactResponse[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/match-email?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send session cookies for authentication
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      if (response.status === 400) {
        throw new Error('Invalid email format.');
      }
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data; // Array of MatchContactResponse objects
  } catch (error) {
    // Log error for debugging
    console.error('Match contact API failed:', error);
    throw error;
  }
}

/**
 * Match a client by domain
 * Calls GET /api/clients/match-domain endpoint
 *
 * @param domain - Domain to match against client_domains table
 * @returns Promise resolving to matching client or null if no match
 * @throws Error with descriptive message for authentication, validation, or server errors
 *
 * Story 4.2: Domain-to-Client Fallback Matching
 */
export async function matchClientByDomain(domain: string): Promise<MatchClientResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/clients/match-domain?domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send session cookies for authentication
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      if (response.status === 400) {
        throw new Error('Invalid domain format.');
      }
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    // API returns array, but domain is unique per client (database constraint)
    // Return first element or null if empty
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    // Log error for debugging
    console.error('Match domain API failed:', error);
    throw error;
  }
}
