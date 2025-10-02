/**
 * Ticket API service
 * Handles all ticket-related API calls
 */

import { apiClient } from '../api-client';
import { Ticket, CreateTicketRequest } from '@/types';

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
};
