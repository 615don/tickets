import type { MatchingResult } from '../types';

interface ContactDisplayProps {
  matchingResult: MatchingResult | null;
  contactName: string;
  onContactNameChange: (name: string) => void;
  contactEmail?: string;
}

/**
 * Contact display component for ticket form
 * Shows matched contact (read-only) or editable name field for new contact creation
 *
 * Behavior:
 * - Contact matched: Display matched contact name + email (read-only)
 * - Domain matched or no match: Show editable input for new contact name
 *
 * Story 5.1: Ticket Form UI Components
 * Replaces ContactSelect dropdown per Epic 4 design decision (Story 4.4)
 */
export function ContactDisplay({
  matchingResult,
  contactName,
  onContactNameChange,
  contactEmail
}: ContactDisplayProps) {
  // If contact matched: show read-only display
  if (matchingResult?.type === 'contact-matched' && matchingResult.contact) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          Contact
        </label>
        <div className="px-3 py-2 bg-muted rounded-md">
          <div className="font-medium text-sm">
            {matchingResult.contact.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {matchingResult.contact.email}
          </div>
        </div>
      </div>
    );
  }

  // If domain matched or no match: show editable name field for new contact
  return (
    <div className="space-y-1">
      <label htmlFor="contactName" className="text-sm font-medium">
        Contact Name {contactEmail && <span className="text-muted-foreground">({contactEmail})</span>}
      </label>
      <input
        id="contactName"
        type="text"
        value={contactName}
        onChange={(e) => onContactNameChange(e.target.value)}
        placeholder="Enter contact name"
        className="w-full bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Contact name"
        required
      />
      {matchingResult?.type === 'domain-matched' && (
        <p className="text-xs text-muted-foreground">
          New contact will be created at {matchingResult.client?.name}
        </p>
      )}
    </div>
  );
}
