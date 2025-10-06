/**
 * TanStack Query hooks for invoice preview operations
 * Handles preview data fetching, caching, and ticket description updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoices';
import { ticketsApi } from '@/lib/api/tickets';
import { InvoicePreview, InvoiceGenerationError } from '@/types/invoice';
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
          const descriptionCountDelta = 0;

          const updatedClients = old.clients.map((client) => ({
            ...client,
            tickets: client.tickets.map((ticket) => {
              if (ticket.ticketId === ticketId) {
                const newMissingDescription = !description || description.trim().length === 0;

                return {
                  ...ticket,
                  description,
                  missingDescription: newMissingDescription,
                };
              }
              return ticket;
            }),
          }));

          return {
            ...old,
            clients: updatedClients,
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

/**
 * Generate invoices for a specific month and push to Xero
 */
export function useGenerateInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string) => {
      return await invoicesApi.generateInvoices(month);
    },
    onSuccess: (data, month) => {
      // Invalidate invoice preview to refresh lock status
      queryClient.invalidateQueries({ queryKey: invoicePreviewKeys.preview(month) });

      // Optional: Log successful generation for audit trail
      console.log(
        `Invoice generation: Month ${data.month}, Clients ${data.clientsInvoiced}, Total Hours ${data.totalBillableHours.toFixed(2)}, Timestamp ${new Date().toISOString()}`
      );
    },
    onError: (error: ApiError) => {
      // Error handled in component UI
      console.error('Invoice generation failed:', error);
    },
  });
}
