import { useQuery } from '@tanstack/react-query';
import { fetchOpenTickets, OpenTicket } from '../lib/api/tickets';

interface UseOpenTicketsResult {
  openTickets: OpenTicket[];
  isLoading: boolean;
  error: Error | null;
}

export function useOpenTickets(contactId: number | null): UseOpenTicketsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['openTickets', contactId],
    queryFn: async ({ signal }) => {
      if (!contactId) {
        return [];
      }
      return fetchOpenTickets(contactId, signal);
    },
    enabled: contactId !== null, // Only run query when contactId exists
    staleTime: 2 * 60 * 1000, // 2 minutes - consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
  });

  return {
    openTickets: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
