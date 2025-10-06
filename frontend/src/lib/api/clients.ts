/**
 * Client API service
 * Handles all client-related API calls
 */

import { apiClient } from '../api-client';
import { Client } from '@/types';

export interface CreateClientRequest {
  companyName: string;
  xeroCustomerId?: string;
  maintenanceContractType: 'On Demand' | 'Regular Maintenance';
  domains: string[];
}

export interface UpdateClientRequest extends CreateClientRequest {
  id: number;
}

export interface ClientResponse {
  id: number;
  company_name: string;
  xero_customer_id: string | null;
  maintenance_contract_type: 'On Demand' | 'Regular Maintenance';
  domains: string[];
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeleteClientResponse {
  message: string;
  contactCount: number;
  ticketCount: number;
  timeEntryCount: number;
}

export interface DeletionImpactResponse {
  clientId: number;
  canDelete: boolean;
  counts: {
    contacts: number;
    tickets: number;
    timeEntries: number;
  };
}

/**
 * Transform backend snake_case response to frontend camelCase
 */
function transformClient(data: ClientResponse): Client {
  return {
    id: data.id,
    companyName: data.company_name,
    xeroCustomerId: data.xero_customer_id,
    maintenanceContractType: data.maintenance_contract_type,
    domains: data.domains,
    contactCount: data.contact_count,
    createdAt: data.created_at,
  };
}

/**
 * Transform frontend camelCase to backend snake_case
 */
function transformClientRequest(data: CreateClientRequest) {
  return {
    companyName: data.companyName,
    xeroCustomerId: data.xeroCustomerId || null,
    maintenanceContractType: data.maintenanceContractType,
    domains: data.domains.filter(d => d.trim() !== ''),
  };
}

export const clientsApi = {
  /**
   * Get all clients
   */
  getAll: async (search?: string): Promise<Client[]> => {
    const params = search ? { search } : undefined;
    const data = await apiClient.get<ClientResponse[]>('/api/clients', params);
    return data.map(transformClient);
  },

  /**
   * Get client by ID
   */
  getById: async (id: number): Promise<Client> => {
    const data = await apiClient.get<ClientResponse>(`/api/clients/${id}`);
    return transformClient(data);
  },

  /**
   * Create new client
   */
  create: async (client: CreateClientRequest): Promise<Client> => {
    const data = await apiClient.post<ClientResponse>(
      '/api/clients',
      transformClientRequest(client)
    );
    return transformClient(data);
  },

  /**
   * Update existing client
   */
  update: async (id: number, client: CreateClientRequest): Promise<Client> => {
    const data = await apiClient.put<ClientResponse>(
      `/api/clients/${id}`,
      transformClientRequest(client)
    );
    return transformClient(data);
  },

  /**
   * Get deletion impact counts for a client
   */
  getDeletionImpact: async (id: number): Promise<DeletionImpactResponse> => {
    return apiClient.get<DeletionImpactResponse>(`/api/clients/${id}/deletion-impact`);
  },

  /**
   * Delete client
   */
  delete: async (id: number): Promise<DeleteClientResponse> => {
    return apiClient.delete<DeleteClientResponse>(`/api/clients/${id}`);
  },
};
