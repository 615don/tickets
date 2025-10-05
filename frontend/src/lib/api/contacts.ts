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
  clientId: number;
  clientName: string;
  name: string;
  email: string;
  isSystemContact: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend response to frontend Contact type
 */
function transformContact(data: ContactResponse): Contact {
  return {
    id: data.id,
    clientId: data.clientId,
    clientName: data.clientName,
    name: data.name,
    email: data.email,
    isSystemContact: data.isSystemContact,
    createdAt: data.createdAt,
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
