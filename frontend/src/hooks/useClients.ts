/**
 * TanStack Query hooks for Client operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, CreateClientRequest, DeleteClientResponse } from '@/lib/api/clients';
import { Client } from '@/types';
import { ApiError } from '@/lib/api-client';
import { queryConfig } from '@/lib/queryConfig';

// Query keys for cache management (maintain backward compatibility)
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (search?: string) => [...clientKeys.lists(), { search }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
};

/**
 * Fetch all clients with optional search
 */
export function useClients(search?: string) {
  return useQuery({
    queryKey: clientKeys.list(search),
    queryFn: () => clientsApi.getAll(search),
    staleTime: queryConfig.clients.staleTime,
    refetchOnWindowFocus: queryConfig.clients.refetchOnWindowFocus,
  });
}

/**
 * Fetch single client by ID
 */
export function useClient(id: number) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: queryConfig.clients.staleTime,
    refetchOnWindowFocus: queryConfig.clients.refetchOnWindowFocus,
  });
}

/**
 * Create new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (client: CreateClientRequest) => clientsApi.create(client),
    onSuccess: (newClient) => {
      // Invalidate and refetch client list
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });

      // Optionally: Add new client to cache optimistically
      queryClient.setQueryData<Client[]>(clientKeys.list(), (old) => {
        return old ? [...old, newClient] : [newClient];
      });
    },
    onError: (error: ApiError) => {
      console.error('Create client failed:', error.message);
    },
  });
}

/**
 * Update existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateClientRequest }) =>
      clientsApi.update(id, data),
    onSuccess: (updatedClient) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });

      // Update specific client in cache
      queryClient.setQueryData(clientKeys.detail(updatedClient.id), updatedClient);
    },
    onError: (error: ApiError) => {
      console.error('Update client failed:', error.message);
      console.error('Full error:', error);
    },
  });
}

/**
 * Delete client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: clientKeys.detail(deletedId) });
    },
    onError: (error: ApiError) => {
      console.error('Delete client failed:', error.message);
    },
  });
}
