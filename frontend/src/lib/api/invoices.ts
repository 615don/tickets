/**
 * API client for invoice endpoints
 */

import { apiClient } from '@/lib/api-client';
import { InvoicePreview } from '@/types/invoice';

/**
 * Fetch invoice preview for a specific month
 * @param month - Month in YYYY-MM format (e.g., "2025-10")
 */
export async function getInvoicePreview(month: string): Promise<InvoicePreview> {
  return apiClient.get<InvoicePreview>(`/api/invoices/preview?month=${month}`);
}

export const invoicesApi = {
  getInvoicePreview,
};
