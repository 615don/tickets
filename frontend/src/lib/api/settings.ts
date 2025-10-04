/**
 * API client for settings endpoints
 */

import { apiClient } from '@/lib/api-client';

export interface InvoiceConfig {
  xeroInvoiceStatus: 'DRAFT' | 'AUTHORISED';
}

export interface UpdateInvoiceConfigResponse {
  success: boolean;
  xeroInvoiceStatus: string;
  message: string;
}

/**
 * Fetch current invoice configuration
 */
export async function getInvoiceConfig(): Promise<InvoiceConfig> {
  return apiClient.get<InvoiceConfig>('/api/settings/invoice-config');
}

/**
 * Update invoice configuration
 */
export async function updateInvoiceConfig(
  config: InvoiceConfig
): Promise<UpdateInvoiceConfigResponse> {
  return apiClient.put<UpdateInvoiceConfigResponse>(
    '/api/settings/invoice-config',
    config
  );
}

export const settingsApi = {
  getInvoiceConfig,
  updateInvoiceConfig,
};
