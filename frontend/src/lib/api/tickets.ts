/**
 * Ticket API service
 * Handles all ticket-related API calls
 */

import { apiClient } from '../api-client';
import { Ticket, TicketDetail, CreateTicketRequest, UpdateTicketRequest, TimeEntry } from '@/types';

/**
 * Backend response type (snake_case)
 */
export interface TicketResponse {
  id: number;
  client_id: number;
  client_name: string;
  contact_id: number;
  contact_name: string;
  description: string | null;
  notes: string | null;
  state: 'open' | 'closed';
  closed_at: string | null;
  can_reopen: boolean | null;
  total_hours: number;
  created_at: string;
  updated_at: string;
}

/**
 * Backend time entry response type (snake_case)
 */
export interface TimeEntryResponse {
  id: number;
  ticket_id: number;
  work_date: string;
  duration_hours: number;
  billable: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Backend ticket detail response with time entries (snake_case)
 */
export interface TicketDetailResponse extends TicketResponse {
  contact_email?: string;
  time_entries: TimeEntryResponse[];
}

/**
 * Transform backend snake_case response to frontend camelCase
 */
function transformTicket(data: TicketResponse): Ticket {
  return {
    id: data.id,
    clientId: data.client_id,
    clientName: data.client_name,
    contactId: data.contact_id,
    contactName: data.contact_name,
    description: data.description,
    notes: data.notes,
    state: data.state,
    closedAt: data.closed_at,
    canReopen: data.can_reopen,
    totalHours: data.total_hours,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform backend time entry response to frontend camelCase
 */
function transformTimeEntry(data: TimeEntryResponse): TimeEntry {
  return {
    id: data.id,
    ticketId: data.ticket_id,
    workDate: data.work_date,
    durationHours: data.duration_hours,
    billable: data.billable,
    isLocked: data.is_locked,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform backend ticket detail response to frontend camelCase
 */
function transformTicketDetail(data: TicketDetailResponse): TicketDetail {
  return {
    id: data.id,
    clientId: data.client_id,
    clientName: data.client_name,
    contactId: data.contact_id,
    contactName: data.contact_name,
    contactEmail: data.contact_email,
    description: data.description,
    notes: data.notes,
    state: data.state,
    closedAt: data.closed_at,
    canReopen: data.can_reopen,
    totalHours: data.total_hours,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    timeEntries: data.time_entries.map(transformTimeEntry),
  };
}

/**
 * Transform frontend request to backend format (backend uses camelCase)
 */
function transformCreateTicketRequest(data: CreateTicketRequest) {
  return {
    clientId: data.clientId,
    contactId: data.contactId,
    description: data.description || null,
    notes: data.notes || null,
    timeEntry: {
      workDate: data.timeEntry.workDate,
      duration: data.timeEntry.duration,
      billable: data.timeEntry.billable ?? true,
    },
  };
}

export const ticketsApi = {
  /**
   * Create new ticket
   */
  create: async (ticket: CreateTicketRequest): Promise<Ticket> => {
    const data = await apiClient.post<TicketResponse>(
      '/api/tickets',
      transformCreateTicketRequest(ticket)
    );
    return transformTicket(data);
  },

  /**
   * Get ticket by ID with time entries
   */
  getById: async (id: number): Promise<TicketDetail> => {
    const data = await apiClient.get<TicketDetailResponse>(`/api/tickets/${id}`);
    return transformTicketDetail(data);
  },

  /**
   * Update ticket (description, notes, or state)
   */
  update: async (id: number, updates: UpdateTicketRequest): Promise<Ticket> => {
    const data = await apiClient.put<TicketResponse>(
      `/api/tickets/${id}`,
      updates // Backend accepts camelCase
    );
    return transformTicket(data);
  },
};
