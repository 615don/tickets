/**
 * Time Entry API service
 * Handles all time entry-related API calls
 */

import { apiClient } from '../api-client';
import { TimeEntry, TimeEntryRequest } from '@/types';

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

export const timeEntriesApi = {
  /**
   * Create new time entry for a ticket
   */
  create: async (ticketId: number, data: TimeEntryRequest): Promise<TimeEntry> => {
    const response = await apiClient.post<TimeEntryResponse>(
      `/api/tickets/${ticketId}/time-entries`,
      data // Backend accepts camelCase
    );
    return transformTimeEntry(response);
  },

  /**
   * Update existing time entry
   */
  update: async (id: number, data: TimeEntryRequest): Promise<TimeEntry> => {
    const response = await apiClient.put<TimeEntryResponse>(
      `/api/time-entries/${id}`,
      data
    );
    return transformTimeEntry(response);
  },

  /**
   * Delete time entry (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/time-entries/${id}`);
  },
};
