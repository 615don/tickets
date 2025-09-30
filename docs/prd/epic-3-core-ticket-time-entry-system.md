# Epic 3: Core Ticket & Time Entry System

**Epic Goal:** Build the core ticketing functionality including ticket creation with minimal required fields, flexible time entry parsing, multiple time entries per ticket, open/closed states with re-open capability, and ticket editing workflows. This epic delivers the primary value proposition - fast, friction-free ticket logging during billable work.

## Story 3.1: Ticket Data Model & Database Schema

As a **developer**,
I want **database tables and models for storing ticket and time entry information**,
so that **the application can persist ticket data with appropriate relationships and constraints**.

### Acceptance Criteria

1. Database migration creates `tickets` table with columns: `id`, `client_id` (FK), `contact_id` (FK), `description` (nullable), `notes` (nullable), `state` (enum: open/closed), `closed_at` (nullable), `created_at`, `updated_at`
2. Database migration creates `time_entries` table with columns: `id`, `ticket_id` (FK), `work_date`, `duration_hours` (decimal), `billable` (boolean), `created_at`, `updated_at`, `deleted_at` (nullable)
3. Foreign key constraints enforce valid client_id and contact_id references
4. Cascading rules defined for ticket deletion (cascade delete time_entries)
5. Backend models/entities created for Ticket and TimeEntry with appropriate types
6. Model validation rules defined (e.g., duration_hours > 0, work_date not future)
7. Index created on `tickets.state` for efficient filtering
8. Index created on `time_entries.work_date` for date-range queries
9. Migration runs successfully and can be rolled back

## Story 3.2: Time Entry Parsing Utility

As a **developer**,
I want **a utility function that parses flexible time input formats**,
so that **users can enter time naturally without strict format constraints** (FR9).

### Acceptance Criteria

1. Function accepts string input and returns decimal hours or error
2. Parses hour formats: "2h", "2", "2.5h", "2.5" → 2.0, 2.0, 2.5, 2.5 hours
3. Parses minute formats: "45m", "90m" → 0.75, 1.5 hours
4. Handles combined formats: "1h30m", "1.5h" → 1.5 hours
5. Returns validation error for invalid formats: "abc", "-5", "25h" (>24 hours suspicious)
6. Function has unit tests covering all format variations
7. Function is framework-agnostic (can be reused in frontend validation)

## Story 3.3: Ticket Creation API Endpoint

As a **developer**,
I want **an API endpoint to create tickets with minimal required fields**,
so that **the frontend can support fast ticket creation** (FR1, FR2).

### Acceptance Criteria

1. `POST /api/tickets` creates new ticket with required fields: `client_id`, `contact_id`, and at least one time entry (work_date, duration, billable flag)
2. Endpoint accepts optional fields: `description`, `notes`
3. Time entry duration parsed using flexible format utility (Story 3.2)
4. Validation ensures contact belongs to specified client (400 error if mismatch)
5. New tickets default to `state: "open"`
6. Initial time entry `work_date` defaults to current date if not specified
7. Endpoint requires authentication (401 if not logged in)
8. Returns created ticket with generated ID and confirmation (201 status)
9. Request validation returns clear error messages

## Story 3.4: Ticket Retrieval API Endpoints

As a **developer**,
I want **API endpoints to retrieve tickets and their time entries**,
so that **the frontend can display ticket lists and details**.

### Acceptance Criteria

1. `GET /api/tickets` returns all tickets with associated client/contact names and total hours (sum of time entries)
2. `GET /api/tickets?state=open` filters tickets by state (open/closed)
3. `GET /api/tickets?client_id=X` filters tickets by client
4. `GET /api/tickets/:id` returns single ticket with full details including all time entries
5. Time entries in response include work_date, duration_hours, billable flag
6. All endpoints require authentication
7. Endpoints return appropriate HTTP status codes (200, 404)
8. Results sorted by updated_at descending (most recent first)

## Story 3.5: Ticket Update & Time Entry Management API

As a **developer**,
I want **API endpoints to update tickets and manage time entries**,
so that **users can edit ticket details and add/modify time entries** (FR2, FR8).

### Acceptance Criteria

