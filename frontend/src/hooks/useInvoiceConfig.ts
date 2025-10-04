/**
 * TanStack Query hooks for invoice configuration operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  InvoiceConfig,
  UpdateInvoiceConfigResponse,
} from '@/lib/api/settings';
import { ApiError } from '@/lib/api-client';

// Query keys for cache management
export const invoiceConfigKeys = {
  all: ['invoiceConfig'] as const,
  config: () => [...invoiceConfigKeys.all, 'config'] as const,
};

/**
 * Fetch current invoice configuration
 */
export function useInvoiceConfig() {
  return useQuery({
    queryKey: invoiceConfigKeys.config(),
    queryFn: () => settingsApi.getInvoiceConfig(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });
}

/**
 * Update invoice configuration
 */
export function useUpdateInvoiceConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: InvoiceConfig) => settingsApi.updateInvoiceConfig(config),
    onSuccess: (data: UpdateInvoiceConfigResponse) => {
      // Update cache immediately with new value
      queryClient.setQueryData<InvoiceConfig>(invoiceConfigKeys.config(), {
        xeroInvoiceStatus: data.xeroInvoiceStatus as 'DRAFT' | 'AUTHORISED',
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: invoiceConfigKeys.config() });
    },
    onError: (error: ApiError) => {
      console.error('Update invoice config failed:', error.message);
    },
  });
}
