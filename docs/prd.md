# Lean IT Consulting Ticketing System Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Eliminate revenue leakage from forgotten billable hours by enabling real-time ticket logging
- Reduce ticket creation time from minutes to under 10 seconds (target: 5 seconds)
- Decrease monthly administrative overhead from ~4 hours to under 1 hour
- Enable same-day invoice generation at month-end through seamless Xero integration
- Provide transparent, dispute-proof billing documentation for all client work
- Support 100% billable time capture with minimal friction during active work

### Background Context

Solo IT consultants and small IT consulting firms billing hourly face a critical challenge: existing ticketing systems designed for team collaboration impose unnecessary complexity that directly causes revenue loss. Current systems require slow-loading dropdowns, multiple forced fields, and multi-step workflows that transform simple billing documentation into a multi-minute interruption. This friction leads consultants to defer ticket creation, resulting in forgotten billable hours—potentially $5,000-10,000 in annual revenue loss for a typical consultant billing 85-100 hours monthly.

This PRD defines an MVP ticketing system purpose-built for billing documentation rather than task management. By reducing required fields at creation to just three essentials (client, contact, time) and enabling rich context capture at closure, the system meets consultants where they work and eliminates the barrier causing revenue leakage. The solution focuses exclusively on the billing workflow: capture time during work, review and adjust before month-end, and generate detailed Xero invoices with per-ticket line items.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-30 | 1.0 | Initial PRD creation from Project Brief | John (PM Agent) |

---

## Requirements

### Functional Requirements

**FR1:** System shall support creating tickets with only three required fields at creation time: Client, Contact, and Time Entry.

**FR2:** System shall allow tickets to have optional Description and Notes fields that can be populated at creation or added/edited later before ticket closure.

**FR3:** System shall require a Description field to be populated before a ticket can be included in invoice generation, prompting the user to add descriptions to any tickets lacking them during the pre-invoice review process.

**FR4:** System shall support ticket states of Open and Closed, with ability to re-open closed tickets within 7 days of closure.

**FR5:** System shall maintain a Client database with fields for company name, one or more email domains (for auto-detection), Xero customer ID, and maintenance contract type.

**FR6:** System shall maintain a Contact database with fields for name and email address, with each contact associated with exactly one Client.

**FR7:** System shall support multiple time entries per ticket, each with a work date, duration, and billable/non-billable flag.

**FR8:** System shall allow users to add, edit, or delete time entries for any ticket until the associated month's invoice has been pushed to Xero (invoice lock).

**FR9:** System shall accept time input in flexible formats including hours ("2h", "2"), minutes ("45m", "45"), and decimal hours ("1.5h", "1.5").

**FR10:** System shall provide an Open Tickets view displaying all currently open tickets.

**FR11:** System shall provide a Recently Closed Tickets view displaying tickets closed within the last 7 days.

**FR12:** System shall provide search capability for historical closed tickets.

**FR13:** System shall support manual invoice generation for a specified month that pushes invoices to Xero via API integration.

**FR14:** System shall format Xero invoices with per-ticket line items using format "Ticket #[ID] - [Description]".

**FR15:** System shall include non-billable tickets as $0 line items in Xero invoices.

**FR16:** System shall display a pre-invoice review screen showing total billable hours, per-client breakdown, and any tickets missing descriptions before allowing invoice push to Xero.

**FR17:** System shall lock all time entries for a month after successful Xero invoice push to prevent accidental modification.

**FR18:** System shall support basic authentication with username and password for single-user access.

**FR19:** System shall allow deletion of contacts with automatic reassignment of their tickets to a system-generated "Deleted Contact" record per client, preserving ticket history.

**FR20:** System shall allow deletion of clients with cascade deletion of all related data (contacts, tickets, time entries), but prevent deletion if invoices have been generated for that client.

### Non-Functional Requirements

**NFR1:** Ticket creation form submission shall complete in under 500ms under normal operating conditions.

**NFR2:** Page load times shall not exceed 2 seconds for any view in the system.

**NFR3:** Search and filter operations shall return results in under 1 second.

**NFR4:** System shall use HTTPS for all client-server communication.

**NFR5:** System shall securely store Xero API credentials (OAuth tokens) using industry-standard encryption.

**NFR6:** System shall support modern browsers (Chrome, Edge, Safari, Firefox - last 2 major versions) with no requirement for IE11.

**NFR7:** System shall implement automated daily database backups with retention policy.

**NFR8:** System shall be responsive and usable on mobile browsers (tablet and phone sizes).

**NFR9:** System shall implement soft deletes for time entries to enable audit trail and recovery capability.

**NFR10:** System shall display confirmation dialogs for destructive actions (delete time entry, lock invoice).

**NFR11:** System shall use Xero's "Consulting Services" product/service item for invoice line items. User must have this product configured in their Xero account with appropriate rate and accounting code mappings before invoice generation.

---

## User Interface Design Goals

### Overall UX Vision

The system prioritizes **speed and simplicity** over feature richness. The interface should feel lightweight and responsive, with minimal cognitive load at every interaction. The primary UX goal is to make ticket creation so fast and frictionless that users log time in real-time during work rather than deferring to memory. Secondary UX goals include confidence during month-end review (clear visibility of all billable work) and zero-confusion invoice generation (obvious what will be sent to Xero before pushing).

### Key Interaction Paradigms

