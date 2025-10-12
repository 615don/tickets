import type { Client } from '../../types';
import { apiClient } from '../api-client';

/**
 * Backend client response format
 * Backend returns: company_name
 * Frontend expects: name
 */
interface BackendClient {
  id: number;
  company_name: string;
}

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
  const data = await apiClient<BackendClient[]>('/api/clients');

  // Map backend field names to frontend types
  return data
    .map((client) => ({
      id: client.id,
      name: client.company_name,
    }))
    .sort((a: Client, b: Client) => a.name.localeCompare(b.name)); // Sort alphabetically
}
