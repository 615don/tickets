# Epic 5: Ticket Creation Form & Submission

**Epic Goal:** Implement the complete ticket creation workflow including the form with pre-filled client/contact fields, time entry input with flexible parsing, optional description/notes fields, new contact creation from email metadata, and ticket submission to the existing backend API. Complete the end-to-end value delivery from email selection to ticket created.

## Story 5.1: Ticket Form UI Components

As a **developer**,
I want **form components for ticket creation fields**,
so that **users can input ticket data**.

### Acceptance Criteria

1. Form components created: ClientDropdown, ContactDisplay, TimeInput, DescriptionTextarea, NotesTextarea
2. ClientDropdown populated from client data (auto-selected when matched)
3. ContactDisplay shows matched contact (read-only) or editable name field for new contact creation
4. TimeInput text field with placeholder: "e.g., 2m, 0.5h, 30m" (default value: 0.03h / 2 minutes)
5. DescriptionTextarea optional, multiline, placeholder: "Brief description for invoice"
6. NotesTextarea optional, multiline, placeholder: "Detailed notes (optional)"
7. "Mark as closed immediately" checkbox component
8. All fields use Tailwind styling consistent with design goals
9. Form layout optimized for narrow sidebar width (stacked fields, no horizontal layout)
10. Tab order follows logical field sequence

## Story 5.2: Time Entry Parsing & Validation

As a **developer**,
I want **flexible time input parsing matching the main app's time entry logic**,
so that **users can enter time naturally**.

### Acceptance Criteria

1. Time parsing utility function reused or ported from backend (Story 3.2 from main PRD)
2. Parses hour formats: "2h", "2", "2.5h" → 2.0, 2.0, 2.5 hours
3. Parses minute formats: "45m", "90m" → 0.75, 1.5 hours
4. Parses combined formats: "1h30m" → 1.5 hours
5. Client-side validation displays inline error for invalid formats
6. Validation error message: "Invalid time format. Examples: 2h, 30m, 1.5h"
7. Valid input converts to decimal hours before API submission
8. Default value (2 minutes / 0.03h) pre-filled on form load
9. Unit tests for time parsing function (frontend version)

## Story 5.3: New Contact Creation Workflow

As a **user**,
I want **to create a new contact from email metadata when domain matches but contact doesn't exist**,
so that **I can create tickets for new contacts without leaving Outlook**.

### Acceptance Criteria

1. When domain match found but no contact match, "New Contact" form fields appear
2. Contact name field pre-filled from sender display name (editable)
3. Contact email field pre-filled from sender email (read-only, displayed in EmailContext)
4. Client auto-selected from domain match result
5. User can edit contact name before ticket creation
6. Validation enforces: name required, valid email format
7. StatusBadge indicates new contact will be created: "⚠ New contact at [Client]"
8. New contact form hidden when exact contact match found
9. Progressive disclosure: new contact fields only appear when needed

## Story 5.4: Ticket Submission to Backend API

As a **developer**,
I want **to submit the completed form to the existing ticket creation API**,
so that **tickets are created from the add-in**.

### Acceptance Criteria

1. API client function: `createTicket(ticketData)` calls `POST /api/tickets`
2. Request payload includes: client_id, contact_id (or new contact data), time entry (work_date, duration_hours), description, notes, state (open or closed)
3. Authentication included in request (session cookie or token)
4. Form submission triggers API call on button click
5. Loading state displayed during submission (button disabled, spinner)
6. Success handling: display confirmation message, clear form, reset to next email
7. Error handling: display clear error messages (validation errors, API failures, network errors)
8. New contact creation handled: if new contact, include contact creation in request or call separate endpoint first
9. Unit tests for API client function (mocked fetch)

## Story 5.5: Form Submission & Success Feedback

As a **user**,
I want **clear feedback when my ticket is created successfully**,
so that **I know the ticket was saved and can move to the next email**.

### Acceptance Criteria

1. "Create Ticket" button submits form
2. Button disabled during submission (prevents double-submission)
3. Success message displayed: "✓ Ticket #[ID] created successfully"
4. Success message shows created ticket ID (from API response)
5. Form automatically clears after successful submission
6. Sidebar auto-refreshes for currently selected email (or next email in workflow)
7. Success message auto-dismisses after 3 seconds or includes dismiss button
8. Form re-enables for next ticket creation
9. Visual feedback uses green color scheme for success state

## Story 5.6: Error Handling & Validation

As a **user**,
I want **helpful error messages when ticket creation fails**,
so that **I can correct issues and retry**.

### Acceptance Criteria

1. Client-side validation runs before API submission: client required, contact required (or new contact data), valid time format
2. Validation errors displayed inline next to relevant fields (red text, red border)
3. API error responses parsed and displayed: "Failed to create ticket: [error message]"
4. Authentication errors handled: "Session expired. Please log in to the web app and try again."
5. Network errors handled: "Network error. Check your connection and try again."
6. Validation errors prevent form submission (button disabled until valid)
7. Error messages cleared when user corrects field values
8. Retry mechanism available after errors (form stays populated for correction)
9. Error messages use accessible color contrast and ARIA attributes

## Story 5.7: Form Auto-Clear on Email Change

As a **user**,
I want **the form to clear and refresh when I select a different email**,
so that **I don't accidentally create tickets with wrong client/contact data**.

### Acceptance Criteria

1. When email selection changes (Office.js event), form resets to default state
2. All form fields cleared except default time value (0.03h / 2 minutes)
3. Matching process re-runs for new email
4. Form fields auto-populate based on new email's matching results
5. Any in-progress form data discarded (no confirmation dialog - follows fast workflow philosophy)
6. Form state reset includes: client selection, contact selection, description, notes, checkboxes
7. Loading state displayed during new email's matching process
8. Previous email's matching results cleared from state

---