- **Fast-form philosophy:** Ticket creation uses minimal form fields with smart defaults, keyboard shortcuts for power users, and instant submission without confirmation dialogs
- **Deferred detail capture:** System embraces the workflow of "quick capture now, rich context later" - users can return to tickets to add descriptions/notes when context is fresh
- **Dashboard-centric navigation:** Single dashboard view as home base showing open tickets, recently closed, and quick-access to month-end review
- **Inline editing:** Edit ticket details, time entries, and descriptions directly in list views without modal popups or page transitions where possible
- **Progressive disclosure:** Advanced features (search, historical tickets, client/contact management) hidden behind secondary navigation to keep primary workflow clean

### Core Screens and Views

1. **Dashboard (Home)** - Primary landing page showing open tickets, recently closed tickets, and quick stats (current month hours)
2. **Create Ticket Form** - Minimal form with Client dropdown, Contact dropdown, Time input, and optional Description/Notes
3. **Ticket Detail/Edit View** - Display and edit all ticket details including multiple time entries, with ability to add/edit description and notes
4. **Pre-Invoice Review Screen** - Month-end review showing all tickets to be invoiced, grouped by client, with totals and highlighting of missing descriptions
5. **Client Management** - CRUD interface for clients (company name, domains, Xero ID, contract type)
6. **Contact Management** - CRUD interface for contacts (name, email, associated client)
7. **Historical Ticket Search** - Simple search interface for finding closed tickets by client, date range, or keyword

### Accessibility: None

No formal accessibility compliance requirements for MVP. Standard browser accessibility features should work (keyboard navigation, screen reader compatibility for form fields), but WCAG conformance is not a formal requirement.

### Branding

Clean, professional, minimal aesthetic. Favor function over form. No specific brand guidelines or color palette defined for MVP. Suggested approach: Simple neutral color scheme (blues/grays for professionalism), clear typography optimized for readability, and generous whitespace to reduce visual clutter. Avoid unnecessary animations or decorative elements that could slow perceived performance.

### Target Device and Platforms: Web Responsive

Primary target is desktop browsers (where most work happens), with responsive design ensuring usability on tablets and mobile phones. Mobile experience should support common on-the-go tasks like quick ticket creation and viewing recent tickets, but month-end invoice review and client/contact management can be desktop-optimized.

---

## Technical Assumptions

### Repository Structure: Monorepo

Single repository containing both frontend and backend code. This simplifies development, deployment, and dependency management for the MVP. The structure can be separated into polyrepo later if the project scales beyond single-user scope.

**Rationale:** Solo development with tight timeline (4-6 weeks) benefits from unified codebase. No team coordination overhead, simpler CI/CD pipeline, and easier context switching during rapid iteration.

### Service Architecture

**Monolithic web application** with clear separation between frontend (SPA), backend API layer, and data layer.

- **Frontend:** Single-page application (SPA) served as static assets
- **Backend:** RESTful API server handling business logic, Xero integration, and database operations
- **Database:** PostgreSQL for relational data (clients, contacts, tickets, time entries)

**Not using microservices or serverless** - unnecessary complexity for single-user system with straightforward workflows. All functionality deployed as single application unit.

**Rationale:** Brief emphasizes speed of development and minimal hosting costs. Monolith is fastest to build, easiest to deploy, and most cost-effective for expected load (one active user). Future Phase 2 features (Outlook extension, daily emails) can integrate with monolith via API endpoints.

### Testing Requirements

**Unit tests for critical business logic** - Focus testing effort on:
- Time entry parsing and validation (flexible format handling)
- Invoice calculation and line item formatting
- Xero API integration layer (with mocked API responses)
- Date-based filtering and time entry locking logic

**Manual testing for UI workflows** - Given tight MVP timeline and single user:
- Manual QA of ticket creation, editing, and invoice generation workflows
- Browser compatibility spot-checking on Chrome, Edge, Safari
- Responsive design manual testing on common mobile viewports

**No automated E2E or integration tests for MVP** - Trade-off accepting some risk to meet 4-6 week timeline. User will effectively perform UAT during real-world usage.

**Convenience methods for manual testing:**
- Seed script to populate test data (sample clients, contacts, tickets)
- Admin endpoint to reset Xero invoice locks for testing month-end workflow
- Database snapshot/restore utilities for safe testing

**Rationale:** YAGNI applied to testing pyramid. Critical financial calculations (time totals, invoice amounts) warrant unit tests. Complex E2E test infrastructure would consume significant timeline with marginal benefit for single-user MVP.

### Additional Technical Assumptions and Requests

**Frontend Framework:** Modern JavaScript framework recommended - **React** or **Vue.js** preferred for:
- Large ecosystem and component libraries (faster development)
- Strong TypeScript support (type safety for time calculations)
- Lightweight build output to meet <2 second page load NFR

**Backend Language/Framework:** **Node.js with Express** or **Python with FastAPI** recommended for:
- Excellent Xero API SDK availability (both have official/community libraries)
- Rapid development capability for REST APIs
- Shared language with frontend (Node.js) or clarity/simplicity (Python)

**Database:** **PostgreSQL** for:
- Robust relational data model (clients → contacts, tickets → time entries)
- JSON column support for flexible metadata storage if needed
- Reliable ACID transactions for invoice locking operations
- Free tier availability on most cloud hosting platforms

**Hosting/Deployment:** Cloud hosting with minimal DevOps overhead:
- **Heroku**, **Railway**, **Render**, or **DigitalOcean App Platform** recommended
- Single-click deployment from Git repository
- Managed PostgreSQL database (no manual DB administration)
- Automatic HTTPS and daily backups included
- Cost target: Under $20/month for MVP (hobby tier acceptable)

**Authentication:** Simple username/password with **bcrypt password hashing** for MVP. Session-based authentication with HTTP-only cookies. OAuth/SSO (Microsoft 365) deferred to post-MVP.

