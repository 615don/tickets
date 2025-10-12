import { useState, FormEvent, useEffect } from "react";
import { TimeInput } from "./TimeInput";
import { ClientDropdown } from "./ClientDropdown";
import { DescriptionTextarea } from "./DescriptionTextarea";
import { NotesTextarea } from "./NotesTextarea";
import { ClosedCheckbox } from "./ClosedCheckbox";
import { ErrorMessage } from "./ErrorMessage";
import { OpenTicketsList } from "./OpenTicketsList";
import { Loader2 } from "lucide-react";
import { MatchingResult } from "../types";
import { createTicket, CreateTicketResponse, CreateTicketPayload, OpenTicket, addTimeEntry, TimeEntryPayload } from "../lib/api/tickets";

type FormMode = 'create-ticket' | 'add-time-entry';

export interface TicketFormProps {
  selectedClient: { id: number; name: string } | null;
  onClientChange: (client: { id: number; name: string } | null) => void;
  matchingResult: MatchingResult | null;
  contactName: string;
  contactEmail: string;
  onSubmit: (response: CreateTicketResponse, mode?: 'create-ticket' | 'add-time-entry') => void;
  contactNameError?: string;
  contactEmailError?: string;
  onContactNameErrorChange?: (error: string) => void;
  onContactEmailErrorChange?: (error: string) => void;
}

