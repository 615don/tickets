/**
 * Contact API service
 * Handles all contact-related API calls
 */

import { apiClient } from '../api-client';
import { Contact } from '@/types';

export interface CreateContactRequest {
  name: string;
  email: string;
  clientId: number;
}

export interface UpdateContactRequest extends CreateContactRequest {
  id: number;
}

export interface ContactResponse {
  id: number;
  client_id: number;
  client_name: string;
  name: string;
  email: string;
  is_system_contact: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Transform backend snake_case response to frontend camelCase
 */
function transformContact(data: ContactResponse): Contact {
  return {
    id: data.id,
    clientId: data.client_id,
    clientName: data.client_name,
    name: data.name,
    email: data.email,
    isSystemContact: data.is_system_contact,
    createdAt: data.created_at,
  };
}

/**
 * Transform frontend camelCase to backend snake_case
 */
function transformContactRequest(data: CreateContactRequest) {
  return {
    name: data.name,
    email: data.email,
    clientId: data.clientId,
  };
}

export const contactsApi = {
  /**
   * Get all contacts with optional client filter
   */
  getAll: async (clientId?: number): Promise<Contact[]> => {
    const params = clientId ? { client_id: clientId } : undefined;
    const data = await apiClient.get<ContactResponse[]>('/api/contacts', params);
    return data.map(transformContact);
  },

  /**
   * Get contact by ID
   */
  getById: async (id: number): Promise<Contact> => {
    const data = await apiClient.get<ContactResponse>(`/api/contacts/${id}`);
    return transformContact(data);
  },

  /**
   * Create new contact
   */
  create: async (contact: CreateContactRequest): Promise<Contact> => {
    const data = await apiClient.post<ContactResponse>(
      '/api/contacts',
      transformContactRequest(contact)
    );
    return transformContact(data);
  },

  /**
   * Update existing contact
   */
  update: async (id: number, contact: CreateContactRequest): Promise<Contact> => {
    const data = await apiClient.put<ContactResponse>(
      `/api/contacts/${id}`,
      transformContactRequest(contact)
    );
    return transformContact(data);
  },

  /**
   * Delete contact (soft delete)
   */
  delete: async (id: number): Promise<{ message: string; ticketsReassigned: number }> => {
    return apiClient.delete<{ message: string; ticketsReassigned: number }>(`/api/contacts/${id}`);
  },
};