**Xero Integration:** Official Xero API SDK (Node.js or Python) with OAuth 2.0 flow. Store refresh tokens securely (encrypted at rest). Handle token refresh automatically. Research invoice line item limits during technical spike (identified risk in brief).

**Version Control & CI/CD:** Git repository (GitHub/GitLab), automated deployment on merge to main branch, database migrations handled via framework tooling (e.g., Alembic for Python, Sequelize/TypeORM for Node.js).

**Time Entry Storage:** Store time as decimal hours in database for calculation simplicity. Accept flexible input formats in UI, normalize to decimal on save.

**Timezone Handling:**
- All users and clients operate in Central Standard Time (CST/CDT)
- Server should be configured to CST timezone or convert all timestamps to CST for storage
- Work dates (`time_entries.work_date`) stored as DATE type (no time component, eliminates timezone confusion)
- Timestamps (`created_at`, `updated_at`, `closed_at`) stored in CST
- Date pickers in UI default to CST, no timezone conversion needed
- Month boundaries for invoice generation calculated in CST (e.g., "January 2025" = 2025-01-01 to 2025-01-31 CST)

**Rationale:** Single-timezone operation eliminates complexity. All users in same timezone means no conversion logic needed, reducing edge case bugs.

---

## Epic List

**Epic 1: Foundation & Authentication**
*Establish project infrastructure, repository setup, basic authentication, and deploy a working "hello world" application to production hosting.*

**Epic 2: Client & Contact Management**
*Implement full CRUD operations for Clients and Contacts, establishing the foundational data entities required for ticket creation.*

**Epic 3: Core Ticket & Time Entry System**
*Build ticket creation, editing, and time entry management with open/closed states and flexible time input parsing.*

**Epic 4: Xero Integration & Invoice Generation**
*Integrate with Xero API, implement OAuth flow, build pre-invoice review screen, and enable invoice push with time entry locking.*

**Epic 5: Views, Search & Historical Access**
*Implement dashboard with open/recently closed tickets, historical ticket search, and navigation workflows for complete user experience.*

---

## Epic 1: Foundation & Authentication

**Epic Goal:** Establish a production-ready foundation including project repository, development environment, CI/CD pipeline, basic authentication system, and deploy a minimal working application to cloud hosting. This epic delivers a secured, deployable application framework that subsequent epics will build upon.

### Story 1.1: Project Setup & Repository Initialization

As a **developer**,
I want **a properly configured monorepo with frontend and backend scaffolding**,
so that **I have a clean foundation to build the application with appropriate tooling and structure**.

#### Acceptance Criteria

1. Repository created with appropriate `.gitignore` for chosen tech stack (Node.js/Python)
2. Monorepo structure established with separate `/frontend` and `/backend` directories
3. Frontend framework initialized (React/Vue) with TypeScript configuration
4. Backend framework initialized (Express/FastAPI) with basic project structure
5. Package manager configuration files present (package.json or requirements.txt)
6. README.md exists with basic project description and setup instructions
7. Development environment can be started locally (both frontend and backend running)

### Story 1.2: Database Setup & Connection

As a **developer**,
I want **a PostgreSQL database configured and connected to the backend**,
so that **the application can persist and retrieve data**.

#### Acceptance Criteria

1. PostgreSQL database provisioned (local development environment)
2. Database connection configuration using environment variables (no hardcoded credentials)
3. Database migration tooling installed (Alembic/Sequelize/TypeORM)
4. Initial migration creates `users` table for authentication
5. Backend can successfully connect to database on startup
6. Database connection health check endpoint (`/api/health`) returns 200 when DB connected
7. Environment variable template (`.env.example`) documented with required DB configuration

### Story 1.3: Basic Authentication System

As a **user**,
I want **to log in with username and password**,
so that **only I can access the ticketing system**.

#### Acceptance Criteria

1. User registration endpoint creates user with bcrypt-hashed password
2. Login endpoint validates credentials and creates session with HTTP-only cookie
3. Logout endpoint clears session and invalidates cookie
4. Protected API routes reject requests without valid session (401 Unauthorized)
5. Frontend login page renders with username/password form
6. Successful login redirects to dashboard (placeholder page acceptable)
7. Frontend stores authentication state and redirects unauthenticated users to login
8. Password minimum requirements enforced (8+ characters)

### Story 1.4: CI/CD Pipeline & Production Deployment

As a **developer**,
I want **automated deployment to production hosting on main branch commits**,
so that **changes are continuously deployed without manual intervention**.

#### Acceptance Criteria

1. Cloud hosting platform account configured (Heroku/Railway/Render/DigitalOcean)
2. Production PostgreSQL database provisioned on hosting platform
3. CI/CD pipeline configured to deploy on merge to `main` branch
4. Database migrations run automatically on deployment
5. Environment variables configured in hosting platform (DB credentials, session secret)
6. Application accessible via HTTPS URL
7. Health check endpoint returns 200 on production deployment
8. Automated daily database backups configured on hosting platform (NFR7)

---

## Epic 2: Client & Contact Management

**Epic Goal:** Implement complete CRUD (Create, Read, Update, Delete) operations for Clients and Contacts, establishing the foundational data entities required for ticket creation. This epic delivers a fully functional client database that enables accurate billing organization and prepares the system for ticket workflows.

### Story 2.1: Client Data Model & Database Schema

As a **developer**,
I want **database tables and models for storing client information**,
so that **the application can persist client data with appropriate relationships and constraints**.

#### Acceptance Criteria