export const TicketForm = ({
  selectedClient,
  onClientChange,
  matchingResult,
  contactName,
  contactEmail,
  onSubmit,
  contactNameError: externalContactNameError,
  contactEmailError: externalContactEmailError,
  onContactNameErrorChange,
  onContactEmailErrorChange,
}: TicketFormProps) => {
  const [timeValue, setTimeValue] = useState("2m");
  const [parsedHours, setParsedHours] = useState<number | null>(0.03); // 2m = 0.0333h ≈ 0.03h
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [closeImmediately, setCloseImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<OpenTicket | null>(null);

  // Use external error state if provided, otherwise use empty string
  const contactNameErrorValue = externalContactNameError ?? "";
  const contactEmailErrorValue = externalContactEmailError ?? "";
  const setContactNameError = onContactNameErrorChange ?? (() => {});
  const setContactEmailError = onContactEmailErrorChange ?? (() => {});

  // Extract contactId from matchingResult
  const contactId = matchingResult?.type === 'contact-matched' ? matchingResult.contact.id : null;

  // Derive form mode from selected ticket
  const formMode: FormMode = selectedTicket ? 'add-time-entry' : 'create-ticket';

  // Reset selected ticket when matchingResult changes (user switches emails)
  useEffect(() => {
    setSelectedTicket(null);
  }, [matchingResult]);

  // Pre-populate Description and clear Notes when ticket selected (AC 2, 3)
  // Combined into single useEffect to prevent double re-render
  useEffect(() => {
    if (selectedTicket) {
      setDescription(selectedTicket.description);
      setNotes(''); // Clear for new entry-specific notes
    } else {
      setDescription('');
    }
  }, [selectedTicket]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Error clearing handlers (AC 7)
  const clearSubmitError = () => {
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleClientChange = (client: { id: number; name: string } | null) => {
    onClientChange(client);
    clearSubmitError();
    if (validationError.includes('Client')) {
      setValidationError('');
    }
  };

  const handleTimeChange = (value: string) => {
    setTimeValue(value);
    clearSubmitError();
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    clearSubmitError();
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    clearSubmitError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Early exit if already submitting (prevents double-submission)
    if (isSubmitting) return;

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
      if (formMode === 'add-time-entry' && selectedTicket) {
        // Time entry submission (AC 5, 8, 9)
        const timeEntryPayload: TimeEntryPayload = {
          duration: timeValue,
          billable: true,
          notes: notes.trim() || undefined, // Optional
        };

        const timeEntryResponse = await addTimeEntry(selectedTicket.id, timeEntryPayload);

        // Clear selection and reset form (AC 9)
        setSelectedTicket(null);
        setNotes('');
        setTimeValue('2m');
        setParsedHours(0.03);

        // Notify parent with time entry mode (AC 8)
        // Create a response that matches CreateTicketResponse format
        const response: CreateTicketResponse = {
          id: selectedTicket.id,
          clientId: selectedClient!.id,
          contactId: contactId!,
          description: selectedTicket.description,
          notes: notes,
          state: 'open',
          createdAt: timeEntryResponse.createdAt,
          updatedAt: timeEntryResponse.createdAt,
        };
        onSubmit(response, 'add-time-entry');
      } else {
        // Existing ticket creation logic (unchanged)
        const payload: CreateTicketPayload = {
          clientId: selectedClient.id,
          contactId: matchingResult?.type === 'contact-matched'
            ? matchingResult.contact.id
            : 0, // 0 signals new contact creation
          description: description.trim(),
          notes: notes.trim(),
          state: closeImmediately ? ('closed' as const) : ('open' as const),
          timeEntry: {
            workDate: new Date().toLocaleDateString('en-CA'), // Today's date YYYY-MM-DD in local timezone
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
        onSubmit(response, 'create-ticket');

        // Reset form
        setTimeValue("2m");
        setParsedHours(0.03);
        setDescription("");
        setNotes("");
        setCloseImmediately(false);
      }
    } catch (error) {
      // Error handling - display error and keep form data for retry
      let errorMessage = formMode === 'add-time-entry'
        ? 'Failed to add time entry.'
        : 'Failed to create ticket.';

      if (error instanceof Error) {
        // Check for authentication error (AC 4)
        if (error.message.includes('Authentication required') || error.message.includes('log in')) {
          errorMessage = 'Session expired. Please log in to the web app and try again.';
        }
        // Check for network error (AC 5)
        else if (error.message.includes('Network error')) {
          errorMessage = error.message; // Use the message from apiClient
        }
        // Check for CSRF token error
        else if (error.message.includes('Security token')) {
          errorMessage = error.message; // Use the message from apiClient
        }
        // Check for specific time entry errors
        else if (error.message.includes('closed ticket') || error.message.includes('closed')) {
          errorMessage = 'Cannot add time to closed ticket.';
        }
        else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Ticket not found. It may have been deleted.';
        }
        // Parse backend validation or API error (AC 3)
        else {
          // If message doesn't already include "Failed to", prepend it
          if (error.message.startsWith('HTTP') || error.message.includes('validation')) {
            errorMessage = formMode === 'add-time-entry'
              ? `Failed to add time entry: ${error.message}`
              : `Failed to create ticket: ${error.message}`;
          } else {
            errorMessage = error.message;
          }
        }
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedClient !== null
    && isTimeValid
    && parsedHours !== null
    && !contactNameErrorValue
    && !contactEmailErrorValue
    && (formMode === 'add-time-entry' ||
        (matchingResult?.type === 'contact-matched' ||
        (contactName?.trim().length > 0 && contactEmail && contactEmail.trim().length > 0 && isValidEmail(contactEmail))));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Submit Error Banner - AC 3, 4, 5, 8, 9 */}
      {submitError && (
        <ErrorMessage
          variant="banner"
          message={submitError}
          onDismiss={() => setSubmitError('')}
        />
      )}

      {/* Client Dropdown - Always visible and editable */}
      <div className="space-y-1">
        <label htmlFor="client-dropdown" className="block text-sm font-medium text-foreground">
          Client
        </label>
        <ClientDropdown
          value={selectedClient?.id || null}
          onChange={handleClientChange}
          error={validationError}
        />
      </div>

      {/* Open Tickets List - positioned between Client and Time */}
      {contactId && (
        <OpenTicketsList
          contactId={contactId}
          onTicketSelect={setSelectedTicket}
          selectedTicketId={selectedTicket?.id || null}
        />
      )}

      {/* Clear Selection Button - AC 6 */}
      {selectedTicket && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setSelectedTicket(null)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
            aria-label="Clear ticket selection and return to create mode"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Time Input */}
      <TimeInput
        value={timeValue}
        onChange={handleTimeChange}
        onValidityChange={setIsTimeValid}
        onParsedValueChange={setParsedHours}
      />

      {/* Description */}
      <DescriptionTextarea
        value={description}
        onChange={handleDescriptionChange}
        disabled={formMode === 'add-time-entry'}
      />

      {/* Notes */}
      <NotesTextarea value={notes} onChange={handleNotesChange} />

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
              {formMode === 'add-time-entry' ? 'Adding Time...' : 'Creating...'}
            </>
          ) : (
            formMode === 'add-time-entry' ? 'Add Time Entry' : 'Create Ticket'
          )}
        </button>
      </div>
    </form>
  );
};
