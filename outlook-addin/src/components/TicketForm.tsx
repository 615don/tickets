import { useState, FormEvent } from "react";
import { TimeInput } from "./TimeInput";
import { ClientDropdown } from "./ClientDropdown";
import { ContactDisplay } from "./ContactDisplay";
import { DescriptionTextarea } from "./DescriptionTextarea";
import { NotesTextarea } from "./NotesTextarea";
import { ClosedCheckbox } from "./ClosedCheckbox";
import { Loader2 } from "lucide-react";
import { TicketFormData, MatchingResult } from "../types";

export interface TicketFormProps {
  selectedClient: { id: number; name: string } | null;
  onClientChange: (client: { id: number; name: string } | null) => void;
  matchingResult: MatchingResult | null;
  contactName: string;
  onContactNameChange: (name: string) => void;
  contactEmail?: string;
  onSubmit: (data: TicketFormData) => Promise<void>;
}

export const TicketForm = ({
  selectedClient,
  onClientChange,
  matchingResult,
  contactName,
  onContactNameChange,
  contactEmail,
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
        payload.contactName = contactName;
        payload.contactEmail = contactEmail;
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

      {/* Contact Display */}
      <ContactDisplay
        matchingResult={matchingResult}
        contactName={contactName}
        onContactNameChange={onContactNameChange}
        contactEmail={contactEmail}
      />

      {/* Description */}
      <DescriptionTextarea value={description} onChange={setDescription} />

      {/* Notes */}
      <NotesTextarea value={notes} onChange={setNotes} />

      {/* Checkbox */}
      <ClosedCheckbox checked={closeImmediately} onChange={setCloseImmediately} />

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
