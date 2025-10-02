/**
 * TanStack Query hooks for Xero operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { xeroApi, XeroStatus, DisconnectResponse } from '@/lib/api/xero';
import { ApiError } from '@/lib/api-client';

// Query keys for cache management
export const xeroKeys = {
  all: ['xero'] as const,
  status: () => [...xeroKeys.all, 'status'] as const,
};

/**
 * Fetch Xero connection status
 */
export function useXeroStatus() {
  return useQuery({
    queryKey: xeroKeys.status(),
    queryFn: () => xeroApi.getStatus(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });
}

/**
 * Disconnect from Xero
 */
export function useDisconnectXero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => xeroApi.disconnect(),
    onSuccess: () => {
      // Invalidate and refetch status
      queryClient.invalidateQueries({ queryKey: xeroKeys.status() });

      // Update cache immediately to reflect disconnected state
      queryClient.setQueryData<XeroStatus>(xeroKeys.status(), {
        isConnected: false,
        organizationName: null,
        organizationId: null,
        lastSyncAt: null,
      });
    },
    onError: (error: ApiError) => {
      console.error('Disconnect Xero failed:', error.message);
    },
  });
}
