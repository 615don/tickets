import { useState, FormEvent } from "react";
import { TimeInput } from "./TimeInput";
import { ClientDropdown } from "./ClientDropdown";
import { DescriptionTextarea } from "./DescriptionTextarea";
import { NotesTextarea } from "./NotesTextarea";
import { ClosedCheckbox } from "./ClosedCheckbox";
import { Loader2, Info } from "lucide-react";
import { TicketFormData, MatchingResult } from "../types";

export interface TicketFormProps {
  selectedClient: { id: number; name: string } | null;
  onClientChange: (client: { id: number; name: string } | null) => void;
  matchingResult: MatchingResult | null;
  contactName: string;
  contactEmail: string;
  onSubmit: (data: TicketFormData) => Promise<void>;
}

export const TicketForm = ({
  selectedClient,
  onClientChange,
  matchingResult,
  contactName,
  contactEmail,
  onSubmit,
}: TicketFormProps) => {
  const [timeValue, setTimeValue] = useState("2m");
  const [parsedHours, setParsedHours] = useState<number | null>(0.03); // 2m = 0.0333h ≈ 0.03h
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [closeImmediately, setCloseImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [contactNameError, setContactNameError] = useState<string>("");
  const [contactEmailError, setContactEmailError] = useState<string>("");

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate client selection
    if (!selectedClient) {
      setValidationError("Client selection required");
      return;
    }

    if (!isTimeValid || !timeValue.trim() || parsedHours === null) {
      return;
    }

    // Validate contact name and email for new contact scenarios
    if (matchingResult?.type === 'domain-matched' || matchingResult?.type === 'no-match') {
      if (!contactName || contactName.trim().length === 0) {
        setContactNameError("Contact name is required");
        return;
      }
      if (!contactEmail || contactEmail.trim().length === 0) {
        setContactEmailError("Contact email is required");
        return;
      }
      if (!isValidEmail(contactEmail)) {
        setContactEmailError("Invalid email format");
        return;
      }
    }

    setValidationError("");
    setContactNameError("");
    setContactEmailError("");
    setIsSubmitting(true);

    try {
      // Build submission payload
      const payload: TicketFormData = {
        clientId: selectedClient.id,
        contactId: matchingResult?.contact?.id || 0, // Use matched contact or 0 for new contact
        timeHours: parsedHours,
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
      setParsedHours(0.03); // Reset to default parsed value
      setDescription("");
      setNotes("");
      setCloseImmediately(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedClient !== null
    && isTimeValid
    && parsedHours !== null
    && (matchingResult?.type === 'contact-matched' ||
        (contactName?.trim().length > 0 && contactEmail && contactEmail.trim().length > 0 && isValidEmail(contactEmail)));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Contact validation errors */}
      {(contactNameError || contactEmailError) && (
        <div className="space-y-1">
          {contactNameError && (
            <p className="text-sm text-red-600" role="alert">
              {contactNameError}
            </p>
          )}
          {contactEmailError && (
            <p className="text-sm text-red-600" role="alert">
              {contactEmailError}
            </p>
          )}
        </div>
      )}

      {/* New contact creation indicator */}
      {(matchingResult?.type === 'domain-matched' || matchingResult?.type === 'no-match') && contactName && contactEmail && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            This will create a new contact: <strong>{contactName}</strong> ({contactEmail})
          </p>
        </div>
      )}

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
        onParsedValueChange={setParsedHours}
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
