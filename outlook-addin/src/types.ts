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

export type MatchStatus = "loading" | "matched" | "warning" | "neutral";
export type SubmissionStatus = "idle" | "loading" | "success" | "error";
