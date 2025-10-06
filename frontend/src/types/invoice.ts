export interface TimeEntry {
  id: number;
  workDate: string;
  durationHours: number;
  billable: boolean;
}

export interface TicketInvoiceItem {
  ticketId: number;
  description: string | null;
  contactId: number;
  contactName: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billable: boolean;
  missingDescription: boolean;
  timeEntries: TimeEntry[];
}

export interface ClientInvoiceGroup {
  clientId: number;
  clientName: string;
  xeroCustomerId: string | null;
  subtotalHours: number;
  tickets: TicketInvoiceItem[];
}

export interface InvoicePreview {
  month: string;
  isLocked: boolean;
  totalBillableHours: number;
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

export interface InvoiceMetadata {
  clientId: number;
  clientName: string;
  xeroInvoiceId: string;
  hours: number;
  lineItemCount: number;
}

export interface InvoiceHistoryItem {
  id: number;
  month: string; // YYYY-MM format
  lockedAt: string; // ISO timestamp
  xeroInvoiceIds: string[]; // Array of Xero invoice IDs (GUIDs)
  invoices: InvoiceMetadata[]; // Individual invoice details
}

export interface DeleteInvoiceLockResponse {
  success: boolean;
  message: string;
}
