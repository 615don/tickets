/**
 * Xero API service
 * Handles all Xero-related API calls
 */

import { apiClient } from '../api-client';

export interface XeroStatusResponse {
  is_connected: boolean;
  organization_name: string | null;
  organization_id: string | null;
  last_sync_at: string | null;
}

export interface XeroStatus {
  isConnected: boolean;
  organizationName: string | null;
  organizationId: string | null;
  lastSyncAt: string | null;
}

export interface DisconnectResponse {
  success: boolean;
  message: string;
}

export interface XeroContact {
  contactID: string;
  name: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  isCustomer: boolean;
  isSupplier: boolean;
}

/**
 * Transform backend snake_case response to frontend camelCase
 */
function transformStatus(data: XeroStatusResponse): XeroStatus {
  return {
    isConnected: data.is_connected,
    organizationName: data.organization_name,
    organizationId: data.organization_id,
    lastSyncAt: data.last_sync_at,
  };
}

export const xeroApi = {
  /**
   * Get Xero connection status
   */
  getStatus: async (): Promise<XeroStatus> => {
    const data = await apiClient.get<XeroStatusResponse>('/api/xero/status');
    return transformStatus(data);
  },

  /**
   * Initiate Xero OAuth flow (redirects user)
   */
  initiateConnect: () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/xero/connect`;
  },

  /**
   * Disconnect from Xero
   */
  disconnect: async (): Promise<DisconnectResponse> => {
    return apiClient.post<DisconnectResponse>('/api/xero/disconnect', {});
  },

  /**
   * Get all Xero contacts/customers
   */
  getContacts: async (): Promise<{ contacts: XeroContact[] }> => {
    return apiClient.get<{ contacts: XeroContact[] }>('/api/xero/contacts');
  },
};
