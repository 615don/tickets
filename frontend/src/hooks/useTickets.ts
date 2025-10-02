/**
 * TanStack Query hooks for Ticket operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/tickets';
import { CreateTicketRequest, UpdateTicketRequest } from '@/types';
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
 * Fetch single ticket with time entries
 */
export function useTicket(id: number | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn: () => ticketsApi.getById(id!),
    enabled: !!id, // Only fetch if id is provided
  });
}

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

/**
 * Update ticket (description, notes, or state)
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketRequest }) =>
      ticketsApi.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });
}

/**
 * Close ticket (convenience wrapper)
 */
export function useCloseTicket() {
  const updateTicket = useUpdateTicket();

  return useMutation({
    mutationFn: (id: number) =>
      updateTicket.mutateAsync({ id, data: { state: 'closed' } }),
  });
}

/**
 * Re-open ticket (convenience wrapper)
 */
export function useReopenTicket() {
  const updateTicket = useUpdateTicket();

  return useMutation({
    mutationFn: (id: number) =>
      updateTicket.mutateAsync({ id, data: { state: 'open' } }),
  });
}
