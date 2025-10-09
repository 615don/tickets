# Outlook Web Add-in for Email-to-Ticket Conversion Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable instant ticket creation from Outlook emails without context switching, capturing 100% of billable time
- Reduce ticket creation time from 2-3 minutes to under 30 seconds through intelligent auto-matching and pre-filled forms
- Eliminate forgotten billable work by embedding ticket capture directly in the email workflow
- Provide contextual awareness of client/contact information without leaving Outlook
- Increase revenue capture by $5,000-10,000 annually through complete billable time tracking
- Reduce administrative overhead by 20-30 hours per year in ticket documentation time

### Background Context

Solo IT consultants performing hourly billing work primarily through email face a critical friction problem: switching from Outlook to a separate ticketing system to log billable time introduces overhead that leads to forgotten tickets and lost revenue. Current third-party solutions are bloated with team-focused features (workflow management, assignments, priorities) that add complexity rather than solving the core problem of fast, frictionless billing documentation. This PRD addresses that gap by specifying an Outlook Web Add-in that brings ticket creation directly into the email environment through a persistent sidebar interface with intelligent contact/client matching, minimal required fields, and optional AI assistance. The solution meets consultants where they already work rather than forcing adoption of new tools.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-08 | 1.0 | Initial PRD created from Project Brief | John (PM Agent) |

---

## Requirements

### Functional Requirements

**FR1:** Add-in shall load as a persistent task pane in Outlook Web Access that remains open while navigating through emails.

**FR2:** Add-in shall automatically detect and populate contact/client information when an email is selected based on sender email address.

**FR3:** Add-in shall match contacts by exact email address lookup against the contacts database as the primary matching strategy.

**FR4:** Add-in shall fall back to domain-based client matching when email address does not match an existing contact, using the sender's email domain against client domain lists.

**FR5:** Add-in shall display a disambiguation UI when a contact exists at multiple clients, allowing the user to select the correct client context.

**FR6:** Add-in shall automatically create a new contact record when the sender's domain matches a client but the specific email address doesn't exist, pre-filling name from email display name and email address (editable before ticket creation).

**FR7:** Add-in shall display a warning indicator when the matched client is marked as inactive, but allow ticket creation to proceed.

**FR8:** Add-in shall automatically clear and refresh the form when the user selects a different email in Outlook.

**FR9:** Add-in shall provide a manual ticket creation form with fields: Client (dropdown), Contact (dropdown with auto-selection based on matching), Time (default 0.03 hours / 2 minutes), Description (optional), Notes (optional), and "Mark as closed immediately" checkbox.

**FR10:** Add-in form fields shall be pre-filled based on email matching but remain fully editable before ticket submission.

**FR11:** Add-in shall submit tickets to the existing ticketing system REST API using the same endpoints as the web application.

**FR12:** Add-in shall support received emails only in MVP, matching based on the sender's email address.

**FR13:** Add-in shall require authentication with the ticketing system before allowing ticket creation operations.

**FR14:** Add-in shall handle authentication errors gracefully, prompting the user to log in via the web app if session is invalid.

**FR15:** Add-in shall work on macOS using Outlook Web Access in modern browsers (Chrome, Safari, Edge).

### Non-Functional Requirements

**NFR1:** Add-in sidebar shall load and render within 2 seconds of Outlook launch.

**NFR2:** Contact/client matching shall complete within 500ms of email selection.

**NFR3:** Ticket creation submission shall complete within 1 second under normal operating conditions.

**NFR4:** Add-in shall communicate with ticketing system API over HTTPS only.

**NFR5:** Add-in shall not store email content on the backend; email data used only for transient AI processing if user explicitly triggers AI generation.

**NFR6:** Add-in shall handle network failures gracefully with clear error messages and retry capabilities.

**NFR7:** Add-in manifest shall be sideload-compatible for development and testing (no Office Store publishing required for MVP).

**NFR8:** Add-in shall be compatible with modern browsers supporting Office.js API (Chrome, Safari, Edge - latest 2 major versions).

---

## User Interface Design Goals

### Overall UX Vision

The add-in prioritizes **invisible speed** - the interface should feel so fast and intuitive that ticket creation becomes automatic muscle memory rather than a conscious task. The primary UX goal is zero perceived friction between reading an email and logging billable time. The sidebar should feel like a natural extension of Outlook, not a foreign application embedded within it. Secondary UX goals include confidence through clear visual feedback (matched client/contact displayed prominently) and graceful degradation when matching fails (easy manual selection fallback).

### Key Interaction Paradigms

- **Persistent context awareness:** Sidebar updates automatically on email selection without user action required
- **Progressive disclosure of complexity:** Simple case (exact match) shows minimal UI; edge cases (disambiguation, new contact) progressively reveal additional options
- **Pre-filled but editable philosophy:** Auto-matching provides speed, but all fields remain editable for edge case handling
- **Visual feedback loops:** Clear indicators for matching status (✓ matched, ⚠ inactive client, ? no match)
- **Keyboard-first design:** Tab navigation through form, Enter to submit - optimized for power users processing high email volume

### Core Screens and Views

1. **Sidebar Default State (No Email Selected)** - Prompt to select an email or display last-created ticket confirmation
2. **Sidebar with Matched Contact/Client** - Auto-populated form showing matched client and contact with editable ticket fields
3. **Sidebar with Domain Match Only (New Contact)** - Form showing matched client with editable new contact fields and ticket creation
4. **Sidebar with Disambiguation Required** - Contact matched to multiple clients, display client selection UI before showing ticket form
5. **Sidebar with No Match** - Manual mode with empty dropdowns for client/contact selection
6. **Ticket Creation Success State** - Confirmation message with created ticket ID, form clears automatically
7. **Error/Authentication Required State** - Clear messaging prompting user to authenticate via web app

### Accessibility: None

No formal WCAG compliance required for MVP. Standard keyboard navigation and screen reader compatibility through semantic HTML is sufficient. The add-in uses Office.js within Outlook's accessibility context, inheriting Outlook's accessibility features.

