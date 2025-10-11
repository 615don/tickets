import { useState, FormEvent } from "react";
import { TimeInput } from "./TimeInput";
import { ClientDropdown } from "./ClientDropdown";
import { Loader2 } from "lucide-react";
import { TicketFormData, MatchingResult } from "../types";

export interface TicketFormProps {
  selectedClient: { id: number; name: string } | null;
  onClientChange: (client: { id: number; name: string } | null) => void;
  matchingResult: MatchingResult | null;
  onSubmit: (data: TicketFormData) => Promise<void>;
}

export const TicketForm = ({
  selectedClient,
  onClientChange,
  matchingResult,
  onSubmit,
}: TicketFormProps) => {
  const [timeValue, setTimeValue] = useState("2m");
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [closeImmediately, setCloseImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

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

    // Validate client selection
    if (!selectedClient) {
      setValidationError("Client selection required");
      return;
    }

    if (!isTimeValid || !timeValue.trim()) {
      return;
    }

    setValidationError("");
    setIsSubmitting(true);

    try {
      const timeHours = parseTimeToHours(timeValue);

      // Build submission payload
      const payload: TicketFormData = {
        clientId: selectedClient.id,
        contactId: matchingResult?.contact?.id || 0, // Use matched contact or 0 for new contact
        timeHours,
        description: description.trim(),
        notes: notes.trim(),
        closeImmediately,
      };

      // Include contact info for new contact creation (domain match or no match scenarios)
      if (matchingResult?.type === 'domain-matched' || matchingResult?.type === 'no-match') {
        // Contact will be created automatically by backend using sender email info
        payload.contactName = matchingResult.contact?.name;
        payload.contactEmail = matchingResult.contact?.email;
      }

      await onSubmit(payload);

      // Reset form
      setTimeValue("2m");
      setDescription("");
      setNotes("");
      setCloseImmediately(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedClient !== null && isTimeValid && timeValue.trim() !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client Dropdown - Always visible and editable */}
      <div className="space-y-1">
        <label htmlFor="client-dropdown" className="block text-sm font-medium text-foreground">
          Client
        </label>
        <ClientDropdown
          value={selectedClient?.id || null}
          onChange={onClientChange}
        />
        {validationError && (
          <p className="text-sm text-red-600" role="alert">
            {validationError}
          </p>
        )}
      </div>

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
