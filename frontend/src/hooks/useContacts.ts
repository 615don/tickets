/**
 * TanStack Query hooks for Contact operations
 * Handles data fetching, caching, and mutations with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, CreateContactRequest } from '@/lib/api/contacts';
import { Contact } from '@/types';
import { ApiError } from '@/lib/api-client';
import { clientKeys } from './useClients';

// Query keys for cache management
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (clientId?: number) => [...contactKeys.lists(), { clientId }] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactKeys.details(), id] as const,
};

/**
 * Fetch all contacts with optional client filter
 */
export function useContacts(clientId?: number) {
  return useQuery({
    queryKey: contactKeys.list(clientId),
    queryFn: () => contactsApi.getAll(clientId),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Fetch single contact by ID
 */
export function useContact(id: number) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactsApi.getById(id),
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Create new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: CreateContactRequest) => contactsApi.create(contact),
    onSuccess: (newContact) => {
      // Invalidate all contact lists
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });

      // Update client's contact count
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(newContact.clientId)
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.lists()
      });
    },
    onError: (error: ApiError) => {
      console.error('Create contact failed:', error.message);
    },
  });
}

/**
 * Update existing contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateContactRequest }) =>
      contactsApi.update(id, data),
    onSuccess: (updatedContact) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });

      // Update specific contact in cache
      queryClient.setQueryData(contactKeys.detail(updatedContact.id), updatedContact);

      // Update client data if client changed
      queryClient.invalidateQueries({
        queryKey: clientKeys.lists()
      });
    },
    onError: (error: ApiError) => {
      console.error('Update contact failed:', error.message);
    },
  });
}

/**
 * Delete contact (soft delete)
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contactsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: contactKeys.detail(deletedId) });

      // Update client contact counts
      queryClient.invalidateQueries({
        queryKey: clientKeys.lists()
      });
    },
    onError: (error: ApiError) => {
      console.error('Delete contact failed:', error.message);
    },
  });
}
