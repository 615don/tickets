import type { Client } from '../../types';

// Get API base URL from environment variable or use relative URL for development
const API_BASE_URL = import.meta.env?.VITE_API_URL || '';

/**
 * Fetch all clients from the backend API
 * Calls GET /api/clients endpoint
 *
 * @returns Promise resolving to array of clients, sorted alphabetically by name
 * @throws Error with descriptive message for authentication, network, or server errors
 *
 * Story 4.4: Manual Client Selection Fallback
 */
export async function fetchClients(): Promise<Client[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/clients`,
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
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // Map backend field names to frontend types
    // Backend returns: company_name
    // Frontend expects: name
    interface BackendClient {
      id: number;
      company_name: string;
    }

    return (data as BackendClient[])
      .map((client) => ({
        id: client.id,
        name: client.company_name,
      }))
      .sort((a: Client, b: Client) => a.name.localeCompare(b.name)); // Sort alphabetically
  } catch (error) {
    console.error('Fetch clients API failed:', error);
    throw error;
  }
}
