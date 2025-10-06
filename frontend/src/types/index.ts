export interface Ticket {
  id: number;
  clientId: number;
  clientName: string;
  contactId: number;
  contactName: string;
  description: string | null;
  notes: string | null;
  state: 'open' | 'closed';
  closedAt: string | null;
  canReopen: boolean | null;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  companyName: string;
  xeroCustomerId: string | null;
  maintenanceContractType: 'On Demand' | 'Regular Maintenance';
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

export interface CreateTicketRequest {
  clientId: number;
  contactId: number;
  description?: string;
  notes?: string;
  timeEntry: {
    workDate?: string;
    duration: string;
    billable?: boolean;
  };
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
  ticketId: number;
  workDate: string;
  durationHours: number;
  billable: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail {
  id: number;
  clientId: number;
  clientName: string;
  contactId: number;
  contactName: string;
  contactEmail?: string;
  description: string | null;
  notes: string | null;
  state: 'open' | 'closed';
  closedAt: string | null;
  canReopen: boolean | null;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  timeEntries: TimeEntry[];
}

export interface UpdateTicketRequest {
  description?: string;
  notes?: string;
  state?: 'open' | 'closed';
}

export interface TimeEntryRequest {
  workDate: string;
  duration: string;
  billable: boolean;
}

export interface TimeEntryFormData {
  workDate: string;
  time: string;
  billable: boolean;
}
