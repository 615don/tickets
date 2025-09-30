export interface Ticket {
  id: number;
  clientName: string;
  contactName: string;
  description?: string;
  totalHours: number;
  state: 'open' | 'closed';
  updatedAt: string;
  closedAt?: string;
}

export interface Client {
  id: number;
  companyName: string;
  xeroCustomerId: string | null;
  maintenanceContractType: 'Hourly' | 'Monthly Retainer' | 'Project-Based' | 'None';
  domains: string[];
  contactCount: number;
  createdAt: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  clientId: number;
  clientName: string;
  isSystemContact: boolean;
  createdAt: string;
}

export interface ClientFormData {
  companyName: string;
  xeroCustomerId?: string;
  maintenanceContractType: string;
  domains: string[];
}

export interface ContactFormData {
  name: string;
  email: string;
  clientId: number;
}

export interface DeleteClientData {
  clientId: number;
  companyName: string;
  contactCount: number;
  ticketCount: number;
  timeEntryCount: number;
  hasInvoices: boolean;
}

export interface CreateTicketForm {
  clientId: number;
  contactId: number;
  time: string;
  billable: boolean;
  workDate: string;
  description?: string;
  notes?: string;
}

export interface DashboardStats {
  currentMonthHours: number;
  openTicketCount: number;
  recentlyClosedCount: number;
  lastInvoiceDate: string;
  lastInvoicedMonth: string;
}

export interface TimeEntry {
  id: number;
  workDate: string;
  durationHours: number;
  billable: boolean;
  isLocked: boolean;
  createdAt: string;
}

export interface TicketDetail {
  id: number;
  clientName: string;
  contactName: string;
  contactEmail: string;
  description: string | null;
  notes: string | null;
  state: 'open' | 'closed';
  createdAt: string;
  closedAt: string | null;
  timeEntries: TimeEntry[];
  totalHours: number;
  billableHours: number;
  canReopen: boolean;
}

export interface TimeEntryFormData {
  workDate: string;
  time: string;
  billable: boolean;
}
