import { useState, useEffect, FormEvent } from "react";
import { TimeInput } from "./TimeInput";
import { Loader2 } from "lucide-react";
import { Client, Contact, TicketFormData } from "../types";

export interface TicketFormProps {
  clients: Client[];
  selectedClientId?: number;
  selectedContactId?: number;
  contactName?: string; // Pass edited name for new contact creation
  contactEmail?: string; // Pass email for new contact creation
  hasMatch: boolean; // Whether a contact match was found
  onClientChange: (clientId: number) => void;
  onContactLoad: (clientId: number) => Promise<Contact[]>;
  onSubmit: (data: TicketFormData) => Promise<void>;
}

export const TicketForm = ({
  clients,
  selectedClientId,
  selectedContactId,
  contactName,
  contactEmail,
  hasMatch,
  onClientChange,
  onContactLoad,
  onSubmit,
}: TicketFormProps) => {
  const [clientId, setClientId] = useState<number | null>(selectedClientId || null);
  const [contactId, setContactId] = useState<number | null>(selectedContactId || null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [timeValue, setTimeValue] = useState("2m");
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [closeImmediately, setCloseImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort clients alphabetically
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));

  // Load contacts when client changes
  useEffect(() => {
    if (clientId) {
      setLoadingContacts(true);
      setContactId(null);
      
      onContactLoad(clientId)
        .then((loadedContacts) => {
          setContacts(loadedContacts);
          setLoadingContacts(false);
        })
        .catch(() => {
          setContacts([]);
          setLoadingContacts(false);
        });
    } else {
      setContacts([]);
      setContactId(null);
    }
  }, [clientId, onContactLoad]);

  const handleClientChange = (newClientId: string) => {
    const id = parseInt(newClientId);
    setClientId(id);
    onClientChange(id);
  };

  const parseTimeToHours = (timeStr: string): number => {
    const trimmed = timeStr.trim().toLowerCase();
    
    // Match patterns like "1h30m"
    const combinedMatch = trimmed.match(/^(\d+)h(\d+)m$/);
    if (combinedMatch) {
      const hours = parseInt(combinedMatch[1]);
      const minutes = parseInt(combinedMatch[2]);
      return hours + minutes / 60;
    }
    
    // Match patterns like "2h" or "1.5h"
    const hoursMatch = trimmed.match(/^(\d+\.?\d*)h$/);
    if (hoursMatch) {
      return parseFloat(hoursMatch[1]);
    }
    
    // Match patterns like "30m" or "90m"
    const minutesMatch = trimmed.match(/^(\d+)m$/);
    if (minutesMatch) {
      return parseInt(minutesMatch[1]) / 60;
    }
    
    return 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !contactId || !isTimeValid || !timeValue.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const timeHours = parseTimeToHours(timeValue);
      
      await onSubmit({
        clientId,
        contactId: contactId || 0, // Use 0 for new contacts
        timeHours,
        description: description.trim(),
        notes: notes.trim(),
        closeImmediately,
        contactName, // Include edited name for new contact creation
        contactEmail, // Include email for new contact creation
      });
      
      // Reset form
      setTimeValue("2m");
      setDescription("");
      setNotes("");
      setCloseImmediately(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    hasMatch 
      ? clientId !== null && contactId !== null && isTimeValid && timeValue.trim() !== ""
      : clientId !== null && isTimeValid && timeValue.trim() !== ""; // No match: only need client selection

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client Dropdown */}
      <div className="space-y-1">
        <label htmlFor="client-select" className="block text-sm font-medium text-foreground">
          Client
        </label>
        <select
          id="client-select"
          value={clientId || ""}
          onChange={(e) => handleClientChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="">Select a client</option>
          {sortedClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Contact Dropdown - Only shown when there's a match */}
      {hasMatch && (
        <div className="space-y-1">
          <label htmlFor="contact-select" className="block text-sm font-medium text-foreground">
            Contact
          </label>
          <select
            id="contact-select"
            value={contactId || ""}
            onChange={(e) => setContactId(parseInt(e.target.value))}
            disabled={!clientId || loadingContacts}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">
              {loadingContacts
                ? "Loading contacts..."
                : !clientId
                ? "Select a client first"
                : contacts.length === 0
                ? "No contacts available"
                : "Select a contact"}
            </option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} ({contact.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Time Input */}
      <TimeInput
        value={timeValue}
        onChange={setTimeValue}
        onValidityChange={setIsTimeValid}
      />

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description for invoice"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium text-foreground">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detailed notes (optional)"
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="close-immediately"
          checked={closeImmediately}
          onChange={(e) => setCloseImmediately(e.target.checked)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="close-immediately" className="text-sm text-foreground">
          Mark as closed immediately
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Ticket"
        )}
      </button>
    </form>
  );
};
