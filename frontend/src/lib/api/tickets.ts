/**
 * Ticket API service
 * Handles all ticket-related API calls
 */

import { apiClient } from '../api-client';
import { Ticket, TicketDetail, CreateTicketRequest, UpdateTicketRequest, TimeEntry } from '@/types';

/**
 * Backend response type (camelCase - backend already converts from snake_case)
 */
export interface TicketResponse {
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

/**
 * Backend time entry response type (camelCase - backend already converts from snake_case)
 */
export interface TimeEntryResponse {
  id: number;
  ticketId: number;
  workDate: string;
  durationHours: number;
  billable: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend ticket detail response with time entries (camelCase)
 */
export interface TicketDetailResponse extends TicketResponse {
  contactEmail?: string;
  clientNotionUrl?: string | null;
  timeEntries: TimeEntryResponse[];
}

/**
 * Transform backend response to frontend format
 * NOTE: Backend already sends camelCase, so this is now a passthrough
 */
function transformTicket(data: TicketResponse): Ticket {
  return data as Ticket;
}

/**
 * Transform backend time entry response to frontend format
 * NOTE: Backend already sends camelCase, so this is now a passthrough
 */
function transformTimeEntry(data: TimeEntryResponse): TimeEntry {
  return data as TimeEntry;
}

/**
 * Transform backend ticket detail response to frontend format
 * NOTE: Backend already sends camelCase, so this is now a passthrough
 */
function transformTicketDetail(data: TicketDetailResponse): TicketDetail {
  return {
    ...data,
    timeEntries: data.timeEntries.map(transformTimeEntry),
  } as TicketDetail;
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

/**
 * Query parameters for getting tickets
 */
export interface GetTicketsParams {
  state?: 'open' | 'closed';
  clientId?: number;
}

/**
 * Dashboard stats response from backend
 */
export interface DashboardStatsResponse {
  currentMonthHours: number;
  lastInvoiceDate: string;
  lastInvoicedMonth: string;
}

export const ticketsApi = {
  /**
   * Get all tickets with optional filters
   */
  getAll: async (params?: GetTicketsParams): Promise<Ticket[]> => {
    const queryParams = new URLSearchParams();
    if (params?.state) {
      queryParams.append('state', params.state);
    }
    if (params?.clientId) {
      queryParams.append('client_id', params.clientId.toString());
    }

    const url = `/api/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await apiClient.get<TicketResponse[]>(url);
    return data.map(transformTicket);
  },

  /**
   * Get recently closed tickets (last 7 days)
   */
  getRecentlyClosed: async (): Promise<Ticket[]> => {
    const data = await apiClient.get<TicketResponse[]>('/api/tickets/recently-closed');
    return data.map(transformTicket);
  },

  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStatsResponse> => {
    return await apiClient.get<DashboardStatsResponse>('/api/tickets/stats');
  },

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

  /**
   * Delete ticket
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/tickets/${id}`);
  },
};
