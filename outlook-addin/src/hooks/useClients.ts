import { useEffect, useState } from 'react';
import type { Client } from '../types';
import { fetchClients } from '../lib/api/clients';

/**
 * React hook to load and cache all clients
 * Loads clients once on component mount and caches results in state
 *
 * @returns Object containing clients array, loading state, and error state
 *
 * Story 4.4: Manual Client Selection Fallback
 */
export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Load clients on mount
    async function loadClients() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchClients();
        // Clients already sorted alphabetically in API function
        setClients(data);
      } catch (err) {
        // Log error for debugging
        console.error('Failed to load clients:', err);
        setError(err instanceof Error ? err : new Error('Failed to load clients'));
        // Set empty array on error to allow UI to display error state
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadClients();
  }, []); // Empty dependency array - load once on mount

  return { clients, isLoading, error };
}
