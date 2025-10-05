export interface TimeEntry {
  id: number;
  workDate: string;
  durationHours: number;
  billable: boolean;
}

export interface TicketInvoiceItem {
  id: number;
  description: string | null;
  contactId: number;
  contactName: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billable: boolean;
  hasMissingDescription: boolean;
  timeEntries: TimeEntry[];
}

export interface ClientInvoiceGroup {
  clientId: number;
  clientName: string;
  xeroCustomerId: string | null;
  totalHours: number;
  billableHours: number;
  estimatedAmount: number;
  tickets: TicketInvoiceItem[];
}

export interface InvoiceSummary {
  totalBillableHours: number;
  totalClients: number;
  totalTickets: number;
  missingDescriptionCount: number;
}

export interface InvoicePreview {
  month: string;
  isLocked: boolean;
  lockedAt: string | null;
  xeroInvoiceIds: string[];
  summary: InvoiceSummary;
  clients: ClientInvoiceGroup[];
}

export interface XeroInvoiceResult {
  clientId: number;
  clientName: string;
  xeroInvoiceId: string;
  xeroInvoiceUrl?: string;
  amount: number;
  lineItemCount: number;
}

export interface InvoiceGenerationResult {
  success: boolean;
  invoiceCount?: number;
  results?: XeroInvoiceResult[];
  error?: string;
  message?: string;
  ticketIds?: number[];
}

export interface InvoiceGenerationRequest {
  month: string; // YYYY-MM format
}

export interface InvoiceGenerationResponse {
  success: boolean;
  month: string; // YYYY-MM format
  clientsInvoiced: number;
  totalBillableHours: number;
  xeroInvoiceIds: string[]; // Array of Xero invoice IDs (GUIDs)
  message: string;
}

export interface InvoiceGenerationError {
  error: string; // Error type: ValidationError, InvoiceLockError, XeroConnectionError, etc.
  message: string; // Human-readable error message
}
