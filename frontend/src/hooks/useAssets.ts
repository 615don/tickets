/**
 * TanStack Query hooks for Asset operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api/assets';
import { Asset, AssetFormData, AssetFilters } from '@tickets/shared';
import { ApiError } from '@/lib/api-client';
import { queryConfig } from '@/lib/queryConfig';

// Query keys for cache management
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters?: AssetFilters) => [...assetKeys.lists(), { filters }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: number) => [...assetKeys.details(), id] as const,
};

/**
 * Fetch all assets with optional filters
 */
export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: () => assetsApi.getAll(filters),
    staleTime: queryConfig.clients.staleTime, // Use same config as clients
    refetchOnWindowFocus: queryConfig.clients.refetchOnWindowFocus,
  });
}

/**
 * Fetch single asset by ID
 */
export function useAsset(id: number) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetsApi.getById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: queryConfig.clients.staleTime,
    refetchOnWindowFocus: queryConfig.clients.refetchOnWindowFocus,
  });
}

/**
 * Create new asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: AssetFormData) => assetsApi.create(asset),
    onSuccess: () => {
      // Invalidate all asset lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Create asset failed:', error.message);
    },
  });
}

/**
 * Update existing asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetFormData }) =>
      assetsApi.update(id, data),
    onSuccess: (updatedAsset) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });

      // Update specific asset in cache
      queryClient.setQueryData(assetKeys.detail(updatedAsset.id), updatedAsset);
    },
    onError: (error: ApiError) => {
      console.error('Update asset failed:', error.message);
    },
  });
}

/**
 * Retire asset (soft delete)
 */
export function useRetireAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetsApi.retire(id),
    onSuccess: (_, retiredId) => {
      // Invalidate lists to refresh the view - refetch option forces immediate refetch
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(),
        refetchType: 'active'
      });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: assetKeys.detail(retiredId) });
    },
    onError: (error: ApiError) => {
      console.error('Retire asset failed:', error.message);
    },
  });
}

/**
 * Permanently delete asset (hard delete)
 */
export function usePermanentDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetsApi.permanentDelete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists - force immediate refetch
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(),
        refetchType: 'active'
      });

      // Remove from cache
      queryClient.removeQueries({ queryKey: assetKeys.detail(deletedId) });
    },
    onError: (error: ApiError) => {
      console.error('Permanent delete asset failed:', error.message);
    },
  });
}

/**
 * Reactivate retired asset
 */
export function useReactivateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetsApi.reactivate(id),
    onSuccess: (updatedAsset) => {
      // Invalidate lists to refresh the view - force immediate refetch
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(),
        refetchType: 'active'
      });

      // Update specific asset in cache
      queryClient.setQueryData(assetKeys.detail(updatedAsset.id), updatedAsset);
    },
    onError: (error: ApiError) => {
      console.error('Reactivate asset failed:', error.message);
    },
  });
}
