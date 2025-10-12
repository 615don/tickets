import { apiClient } from '../api-client';

export interface TimeEntryData {
  workDate?: string; // ISO date format YYYY-MM-DD (optional, defaults to today)
  duration: string; // Time string like "2m", "1.5h", "1h30m" (backend parses this)
  billable?: boolean; // Optional, defaults to true
}

export interface NewContactData {
  name: string;
  email: string;
  clientId: number;
}

export interface OpenTicket {
  id: number;
  description: string;
  updatedAt: string; // ISO 8601 timestamp
}

export interface CreateTicketPayload {
  clientId: number;
  contactId: number; // 0 for new contact creation
  description?: string;
  notes?: string;
  state?: 'open' | 'closed'; // Optional, set via separate PUT if 'closed'
  timeEntry: TimeEntryData;
  newContact?: NewContactData; // Only included when contactId === 0
}

export interface CreateTicketResponse {
  id: number;
  clientId: number;
  contactId: number;
  description: string | null;
  notes: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateContactResponse {
  id: number;
  clientId: number;
  name: string;
  email: string;
  isSystemContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createTicket(
  payload: CreateTicketPayload
): Promise<CreateTicketResponse> {
  let contactId = payload.contactId;

  // If contactId is 0, create contact first
  if (contactId === 0 && payload.newContact) {
    const newContact = await apiClient<CreateContactResponse>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({
        clientId: payload.newContact.clientId,
        name: payload.newContact.name,
        email: payload.newContact.email,
      }),
    });
    contactId = newContact.id;
  }

  // Create ticket with backend format
  const ticketPayload = {
    clientId: payload.clientId,
    contactId,
    description: payload.description,
    notes: payload.notes,
    timeEntry: payload.timeEntry,
  };

  const ticket = await apiClient<CreateTicketResponse>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketPayload),
  });

  // If state is 'closed', update ticket state
  if (payload.state === 'closed') {
    return apiClient<CreateTicketResponse>(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      body: JSON.stringify({ state: 'closed' }),
    });
  }

  return ticket;
}

export async function fetchOpenTickets(
  contactId: number,
  signal?: AbortSignal
): Promise<OpenTicket[]> {
  return apiClient<OpenTicket[]>(
    `/api/tickets/open-by-contact?contactId=${contactId}`,
    { signal }
  );
}

export interface TimeEntryPayload {
  workDate?: string; // ISO date YYYY-MM-DD (optional)
  duration: string; // Time string like "2h", "30m", "1h30m"
  billable?: boolean; // Optional, defaults to true
  notes?: string; // Optional, appended to ticket notes
}

export interface TimeEntryResponse {
  id: number;
  ticketId: number;
  workDate: string;
  durationHours: number;
  billable: boolean;
  createdAt: string;
}

export async function addTimeEntry(
  ticketId: number,
  payload: TimeEntryPayload
): Promise<TimeEntryResponse> {
  return apiClient<TimeEntryResponse>(`/api/tickets/${ticketId}/time-entries`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