1. `PUT /api/tickets/:id` updates ticket description, notes, and state
2. `POST /api/tickets/:id/time-entries` adds new time entry to existing ticket
3. `PUT /api/time-entries/:id` updates existing time entry (work_date, duration, billable flag)
4. `DELETE /api/time-entries/:id` soft-deletes time entry (marks as deleted, doesn't remove from DB per NFR9)
5. Validation prevents editing time entries for locked months (return 403 with error message)
6. Ticket `updated_at` timestamp refreshed on any modification
7. All endpoints require authentication
8. Endpoints return appropriate status codes and validation errors
9. Time entry modifications tracked (updated_at timestamp)

## Story 3.6: Ticket Close & Re-open Logic

As a **developer**,
I want **API logic for closing and re-opening tickets with business rules**,
so that **tickets follow the 7-day re-open window requirement** (FR4).

### Acceptance Criteria

1. `PUT /api/tickets/:id` with `state: "closed"` sets `closed_at` timestamp to current date/time
2. `PUT /api/tickets/:id` with `state: "open"` validates re-open eligibility (within 7 days of closed_at)
3. Re-opening ticket more than 7 days after closure returns 400 error with message: "Cannot re-open tickets closed more than 7 days ago"
4. Re-opening eligible ticket clears `closed_at` timestamp
5. Closing already-closed ticket is idempotent (no error, updates closed_at)
6. API response includes re-open eligibility flag for closed tickets
7. Logic unit tested for edge cases (exactly 7 days, timezone handling)

## Story 3.7: Ticket Creation UI

As a **user**,
I want **a fast, minimal form to create tickets**,
so that **I can log billable work in under 10 seconds** (Goal: <10 sec, target 5 sec).

### Acceptance Criteria

1. Create ticket form displays with fields: Client (dropdown), Contact (dropdown), Time (text input), Description (optional textarea), Notes (optional textarea)
2. Client dropdown loads quickly (<500ms per NFR1), displays company names alphabetically
3. Contact dropdown filters to only contacts for selected client
4. Time input accepts flexible formats (validated using Story 3.2 utility)
5. Description and Notes fields clearly marked as optional
6. Billable checkbox defaults to checked (true)
7. Work date defaults to today, with date picker for alternate dates
8. Form submission creates ticket and shows success message
9. After successful creation, form clears and focuses on Client dropdown for next entry
10. Form validation displays inline error messages without page reload
11. Keyboard shortcuts supported: Tab navigation, Enter to submit
12. Form renders in <2 seconds per NFR2

## Story 3.8: Ticket Detail & Edit UI

As a **user**,
I want **to view and edit ticket details including time entries**,
so that **I can add descriptions and manage time entries after initial creation** (FR2, FR8).

### Acceptance Criteria

1. Ticket detail page displays all ticket information: client, contact, description, notes, state, created date
2. Description and Notes fields editable inline or via edit button
3. Time entries displayed in table with columns: work date, duration, billable (yes/no), actions
4. "Add Time Entry" button opens form to add additional time entry to ticket
5. Each time entry has Edit and Delete actions
6. Edit time entry allows changing work_date, duration, and billable flag
7. Delete time entry shows confirmation dialog (NFR10)
8. Cannot edit/delete time entries for locked months (disabled with tooltip message)
9. "Close Ticket" button available for open tickets
10. "Re-open Ticket" button available for recently closed tickets (within 7 days), hidden for older closed tickets
11. Save actions provide immediate feedback (success/error messages)
12. Page accessible via clicking ticket from lists

## Story 3.9: Open Tickets View

As a **user**,
I want **to see all currently open tickets**,
so that **I can quickly review work in progress** (FR10).

### Acceptance Criteria

1. Open tickets view accessible from main navigation/dashboard
2. Displays list/table of open tickets with columns: ticket ID, client name, contact name, total hours, last updated
3. List sorted by most recently updated first
4. Each ticket row clickable to navigate to ticket detail page
5. Empty state message shown when no open tickets exist
6. View loads in <2 seconds per NFR2
7. Responsive design works on mobile viewports
8. Total count of open tickets displayed in header

---