1. Database migration creates `clients` table with columns: `id`, `company_name`, `xero_customer_id`, `maintenance_contract_type`, `created_at`, `updated_at`
2. Database migration creates `client_domains` table with columns: `id`, `client_id` (foreign key), `domain`, supporting one-to-many relationship
3. Backend models/entities created for Client and ClientDomain with appropriate TypeScript/Python types
4. Database enforces unique constraint on `client_domains.domain` (no domain duplicates across all clients)
5. Cascading delete configured - deleting client removes associated domains
6. Model includes validation rules (e.g., company_name required, domain format validation)
7. Migration runs successfully on local and can be rolled back

### Story 2.2: Contact Data Model & Database Schema

As a **developer**,
I want **database tables and models for storing contact information**,
so that **the application can persist contacts associated with clients**.

#### Acceptance Criteria

1. Database migration creates `contacts` table with columns: `id`, `client_id` (foreign key), `name`, `email`, `created_at`, `updated_at`, `deleted_at` (nullable, for soft deletes)
2. Backend model/entity created for Contact with appropriate types
3. Foreign key constraint enforces `contacts.client_id` references valid client
4. Database enforces unique constraint on `email` for non-deleted contacts
5. Cascading delete configured - deleting client removes associated contacts
6. Model includes validation rules (name required, email format validation)
7. Migration runs successfully and can be rolled back

### Story 2.3: Client Management API Endpoints

As a **developer**,
I want **RESTful API endpoints for client CRUD operations**,
so that **the frontend can manage client data**.

#### Acceptance Criteria

1. `POST /api/clients` creates new client with domains (accepts array of domain strings)
2. `GET /api/clients` returns list of all clients with associated domains
3. `GET /api/clients/:id` returns single client with domains and contact count
4. `PUT /api/clients/:id` updates client and replaces domains list
5. `DELETE /api/clients/:id` removes client - returns 403 error if any invoice locks reference this client's tickets, otherwise cascade deletes all contacts, tickets, and time entries with confirmation dialog showing data counts
6. All endpoints require authentication (401 if not logged in)
7. Endpoints return appropriate HTTP status codes (200, 201, 400, 404, 500)
8. Request validation returns clear error messages (e.g., "domain format invalid")
9. API endpoints tested manually using cURL/Postman or unit tests

### Story 2.4: Contact Management API Endpoints

As a **developer**,
I want **RESTful API endpoints for contact CRUD operations**,
so that **the frontend can manage contact data**.

#### Acceptance Criteria

1. `POST /api/contacts` creates new contact (requires valid `client_id`)
2. `GET /api/contacts` returns list of all non-deleted contacts with client information
3. `GET /api/contacts?client_id=X` filters contacts by client
4. `GET /api/contacts/:id` returns single contact with full client details
5. `PUT /api/contacts/:id` updates contact information
6. `DELETE /api/contacts/:id` soft-deletes contact and reassigns all associated tickets to system-created "Deleted Contact" for that client (preserves ticket history)
7. All endpoints require authentication (401 if not logged in)
8. Endpoints return appropriate HTTP status codes and validation error messages
9. API endpoints tested manually or with unit tests

### Story 2.5: Client Management UI

As a **user**,
I want **a screen to create, view, edit, and delete clients**,
so that **I can maintain my client database**.

#### Acceptance Criteria

1. Clients list page displays all clients in table/list format with company name and domain count
2. "Add Client" button opens form with fields: company_name, xero_customer_id, maintenance_contract_type, domains (dynamic list input)
3. Domain input allows adding multiple domains with add/remove buttons
4. Submitting form creates client and displays success message
5. Each client row has "Edit" and "Delete" actions
6. Edit opens pre-populated form, saving updates the client
7. Delete shows confirmation dialog before removing client, including count of contacts/tickets/time entries that will be deleted
8. Form validation displays inline error messages (e.g., "Company name required")
9. Page accessible via navigation link from dashboard/header
10. Responsive design works on mobile viewports

### Story 2.6: Contact Management UI

As a **user**,
I want **a screen to create, view, edit, and delete contacts**,
so that **I can maintain my contact database**.

#### Acceptance Criteria

1. Contacts list page displays all contacts in table format with name, email, and client company name
2. "Add Contact" button opens form with fields: name, email, client (dropdown)
3. Client dropdown populated from existing clients
4. Submitting form creates contact and displays success message
5. Each contact row has "Edit" and "Delete" actions
6. Edit opens pre-populated form, saving updates the contact
7. Delete shows confirmation dialog before removing contact
8. Form validation displays inline error messages (e.g., "Invalid email format")
9. Page accessible via navigation link from dashboard/header
10. List can be filtered by client using dropdown or search
11. Responsive design works on mobile viewports

### Story 2.7: System Contact Management

As a **developer**,
I want **automatic creation of system "Deleted Contact" records per client**,
so that **ticket history is preserved when contacts are removed**.

#### Acceptance Criteria

1. System creates "Deleted Contact" record for each client on first contact deletion
2. "Deleted Contact" has email format: `deleted+{client_id}@system.local`
3. All tickets for deleted contact automatically reassigned to client's "Deleted Contact"
4. System contacts cannot be manually deleted
5. UI displays "(Deleted Contact)" label for system-created contacts
6. Ticket detail view shows original contact name in audit history if available

---

## Epic 3: Core Ticket & Time Entry System

**Epic Goal:** Build the core ticketing functionality including ticket creation with minimal required fields, flexible time entry parsing, multiple time entries per ticket, open/closed states with re-open capability, and ticket editing workflows. This epic delivers the primary value proposition - fast, friction-free ticket logging during billable work.

### Story 3.1: Ticket Data Model & Database Schema

As a **developer**,
I want **database tables and models for storing ticket and time entry information**,
so that **the application can persist ticket data with appropriate relationships and constraints**.

#### Acceptance Criteria

