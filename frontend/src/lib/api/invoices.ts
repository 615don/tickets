/**
 * API client for invoice endpoints
 */

import { apiClient } from '@/lib/api-client';
import { InvoicePreview, InvoiceGenerationRequest, InvoiceGenerationResponse } from '@/types/invoice';

/**
 * Fetch invoice preview for a specific month
 * @param month - Month in YYYY-MM format (e.g., "2025-10")
 */
export async function getInvoicePreview(month: string): Promise<InvoicePreview> {
  return apiClient.get<InvoicePreview>(`/api/invoices/preview?month=${month}`);
}

/**
 * Generate invoices for a specific month and push to Xero
 * @param month - Month in YYYY-MM format (e.g., "2025-10")
 */
export async function generateInvoices(month: string): Promise<InvoiceGenerationResponse> {
  const body: InvoiceGenerationRequest = { month };
  return apiClient.post<InvoiceGenerationResponse>('/api/invoices/generate', body);
}

export const invoicesApi = {
  getInvoicePreview,
  generateInvoices,
};
