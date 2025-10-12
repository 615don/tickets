# Epic 6: Open Ticket Re-entry Workflow - Brownfield Enhancement

## Epic Goal

Enable users to add time to existing open tickets directly from the Outlook add-in by displaying up to three open tickets for the matched contact and transforming the ticket creation form into a time entry form when a ticket is selected, reducing duplicate ticket creation and improving workflow efficiency.

## Epic Description

### Existing System Context

- **Current relevant functionality:** The Outlook add-in currently supports email-to-contact matching, domain-to-client fallback matching, and new ticket creation with time entry. The ticket creation form displays contact matching status and auto-populates client/contact information.
- **Technology stack:** React 18.3.1 + TypeScript 5.8.3 + Vite 5.4.19, Tailwind CSS 3.4.17, shadcn/ui components, session-based authentication with CORS-enabled backend API
- **Integration points:**
  - Existing contact matching system (`/api/contacts/match-email`)
  - Ticket creation API (`POST /api/tickets`)
  - TicketForm component ([outlook-addin/src/components/TicketForm.tsx](outlook-addin/src/components/TicketForm.tsx))
  - EmailContext component ([outlook-addin/src/components/EmailContext.tsx](outlook-addin/src/components/EmailContext.tsx))

### Enhancement Details

**What's being added/changed:**

1. **New API Endpoint:** `GET /api/tickets/open-by-contact?contactId={id}` - Returns up to 3 most recent open tickets for a contact, ordered by most recent activity
2. **New UI Component:** `OpenTicketsList` - Displays clickable links between Client dropdown and Time input in TicketForm
3. **Form Mode State:** Toggle TicketForm between "create new ticket" mode (default) and "add time to existing ticket" mode
4. **Time Entry API:** `POST /api/tickets/:ticketId/time-entries` - Add time entry to existing ticket (or reuse existing ticket creation endpoint with modified payload)

**How it integrates:**

- When contact is matched (`matchingResult.type === 'contact-matched'`), automatically call the new open tickets API endpoint
- Display open ticket links in TicketForm between Client dropdown and Time input
- Clicking a ticket link switches form to "time entry mode":
  - Pre-populates Description field with ticket description (read-only or editable)
  - Clears Notes field for new entry-specific notes
  - Changes submit button text from "Create Ticket" to "Add Time Entry"
  - Submit creates time entry for existing ticket instead of new ticket
- Not clicking any link keeps form in default "create new ticket" mode

**Success criteria:**

- Users can see up to 3 open tickets for matched contacts
- Ticket descriptions are truncated to fit available width with ellipsis
- Clicking a ticket link transforms the form to time entry mode
- Time entry submission succeeds and adds to existing ticket
- Users can cancel/deselect to return to ticket creation mode
- No impact on existing ticket creation workflow (backward compatible)

## Stories

1. **Story 6.1: Backend Open Tickets API Endpoint**
   - Create `GET /api/tickets/open-by-contact?contactId={id}` endpoint
   - Return up to 3 most recent open tickets with id, description, and last updated timestamp
   - Add unit tests for endpoint and edge cases (no open tickets, contact doesn't exist)

2. **Story 6.2: Open Tickets List UI Component**
   - Create `OpenTicketsList` component displaying clickable ticket links
   - Position between Client dropdown and Time input in TicketForm
   - Implement text truncation with ellipsis for descriptions
   - Add selection state management and visual feedback (highlight selected ticket)
   - Integrate with contact matching hook to fetch open tickets when contact is matched

3. **Story 6.3: Time Entry Form Mode and Submission**
   - Add form mode state to TicketForm (create vs. add-time)
   - Pre-populate Description field when ticket is selected
   - Clear Notes field for new entry-specific notes
   - Change submit button text based on mode
   - Implement time entry submission to backend (new endpoint or modify existing)
   - Add "Cancel/Clear Selection" to return to create mode
   - Update form validation for time entry mode

## Compatibility Requirements

- [x] Existing APIs remain unchanged (`POST /api/tickets` still works for new tickets)
- [x] Database schema changes are backward compatible (time_entries table already supports ticket_id FK)
- [x] UI changes follow existing patterns (shadcn/ui components, Tailwind CSS, React hooks)
- [x] Performance impact is minimal (single additional API call when contact is matched)

## Risk Mitigation

**Primary Risk:** Confusion between time entry mode and ticket creation mode, leading to accidental duplicate tickets or incorrect time entries

**Mitigation:**
- Clear visual distinction between modes (different button text, selected ticket highlight, optional mode indicator badge)
- Explicit "Cancel/Clear Selection" action to return to creation mode
- Comprehensive frontend validation to ensure correct payload is sent for each mode

**Rollback Plan:**
- Backend: Remove new `GET /api/tickets/open-by-contact` endpoint and time entry endpoint (if separate)
- Frontend: Remove `OpenTicketsList` component and revert TicketForm to single-mode behavior
- No database migration required (time_entries table unchanged, only INSERT operations)

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing ticket creation functionality verified through testing
- [x] Open tickets list displays correctly when contact is matched
- [x] Time entry mode works correctly and adds time to existing ticket
- [x] Users can switch between modes without errors
- [x] Documentation updated (architecture component diagram, API docs)
- [x] No regression in existing contact matching or ticket creation features
- [x] Unit tests pass for new API endpoints and components
- [x] Manual testing confirms workflow efficiency improvement

---

## Story Manager Handoff

**Story Manager Handoff:**

Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to the existing Outlook add-in running React 18.3.1 + TypeScript 5.8.3 with session-based authentication
- **Integration points:**
  - Contact matching system (`/api/contacts/match-email`) - already triggers when email is selected
  - TicketForm component - existing form with Client dropdown, Time input, Description, Notes fields
  - Backend ticket and time_entries tables - already support one-to-many relationship
- **Existing patterns to follow:**
  - shadcn/ui components for UI elements (follow ClientDropdown, TimeInput patterns)
  - React hooks for API calls (follow `useClients`, `useMatching` patterns in `/outlook-addin/src/hooks/`)
  - Backend controller pattern (follow ticketController structure in `/backend/src/controllers/ticketController.js`)
  - API response format with error handling (follow existing `/api/contacts/match-email` pattern)
- **Critical compatibility requirements:**
  - Do not modify existing `POST /api/tickets` endpoint behavior
  - Ensure backward compatibility with existing time_entries table schema
  - Maintain existing TicketForm component interface and props
  - Follow WCAG 2.1 Level AA accessibility standards (keyboard navigation, ARIA labels)
- Each story must include verification that existing functionality remains intact (regression testing acceptance criteria)

The epic should maintain system integrity while delivering **a seamless workflow for adding time to existing open tickets, reducing duplicate ticket creation and improving user efficiency when handling ongoing support conversations via email**.
