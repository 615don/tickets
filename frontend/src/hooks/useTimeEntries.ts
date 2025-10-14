/**
 * TanStack Query hooks for Time Entry operations
 * Handles time entry mutations with automatic cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '@/lib/api/time-entries';
import { TimeEntryRequest } from '@/types';
import { ticketKeys } from './useTickets';

/**
 * Create new time entry for a ticket
 */
export function useCreateTimeEntry(ticketId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TimeEntryRequest) => timeEntriesApi.create(ticketId, data),
    onSuccess: () => {
      // Invalidate ticket detail to refresh time entries list and totalHours
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      // Invalidate lists to update totalHours display
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      // Invalidate stats to update currentMonthHours
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}

/**
 * Update existing time entry
 */
export function useUpdateTimeEntry(ticketId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TimeEntryRequest }) =>
      timeEntriesApi.update(id, data),
    onSuccess: () => {
      // Invalidate ticket detail to refresh time entries list and totalHours
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      // Invalidate lists to update totalHours display
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      // Invalidate stats to update currentMonthHours
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}

/**
 * Delete time entry (soft delete)
 */
export function useDeleteTimeEntry(ticketId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => timeEntriesApi.delete(id),
    onSuccess: () => {
      // Invalidate ticket detail to refresh time entries list and totalHours
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      // Invalidate lists to update totalHours display
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      // Invalidate stats to update currentMonthHours
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}