1. Database migration creates `tickets` table with columns: `id`, `client_id` (FK), `contact_id` (FK), `description` (nullable), `notes` (nullable), `state` (enum: open/closed), `closed_at` (nullable), `created_at`, `updated_at`
2. Database migration creates `time_entries` table with columns: `id`, `ticket_id` (FK), `work_date`, `duration_hours` (decimal), `billable` (boolean), `created_at`, `updated_at`, `deleted_at` (nullable)
3. Foreign key constraints enforce valid client_id and contact_id references
4. Cascading rules defined for ticket deletion (cascade delete time_entries)
5. Backend models/entities created for Ticket and TimeEntry with appropriate types
6. Model validation rules defined (e.g., duration_hours > 0, work_date not future)
7. Index created on `tickets.state` for efficient filtering
8. Index created on `time_entries.work_date` for date-range queries
9. Migration runs successfully and can be rolled back

### Story 3.2: Time Entry Parsing Utility

As a **developer**,
I want **a utility function that parses flexible time input formats**,
so that **users can enter time naturally without strict format constraints** (FR9).

#### Acceptance Criteria

1. Function accepts string input and returns decimal hours or error
2. Parses hour formats: "2h", "2", "2.5h", "2.5" → 2.0, 2.0, 2.5, 2.5 hours
3. Parses minute formats: "45m", "90m" → 0.75, 1.5 hours
4. Handles combined formats: "1h30m", "1.5h" → 1.5 hours
5. Returns validation error for invalid formats: "abc", "-5", "25h" (>24 hours suspicious)
6. Function has unit tests covering all format variations
7. Function is framework-agnostic (can be reused in frontend validation)

### Story 3.3: Ticket Creation API Endpoint

As a **developer**,
I want **an API endpoint to create tickets with minimal required fields**,
so that **the frontend can support fast ticket creation** (FR1, FR2).

#### Acceptance Criteria

1. `POST /api/tickets` creates new ticket with required fields: `client_id`, `contact_id`, and at least one time entry (work_date, duration, billable flag)
2. Endpoint accepts optional fields: `description`, `notes`
3. Time entry duration parsed using flexible format utility (Story 3.2)
4. Validation ensures contact belongs to specified client (400 error if mismatch)
5. New tickets default to `state: "open"`
6. Initial time entry `work_date` defaults to current date if not specified
7. Endpoint requires authentication (401 if not logged in)
8. Returns created ticket with generated ID and confirmation (201 status)
9. Request validation returns clear error messages

### Story 3.4: Ticket Retrieval API Endpoints

As a **developer**,
I want **API endpoints to retrieve tickets and their time entries**,
so that **the frontend can display ticket lists and details**.

#### Acceptance Criteria

1. `GET /api/tickets` returns all tickets with associated client/contact names and total hours (sum of time entries)
2. `GET /api/tickets?state=open` filters tickets by state (open/closed)
3. `GET /api/tickets?client_id=X` filters tickets by client
4. `GET /api/tickets/:id` returns single ticket with full details including all time entries
5. Time entries in response include work_date, duration_hours, billable flag
6. All endpoints require authentication
7. Endpoints return appropriate HTTP status codes (200, 404)
8. Results sorted by updated_at descending (most recent first)

### Story 3.5: Ticket Update & Time Entry Management API

As a **developer**,
I want **API endpoints to update tickets and manage time entries**,
so that **users can edit ticket details and add/modify time entries** (FR2, FR8).

#### Acceptance Criteria

