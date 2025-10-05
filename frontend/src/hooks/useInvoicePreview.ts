/**
 * TanStack Query hooks for invoice preview operations
 * Handles preview data fetching, caching, and ticket description updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoices';
import { ticketsApi } from '@/lib/api/tickets';
import { InvoicePreview } from '@/types/invoice';
import { ApiError } from '@/lib/api-client';

// Query keys for cache management
export const invoicePreviewKeys = {
  all: ['invoicePreview'] as const,
  preview: (month: string) => [...invoicePreviewKeys.all, month] as const,
};

/**
 * Fetch invoice preview for a specific month
 * @param month - Month in YYYY-MM format (e.g., "2025-10")
 */
export function useInvoicePreview(month: string) {
  return useQuery({
    queryKey: invoicePreviewKeys.preview(month),
    queryFn: () => invoicesApi.getInvoicePreview(month),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to window
    enabled: !!month, // Only run if month is provided
  });
}

/**
 * Update ticket description with optimistic updates
 */
export function useUpdateTicketDescription(month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, description }: { ticketId: number; description: string }) => {
      return await ticketsApi.update(ticketId, { description });
    },
    onMutate: async ({ ticketId, description }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invoicePreviewKeys.preview(month) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<InvoicePreview>(
        invoicePreviewKeys.preview(month)
      );

      // Optimistically update UI
      if (previousData) {
        queryClient.setQueryData<InvoicePreview>(invoicePreviewKeys.preview(month), (old) => {
          if (!old) return old;

          // Track if this update changes missing description status
          let descriptionCountDelta = 0;

          const updatedClients = old.clients.map((client) => ({
            ...client,
            tickets: client.tickets.map((ticket) => {
              if (ticket.id === ticketId) {
                const newHasMissingDescription = !description || description.trim().length === 0;
                // If was missing and now isn't, decrement count
                if (ticket.hasMissingDescription && !newHasMissingDescription) {
                  descriptionCountDelta = -1;
                }
                // If wasn't missing and now is, increment count
                else if (!ticket.hasMissingDescription && newHasMissingDescription) {
                  descriptionCountDelta = 1;
                }

                return {
                  ...ticket,
                  description,
                  hasMissingDescription: newHasMissingDescription,
                };
              }
              return ticket;
            }),
          }));

          return {
            ...old,
            clients: updatedClients,
            summary: {
              ...old.summary,
              missingDescriptionCount: Math.max(0, old.summary.missingDescriptionCount + descriptionCountDelta),
            },
          };
        });
      }

      return { previousData };
    },
    onError: (err: ApiError, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(invoicePreviewKeys.preview(month), context.previousData);
      }
    },
    onSuccess: () => {
      // Invalidate to refetch and update missing description counts
      queryClient.invalidateQueries({ queryKey: invoicePreviewKeys.preview(month) });
    },
  });
}
