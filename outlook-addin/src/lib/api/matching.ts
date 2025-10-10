import type { MatchContactResponse } from '../../types';

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
      `/api/contacts/match-email?email=${encodeURIComponent(email)}`,
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