### Branding

**Alignment with main ticketing system:** Adopt the same clean, professional, minimal aesthetic established in the web app. Visual consistency creates trust that the add-in is an official extension rather than third-party integration.

**Sidebar-specific considerations:**
- Constrained width (typically 300-400px) requires aggressive information density optimization
- Generous vertical whitespace to create breathing room in narrow layout
- Prominent visual indicators for matching status (color-coded badges: green for match, yellow for warning, gray for manual)
- Minimal decorative elements - every pixel serves functional purpose

**No brand colors defined** - inherit from Office/Outlook theme or use neutral blue/gray palette matching web app.

### Target Device and Platforms: Web Responsive (Outlook Web Access Only)

**Primary platform:** macOS running Outlook Web Access in Chrome or Safari
**Browser compatibility:** Modern browsers supporting Office.js (Chrome, Safari, Edge - latest 2 versions)
**Not supported:** Native Outlook desktop clients, Outlook mobile apps, Windows (nice-to-have but not MVP requirement)

The add-in interface optimizes for sidebar task pane dimensions (fixed width, variable height). No mobile-specific responsive breakpoints needed since Outlook Web on mobile doesn't support add-ins in the same way.

---

## Technical Assumptions

### Repository Structure: Monorepo

Add-in code will live in `/outlook-addin` directory within the existing monorepo alongside `/frontend` and `/backend`.

**Structure:**
```
/frontend       (existing React web app)
/backend        (existing Express API)
/outlook-addin  (new Office Add-in)
  /src          (add-in sidebar UI code)
  /manifest     (Office Add-in manifest XML)
```

**Rationale:** Keeps all related code together, simplifies cross-cutting changes (e.g., contact matching logic updates affect both web app and add-in), enables code sharing via shared utilities, and maintains single deployment pipeline. The add-in will be a separate build target but lives in the same repository for easier maintenance.

### Service Architecture

**Office Add-in Task Pane Architecture** communicating with existing backend API:

