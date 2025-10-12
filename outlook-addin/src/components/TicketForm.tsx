import { useState, FormEvent } from "react";
import { TimeInput } from "./TimeInput";
import { ClientDropdown } from "./ClientDropdown";
import { DescriptionTextarea } from "./DescriptionTextarea";
import { NotesTextarea } from "./NotesTextarea";
import { ClosedCheckbox } from "./ClosedCheckbox";
import { Loader2 } from "lucide-react";
import { MatchingResult } from "../types";
import { createTicket, CreateTicketResponse } from "../lib/api/tickets";

export interface TicketFormProps {
  selectedClient: { id: number; name: string } | null;
  onClientChange: (client: { id: number; name: string } | null) => void;
  matchingResult: MatchingResult | null;
  contactName: string;
  contactEmail: string;
  onSubmit: (response: CreateTicketResponse) => void;
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
  const [submitError, setSubmitError] = useState<string>("");

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
    setSubmitError("");
    setIsSubmitting(true);

    try {
      // Build API payload
      const payload = {
        clientId: selectedClient.id,
        contactId: matchingResult?.type === 'contact-matched'
          ? matchingResult.contact.id
          : 0, // 0 signals new contact creation
        description: description.trim(),
        notes: notes.trim(),
        state: closeImmediately ? ('closed' as const) : ('open' as const),
        timeEntry: {
          workDate: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
          duration: timeValue, // Backend expects string like "2m" or "1.5h", NOT parsed hours
          billable: true,
        },
      };

      // Include new contact data if creating new contact
      if (payload.contactId === 0) {
        payload.newContact = {
          name: contactName.trim(),
          email: contactEmail.trim(),
          clientId: selectedClient.id,
        };
      }

      // Call API
      const response = await createTicket(payload);

      // Success - notify parent and reset form
      onSubmit(response);

      // Reset form
      setTimeValue("2m");
      setParsedHours(0.03);
      setDescription("");
      setNotes("");
      setCloseImmediately(false);
    } catch (error) {
      // Error handling - display error and keep form data for retry
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("An unexpected error occurred. Please try again.");
      }
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
      <div className="space-y-2">
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

        {/* Submit Error Display */}
        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}
      </div>
    </form>
  );
};
