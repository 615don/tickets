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
  list: (filters: string) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
  recentlyClosed: () => [...ticketKeys.all, 'recently-closed'] as const,
  stats: () => [...ticketKeys.all, 'stats'] as const,
};

/**
 * Fetch open tickets (state = 'open')
 */
export function useOpenTickets() {
  return useQuery({
    queryKey: ticketKeys.list('state=open'),
    queryFn: () => ticketsApi.getAll({ state: 'open' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch recently closed tickets (last 7 days)
 */
export function useRecentlyClosedTickets() {
  return useQuery({
    queryKey: ticketKeys.recentlyClosed(),
    queryFn: () => ticketsApi.getRecentlyClosed(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: () => ticketsApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

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