- **Add-in Frontend:** Standalone HTML/CSS/JS bundle served from `/outlook-addin` build output, loaded within Outlook Web's iframe sandbox
- **Backend API:** Existing Express REST API extended with add-in-specific endpoints (`/api/contacts/match-email`, `/api/clients/match-domain`)
- **Authentication:** Shared session/token-based auth between web app and add-in (research required - may need CORS configuration or token-based approach if session cookies don't cross iframe boundary)
- **Manifest Hosting:** Manifest XML file hosted at public URL for Office Add-in registration

**Not using separate microservice** - add-in integrates with existing monolith. All ticket creation uses same backend logic as web app.

**Rationale:** Reusing existing infrastructure minimizes development time. The add-in is simply another client of the existing API, similar to how a mobile app would consume the same endpoints. No new business logic needed - only new matching endpoints for email/domain lookup.

### Testing Requirements

**Manual testing for MVP:**
- Manual QA of add-in installation/sideloading in Outlook Web
- Manual testing of email selection and auto-matching workflows
- Browser compatibility spot-checking (Chrome, Safari on macOS)
- Edge case testing: disambiguation, new contact creation, no match scenarios

**Unit tests for matching logic:**
- Email-to-contact lookup function
- Domain-to-client matching algorithm
- Disambiguation logic (contact exists at multiple clients)

**No E2E tests for MVP** - Office Add-in E2E testing requires complex Outlook automation, not justified for 3-4 week timeline.

**Rationale:** Testing strategy mirrors main ticketing system's pragmatic approach (unit tests for critical logic, manual testing for UI). Add-in is read-heavy (matching lookups) with single write operation (ticket creation via existing tested endpoint).

### Additional Technical Assumptions and Requests

**Add-in Frontend Framework:** **React** (matching existing frontend stack)
- Reuse React expertise and potentially share components with web app
- TypeScript for type safety (matching existing frontend)
- Vite for bundling (consistent with web app build tooling)
- **Lightweight bundle requirement:** Add-in must load quickly (<2 seconds per NFR1), requiring aggressive tree-shaking and code splitting

**Office.js Integration:**
- Office.js library loaded from Microsoft CDN (required for all Office Add-ins)
- Add-in uses Office.js Mail API to access email metadata (sender, display name, subject)
- Task pane context (persistent sidebar) vs. message compose context
- **Research spike required:** Validate Office.js provides access to sender email and display name; confirm task pane can stay open across email selections

**New Backend API Endpoints:**
- `GET /api/contacts/match-email?email={email}` - Returns contact(s) matching email address with associated client(s)
- `GET /api/clients/match-domain?domain={domain}` - Returns client(s) matching email domain
- `POST /api/contacts/create-from-email` - Creates new contact with email/name from add-in (may extend existing `/api/contacts` endpoint)

**Authentication Strategy (requires research):**
- **Option 1:** Session cookie sharing - if Office Add-in iframe can access same session cookies as web app (requires SameSite=None, Secure)
- **Option 2:** Token-based auth - web app issues JWT/token, add-in passes in Authorization header
- **Preferred approach:** Attempt session sharing first (simpler UX), fall back to token-based if iframe sandboxing prevents cookie access

**CORS Configuration:**
- Backend must allow CORS requests from add-in's hosted domain
- Add-in manifest specifies allowed domains for Office.js communication

**Add-in Manifest Requirements:**
- XML manifest file defining add-in metadata, permissions, task pane URL
- Hosted at publicly accessible HTTPS URL for sideloading
- Requests Mail.Read permission for accessing email content
- Specifies minimum Office.js API version required

**Deployment:**
- Add-in static files (HTML/JS/CSS) hosted on existing Railway deployment or separate static hosting (GitHub Pages, Netlify)
- Manifest XML file must be publicly accessible for installation
- Backend API already hosted on Railway, no changes to hosting infrastructure

**Domain-to-Client Matching Logic:**
- Leverage existing `client_domains` table from main ticketing system (Epic 2, Story 2.1 from main PRD)
- Matching extracts domain from email address (`user@example.com` → `example.com`) and queries `client_domains` table
- **Assumption:** Domain matching infrastructure already exists in database schema; if not, requires backend implementation before add-in development

**Contact Schema:**
- Assumes `contacts.email` is unique within a client, but same email can exist across multiple clients
- Disambiguation UI needed when email matches contacts at 2+ clients

**Development Workflow:**
- Local development: Add-in served via `npm run dev` (Vite dev server with HTTPS using self-signed cert - Office Add-ins require HTTPS)
- Manifest points to localhost during development for fast iteration
- Production: Manifest points to Railway-hosted add-in URL

**Browser Compatibility:**
- Target: Modern browsers supporting ES6+, Fetch API, async/await
- Office.js handles some polyfilling, but add-in should use modern JavaScript features
- No IE11 support required (matches main app's NFR6)

**Critical Technical Unknowns (require research spike):**
1. Can Office Add-in task pane share session cookies with main web app for seamless auth?
2. Does Office.js Mail API provide sufficient email metadata (sender, display name) in Outlook Web?
3. Can task pane persist across email selections, or does it reload/reset?
4. Are there Office.js API rate limits or quota restrictions for email access?

---

## Epic List

**Epic 1: Technical Discovery & Office Add-in Foundation**
*Research Office.js capabilities and authentication options, establish add-in development environment, create manifest, and deploy a "hello world" add-in to validate the technical foundation.*

**Epic 2: Backend Contact/Client Matching Infrastructure**
*Implement backend API endpoints for email-to-contact and domain-to-client matching, leveraging existing database schema and creating new lookup endpoints required by the add-in.*

**Epic 3: Add-in Sidebar UI & Email Context Detection**
*Build React-based add-in sidebar that detects email selection, extracts sender metadata using Office.js, and displays email context to the user.*

**Epic 4: Contact/Client Matching & Auto-Population**
*Integrate sidebar with matching APIs to automatically populate client/contact fields based on email sender, handling exact matches, domain matches, and manual fallback scenarios.*

**Epic 5: Ticket Creation Form & Submission**
*Implement ticket creation form with pre-filled fields, new contact creation workflow, and ticket submission via existing API, completing the end-to-end workflow.*

---

## Epic 1: Technical Discovery & Office Add-in Foundation

**Epic Goal:** Validate the technical feasibility of Office Add-in development by researching Office.js Mail API capabilities, authentication strategies, and manifest requirements. Establish a working development environment and deploy a minimal "hello world" add-in to Outlook Web Access, proving the foundation before building features.

### Story 1.1: Office.js API Research & Capability Validation

As a **developer**,
I want **to research and document Office.js Mail API capabilities**,
so that **I can confirm the API provides sufficient email metadata for contact/client matching**.

#### Acceptance Criteria

1. Office.js Mail API documentation reviewed for Outlook Web Add-in task pane context
2. Confirmed Office.js provides access to: sender email address, sender display name, email subject
3. Validated task pane can persist across email selections (or documented reload behavior)
4. Documented any API limitations: rate limits, permissions required, unsupported scenarios
5. Tested Mail API in browser console or simple HTML page to verify basic functionality
6. Research findings documented in `/outlook-addin/docs/office-api-research.md`
7. Decision documented: task pane feasible for MVP requirements or show-stopper issues identified

### Story 1.2: Authentication Strategy Research & Decision

As a **developer**,
I want **to research authentication options for Office Add-in communicating with existing backend API**,
so that **I can choose the best approach for seamless user experience**.

#### Acceptance Criteria

1. Researched session cookie sharing between web app and add-in task pane iframe
2. Tested if `SameSite=None; Secure` cookies accessible from Office Add-in context
3. Researched token-based authentication alternatives (JWT, OAuth implicit flow)
4. Documented pros/cons of each approach (UX friction, implementation complexity, security)
5. Decision made and documented: session sharing OR token-based auth
6. If session sharing: confirmed backend CORS configuration required
7. If token-based: defined token generation/storage mechanism
8. Authentication strategy documented in `/outlook-addin/docs/auth-strategy.md`

### Story 1.3: Add-in Project Setup & Development Environment

As a **developer**,
I want **to scaffold the Outlook Add-in project with React and TypeScript**,
so that **I have a proper development environment for building the sidebar UI**.

#### Acceptance Criteria

1. Created `/outlook-addin` directory in monorepo root
2. Initialized React + TypeScript project using Vite
3. Configured Vite dev server to run with HTTPS (self-signed certificate for local development)
4. Added Office.js CDN script to HTML template
5. Created basic project structure: `/src/components`, `/src/utils`, `/src/types`
6. Installed dependencies: React, TypeScript, Office.js type definitions (@types/office-js)
7. Created npm scripts: `npm run dev` (HTTPS dev server), `npm run build` (production bundle)
8. Verified dev server accessible at `https://localhost:3000` (or configured port)
9. Updated root `.gitignore` to exclude add-in build artifacts
10. README.md created with setup instructions for add-in development

### Story 1.4: Office Add-in Manifest Creation

As a **developer**,
I want **to create an Office Add-in manifest XML file**,
so that **the add-in can be sideloaded into Outlook Web Access**.

#### Acceptance Criteria

1. Created manifest XML file at `/outlook-addin/manifest/outlook-addin-manifest.xml`
2. Manifest includes required fields: ID (UUID), version, provider name, display name, description
3. Manifest specifies task pane source URL pointing to localhost HTTPS dev server
4. Manifest requests Mail.Read permission for accessing email metadata
5. Manifest specifies supported Outlook hosts: Outlook Web Access (desktop)
6. Manifest includes icon URLs (placeholder icons acceptable for MVP)
7. Manifest validates against Office Add-in schema (use Office Add-in Validator tool)
8. Created npm script to generate production manifest with Railway hosted URL
9. Documentation added: how to sideload manifest in Outlook Web for testing

### Story 1.5: Hello World Add-in Implementation & Sideloading

As a **developer**,
I want **to build a minimal "hello world" add-in that displays in Outlook Web**,
so that **I can validate the entire development-to-deployment pipeline**.

#### Acceptance Criteria

1. React component created displaying "Hello from Outlook Add-in" in sidebar
2. Office.js initialization code implemented: `Office.onReady()` callback
3. Add-in detects Outlook host and displays host information (Outlook Web, version)
4. Sidebar renders successfully when add-in loaded in Outlook Web
5. Add-in sideloaded successfully in Outlook Web Access using manifest file
6. Task pane opens and displays hello world UI
7. Verified task pane persists when navigating between emails (or documented reload behavior)
8. No console errors or Office.js API errors during load
9. Screenshot captured of working add-in in Outlook Web for documentation

### Story 1.6: Production Deployment & Manifest Hosting

As a **developer**,
I want **to deploy the add-in to production hosting and publish the manifest**,
so that **the add-in can be installed from a public URL**.

#### Acceptance Criteria

1. Add-in production build created using `npm run build`
2. Static files deployed to Railway (alongside existing backend) or separate static host (Netlify/GitHub Pages)
3. Production manifest XML updated with public HTTPS URL
4. Manifest hosted at publicly accessible URL (e.g., `https://tickets.railway.app/outlook-addin/manifest.xml`)
5. Sideloaded add-in from production manifest successfully in Outlook Web
6. Task pane loads from production URL (not localhost)
7. Verified HTTPS certificate valid (no browser security warnings)
8. Updated documentation with production installation instructions
9. Production URL returns correct MIME type for manifest (application/xml or text/xml)

---

## Epic 2: Backend Contact/Client Matching Infrastructure

**Epic Goal:** Extend the existing Express backend with new API endpoints to support email-to-contact and domain-to-client matching. Build the lookup and matching logic that powers the add-in's intelligent auto-population feature, reusing the existing database schema and domain infrastructure.

### Story 2.1: Email-to-Contact Matching API Endpoint

As a **developer**,
I want **an API endpoint that looks up contacts by email address**,
so that **the add-in can find existing contacts matching email senders**.

#### Acceptance Criteria

1. `GET /api/contacts/match-email?email={email}` endpoint created
2. Endpoint queries `contacts` table for exact email match (case-insensitive)
3. Response includes matched contact(s) with fields: id, name, email, client_id, client name
4. If contact exists at multiple clients, response includes all matches (array)
5. If no contact found, response returns 200 with empty array (not 404)
6. Endpoint requires authentication (401 if not logged in)
7. Email parameter validated (basic email format check)
8. Query excludes soft-deleted contacts (contacts.deleted_at IS NULL)
9. Unit tests cover: exact match, multiple clients, no match, invalid email format
10. Endpoint manually tested using curl or Postman

### Story 2.2: Domain-to-Client Matching API Endpoint

As a **developer**,
I want **an API endpoint that looks up clients by email domain**,
so that **the add-in can match emails to clients when contact doesn't exist**.

#### Acceptance Criteria

1. `GET /api/clients/match-domain?domain={domain}` endpoint created
2. Endpoint queries `client_domains` table for exact domain match
3. Response includes matched client(s) with fields: id, company_name, domains (array)
4. If domain matches multiple clients, response includes all matches (array)
5. If no client found, response returns 200 with empty array
6. Endpoint requires authentication
7. Domain parameter validated (basic domain format check, e.g., no @symbols)
8. Query only returns active clients (or includes `is_active` flag in response)
9. Unit tests cover: exact match, multiple clients, no match, invalid domain
10. Endpoint manually tested

### Story 2.3: Domain Extraction Utility Function

As a **developer**,
I want **a utility function that extracts domain from email address**,
so that **both frontend and backend can consistently parse email domains**.

#### Acceptance Criteria

1. Function created: `extractDomain(email: string): string | null`
2. Extracts domain from email: `user@example.com` → `example.com`
3. Handles edge cases: subdomains (`user@mail.example.com` → `mail.example.com`), uppercase, whitespace
4. Returns null for invalid email formats (no @ symbol, empty string)
5. Function is pure (no side effects) and framework-agnostic
6. Unit tests cover: standard email, subdomain, uppercase, invalid formats, edge cases
7. Function exported from shared utility module accessible to both frontend and backend
8. TypeScript type definitions included

### Story 2.4: Client Inactive Warning Data

As a **developer**,
I want **matching API responses to include client active status**,
so that **the add-in can display warnings for inactive clients**.

#### Acceptance Criteria

1. Assuming `clients` table has `is_active` boolean column (verify schema)
2. `match-email` endpoint response includes `client.is_active` flag
3. `match-domain` endpoint response includes `client.is_active` flag
4. If `is_active` column doesn't exist: add database migration to create it (default true)
5. Updated unit tests to verify `is_active` flag in responses
6. API documentation updated with response schema including `is_active` field

### Story 2.5: Matching Logic Unit Tests

As a **developer**,
I want **comprehensive unit tests for matching logic**,
so that **edge cases are handled correctly**.

#### Acceptance Criteria

1. Unit tests for email-to-contact matching: exact match, case-insensitive, multiple clients, no match
2. Unit tests for domain-to-client matching: exact match, subdomain variations, multiple clients, no match
3. Unit tests for domain extraction: standard formats, edge cases, invalid inputs
4. Unit tests verify soft-deleted contacts excluded from matches
5. Unit tests verify inactive clients included in results with flag
6. Tests use test database or mocked database queries (no production DB dependency)
7. All tests pass successfully
8. Code coverage for matching logic >80%

---

## Epic 3: Add-in Sidebar UI & Email Context Detection

**Epic Goal:** Build the React-based sidebar user interface that initializes when Outlook loads, detects when the user selects an email, extracts sender metadata using Office.js Mail API, and displays the email context to provide visual feedback that matching is occurring.

### Story 3.1: Sidebar Layout & Basic UI Structure

As a **developer**,
I want **a responsive sidebar layout component**,
so that **the add-in has a clean UI foundation matching the design goals**.

#### Acceptance Criteria

1. React component `Sidebar.tsx` created as main layout wrapper
2. Layout optimized for narrow width (300-400px typical task pane size)
3. Header section displays add-in branding/title
4. Main content area for dynamic content (email context, forms)
5. Footer section for status messages or help links (optional)
6. Styling uses Tailwind CSS (consistent with main app)
7. Responsive to task pane height changes (scrollable content)
8. Component renders without errors in Outlook Web task pane
9. Basic loading state UI created for asynchronous operations

### Story 3.2: Office.js Email Selection Event Listener

As a **developer**,
I want **to detect when the user selects a different email in Outlook**,
so that **the add-in can respond to email changes**.

#### Acceptance Criteria

1. Office.js `Office.context.mailbox.addHandlerAsync` implemented for item selection event
2. Event listener registered on add-in initialization (in `Office.onReady()`)
3. Event handler function extracts current email item: `Office.context.mailbox.item`
4. React state updated when new email selected (triggers re-render)
5. Event listener handles edge case: no email selected (initial load state)
6. Event listener handles rapid email switching (debouncing if needed)
7. Console logging confirms event fires when emails selected during testing
8. Verified task pane updates when switching between received emails

### Story 3.3: Email Metadata Extraction

As a **developer**,
I want **to extract sender email and display name from selected email**,
so that **the add-in has data for contact/client matching**.

#### Acceptance Criteria

1. Office.js API calls extract sender data: `item.from.emailAddress`, `item.from.displayName`
2. Email metadata stored in React state: `{ senderEmail: string, senderName: string }`
3. Handles asynchronous Office.js API calls (callbacks or Promises)
4. Handles edge cases: sender data missing/null, email without sender
5. Extracts email subject for future use (optional display): `item.subject`
6. TypeScript types defined for email metadata structure
7. Extraction logic abstracted into custom React hook: `useEmailContext()`
8. Unit tests (if possible) or manual testing confirms correct data extraction

### Story 3.4: Email Context Display Component

As a **user**,
I want **to see the sender's name and email displayed in the sidebar**,
so that **I know the add-in detected the email I'm viewing**.

#### Acceptance Criteria

1. React component `EmailContext.tsx` displays sender information
2. Shows sender display name prominently
3. Shows sender email address (smaller text, secondary styling)
4. Shows email subject (optional, truncated if long)
5. Component updates automatically when different email selected
6. Loading state displayed while extracting metadata (spinner or skeleton)
7. Empty state displayed when no email selected: "Select an email to create a ticket"
8. Visual design aligns with UI Design Goals (clean, minimal, generous whitespace)
9. Component tested in Outlook Web with various email types

### Story 3.5: Sidebar State Management

As a **developer**,
I want **centralized state management for sidebar data**,
so that **components can share email context and matching results**.

#### Acceptance Criteria

1. React Context or state management solution implemented (React Context, Zustand, or React Query)
2. Global state includes: email context (sender, subject), matching results, loading states
3. State accessible via hooks in any component
4. State updates trigger appropriate component re-renders
5. State persists during sidebar lifecycle (until email selection changes)
6. Clear state separation: email context vs. matching results vs. form data
7. TypeScript types for all state shapes
8. State management pattern documented for future development

---

## Epic 4: Contact/Client Matching & Auto-Population

**Epic Goal:** Integrate the sidebar with backend matching APIs to automatically identify contacts and clients based on email senders. Implement the matching hierarchy (exact email match → domain match → manual fallback) and handle edge cases like disambiguation and inactive clients, providing clear visual feedback for matching status.

### Story 4.1: Email-to-Contact Matching Integration

As a **developer**,
I want **the sidebar to call the match-email API when an email is selected**,
so that **existing contacts are automatically identified**.

#### Acceptance Criteria

1. API client function created: `matchContactByEmail(email: string)`
2. Function calls `GET /api/contacts/match-email` endpoint
3. Function handles authentication (session cookies or token in header)
4. React hook or effect triggers API call when email context changes
5. Matching results stored in sidebar state
6. Loading state displayed during API call (spinner in email context area)
7. Error handling for API failures (network error, 401 unauthorized)
8. API call debounced if email selection changes rapidly
9. Unit tests for API client function (mocked fetch)

### Story 4.2: Domain-to-Client Fallback Matching

As a **developer**,
I want **the sidebar to fall back to domain matching when email match fails**,
so that **clients are identified even for unknown contacts**.

#### Acceptance Criteria

1. Domain extracted from sender email using `extractDomain()` utility
2. If `matchContactByEmail` returns empty array, trigger `matchClientByDomain(domain)` API call
3. API client function created: `matchClientByDomain(domain: string)`
4. Function calls `GET /api/clients/match-domain` endpoint
5. Domain matching results stored in sidebar state alongside contact matching results
6. Matching hierarchy enforced: exact match takes precedence over domain match
7. Both API calls happen sequentially: email match first, then domain match if needed
8. Error handling for domain matching failures
9. Unit tests for fallback logic

### Story 4.3: Matching Status Visual Feedback

As a **user**,
I want **clear visual indicators showing matching status**,
so that **I understand whether the add-in found my contact/client**.

#### Acceptance Criteria

1. Visual indicator displayed in email context component: matched (✓ green), no match (? gray), loading (spinner)
2. Exact contact match: Display "✓ Matched: [Client Name] - [Contact Name]" with green badge
3. Domain match (new contact): Display "⚠ New contact at [Client Name]" with yellow/orange badge
4. No match: Display "? No match found - manual selection required" with gray badge
5. Inactive client warning: Display "⚠ Inactive client" badge if `client.is_active = false`
6. Icons and colors align with branding guidelines (accessible color contrast)
7. Visual feedback appears within 500ms of matching completion (NFR2 performance target)
8. Tooltips provide additional context on hover (optional)

### Story 4.4: Disambiguation UI for Multiple Client Matches

As a **user**,
I want **to select the correct client when a contact exists at multiple clients**,
so that **I can create tickets for the right client context**.

#### Acceptance Criteria

1. Disambiguation UI appears when `matchContactByEmail` returns multiple clients
2. UI displays radio buttons or dropdown: "This contact exists at multiple clients. Select one:"
3. Each option shows client name
4. User selection updates sidebar state with chosen client_id
5. Form fields auto-populate after client selection
6. Disambiguation UI hidden for single client match (auto-selected)
7. UI supports keyboard navigation (Tab, Enter to select)
8. Selected client persists for current email (doesn't reset on re-render)
9. Visual design follows progressive disclosure pattern (only shown when needed)

### Story 4.5: Manual Client/Contact Selection Fallback

As a **user**,
I want **to manually select client and contact from dropdowns when auto-matching fails**,
so that **I can still create tickets even for unmatched emails**.

#### Acceptance Criteria

1. Client dropdown component displays all active clients (alphabetically sorted)
2. Contact dropdown component displays contacts for selected client
3. Dropdowns appear when no match found (manual mode)
4. Dropdowns editable even when match found (user can override auto-selection)
5. Client dropdown loads on sidebar initialization (cached for performance)
6. Contact dropdown filters dynamically based on selected client
7. Empty state for contact dropdown: "No contacts for this client"
8. Dropdowns use accessible UI components (keyboard navigation, ARIA labels)
9. Loading states for dropdowns while data fetches

---

## Epic 5: Ticket Creation Form & Submission

**Epic Goal:** Implement the complete ticket creation workflow including the form with pre-filled client/contact fields, time entry input with flexible parsing, optional description/notes fields, new contact creation from email metadata, and ticket submission to the existing backend API. Complete the end-to-end value delivery from email selection to ticket created.

### Story 5.1: Ticket Form UI Components

As a **developer**,
I want **form components for ticket creation fields**,
so that **users can input ticket data**.

#### Acceptance Criteria

1. Form components created: ClientSelect, ContactSelect, TimeInput, DescriptionTextarea, NotesTextarea
2. ClientSelect populated from client data (auto-selected when matched)
3. ContactSelect populated from contacts for selected client (auto-selected when matched)
4. TimeInput text field with placeholder: "e.g., 2m, 0.5h, 30m" (default value: 0.03h / 2 minutes)
5. DescriptionTextarea optional, multiline, placeholder: "Brief description for invoice"
6. NotesTextarea optional, multiline, placeholder: "Detailed notes (optional)"
7. "Mark as closed immediately" checkbox component
8. All fields use Tailwind styling consistent with design goals
9. Form layout optimized for narrow sidebar width (stacked fields, no horizontal layout)
10. Tab order follows logical field sequence

### Story 5.2: Time Entry Parsing & Validation

As a **developer**,
I want **flexible time input parsing matching the main app's time entry logic**,
so that **users can enter time naturally**.

#### Acceptance Criteria

1. Time parsing utility function reused or ported from backend (Story 3.2 from main PRD)
2. Parses hour formats: "2h", "2", "2.5h" → 2.0, 2.0, 2.5 hours
3. Parses minute formats: "45m", "90m" → 0.75, 1.5 hours
4. Parses combined formats: "1h30m" → 1.5 hours
5. Client-side validation displays inline error for invalid formats
6. Validation error message: "Invalid time format. Examples: 2h, 30m, 1.5h"
7. Valid input converts to decimal hours before API submission
8. Default value (2 minutes / 0.03h) pre-filled on form load
9. Unit tests for time parsing function (frontend version)

### Story 5.3: New Contact Creation Workflow

As a **user**,
I want **to create a new contact from email metadata when domain matches but contact doesn't exist**,
so that **I can create tickets for new contacts without leaving Outlook**.

#### Acceptance Criteria

1. When domain match found but no contact match, "New Contact" form fields appear
2. Contact name field pre-filled from sender display name (editable)
3. Contact email field pre-filled from sender email (editable)
4. Client auto-selected from domain match result
5. User can edit contact name/email before ticket creation
6. Validation enforces: name required, valid email format
7. Form indicates new contact will be created: "This will create a new contact: [Name] ([Email])"
8. New contact form hidden when exact contact match found
9. Progressive disclosure: new contact fields only appear when needed

### Story 5.4: Ticket Submission to Backend API

As a **developer**,
I want **to submit the completed form to the existing ticket creation API**,
so that **tickets are created from the add-in**.

#### Acceptance Criteria

1. API client function: `createTicket(ticketData)` calls `POST /api/tickets`
2. Request payload includes: client_id, contact_id (or new contact data), time entry (work_date, duration_hours), description, notes, state (open or closed)
3. Authentication included in request (session cookie or token)
4. Form submission triggers API call on button click
5. Loading state displayed during submission (button disabled, spinner)
6. Success handling: display confirmation message, clear form, reset to next email
7. Error handling: display clear error messages (validation errors, API failures, network errors)
8. New contact creation handled: if new contact, include contact creation in request or call separate endpoint first
9. Unit tests for API client function (mocked fetch)

### Story 5.5: Form Submission & Success Feedback

As a **user**,
I want **clear feedback when my ticket is created successfully**,
so that **I know the ticket was saved and can move to the next email**.

#### Acceptance Criteria

1. "Create Ticket" button submits form
2. Button disabled during submission (prevents double-submission)
3. Success message displayed: "✓ Ticket #[ID] created successfully"
4. Success message shows created ticket ID (from API response)
5. Form automatically clears after successful submission
6. Sidebar auto-refreshes for currently selected email (or next email in workflow)
7. Success message auto-dismisses after 3 seconds or includes dismiss button
8. Form re-enables for next ticket creation
9. Visual feedback uses green color scheme for success state

### Story 5.6: Error Handling & Validation

As a **user**,
I want **helpful error messages when ticket creation fails**,
so that **I can correct issues and retry**.

#### Acceptance Criteria

1. Client-side validation runs before API submission: client required, contact required (or new contact data), valid time format
2. Validation errors displayed inline next to relevant fields (red text, red border)
3. API error responses parsed and displayed: "Failed to create ticket: [error message]"
4. Authentication errors handled: "Session expired. Please log in to the web app and try again."
5. Network errors handled: "Network error. Check your connection and try again."
6. Validation errors prevent form submission (button disabled until valid)
7. Error messages cleared when user corrects field values
8. Retry mechanism available after errors (form stays populated for correction)
9. Error messages use accessible color contrast and ARIA attributes

### Story 5.7: Form Auto-Clear on Email Change

As a **user**,
I want **the form to clear and refresh when I select a different email**,
so that **I don't accidentally create tickets with wrong client/contact data**.

#### Acceptance Criteria

1. When email selection changes (Office.js event), form resets to default state
2. All form fields cleared except default time value (0.03h / 2 minutes)
3. Matching process re-runs for new email
4. Form fields auto-populate based on new email's matching results
5. Any in-progress form data discarded (no confirmation dialog - follows fast workflow philosophy)
6. Form state reset includes: client selection, contact selection, description, notes, checkboxes
7. Loading state displayed during new email's matching process
8. Previous email's matching results cleared from state

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 95%

**MVP Scope Appropriateness:** Just Right - The scope is laser-focused on the core problem (friction in ticket creation from email) with clear boundaries between MVP and Phase 2 features. The 5 epics deliver incremental value while maintaining tight focus on the Brief's stated goal of reducing ticket creation time from minutes to seconds.

**Readiness for Architecture Phase:** Ready - The PRD provides comprehensive technical guidance, clear requirements with testable acceptance criteria, and appropriate constraints for the Architect to begin detailed design. The critical technical unknowns are documented with research spike in Epic 1.

**Most Critical Concerns:**
- **RESOLVED:** Authentication strategy flagged as unknown but Epic 1.2 explicitly addresses this with research requirement
- **RESOLVED:** Domain matching infrastructure dependency documented in Technical Assumptions with clear assumption that it exists from main app
- **NOTED:** Office.js API capabilities unvalidated, but Epic 1.1 research spike de-risks this before feature development

### Category Analysis Table

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | PASS    | None - Clear problem from Brief, target user defined, quantified impact ($5-10K revenue) |
| 2. MVP Scope Definition          | PASS    | None - Explicit scope boundaries in Brief's "Out of Scope" section, rationale documented |
| 3. User Experience Requirements  | PASS    | None - UI Design Goals section comprehensive, 7 core screens defined, interaction paradigms clear |
| 4. Functional Requirements       | PASS    | None - 15 FRs covering all MVP features, NFRs address performance/security/compatibility |
| 5. Non-Functional Requirements   | PASS    | None - 8 NFRs with specific performance targets (2s load, 500ms matching, 1s submission) |
| 6. Epic & Story Structure        | PASS    | None - 5 epics logically sequenced, 32 stories appropriately sized, clear dependencies |
| 7. Technical Guidance            | PASS    | None - Tech stack aligned with existing system, architecture decisions documented, unknowns flagged |
| 8. Cross-Functional Requirements | PASS    | None - Backend API integration specified, CORS/auth requirements documented, deployment addressed |
| 9. Clarity & Communication       | PASS    | None - Consistent terminology, well-structured, comprehensive rationale throughout |

### Validation Summary

✅ **READY FOR ARCHITECT**

The PRD and epics are comprehensive, properly structured, and ready for architectural design. All categories passed validation. The epic structure provides clear sequencing with Epic 1 validating technical feasibility before feature development, and stories are appropriately sized for AI agent execution (2-4 hour sessions).

**Strengths:**
- **Problem-solution fit derived from comprehensive Brief** - Clear connection from pain points to features
- **Excellent requirement traceability** - All FRs map directly to Brief's MVP Core Features
- **Logical epic sequencing** - Epic 1 de-risks technical unknowns before investing in features
- **Appropriate MVP scope** - No feature creep; AI generation, open tickets, keyboard shortcuts explicitly deferred to Phase 2
- **Detailed acceptance criteria** - All 32 stories have 6-10 testable ACs enabling confident implementation
- **Realistic timeline** - 5 epics, 32 stories, estimated 64-128 hours (2-4 hours per story), fits within 3-4 week target with buffer

**Timeline Assessment:**
- 5 Epics, 32 total stories
- Estimated at 2-4 hours per story (AI agent session size per PRD template guidance)
- Total: 64-128 hours of focused development
- Target timeline: 3-4 weeks (120-160 hours at 40hr/week)
- Assessment: **Realistic** with buffer for Office.js learning curve, testing, and integration debugging

**MVP Validation:**
- Core value delivered: Reduce ticket creation from 2-3 minutes to <30 seconds via intelligent matching
- Minimum features to validate hypothesis: Email detection, contact/client matching, ticket creation
- Learning goals clear: Adoption rate (80%+ of email-based tickets), time savings achieved, matching accuracy
- Phase 2 features properly deferred: AI generation, open tickets display, keyboard shortcuts, sent emails

**Technical Readiness:**
- Critical unknowns identified: Office.js capabilities, authentication strategy, task pane persistence
- Research spike in Epic 1 de-risks before feature development
- Clear integration points: Existing backend API, new matching endpoints
- Deployment strategy defined: Railway hosting, manifest sideloading for MVP

### Top Issues by Priority

**BLOCKERS:** None

**HIGH:** None - All high-priority requirements addressed

**MEDIUM:**
1. **Domain matching infrastructure assumption** - PRD assumes `client_domains` table exists from main app's Epic 2. If not yet implemented, becomes prerequisite work. *Mitigation: Epic 2.2 acceptance criteria can verify schema and add migration if needed.*

**LOW:**
1. **Icon placeholders in manifest (Story 1.4)** - Acceptable for MVP but production should have proper branding. *Deferred to post-MVP polish.*

### MVP Scope Assessment

**Features appropriately scoped for MVP:**
- ✅ Persistent sidebar (FR1) - Core differentiator vs. modal approach
- ✅ Email-to-contact matching (FR2-3) - Primary value prop
- ✅ Domain fallback matching (FR4) - Essential for new contacts
- ✅ Disambiguation UI (FR5) - Edge case handling required for data integrity
- ✅ Auto-create contacts (FR6) - Removes friction when new contact at known client
- ✅ Manual fallback (FR9-10) - Safety net when matching fails

**Features correctly deferred to Phase 2 (per Brief):**
- ✅ AI description/notes generation - Nice-to-have, opt-in model needs validation first
- ✅ Show recent open tickets - Contextual awareness feature, not core MVP
- ✅ Keyboard shortcuts - Power user optimization, can add after adoption proven
- ✅ Sent email support - Workflow extension, requires recipient matching complexity
- ✅ Calendar integration - Future vision, email workflow must succeed first

**Missing features:** None identified - MVP scope complete for validating core hypothesis

**Complexity concerns:**
- Office.js API learning curve - Mitigated by Epic 1 research spike
- Authentication across iframe boundary - Mitigated by Epic 1.2 research with fallback strategy
- CORS configuration - Well-understood problem with documented solution

**Timeline realism:** 3-4 weeks is achievable for 32 stories at 2-4 hours each, with buffer for integration testing and deployment. Epic 1 (5-6 days) validates feasibility before committing to feature development.

### Recommendations

**For Immediate Action:**
1. ✅ **Epic 1 research spike is critical** - Must validate Office.js capabilities and auth strategy within first 3-5 days to de-risk remaining epics
2. ✅ **Verify domain matching infrastructure** - Check if `client_domains` table exists in current schema; if not, add to Epic 2 scope
3. ✅ **Confirm existing ticket creation API accepts all required fields** - Review POST /api/tickets endpoint to ensure it supports add-in's payload structure

**For Architecture Phase:**
1. Architect should review Office.js documentation for Outlook Web Add-ins in parallel with Epic 1 research
2. Design API endpoint contracts for `/api/contacts/match-email` and `/api/clients/match-domain` early
3. Plan CORS configuration and authentication testing approach
4. Consider bundle size optimization strategy for <2 second load time requirement (NFR1)

**For Development Phase:**
1. Implement Epic 1 in strict sequence - don't start Epic 2 until research spike confirms feasibility
2. Set up local HTTPS development environment early (Vite + self-signed cert) per Story 1.3
3. Create test data for various matching scenarios: exact match, domain match, disambiguation, no match
4. Manual testing checklist for each story's acceptance criteria

---

## Next Steps

### UX Expert Prompt

Review the PRD's User Interface Design Goals section and create wireframes/mockups for the following Outlook Add-in sidebar states:

1. **Default State** - No email selected, prompting user to select an email
2. **Matched Contact/Client State** - Auto-populated form showing matched client and contact with visual indicators (✓ green badge)
3. **Domain Match / New Contact State** - Form showing matched client with editable new contact fields (⚠ yellow badge)
4. **Disambiguation State** - Radio buttons or dropdown for selecting client when contact exists at multiple clients
5. **No Match / Manual Mode** - Empty dropdowns for manual client/contact selection (? gray badge)
6. **Form Submission Success** - Confirmation message with ticket ID created
7. **Error State** - Authentication required or validation error messaging

**Focus areas:**
- Sidebar width constraint (300-400px) requiring vertical layout optimization
- Progressive disclosure pattern - simple cases show minimal UI, complexity revealed only when needed
- Visual feedback for matching status (color-coded badges)
- "Invisible speed" UX vision - ensure form feels instant and automatic

Provide interaction specifications for:
- Form auto-clear behavior on email selection change
- Loading states during matching API calls (<500ms target)
- Keyboard navigation and tab order for power users

### Architect Prompt

Based on this PRD, create a detailed technical architecture document for the Outlook Web Add-in including:

**1. Office Add-in Architecture**
- Manifest structure and configuration requirements
- Task pane lifecycle and persistence behavior
- Office.js API integration approach (Mail API for sender metadata)
- Bundle optimization strategy for <2 second load time (NFR1)

**2. Backend API Extensions**
- `GET /api/contacts/match-email?email={email}` - Endpoint specification with request/response schema
- `GET /api/clients/match-domain?domain={domain}` - Endpoint specification
- Email domain extraction and matching algorithm
- Contact disambiguation logic when email exists at multiple clients

**3. Authentication Strategy** (CRITICAL DECISION)
- Research findings: Can task pane share session cookies with web app?
- Option 1: Session cookie sharing (SameSite=None, Secure) + CORS configuration
- Option 2: Token-based auth (JWT, token storage/refresh in add-in)
- Recommendation with UX/implementation trade-offs

**4. Frontend Architecture**
- React component structure for sidebar UI
- State management approach (React Context, Zustand, or React Query for API caching)
- Office.js event handling for email selection changes
- Form validation and time entry parsing logic

**5. Deployment Architecture**
- Static file hosting strategy (Railway alongside backend, or separate CDN)
- Manifest hosting and sideloading process
- CORS configuration for add-in domain
- Development vs. production manifest configuration

**6. Testing Strategy**
- Unit tests: Matching logic, domain extraction, time parsing
- Manual testing: Office Add-in sideloading, email selection workflows
- Edge case scenarios: Disambiguation, new contact, no match, inactive client

**Begin with Epic 1 research spike:**
1. Validate Office.js Mail API provides `item.from.emailAddress` and `item.from.displayName` in Outlook Web task pane context
2. Confirm task pane persists across email selections (or document reload behavior)
3. Test authentication options - can task pane iframe access web app session cookies?
4. Document any Office.js API limitations or constraints discovered

Provide architecture decision records (ADRs) for key choices: authentication strategy, state management approach, deployment hosting.
