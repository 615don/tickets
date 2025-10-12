import { useEffect, useState } from 'react';
import { fetchOpenTickets, OpenTicket } from '../lib/api/tickets';

interface UseOpenTicketsResult {
  openTickets: OpenTicket[];
  isLoading: boolean;
  error: Error | null;
}

export function useOpenTickets(contactId: number | null): UseOpenTicketsResult {
  const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset state when no contactId
    if (!contactId) {
      setOpenTickets([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // AbortController for canceling in-flight requests
    const abortController = new AbortController();

    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tickets = await fetchOpenTickets(contactId, abortController.signal);
        setOpenTickets(tickets);
      } catch (err) {
        console.error('Failed to fetch open tickets:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setOpenTickets([]); // Graceful fallback
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchTickets();

    // Cleanup: abort in-flight request
    return () => {
      abortController.abort();
      setIsLoading(false);
    };
  }, [contactId]);

  return { openTickets, isLoading, error };
}