1. `PUT /api/tickets/:id` updates ticket description, notes, and state
2. `POST /api/tickets/:id/time-entries` adds new time entry to existing ticket
3. `PUT /api/time-entries/:id` updates existing time entry (work_date, duration, billable flag)
4. `DELETE /api/time-entries/:id` soft-deletes time entry (marks as deleted, doesn't remove from DB per NFR9)
5. Validation prevents editing time entries for locked months (return 403 with error message)
6. Ticket `updated_at` timestamp refreshed on any modification
7. All endpoints require authentication
8. Endpoints return appropriate status codes and validation errors
9. Time entry modifications tracked (updated_at timestamp)

### Story 3.6: Ticket Close & Re-open Logic

As a **developer**,
I want **API logic for closing and re-opening tickets with business rules**,
so that **tickets follow the 7-day re-open window requirement** (FR4).

#### Acceptance Criteria

1. `PUT /api/tickets/:id` with `state: "closed"` sets `closed_at` timestamp to current date/time
2. `PUT /api/tickets/:id` with `state: "open"` validates re-open eligibility (within 7 days of closed_at)
3. Re-opening ticket more than 7 days after closure returns 400 error with message: "Cannot re-open tickets closed more than 7 days ago"
4. Re-opening eligible ticket clears `closed_at` timestamp
5. Closing already-closed ticket is idempotent (no error, updates closed_at)
6. API response includes re-open eligibility flag for closed tickets
7. Logic unit tested for edge cases (exactly 7 days, timezone handling)

### Story 3.7: Ticket Creation UI

As a **user**,
I want **a fast, minimal form to create tickets**,
so that **I can log billable work in under 10 seconds** (Goal: <10 sec, target 5 sec).

#### Acceptance Criteria

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

### Story 3.8: Ticket Detail & Edit UI

As a **user**,
I want **to view and edit ticket details including time entries**,
so that **I can add descriptions and manage time entries after initial creation** (FR2, FR8).

#### Acceptance Criteria

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

### Story 3.9: Open Tickets View

As a **user**,
I want **to see all currently open tickets**,
so that **I can quickly review work in progress** (FR10).

#### Acceptance Criteria

1. Open tickets view accessible from main navigation/dashboard
2. Displays list/table of open tickets with columns: ticket ID, client name, contact name, total hours, last updated
3. List sorted by most recently updated first
4. Each ticket row clickable to navigate to ticket detail page
5. Empty state message shown when no open tickets exist
6. View loads in <2 seconds per NFR2
7. Responsive design works on mobile viewports
8. Total count of open tickets displayed in header

---

## Epic 4: Xero Integration & Invoice Generation

**Epic Goal:** Integrate with Xero API using OAuth 2.0 authentication, implement invoice generation with per-ticket line items, build pre-invoice review screen with description validation, enable invoice push to Xero, and implement time entry locking after successful invoice generation. This epic completes the end-to-end billing workflow from ticket creation through client invoicing.

### Story 4.1: Xero OAuth Configuration & Connection

As a **developer**,
I want **to configure Xero OAuth 2.0 integration and securely store credentials**,
so that **the application can authenticate with Xero API** (NFR5, NFR11).

#### Acceptance Criteria

1. Xero app created in Xero Developer Portal with OAuth 2.0 credentials (Client ID, Client Secret)
2. Backend environment variables configured for Xero credentials and callback URL
3. OAuth callback route implemented (`/api/xero/callback`) to receive authorization code
4. Token exchange logic implemented to convert authorization code to access/refresh tokens
5. Tokens stored encrypted in database (NFR5) or secure credential storage
6. Token refresh logic implemented to automatically refresh expired access tokens
7. Xero SDK/library installed and configured (official Node.js or Python SDK)
8. Connection test endpoint (`/api/xero/status`) returns connection status and authenticated organization name
9. Admin UI page to initiate Xero OAuth flow (button triggers authorization redirect)
10. Documentation or setup validation confirms "Consulting Services" product exists in connected Xero organization (NFR11)

### Story 4.2: Invoice Lock Mechanism

As a **developer**,
I want **database schema and logic to track invoice locks per month**,
so that **time entries cannot be modified after invoicing** (FR17).

#### Acceptance Criteria

1. Database migration creates `invoice_locks` table with columns: `id`, `month` (date, unique), `locked_at`, `xero_invoice_ids` (JSON array or text)
2. Backend function to check if a given month is locked (returns boolean)
3. Time entry update/delete endpoints validate month not locked before allowing modifications (403 error if locked)
4. Invoice lock creation function stores month and timestamp
5. Model/entity created for InvoiceLock with appropriate types
6. Index created on `invoice_locks.month` for fast lookup
7. Existing time entry validation updated to check lock status (Story 3.5 enhancement)
8. Unit tests cover lock validation logic and edge cases (month boundaries, timezone handling)

### Story 4.3: Pre-Invoice Review Data Aggregation

As a **developer**,
I want **backend logic to aggregate tickets by month for invoice review**,
so that **the frontend can display pre-invoice summary** (FR16).

#### Acceptance Criteria

1. API endpoint `GET /api/invoices/preview?month=YYYY-MM` returns invoice preview data
2. Response groups tickets by client with subtotals per client
3. Response includes total billable hours across all clients for the month
4. Response flags tickets missing descriptions (per FR3 requirement)
5. Calculation includes all time entries with work_date in specified month
6. Calculation sums duration_hours for billable time entries only
7. Non-billable tickets included in data with $0 amount calculated (FR15)
8. Endpoint validates month is not already locked (return lock status in response)
9. Response format structured for easy UI rendering (client grouping, line item details)
10. Endpoint requires authentication

### Story 4.4: Invoice Generation & Xero Push Logic

As a **developer**,
I want **backend logic to generate and push invoices to Xero**,
so that **monthly billing can be automated** (FR13, FR14, FR15).

#### Acceptance Criteria

1. API endpoint `POST /api/invoices/generate` accepts month parameter and initiates invoice generation
2. Endpoint validates all tickets for the month have descriptions (400 error if any missing, per FR3)
3. Endpoint validates month is not already locked (400 error if locked)
4. For each client with billable time, create Xero invoice via API
5. Invoice line items formatted as "Ticket #[ID] - [Description]" per FR14
6. Each line item references Xero "Consulting Services" product/service item and includes: description (ticket format) and quantity (duration_hours as decimal). Xero applies the configured rate and accounting mappings automatically (NFR11)
7. Non-billable tickets included as line items with quantity = hours and unit price overridden to $0 (per FR15)
8. Successful Xero push creates invoice_lock record for the month per FR17
9. Response includes Xero invoice IDs and confirmation message
10. Transaction handling: rollback invoice_lock if any Xero API call fails
11. Error handling for Xero API failures (rate limits, invalid customer ID, network errors, missing "Consulting Services" item)
12. Unit tests for invoice data transformation, integration tests with Xero sandbox

### Story 4.5: Pre-Invoice Review UI

As a **user**,
I want **to review all tickets before generating invoices**,
so that **I can verify accuracy and add missing descriptions** (FR16).

#### Acceptance Criteria

1. Pre-invoice review screen accessible from main navigation
2. Month selector allows choosing which month to review (defaults to current month)
3. Screen displays total billable hours for selected month prominently
4. Tickets grouped by client with per-client subtotals
5. Each ticket shows: ID, description, total hours, billable/non-billable status
6. Tickets missing descriptions highlighted with warning indicator
7. Inline edit capability for descriptions directly in review screen (quick-fix workflow)
8. "Generate Invoices" button visible only when all descriptions present
9. Button disabled with tooltip message if descriptions missing or month already locked
10. Screen shows lock status if month already invoiced (display-only mode)
11. Clear indication of which tickets are non-billable ($0 line items)
12. Screen loads in <2 seconds per NFR2

### Story 4.6: Invoice Generation UI & Confirmation

As a **user**,
I want **to generate and push invoices to Xero with confirmation**,
so that **I can complete monthly billing confidently** (FR13).

#### Acceptance Criteria

1. "Generate Invoices" button in pre-invoice review screen (Story 4.5) triggers generation
2. Confirmation dialog shown before invoicing: "Generate invoices for [Month]? This will lock all time entries for this month."
3. User confirms, system calls invoice generation API (Story 4.4)
4. Loading indicator shown during Xero API calls (may take several seconds)
5. Success message displayed with summary: "Generated X invoices for Y clients. Total: $Z"
6. Success message includes links to Xero invoices (if Xero provides URLs)
7. Error handling displays clear messages: missing descriptions, Xero connection errors, API failures
8. After successful generation, review screen switches to locked/read-only mode
9. "View in Xero" links provided for easy access to generated invoices
10. Action logged (optional but recommended for audit trail)

### Story 4.7: Xero Connection Management UI

As a **user**,
I want **to connect and manage my Xero integration**,
so that **I can authenticate the application with my Xero account**.

#### Acceptance Criteria

1. Settings or Admin page includes Xero connection section
2. If not connected: "Connect to Xero" button initiates OAuth flow
3. OAuth flow redirects to Xero login/authorization page
4. After authorization, user redirected back to app with success message
5. If connected: Display connection status, organization name, and last sync timestamp
6. "Disconnect" button available to revoke Xero connection
7. Connection test button to verify credentials still valid
8. Error messages displayed for connection failures (invalid credentials, network errors)
9. Help text explains why Xero connection is required

---

## Epic 5: Views, Search & Historical Access

**Epic Goal:** Implement comprehensive navigation and discovery features including a unified dashboard displaying open and recently closed tickets, historical ticket search functionality, and complete navigation workflows. This epic enhances usability and provides easy access to all ticket data for billing disputes, reference, and workflow management.

### Story 5.1: Dashboard Layout & Navigation Structure

As a **user**,
I want **a central dashboard as my landing page after login**,
so that **I can quickly access all key areas of the application**.

#### Acceptance Criteria

1. Dashboard page serves as default landing page after successful login
2. Primary navigation menu/header visible on all pages with links to: Dashboard, Create Ticket, Clients, Contacts, Invoices, Settings
3. Dashboard displays current month billable hours total prominently (real-time calculation)
4. Visual indicator shows if current month hours within expected range (85-100 hours)
5. Quick action buttons prominently placed: "Create Ticket", "Review Invoices"
6. Dashboard responsive on mobile viewports with collapsible navigation
7. Active nav item highlighted to show current location
8. Page loads in <2 seconds per NFR2
9. Clean, professional design per UI Design Goals (minimal aesthetic)

### Story 5.2: Recently Closed Tickets View

As a **user**,
I want **to see tickets I've closed in the last 7 days**,
so that **I can quickly re-open them if needed** (FR4, FR11).

#### Acceptance Criteria

1. Dashboard includes "Recently Closed Tickets" section showing tickets closed within last 7 days
2. Section displays ticket ID, client name, description, closed date, total hours
3. Each ticket row shows "Re-open" button (Story 3.6 re-open logic)
4. Re-open button triggers re-open action with confirmation
5. Section shows empty state message if no recently closed tickets
6. Section limited to 10 most recent closed tickets with "View All" link if more exist
7. Clicking ticket row navigates to ticket detail page
8. Closed tickets older than 7 days do not show re-open button
9. Section updates in real-time when tickets closed or re-opened

### Story 5.3: Open Tickets Dashboard Integration

As a **user**,
I want **to see my open tickets on the dashboard**,
so that **I have visibility of current work** (FR10).

#### Acceptance Criteria

1. Dashboard includes "Open Tickets" section showing all currently open tickets
2. Section displays ticket ID, client name, contact name, total hours, last updated date
3. Tickets sorted by most recently updated first
4. Each ticket row clickable to navigate to ticket detail
5. Section shows empty state message if no open tickets
6. Total count of open tickets displayed in section header
7. Section includes "View All" link to dedicated open tickets page if list is long (>20 items)
8. Pagination or "show more" functionality if open ticket count exceeds 20
9. Quick actions available: "Edit" icon/button for inline navigation to ticket detail

### Story 5.4: Historical Ticket Search API

As a **developer**,
I want **backend API endpoints for searching historical closed tickets**,
so that **users can find past tickets for reference** (FR12).

#### Acceptance Criteria

1. `GET /api/tickets/search` endpoint accepts query parameters: `keyword`, `client_id`, `date_from`, `date_to`, `state`
2. Keyword search matches against ticket description, notes, and client/contact names (case-insensitive)
3. Client filter restricts results to specific client
4. Date range filter searches by ticket `created_at` or time entry `work_date` (configurable)
5. State filter allows searching open, closed, or all tickets
6. Results return ticket summary: ID, client, contact, description, state, created date, total hours
7. Results sorted by relevance (keyword match) or date (most recent first) depending on query type
8. Pagination support: `limit` and `offset` parameters for large result sets
9. Endpoint requires authentication
10. Empty search (no parameters) returns recent tickets (last 30 days, max 100 results)

### Story 5.5: Historical Ticket Search UI

As a **user**,
I want **to search for past tickets by keyword, client, or date range**,
so that **I can find historical work for billing disputes or reference** (FR12).

#### Acceptance Criteria

1. Search page accessible from main navigation ("Search" or "History")
2. Search form includes fields: keyword (text input), client filter (dropdown), date range (from/to date pickers), state filter (open/closed/all)
3. Search executes on button click or form submission
4. Results displayed in table with columns: ticket ID, client, description, date, total hours, state
5. Each result row clickable to navigate to ticket detail
6. Empty state message shown when no results found
7. Loading indicator shown during search execution
8. Results paginated if more than 50 matches
9. "Clear Filters" button resets search form
10. Search preserves filters in URL query params for bookmarking/sharing
11. Advanced search option: billable/non-billable filter
12. Page loads and search executes in <1 second per NFR3

### Story 5.6: Dashboard Quick Stats Widget

As a **user**,
I want **to see at-a-glance statistics on my dashboard**,
so that **I can quickly understand my current workload and billing status**.

#### Acceptance Criteria

1. Dashboard displays summary statistics widget with: current month billable hours, open ticket count, recently closed ticket count (last 7 days)
2. Current month hours display with visual indicator: green if within 85-100 hour range, yellow if below 85, red if above 100
3. Widget shows comparison to previous month: "92 hours (↑8 from last month)"
4. Widget displays last invoice generation date and month invoiced
5. Quick link to pre-invoice review from widget if current month not yet invoiced
6. Widget updates in real-time when tickets created/closed or time entries added
7. Widget collapsible/expandable on mobile viewports
8. All calculations perform efficiently (<500ms) per NFR1

### Story 5.7: Enhanced Navigation & Breadcrumbs

As a **user**,
I want **clear navigation context throughout the application**,
so that **I always know where I am and can easily navigate back**.

#### Acceptance Criteria

1. Breadcrumb navigation displayed on all pages below header: "Dashboard > Clients > Edit Client"
2. Each breadcrumb segment clickable to navigate to parent pages
3. Current page title displayed prominently on every page
4. Back button behavior respects navigation history (browser back works correctly)
5. Mobile navigation uses hamburger menu pattern for space efficiency
6. Keyboard navigation support: Tab through nav items, Enter to activate
7. "Skip to main content" link for accessibility (hidden but keyboard accessible)
8. Logout link visible in header/nav menu on all pages

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 92%

**MVP Scope Appropriateness:** Just Right - The scope is tightly focused on the core billing workflow with clear boundaries between MVP and Phase 2 features.

**Readiness for Architecture Phase:** Ready - The PRD provides sufficient detail, clear requirements, and appropriate technical guidance for the Architect to begin detailed design.

**Most Critical Concerns:** All resolved - Xero dependency documented (NFR11), client/contact deletion rules defined (FR19, FR20, Story 2.7), and timezone strategy specified (Technical Assumptions).

### Category Analysis Table

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | PASS    | None - clear problem statement with user research from brief |
| 2. MVP Scope Definition          | PASS    | None - explicit scope boundaries, rationale documented |
| 3. User Experience Requirements  | PASS    | None - clear UX vision, interaction paradigms, core screens |
| 4. Functional Requirements       | PASS    | None - 20 FRs covering all MVP features, testable and unambiguous |
| 5. Non-Functional Requirements   | PASS    | None - 11 NFRs covering performance, security, reliability, Xero dependency |
| 6. Epic & Story Structure        | PASS    | None - logical sequencing, appropriate sizing, clear dependencies |
| 7. Technical Guidance            | PASS    | None - clear tech stack recommendations, architecture decisions, timezone strategy |
| 8. Cross-Functional Requirements | PASS    | Xero dependency in NFR11, cascade delete rules in FR19/FR20 |
| 9. Clarity & Communication       | PASS    | None - consistent terminology, well-structured, comprehensive |

### Validation Summary

✅ **READY FOR ARCHITECT**

The PRD and epics are comprehensive, properly structured, and ready for architectural design. All high-priority issues have been resolved. The epic structure provides clear sequencing, stories are appropriately sized for AI agent execution, and acceptance criteria are testable and complete.

**Strengths:**
- Clear problem-solution fit derived from comprehensive brief
- Excellent requirement traceability (all FRs map to brief's MVP scope)
- Logical epic sequencing with clear dependencies
- Appropriate MVP scope with well-defined Phase 2 boundaries
- Detailed acceptance criteria enabling confident implementation
- Realistic timeline with built-in buffer (4-6 weeks, 35 stories)

**Timeline Assessment:**
- 5 Epics, 36 total stories
- Estimated at 2-4 hours per story (AI agent session size)
- Total: 72-144 hours of focused development
- Target timeline: 4-6 weeks (160-240 hours at 40hr/week)
- Assessment: **Realistic** with buffer for integration testing, bug fixes, and Xero API learning curve

---

## Next Steps

### UX Expert Prompt

Review the PRD's User Interface Design Goals section and create detailed wireframes/mockups for the following core screens:

1. Dashboard (home page with open tickets, recently closed, quick stats)
2. Ticket creation form (minimal, speed-optimized)
3. Pre-invoice review screen (grouped by client, inline editing)
4. Ticket detail/edit view

Focus on the "fast-form philosophy" and ensuring <10 second ticket creation workflow. Provide interaction specifications for inline editing and progressive disclosure patterns.

### Architect Prompt

Based on this PRD, create a detailed technical architecture document including:

1. Complete database schema with tables, relationships, indexes, and constraints
2. API endpoint specifications (request/response formats)
3. Xero integration architecture (OAuth flow, token management, invoice generation)
4. Frontend state management approach
5. Soft delete pattern implementation
6. Invoice lock mechanism and transaction handling
7. Time entry parsing and validation logic
8. Deployment architecture and CI/CD pipeline design

Begin with a technical spike on Xero API integration (OAuth flow, "Consulting Services" item usage, invoice creation with line items) using Xero sandbox environment. Document any API limitations or constraints discovered.