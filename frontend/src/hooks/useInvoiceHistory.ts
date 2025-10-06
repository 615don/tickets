/**
 * TanStack Query hooks for invoice history operations
 * Handles fetching invoice history and deleting invoice locks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoices';
import { InvoiceHistoryItem, DeleteInvoiceLockResponse } from '@/types/invoice';
import { ApiError } from '@/lib/api-client';

// Query keys for cache management
export const invoiceHistoryKeys = {
  all: ['invoiceHistory'] as const,
  list: () => [...invoiceHistoryKeys.all, 'list'] as const,
};

/**
 * Fetch invoice history (all generated invoices)
 */
export function useInvoiceHistory() {
  return useQuery({
    queryKey: invoiceHistoryKeys.list(),
    queryFn: () => invoicesApi.getInvoiceHistory(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });
}

/**
 * Delete an invoice lock to allow re-invoicing
 */
export function useDeleteInvoiceLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await invoicesApi.deleteInvoiceLock(id);
    },
    onSuccess: (data) => {
      // Invalidate and refetch invoice history
      queryClient.invalidateQueries({ queryKey: invoiceHistoryKeys.list() });

      // Log successful deletion for audit trail
      console.log(
        `Invoice lock deleted: ${data.message}, Timestamp ${new Date().toISOString()}`
      );
    },
    onError: (error: ApiError) => {
      // Error handled in component UI
      console.error('Invoice lock deletion failed:', error);
    },
  });
}
