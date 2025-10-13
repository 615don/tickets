export interface Client {
  id: number;
  name: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
}

export interface TicketFormData {
  clientId: number;
  contactId: number;
  timeHours: number;
  description: string;
  notes: string;
  closeImmediately: boolean;
  contactName?: string; // For creating new contacts when no match
  contactEmail?: string; // For creating new contacts when no match
}

export interface EmailData {
  senderName: string;
  senderEmail: string;
}

export interface EmailContext {
  senderEmail: string;
  senderName: string;
  subject: string;
}

export interface MatchResult {
  client: Client;
  contact: Contact;
}

export type MatchStatus = "loading" | "matched" | "warning" | "neutral" | "ai-loading";
export type SubmissionStatus = "idle" | "loading" | "success" | "error";

/**
 * API response for contact matching by email (Story 4.1)
 * Response from GET /api/contacts/match-email endpoint
 */
export interface MatchContactResponse {
  contact: {
    id: number;
    name: string;
    email: string;
    clientId: number;
  };
  client: {
    id: number;
    name: string;
    isActive: boolean;
  };
}

/**
 * API response for client matching by domain (Story 4.2)
 * Response from GET /api/clients/match-domain endpoint
 */
export interface MatchClientResponse {
  id: number;
  name: string;
  domains: string[];
  isActive: boolean;
}

/**
 * Error response from matching API calls (Story 4.1)
 * Used for typed error handling in useMatching hook
 */
export interface MatchingError {
  message: string;
  status: number;
}

/**
 * Matching result from contact/domain lookup API (Stories 3.6+)
 * Used to determine StatusBadge variant and display matched client/contact information
 */
export interface MatchingResult {
  type: 'contact-matched' | 'domain-matched' | 'no-match';
  client?: {
    id: number;
    name: string;
  };
  contact?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Sidebar state management for email context and matching results
 * Centralized state for sharing data between EmailContext and TicketForm components
 */
export interface SidebarState {
  /** Email context from Office.js (managed via useEmailContext hook) */
  emailContext: EmailContext | null;

  /** Matching results from backend API (Stories 3.6+) */
  matchingResult: MatchingResult | null;

  /** True during contact/domain matching API calls */
  isMatching: boolean;

  /** True during ticket creation (Epic 5+) */
  isSubmitting: boolean;
}
