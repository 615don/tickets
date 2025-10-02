/**
 * TanStack Query hooks for Ticket operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/tickets';
import { CreateTicketRequest } from '@/types';
import { ApiError } from '@/lib/api-client';

// Query keys for cache management
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: () => [...ticketKeys.lists()] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
};

/**
 * Create new ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticket: CreateTicketRequest) => ticketsApi.create(ticket),
    onSuccess: () => {
      // Invalidate tickets query to refresh list
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Create ticket failed:', error.message);
    },
  });
}
