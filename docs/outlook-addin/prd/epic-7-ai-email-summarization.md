# Epic 7: AI-Powered Email Summarization

## Table of Contents
- [Intro Project Analysis and Context](#intro-project-analysis-and-context)
- [Requirements](#requirements)
- [User Interface Enhancement Goals](#user-interface-enhancement-goals)
- [Technical Constraints and Integration Requirements](#technical-constraints-and-integration-requirements)
- [Epic and Story Structure](#epic-and-story-structure)
- [Epic Details](#epic-details)

---

## Intro Project Analysis and Context

### Analysis Source

- **IDE-based fresh analysis** combined with existing comprehensive Outlook add-in documentation
- Referenced [docs/brainstorming-session-results.md](../../brainstorming-session-results.md) for feature research
- Referenced [docs/outlook-addin/architecture/existing-project-analysis.md](../architecture/existing-project-analysis.md) for project context
- Referenced [docs/outlook-addin/architecture/tech-stack.md](../architecture/tech-stack.md) for technology constraints

### Current Project State

**Existing Outlook Add-in:** A comprehensive Outlook Web Add-in for email-to-ticket conversion, built as an enhancement to a lean IT consulting ticketing system. The add-in enables rapid ticket creation directly from Outlook Web Access by:
- Auto-detecting client/contact from email sender/domain
- Pre-populating ticket forms with matched data
- Capturing email metadata for context
- Submitting tickets to backend API
- Recently added capability (Epic 6) to update existing open tickets with additional time entries

**Primary Technology:**
- React 18.3.1 + TypeScript 5.8.3 + Vite 5.4.19
- Office.js API for Outlook integration
- shadcn/ui (Radix UI) + Tailwind CSS 3.4.17
- Deployed as separate Railway service alongside main ticketing system

**Current Epic Structure:** 6 completed epics covering technical foundation, matching infrastructure, UI development, form submission, and open ticket re-entry workflow.

### Enhancement Scope Definition

**Enhancement Type:**
- ✓ **New Feature Addition** (AI-powered email summarization)
- ✓ **Integration with New Systems** (OpenAI API via GPT-5 mini)

**Enhancement Description:**

Add AI-powered automatic generation of ticket descriptions and notes from email content. When a contact match occurs, the system will use GPT-5 mini to summarize the email thread into two outputs: a one-line invoice-friendly description and detailed notes for billing reference. This eliminates manual note-taking friction while improving quality over the current practice of using email subject lines.

**Impact Assessment:**
- ✓ **Moderate Impact** (some existing code changes)
  - New backend settings for API key + system prompt configuration
  - Email sanitization pipeline before AI processing
  - Auto-population logic enhancement to handle AI-generated content
  - New API integration with OpenAI
  - No changes to core matching or form submission flows

### Goals and Background Context

**Goals:**
- Eliminate manual note-taking busywork that creates friction in daily ticket creation workflow
- Improve ticket description quality beyond current practice (using email subject lines)
- Auto-generate memory-jogging summaries for rare billing dispute reference
- Maintain minimal UI footprint (proactive automation, no additional buttons in cramped add-in)
- Enable future AI capabilities (ticket matching, billable hours estimation, pattern learning)

**Background Context:**

The Outlook add-in has successfully reduced ticket creation friction from the main web interface, but manual description and note entry remains a pain point. User analysis revealed that note-taking is emotionally taxing "busywork" rather than just inefficient—users actively *hate* writing notes. However, notes serve an important defensive purpose: providing reference material for rare billing disputes with clients.

The bar for quality is intentionally low ("good enough for memory jogging"), but current practice (copying email subject lines as ticket descriptions) produces poor results since most people write terrible email subjects. AI summarization offers dual benefits: friction removal AND quality improvement for clients receiving invoices.

The brainstorming session identified that proactive automation on contact-match events perfectly aligns with existing add-in architecture while avoiding UI space constraints. This enhancement leverages recently-shipped Epic 6 work (open ticket updates) and existing contact-matching infrastructure.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Draft | 2025-10-12 | 0.1 | Created Epic 7: AI Email Summarization PRD from analyst brainstorming session | PM Agent (John) |
| Story 7.10 Removed | 2025-10-13 | 0.2 | Removed Story 7.10 (Smart Minification) and FR11 based on testing validation - AI already handles short emails appropriately | PO Agent (Sarah) |
| Story 7.3 Removed | 2025-10-13 | 0.3 | Removed Story 7.3 (Email Sanitization Pipeline) - migrated to AI-based signature handling via system prompt after programmatic sanitization proved ineffective | PO Agent (Sarah) |

---

## Requirements

### Functional Requirements

**FR1:** When a contact match occurs in the Outlook add-in, the system SHALL automatically trigger AI summarization of the current email thread without requiring manual user action.

**FR2:** The AI summarization SHALL process recent emails in the thread with intelligent limits to balance context and token costs:
- Include up to the last 5 emails in the thread, OR
- Limit to approximately 4,000 words of email content (whichever comes first)
- Always include the most recent email in full

**FR2a:** When email threads exceed limits (>5 emails or >4,000 words), the system SHALL prioritize the most recent emails and include a note in the generated summary indicating "Summary based on last 5 emails in thread" to set user expectations.

**FR3:** The AI system prompt SHALL instruct the model to ignore email signatures, disclaimers, legal footers, and other boilerplate content when generating summaries, ensuring focus on relevant content without programmatic pre-processing.

**FR4:** The AI summarization SHALL generate two distinct outputs from a single API call:
- **Description:** A one-line, invoice-friendly ticket title (concise enough to fit on billing line items)
- **Notes:** A detailed summary of the email thread suitable for billing dispute reference and memory jogging

**FR5:** The system SHALL immediately auto-populate the ticket form's description and notes fields with AI-generated content so the user can verify effectiveness before submission.

**FR6:** Users SHALL be able to directly edit both the AI-generated description and notes fields before submitting the ticket (no regeneration-only workflow).

**FR7:** The AI summarization feature SHALL apply to both new ticket creation AND adding time entries to existing open tickets (Epic 6 integration).

**FR8:** The system SHALL use GPT-5 mini as the default AI model for all summarization tasks.

**FR9:** Administrators SHALL be able to configure the OpenAI API key via the main web application's settings page (not within the add-in).

**FR10:** Administrators SHALL be able to configure and modify the system prompt used for AI summarization via the main web application's settings page.

**FR12:** The system SHALL only trigger AI summarization when a contact match exists, preventing token waste on junk/vendor/partner emails that won't become tickets.

### Non-Functional Requirements

**NFR1:** AI summarization SHALL complete within 5 seconds under normal network conditions to avoid blocking the user's workflow.

**NFR2:** The enhancement SHALL maintain the existing add-in performance characteristics and not increase page load time by more than 500ms.

**NFR3:** Failed AI API calls (timeout, rate limit, network error) SHALL gracefully degrade—allow users to manually enter description/notes without blocking ticket creation.

**NFR4:** The system SHALL provide clear error messaging when AI generation fails (e.g., "AI summarization unavailable—please enter description manually").

**NFR5:** API key storage SHALL use encryption at rest in the backend database to protect credentials.

**NFR6:** The enhancement SHALL reuse existing CORS and authentication infrastructure without introducing new security vulnerabilities.

**NFR7:** AI-generated content quality SHALL be sufficient for memory-jogging purposes—100% accuracy is not required (user can edit).

**NFR8:** Token costs per ticket SHALL be minimized through smart thread selection (5-email/4000-word limits) and single-model strategy (no multi-model fallbacks).

### Compatibility Requirements

**CR1: Existing API Compatibility** - The enhancement SHALL NOT break existing contact/client matching API endpoints or ticket creation/update endpoints. AI summarization must integrate via new optional parameters or separate processing.

**CR2: Database Schema Compatibility** - New settings fields (AI API key, system prompt) SHALL be added to existing settings infrastructure without requiring schema migrations for core ticketing tables (clients, contacts, tickets, time_entries).

**CR3: UI/UX Consistency** - AI auto-population SHALL follow the same visual patterns as existing contact/client auto-population (Epic 4), maintaining consistent user experience.

**CR4: Integration Compatibility** - The enhancement SHALL NOT interfere with existing Xero integration, email metadata extraction, or form validation logic.

---

## User Interface Enhancement Goals

### Integration with Existing UI

The AI summarization feature is designed for **minimal UI footprint** to respect the Outlook add-in's severe space constraints. Integration approach:

**Proactive Automation Pattern:**
- NO new buttons, controls, or UI elements added to the add-in
- Leverages existing contact-match event from Epic 4 as trigger
- Auto-population follows same visual pattern as existing client/contact auto-fill
- Users see fields populate automatically—AI generation is invisible infrastructure

**Visual Feedback:**
- Reuse existing loading states during API calls (spinner or skeleton)
- Field population animation consistent with current auto-fill behavior
- Error states follow existing error message patterns (e.g., toast notifications or inline validation)

**Edit Experience:**
- Description and notes fields remain fully editable text inputs (no change from current)
- No visual distinction between AI-generated vs. manually-entered content
- Users edit in-place just like any other pre-populated field

**Consistency with shadcn/ui + Tailwind:**
- All components continue using existing shadcn/ui primitives (Input, Textarea, etc.)
- No new design tokens or Tailwind classes required
- Maintains current responsive behavior and accessibility patterns

### Modified/New Screens and Views

**Modified Screens:**
1. **Ticket Creation Form (New Ticket Mode)**
   - Description field: Auto-populates with one-line AI-generated summary
   - Notes field: Auto-populates with detailed AI-generated summary
   - Behavior: Population occurs immediately after contact match, before user starts typing

2. **Time Entry Form (Update Existing Ticket Mode - Epic 6)**
   - Notes field: Auto-populates with AI-generated summary of new email content
   - Description field: Not modified (ticket description already exists)
   - Behavior: Same proactive trigger on contact match

**New Screens:**
3. **Admin Settings Page (Main Web App)**
   - New section: "AI Email Summarization Settings"
   - Fields:
     - OpenAI API Key (password field with show/hide toggle)
     - AI Model Selection (dropdown, default: GPT-5 mini)
     - System Prompt (multiline textarea with character count)
   - Save button with validation
   - Test connection button (REQUIRED - verifies API key works)

**NO changes to:**
- Sidebar layout or email context display
- Contact/client matching UI
- Form submission success/error feedback
- Email selection or metadata extraction views

### UI Consistency Requirements

**UC1:** Loading states during AI generation SHALL use the same spinner component and positioning as existing API calls (contact matching, form submission).

**UC2:** Error messages for AI failures SHALL follow the existing toast notification pattern (e.g., "AI summarization failed - please enter description manually").

**UC3:** Auto-populated fields SHALL use the same visual treatment (no special highlighting or badges) to avoid cluttering the minimal UI.

**UC4:** Admin settings page SHALL integrate into the existing settings navigation and follow current form layout patterns (label positioning, input styling, button placement).

**UC5:** The enhancement SHALL maintain the current mobile-responsive behavior—AI features work identically on desktop and mobile Outlook Web Access.

---

## Technical Constraints and Integration Requirements

### Existing Technology Stack

Based on existing Outlook add-in architecture documentation:

**Languages:** TypeScript 5.8.3 (add-in frontend), Node.js with ES modules (backend)

**Frameworks:**
- Frontend: React 18.3.1, Vite 5.4.19
- Backend: Express 4.18.2

**UI Libraries:** shadcn/ui (Radix UI primitives), Tailwind CSS 3.4.17

**Database:** PostgreSQL 14+ (Railway-managed)

**Infrastructure:** Railway platform with separate services (frontend, backend, database)

**External Dependencies:**
- Office.js (latest from Microsoft CDN)
- OpenAI API (NEW - GPT-5 mini endpoint)

**Authentication:** express-session 1.17.3 with connect-pg-simple 9.0.1 (PostgreSQL-backed sessions)

**State Management:** React hooks (useState, useEffect) in add-in; TanStack Query 5.83.0 in main frontend

**HTTP Client:** Native Fetch API

**Package Manager:** npm with workspace support (monorepo)

### Integration Approach

**Database Integration Strategy:**
- Add new columns to existing `settings` table (or create `ai_settings` table if settings table doesn't exist):
  - `openai_api_key` (TEXT, encrypted)
  - `openai_model` (TEXT, default: 'gpt-5-mini')
  - `ai_system_prompt` (TEXT, default prompt provided)
- No changes to core ticketing tables (clients, contacts, tickets, time_entries)
- Settings retrieved by backend, never sent to add-in frontend

**API Integration Strategy:**
- **New backend endpoint:** `POST /api/ai/summarize-email`
  - Input: `{ emailThread: [{ from, subject, body }], emailCount: number }`
  - Output: `{ description: string, notes: string, truncated: boolean }`
  - Handles OpenAI API calls, email sanitization, error handling
- **Modified endpoint:** Existing ticket creation/update endpoints optionally accept AI-generated fields (no breaking changes)
- **New settings endpoint:** `GET /api/settings/ai` and `POST /api/settings/ai` (admin only)
- **New validation endpoint:** `POST /api/settings/ai/test-connection` (verifies API key)

**Frontend Integration Strategy:**
- Add new API client function: `summarizeEmail(emailThread)` in add-in
- Modify existing contact-match success handler to trigger AI summarization
- Reuse existing form state management—just populate description/notes fields
- No new components required; enhancement is pure logic

**Testing Integration Strategy:**
- Unit tests for email sanitization logic (strip signatures, footers)
- Unit tests for smart minification (email length classification)
- Mock OpenAI API responses in add-in tests
- Manual end-to-end testing in Outlook Web with real emails
- API key validation testing (valid key, invalid key, network failure)

### Code Organization and Standards

**File Structure Approach:**
```
backend/src/
  controllers/aiController.js (NEW - summarize endpoint, settings CRUD)
  services/openaiService.js (NEW - OpenAI API client wrapper)
  services/emailThreadProcessor.js (NEW - thread selection and word count)
  middleware/aiErrorHandler.js (NEW - graceful degradation logic)

outlook-addin/src/
  lib/api/ai.ts (NEW - summarizeEmail API client)
  lib/utils/emailThreadBuilder.ts (NEW - format Office.js emails for API)

packages/shared/ (if needed)
  types/ai.ts (NEW - shared TypeScript interfaces for AI payloads)
```

**Naming Conventions:** Follow existing patterns from coding standards:
- Backend: camelCase for functions, PascalCase for classes
- Frontend: PascalCase for components, camelCase for utilities
- Database: snake_case for columns (openai_api_key)
- API routes: kebab-case (/api/ai/test-connection)

**Coding Standards:**
- Async/await for all API calls (existing pattern)
- Error boundaries in React for AI failures
- Environment variable for OpenAI API base URL (support future model changes)
- Comprehensive JSDoc comments for new AI services

**Documentation Standards:**
- Update API specification with new endpoints
- Document default system prompt in architecture docs
- Add troubleshooting guide for common OpenAI errors (rate limits, invalid keys)

### Deployment and Operations

**Build Process Integration:**
- No changes to existing Vite build or npm workspace structure
- Add OpenAI npm package to backend dependencies: `npm install openai --workspace=backend`
- Add TypeScript types: `npm install @types/openai -D --workspace=backend`

**Deployment Strategy:**
- Backend deployment via Railway (existing service) with new environment variable:
  - `OPENAI_API_BASE_URL` (default: https://api.openai.com/v1)
- Frontend/add-in: No environment changes (settings retrieved from backend)
- Database: Migration script for new settings columns (if needed)

**Monitoring and Logging:**
- Log all AI API calls with response times and token usage
- Log AI failures separately for debugging (rate limits, timeouts, invalid responses)
- Use existing backend logging infrastructure (no new monitoring tools)
- Alert on repeated AI failures (>10 consecutive errors suggests configuration issue)

**Configuration Management:**
- API key stored encrypted in database (use `bcrypt` or similar)
- System prompt editable via settings UI (no code deployment for prompt changes)
- Model selection persisted in database (future-proofs for GPT-6, Claude, etc.)
- Default prompt version-controlled in codebase as fallback

### Risk Assessment and Mitigation

**Technical Risks:**
1. **OpenAI API Reliability:** External dependency introduces new failure mode
   - **Mitigation:** Graceful degradation (NFR3) - allow manual entry on failures
   - **Mitigation:** Timeout of 5 seconds prevents indefinite blocking

2. **Token Cost Escalation:** Long email threads or high usage could spike costs
   - **Mitigation:** 5-email/4000-word limit caps maximum tokens per request
   - **Mitigation:** AI system prompt instructs model to ignore signatures/boilerplate
   - **Mitigation:** Contact-match gating prevents processing non-ticket emails

**Integration Risks:**
1. **Breaking Existing Auto-Population:** AI trigger on contact-match could interfere with current workflow
   - **Mitigation:** AI runs asynchronously after contact/client population completes
   - **Mitigation:** Comprehensive integration testing with Epic 4 matching logic

2. **Session/CORS Issues:** OpenAI API calls from backend may have different security requirements
   - **Mitigation:** All AI calls go through backend (not directly from add-in), reusing existing session auth

**Deployment Risks:**
1. **Missing API Key on First Deploy:** Feature breaks if admin doesn't configure settings immediately
   - **Mitigation:** Feature gracefully skips AI if no API key configured (logs warning)
   - **Mitigation:** Clear setup instructions in deployment guide

2. **Railway Service Limits:** Additional API calls may impact backend response times
   - **Mitigation:** AI calls are async and don't block ticket creation
   - **Mitigation:** Monitor backend performance metrics post-deployment

**Mitigation Strategies Summary:**
- Graceful degradation is #1 priority—never block ticket creation
- Start conservative (5-email limit, simple sanitization) and iterate based on real usage
- Comprehensive error logging to quickly identify OpenAI integration issues
- Test connection button catches configuration errors before they impact users
- User edit capability is ultimate safety valve for AI mistakes

---

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision:** Single comprehensive epic

**Rationale:**

This AI email summarization enhancement should be structured as **one cohesive epic (Epic 7)** because:

1. **Single Feature Boundary:** All stories deliver one user-facing capability—AI-generated ticket descriptions and notes. There are no unrelated sub-features.

2. **Logical Dependency Chain:** Stories follow a clear progression: backend infrastructure → AI service integration → frontend integration → settings UI. Each story builds on the previous.

3. **Consistent with Existing Pattern:** Your Outlook add-in PRD uses single epics for cohesive features (Epic 2: Matching Infrastructure, Epic 5: Form Submission). This enhancement follows that successful pattern.

4. **Minimal Scope:** Even with ~8-10 stories, this is contained enough for one epic. It's adding one capability, not multiple independent features.

5. **Testing & Validation:** All stories contribute to validating the same end-to-end flow (email → AI → form population → submission). Splitting into multiple epics would fragment this.

**Alternative Considered:** Could split into "Epic 7a: Backend AI Infrastructure" and "Epic 7b: Frontend Integration," but this creates artificial boundaries since backend is meaningless without frontend consumption, and vice versa.

---

## Epic Details

**Epic Goal:** Enable automatic generation of invoice-friendly ticket descriptions and detailed notes from email content using GPT-5 mini, eliminating manual note-taking friction while improving quality beyond current practice of using email subject lines.

**Integration Requirements:**
- Builds on Epic 4 contact-matching infrastructure (trigger point)
- Extends Epic 6 open-ticket updates (apply AI to both new tickets and time entries)
- Integrates with existing form auto-population patterns
- Adds new backend OpenAI service layer
- Adds admin configuration UI in main web application

---

### Story 7.1: Backend AI Settings Infrastructure

As an **administrator**,
I want **to configure OpenAI API credentials and system prompt via the settings page**,
so that **the AI summarization feature can be enabled and customized without code deployments**.

**Acceptance Criteria:**

1. Settings table (or ai_settings table) includes new columns: `openai_api_key` (encrypted TEXT), `openai_model` (TEXT, default 'gpt-5-mini'), `ai_system_prompt` (TEXT with default prompt)
2. New API endpoint `GET /api/settings/ai` returns current AI settings (API key masked: `sk-***abc123`)
3. New API endpoint `POST /api/settings/ai` saves AI settings with validation (required API key, valid model name, non-empty prompt)
4. API key is encrypted before storage using bcrypt or similar encryption
5. Default system prompt is defined and version-controlled in codebase
6. Only authenticated admin users can access AI settings endpoints

**Integration Verification:**

- **IV1:** Existing settings endpoints (Xero integration, etc.) continue to function unchanged after adding AI settings
- **IV2:** Database schema migration applies cleanly without breaking existing settings data
- **IV3:** Settings page loads without errors when AI settings are unconfigured (graceful defaults)

---

### Story 7.2: OpenAI API Integration Service

As a **system**,
I want **a backend service layer that communicates with OpenAI API**,
so that **email content can be sent for summarization and responses can be parsed into description/notes format**.

**Acceptance Criteria:**

1. New file `backend/src/services/openaiService.js` exports `summarizeEmail(emailThread, settings)` function
2. Service retrieves API key and model from settings (injected as parameter, not global)
3. Service constructs OpenAI API request with:
   - Configured system prompt
   - User message containing formatted email thread
   - Dual-output instructions (generate JSON: `{description, notes}`)
   - Temperature setting (0.3-0.5 for consistency)
4. Service handles OpenAI API responses and extracts `description` and `notes` fields
5. Service implements 5-second timeout on API calls
6. Service returns structured response: `{ description: string, notes: string, success: boolean, error?: string }`
7. All API interactions are logged (timestamp, model, token usage, response time)

**Integration Verification:**

- **IV1:** Service handles missing/invalid API keys gracefully (returns error without crashing)
- **IV2:** Service handles OpenAI API errors (rate limits, network timeouts, invalid responses) with clear error messages
- **IV3:** Service does not expose API keys in logs or error messages

---

### Story 7.4: Smart Email Thread Processing

As a **system**,
I want **to intelligently select and format emails from the thread for AI summarization**,
so that **context is balanced with token costs (max 5 emails or 4,000 words)**.

**Acceptance Criteria:**

1. New file `backend/src/services/emailThreadProcessor.js` exports `processEmailThread(emails)` function
2. Function sorts emails chronologically (oldest to newest)
3. Function selects up to last 5 emails from thread
4. Function calculates approximate word count as emails are added (split by whitespace)
5. Function stops adding emails if total exceeds 4,000 words (even if <5 emails)
6. Function always includes the most recent email, even if it alone exceeds 4,000 words (truncate to 4,000)
7. Function returns: `{ selectedEmails: Email[], truncated: boolean, emailCount: number, wordCount: number }`
8. Each email includes: `from`, `subject`, `body`

**Integration Verification:**

- **IV1:** Single long email (>4,000 words) is truncated gracefully without breaking AI processing
- **IV2:** Short email threads (<5 emails, <4,000 words) are processed in full
- **IV3:** Thread processing time remains <100ms for typical threads

---

### Story 7.5: AI Summarization API Endpoint

As an **Outlook add-in**,
I want **a backend endpoint that accepts email threads and returns AI-generated summaries**,
so that **ticket descriptions and notes can be auto-populated**.

**Acceptance Criteria:**

1. New endpoint `POST /api/ai/summarize-email` accepts payload:
   ```json
   {
     "emails": [
       { "from": "user@example.com", "subject": "...", "body": "..." }
     ]
   }
   ```
2. Endpoint validates authenticated session (requires logged-in user)
3. Endpoint retrieves AI settings from database
4. Endpoint returns 400 error if AI not configured (no API key)
5. Endpoint processes email thread: select recent emails → call OpenAI service
6. Endpoint returns response:
   ```json
   {
     "description": "One-line summary",
     "notes": "Detailed multi-paragraph summary",
     "truncated": false,
     "emailCount": 3
   }
   ```
7. Endpoint handles errors gracefully (returns 200 with `success: false, error: "message"` for AI failures)
8. Endpoint logs all requests and AI service responses

**Integration Verification:**

- **IV1:** Endpoint respects existing authentication (returns 401 for unauthenticated requests)
- **IV2:** Endpoint does not block other API operations (async processing, does not lock database)
- **IV3:** Failed AI calls return useful error messages to frontend ("Rate limit exceeded", "Invalid API key", etc.)

---

### Story 7.6: Admin Settings UI - AI Configuration Form

As an **administrator**,
I want **an AI Settings section on the main web application settings page**,
so that **I can configure the OpenAI API key, select the model, and customize the system prompt**.

**Acceptance Criteria:**

1. New section added to existing settings page: "AI Email Summarization Settings"
2. Form includes three fields:
   - **OpenAI API Key**: Password input with show/hide toggle, placeholder "sk-..."
   - **AI Model**: Dropdown with options ("gpt-5-mini" [default], "gpt-5-mini", "gpt-5", "gpt-5-nano"), displays current selection
   - **System Prompt**: Multiline textarea (8-10 rows), character count displayed, pre-populated with default prompt
3. "Save Settings" button validates and submits to `POST /api/settings/ai`
4. "Test Connection" button calls `POST /api/settings/ai/test-connection` (validates API key works before saving)
5. Success message displayed after save: "AI settings saved successfully"
6. Error messages displayed for validation failures or save errors
7. Form follows existing settings page styling (shadcn/ui components, Tailwind classes)

**Integration Verification:**

- **IV1:** Settings page loads correctly when AI settings are unconfigured (shows empty form with defaults)
- **IV2:** Saving AI settings does not affect other settings sections (Xero integration, etc.)
- **IV3:** Test connection provides clear feedback ("Connection successful" vs. "Invalid API key" vs. "Network error")

---

### Story 7.7: Test Connection Validation Endpoint

As an **administrator**,
I want **to verify my OpenAI API key works before saving settings**,
so that **I can catch configuration errors immediately rather than discovering them during ticket creation**.

**Acceptance Criteria:**

1. New endpoint `POST /api/settings/ai/test-connection` accepts: `{ "apiKey": "sk-...", "model": "gpt-5-mini" }`
2. Endpoint makes minimal OpenAI API call (e.g., summarize "Test email" with max 50 tokens)
3. Endpoint returns success response: `{ "success": true, "message": "Connection successful", "model": "gpt-5-mini" }`
4. Endpoint returns error response with specific failure reason:
   - `{ "success": false, "error": "Invalid API key" }` (401 from OpenAI)
   - `{ "success": false, "error": "Rate limit exceeded" }` (429 from OpenAI)
   - `{ "success": false, "error": "Network error - unable to reach OpenAI" }` (timeout/connection)
5. Endpoint has 10-second timeout (longer than normal AI calls to account for slow connections)
6. Endpoint does not save settings (validation only)

**Integration Verification:**

- **IV1:** Test connection endpoint does not interfere with existing session management
- **IV2:** Multiple rapid test connection calls are handled gracefully (no backend crashes)
- **IV3:** Test connection logs attempts for debugging but never logs full API keys

---

### Story 7.8: Add-in AI Summarization Integration (New Tickets)

As a **user creating a new ticket**,
I want **the description and notes fields to auto-populate with AI-generated summaries when a contact match occurs**,
so that **I don't have to manually write ticket notes**.

**Acceptance Criteria:**

1. New file `outlook-addin/src/lib/api/ai.ts` exports `summarizeEmail(emailThread)` API client function
2. New file `outlook-addin/src/lib/utils/emailThreadBuilder.ts` converts Office.js email items to API format
3. When contact match succeeds (Epic 4), add-in triggers AI summarization asynchronously
4. Add-in displays existing loading state (spinner) while AI processes
5. When AI succeeds, description and notes fields auto-populate with returned values
6. When AI fails, add-in logs error and leaves fields empty (user enters manually)
7. User can edit auto-populated fields before submission (fields remain editable text inputs)
8. AI-generated content is submitted with ticket (no special marking)

**Integration Verification:**

- **IV1:** Contact/client matching still completes successfully before AI is triggered (no race conditions)
- **IV2:** Existing form validation rules apply to AI-generated content (e.g., description max length)
- **IV3:** Form submission works identically whether fields are AI-populated or manually entered

---

### Story 7.9: Add-in AI Summarization Integration (Ticket Updates)

As a **user adding time to an existing ticket**,
I want **the notes field to auto-populate with an AI-generated summary of the new email**,
so that **I can quickly document additional work without manual note-writing**.

**Acceptance Criteria:**

1. When update mode is active (Epic 6 - existing ticket selected), AI summarization triggers on contact match
2. AI processes only the current email (not full thread, since ticket already has context)
3. Notes field auto-populates with AI-generated summary
4. Description field is NOT modified (ticket description already exists)
5. Time entry submission includes AI-generated notes
6. All error handling from Story 7.8 applies (graceful degradation on AI failure)

**Integration Verification:**

- **IV1:** Existing ticket update workflow (Epic 6) continues to function if AI is disabled or fails
- **IV2:** Time entries with AI-generated notes are stored identically to manual entries
- **IV3:** Switching between emails in Outlook properly clears/repopulates notes field

---

### Story 7.11: End-to-End Integration Testing & Deployment

As a **product team**,
I want **comprehensive integration testing of the full AI summarization flow**,
so that **we can confidently deploy to production without breaking existing add-in functionality**.

**Acceptance Criteria:**

1. Manual test plan covers:
   - New ticket creation with AI (various email lengths)
   - Ticket update with AI (Epic 6 integration)
   - AI failure scenarios (invalid key, timeout, rate limit)
   - Admin settings CRUD (save, edit, test connection)
   - Thread truncation (>5 emails, >4,000 words)
2. Test with real OpenAI API key in staging environment
3. Verify existing epics still function:
   - Contact/client matching (Epic 4)
   - Form submission (Epic 5)
   - Ticket updates (Epic 6)
4. Performance testing confirms <5 second AI response time
5. Deploy backend changes to Railway (environment variable for OpenAI base URL)
6. Deploy frontend changes to Railway
7. Run database migration for settings table
8. Configure production AI settings via admin UI
9. Production smoke test: Create 1 real ticket with AI

**Integration Verification:**

- **IV1:** All existing add-in functionality tested post-deployment (no regressions)
- **IV2:** Rollback plan validated (can disable AI feature flag if issues arise)
- **IV3:** Monitoring confirms AI API calls are logged and performance is acceptable

---

## Story Sequence Rationale

**This story sequence is designed to minimize risk to your existing system:**

1. **Backend-first approach (7.1-7.5):** Build complete AI infrastructure before touching frontend, allowing isolated testing
2. **Settings before processing (7.1 first):** Must configure before using—establishes foundation
3. **Service layers before endpoints (7.2, 7.4 before 7.5):** Build composable services that endpoint orchestrates
4. **Admin UI mid-sequence (7.6-7.7):** Can test backend with Postman before building UI, but UI comes before frontend integration for configuration access
5. **Frontend integration late (7.8-7.9):** Only integrate with add-in after backend is proven stable
6. **Deployment final (7.11):** Comprehensive testing gate before production

**Dependencies:**
- 7.2 depends on 7.1 (needs settings to configure API)
- 7.4 depends on 7.2 (needs OpenAI service for thread processing)
- 7.5 depends on 7.2, 7.4 (orchestrates all services)
- 7.6-7.7 depend on 7.1 (settings endpoints must exist)
- 7.8-7.9 depend on 7.5 (require summarize endpoint)
- 7.11 depends on all previous stories
