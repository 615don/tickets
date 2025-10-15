# Enhancement Scope and Integration Strategy

## Enhancement Overview

- **Enhancement Type:** Existing UI mockup (Lovable prototype) requiring backend integration and Office.js implementation
- **Scope:** Convert existing React prototype in `/outlook-addin` to production Office.js add-in with real API integration
- **Integration Impact:** Low-Medium - Frontend mockup exists, needs backend API endpoints and Office.js email detection

## Integration Approach

**Code Integration Strategy:**
- **Existing workspace:** `/outlook-addin` directory already exists as standalone project (not yet NPM workspace)
- **Mockup status:** Full UI implemented with components: Sidebar, EmailContext, TicketForm, StatusBadge, SuccessBanner, ErrorMessage
- **Next steps:**
  1. Convert to NPM workspace in monorepo
  2. Replace mock API calls ([mocks.ts](outlook-addin/src/mocks.ts:1)) with real backend integration
  3. Add Office.js integration for email detection (currently simulated with debug buttons)
  4. Add Office Add-in manifest for Outlook Web Access
- **Shared type library:** Create `/packages/shared` workspace for types shared between main frontend, add-in, and backend

**Database Integration:**
- **Zero schema changes:** Add-in leverages existing tables: `clients`, `contacts`, `client_domains`, `tickets`, `time_entries`
- **Domain matching:** Uses existing `client_domains` table (FK to `clients`, unique `domain` column)
- **Contact creation:** Calls existing contact creation logic (may need minor endpoint modification for add-in-specific flow)
- **Ticket creation:** Reuses existing `POST /api/tickets` endpoint with same payload structure

**API Integration:**
- **Backend API URL:** `https://ticketapi.zollc.com` (existing backend service)
- **New endpoints to implement:**
  - `GET /api/contacts/match-email?email={email}` - Email-to-contact lookup
  - `GET /api/clients/match-domain?domain={domain}` - Domain-to-client matching
  - `GET /api/clients` - List all clients (may already exist)
  - `GET /api/contacts?client_id={id}` - List contacts for client (may already exist)
- **Replace mocks:** Current `mockMatchEmail`, `mockLoadClients`, `mockLoadContactsForClient`, `mockCreateTicket` functions replaced with real API calls
- **Authentication:** Shared session-based auth with `SameSite=None; Secure` cookies for cross-origin iframe access
- **CORS configuration:** Backend CORS updated to allow `https://outlook-addin.zollc.com` origin with credentials

**UI Integration:**
- **Existing UI complete:** All components from front-end spec already implemented:
  - [EmailContext](outlook-addin/src/components/EmailContext.tsx:1) component with status badges
  - [TicketForm](outlook-addin/src/components/TicketForm.tsx:1) with client/contact dropdowns
  - [TimeInput](outlook-addin/src/components/TimeInput.tsx:1) with flexible parsing
  - [SuccessBanner](outlook-addin/src/components/SuccessBanner.tsx:1) and [ErrorMessage](outlook-addin/src/components/ErrorMessage.tsx:1) components
  - [EmptyState](outlook-addin/src/components/EmptyState.tsx:1) for "no email selected"
- **Technology stack matches:** React + TypeScript + Tailwind CSS (consistent with main frontend)
- **Needs Office.js:** Add email selection detection replacing current mock/debug buttons

## Compatibility Requirements

**Existing API Compatibility:**
- Add-in `POST /api/tickets` requests use identical payload structure to main frontend
- Current mock uses `TicketFormData` type: `clientId`, `contactId`, `timeHours`, `description`, `notes`, `closeImmediately`, optional `contactName`/`contactEmail` for new contacts
- No breaking changes to existing API endpoints
- New matching endpoints follow existing REST conventions

**Database Schema Compatibility:**
- No schema migrations required for MVP
- Leverages existing `client_domains.domain` column for matching
- Contact creation follows existing validation rules (email uniqueness within client)

**UI/UX Consistency:**
- Mockup already uses Tailwind CSS with consistent color scheme
- Same component patterns (buttons, forms, badges) as shadcn/ui in main frontend
- Sidebar layout optimized for narrow width (max-w-sm class = 384px)

**Performance Impact:**
- Add-in adds 2 new API endpoints with simple SELECT queries (indexed columns)
- No impact on existing frontend/backend performance
- Add-in hosted as separate Railway service (isolated resource consumption)
- Target: <500ms matching API response time (NFR2)

---
