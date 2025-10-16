# Asset Management Integration - Brownfield Enhancement PRD

**Version:** 1.0
**Date:** 2025-10-16
**Status:** Draft
**Author:** John (PM)

---

## Intro Project Analysis and Context

### Analysis Source

**Document-project analysis available** - Comprehensive technical documentation exists in [docs/architecture/](architecture/) docs/architecture/asset-management-architecture.md

### Existing Project Overview

#### Current Project State

The **Lean IT Consulting Ticketing System** is a production-ready monolithic monorepo application serving Zero One LLC's support workflow. The system currently handles ticket creation, time tracking, client/contact management, and Xero integration for invoicing.

**Current Architecture:**
- **Frontend:** React 18 SPA with TypeScript, Vite, shadcn/ui components
- **Backend:** Node.js Express REST API with session-based authentication
- **Database:** PostgreSQL with clients → contacts → tickets data model
- **Deployment:** Railway platform (monolithic deployment)

**Recent Enhancement:** Outlook Add-in integration recently completed (Epics 1-7), enabling email-to-ticket creation from Outlook.

### Available Documentation Analysis

✅ **Using existing project analysis from document-project output**

#### Available Documentation

- ✅ Tech Stack Documentation ([tech-stack.md](architecture/tech-stack.md))
- ✅ Source Tree/Architecture ([source-tree-organization.md](architecture/source-tree-organization.md), [high-level-architecture.md](architecture/high-level-architecture.md))
- ✅ Coding Standards ([coding-standards.md](architecture/coding-standards.md))
- ✅ API Documentation ([api-specification.md](architecture/api-specification.md))
- ✅ External API Documentation ([external-apis.md](architecture/external-apis.md))
- ⚠️ UX/UI Guidelines (Partial - inferred from Outlook Add-in implementation, **UI discussion needed**)
- ✅ Technical Debt Documentation ([technical-debt.md](architecture/technical-debt.md))
- ✅ Database Schema ([database-schema.md](architecture/database-schema.md))

**Additional Context:** Functional AssetFlow system exists at `/Users/dgivens/Documents/Code/assetflow` with **working Lenovo Warranty API integration**. The Lenovo API implementation will be ported to this project (API key available). **No data migration from AssetFlow** - starting fresh with empty asset database.

### Enhancement Scope Definition

#### Enhancement Type

☑ **Integration with New Systems** + **New Feature Addition**

#### Enhancement Description

Integrate asset management capabilities into the ticketing system, connecting assets to contacts/clients and providing one-click access to ScreenConnect (remote desktop) and PDQ Connect (deployment tools) directly from ticket workflows. This eliminates manual system-switching that currently wastes 30-60 seconds per support call.

#### Impact Assessment

☑ **Moderate Impact** (some existing code changes)

The enhancement extends the existing Client/Contact data model with a new Asset entity, adds asset detail pages, and integrates asset widgets into ticket detail pages. The Outlook Add-in remains unchanged (explicit constraint). Caching strategy required to maintain ticket creation performance (<10 seconds target must not degrade).

### Goals and Background Context

#### Goals

- Eliminate 30-60 seconds of ScreenConnect search time per active support call (5-15 minutes/day savings, 20-60 hours annually)
- Achieve 80%+ asset coverage for active contacts within 3 months through friction-reduced asset management
- Enable one-click remote access (ScreenConnect) and deployment tool access (PDQ Connect) from ticket workflows
- Provide instant visibility into warranty status via color-coded displays (red/yellow/green)
- Create positive feedback loop where easy asset access incentivizes inventory maintenance
- Enable proactive client service through warranty expiration tracking and aging reports

#### Background Context

Support technicians currently manage client IT assets across four fragmented systems: the Ticketing System for work logging, Notion spreadsheets for asset inventory, ScreenConnect for remote access, and PDQ Connect for deployments. Each support call requires manual context switching—opening tickets, searching Notion for asset details, then manually hunting through ScreenConnect's interface to find the correct computer.

This friction wastes 30-60 seconds per interaction and creates a negative feedback loop: difficult asset access discourages inventory updates → stale inventory reduces system value → reduced value further discourages maintenance.

The AssetFlow project previously built a standalone asset management system with excellent data modeling and Lenovo warranty API integration, but it lacks ticketing integration. This enhancement brings AssetFlow's capabilities directly into the ticketing workflow, creating a unified experience where asset information and remote tool access are always one click away from the active ticket.

**Timing:** The recent Outlook Add-in deployment creates the perfect moment to introduce asset integration—adding value alongside new functionality improves adoption, and the existing Client/Contact structure provides the foundation for asset relationships.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD Creation | 2025-10-16 | 1.0 | Created brownfield enhancement PRD from comprehensive project brief | John (PM) |

---

## Requirements

### Functional Requirements

**FR1:** The system shall support creating assets with required fields: hostname, client assignment (required - every asset must belong to a client), in-service date, and optional fields: contact assignment (nullable - assets may be unassigned), manufacturer, model, serial number, warranty expiration, PDQ device ID, ScreenConnect session ID. In-service date may be auto-populated from Lenovo Warranty API when available or manually entered.

**FR2:** The system shall maintain assets directly associated with a single Client (one-to-many: Client → Assets, required relationship). Assets MAY optionally be associated with a Contact within that Client (contact_id nullable). When a Contact is deleted, assets become unassigned (contact_id = null) but remain associated with the Client.

**FR2a:** The system shall require a Client assignment for all assets (client_id NOT NULL). Contact assignment is optional - assets can exist without an assigned contact when ownership is unclear or contact has been deleted.

**FR3:** The system shall display assets on ticket detail pages when a contact is assigned to the ticket, showing up to 2 most relevant assets with hostname, warranty expiration date (color-coded), ScreenConnect link, and PDQ Connect link.

**FR4:** The system shall construct ScreenConnect URLs using the pattern `https://zollc.screenconnect.com/Host#Access///{sessionID}/Join` from stored `screenconnect_session_id` field (no runtime API calls).

**FR5:** The system shall construct PDQ Connect URLs using the pattern `https://app.pdq.com/zero-one-llc/devices/{pdq_device_id}/info` from stored `pdq_device_id` field (no runtime API calls).

**FR6:** The system shall display warranty expiration dates with color-coding: red (expired or <30 days remaining), yellow/amber (30-180 days remaining), green (>180 days remaining), gray (unknown/no date).

**FR7:** The system shall cache all asset data (expected <1000 assets) on application startup with invalidation on asset create/update/delete operations to ensure <500ms asset widget load times.

**FR8:** The system shall integrate Lenovo Warranty API for automatic warranty lookup by serial number for Lenovo devices, auto-populating warranty expiration date, in-service date (warranty start date), service level, and product name.

**FR9:** The system shall allow manual warranty date and in-service date entry for all manufacturers (Lenovo, Dell, HP, and others).

**FR10:** The system shall provide asset detail pages with full CRUD operations: create, view, edit, retire (soft delete), and permanent delete (for assets retired >2-3 years).

**FR11:** The system shall display "No assets tracked for this contact" gracefully when a ticket's assigned contact has zero assets, without errors or broken UI.

**FR12:** The system shall add a `notion_url` field to the Client model, displayed in ticket detail headers as a clickable link for quick access to client documentation.

**FR13:** The system shall load asset widgets on ticket detail pages asynchronously (non-blocking) to prevent impact on ticket page rendering performance.

**FR14:** The system shall maintain existing ticket creation speed (<10 seconds target) - asset integration must not degrade core workflow performance.

**FR15:** The system shall display asset widgets only in the web interface ticket detail pages - Outlook Add-in remains unchanged (explicit constraint).

**FR16:** The system shall allow editing asset contact assignment, including reassigning to a different contact or setting to unassigned (null). When a contact is deleted, all associated assets shall be set to unassigned (not transferred to system contact).

**FR17:** The system shall support asset lifecycle states: active (in use), retired (soft deleted with retired_at timestamp), and eligible for permanent deletion (retired for >2-3 years). Retired assets shall be excluded from ticket widgets and active asset lists but remain queryable.

**FR18:** The system shall calculate asset age from in-service date for aging reports and replacement planning (5-year lifecycle tracking).

### Non-Functional Requirements

**NFR1:** Asset widget shall load on ticket detail page with <500ms latency (no impact on perceived page load time).

**NFR2:** Asset data cache lookup time shall be <10ms (in-memory or Redis cache).

**NFR3:** ScreenConnect/PDQ link construction shall complete in <5ms (simple string concatenation with stored IDs).

**NFR4:** Ticket creation page load time shall remain unchanged (<10 seconds total from FR of base system).

**NFR5:** Asset detail page load time shall be <1 second.

**NFR6:** The system shall support modern browsers (Chrome, Edge, Safari, Firefox - last 2 versions) matching existing system requirements.

**NFR7:** Lenovo Warranty API calls shall have 10-second timeout with graceful error handling for network failures.

**NFR8:** The system shall store Lenovo API key securely in environment variables (no hardcoded credentials).

**NFR9:** Cache hit rate for asset data shall maintain 95%+ to validate caching strategy effectiveness.

**NFR10:** The system shall implement soft deletes (retirement) for assets to enable audit trail, recovery capability, and lifecycle reporting.

### Compatibility Requirements

**CR1:** Asset integration must not modify existing Client, Contact, or Ticket core functionality - purely additive enhancement.

**CR2:** Database schema changes must use migrations compatible with existing PostgreSQL schema and migration tooling.

**CR3:** Asset widget must integrate with existing ticket detail page UI patterns (shadcn/ui components, Tailwind CSS styling).

**CR4:** Outlook Add-in codebase must remain completely unchanged - no asset-related code or dependencies added.

---

## User Interface Enhancement Goals

### Integration with Existing UI

The asset management interface must seamlessly integrate with the existing ticketing system's UI patterns:

- **Consistent component library:** Use existing shadcn/ui components (buttons, forms, tables, cards, badges)
- **Styling consistency:** Follow existing Tailwind CSS utility patterns and color scheme
- **Layout patterns:** Match existing page layouts (header, navigation, content area structure)
- **Typography:** Use existing font stack and text sizing conventions
- **Responsive behavior:** Match existing mobile/tablet breakpoints and navigation patterns

**Key Principle:** A technician should not perceive asset features as "added-on" but as natural extensions of the existing interface.

### Modified/New Screens and Views

#### 1. Asset Detail Page (New)
**Purpose:** Full CRUD interface for individual assets - foundation of asset management

**Key UI Elements:**
- Asset header: Hostname (prominent), status badge (Active/Retired), client/contact breadcrumb
- Info card: Manufacturer, model, serial number, in-service date (editable inline or via form)
- Warranty section: Expiration date with color-coded badge, "Refresh from Lenovo API" button (if Lenovo)
- External tool links: Prominent ScreenConnect and PDQ Connect buttons (primary action style)
- Contact assignment: Dropdown selector with "Unassigned" option
- Metadata: Created/updated timestamps, retirement date (if retired)
- Action buttons: Edit, Retire (if active), Permanently Delete (if retired >2-3 years)

**Layout Style:** Single-column form/detail view, similar to ticket detail page

#### 2. Asset List/Browse Page (New)
**Purpose:** View all assets with filtering and search capabilities

**Key UI Elements:**
- Table view: Hostname, Contact, Client, Warranty Expiration (color-coded), Status, Actions
- Filters: Client dropdown, Status (Active/Retired), Manufacturer dropdown, Warranty status
- Search: Real-time search across hostname, model, serial number
- Quick actions: View, Edit, Retire icons per row
- "Add Asset" button (prominent, top-right)
- Empty state: "No assets found" with "Add your first asset" CTA

**Layout Style:** Full-width table with sticky header, pagination for >50 results

#### 3. Asset Widget on Ticket Detail Page (Modified Existing Screen)
**Purpose:** Contextual asset display during active support workflow - THE KILLER FEATURE

**Key UI Elements:**
- Compact card/section below or beside contact information
- For each asset (max 2 shown):
  - Hostname (linked to asset detail)
  - Warranty expiration date with color-coded badge (red/yellow/green/gray)
  - ScreenConnect button (icon + "Remote" label, primary action)
  - PDQ Connect button (icon + "Deploy" label, secondary action)
- "View all X assets" link if contact has >2 assets
- Empty state: "No assets tracked for [Contact Name]" with "Add Asset" link
- **Async loading:** Skeleton UI while loading, no spinner (seamless integration)

**Layout Style:** Minimal card/panel that doesn't dominate the page, collapses gracefully on mobile

**UI DECISIONS FINALIZED:**
- **Placement:** Asset widget appears **above** time entries section on ticket detail
- **Expansion:** Defaults to **visible**, with collapsible option
- **Mobile behavior:** **Hidden** on mobile (button to reveal: "View Assets")
- **Link styling:** **Button style** (primary for ScreenConnect, secondary for PDQ)

#### 4. Asset Creation/Edit Form (New - Modal Dialog)
**Purpose:** Fast asset onboarding with optional Lenovo API integration

**Key UI Elements:**
- **Modal dialog** presentation (not dedicated page)
- **All fields visible** (no collapsed "Advanced" section):
  - Required: Hostname, Contact (dropdown with "Unassigned" option), In-service date
  - Optional: Manufacturer, Model, Serial Number, Warranty Expiration, PDQ Device ID, ScreenConnect Session ID
- **Lenovo API integration:** "Lookup Warranty" button next to Serial Number field (visible when manufacturer = Lenovo)
  - **Button click** triggers API call (not auto-trigger on blur)
  - Auto-populated fields after API call: Warranty expiration, In-service date, Service level, Product name
  - All fields remain **editable** after API lookup (manual override)
- Form validation: Hostname required, date pickers for dates, pattern validation for IDs
- Cancel/Save buttons at modal footer

**Layout Style:** Modal overlay (~600px wide), scrollable content if needed, focus trap

#### 5. Clients Page - Notion URL Field (Modified Existing Screen)
**Purpose:** Add client documentation link to existing client management

**IMPORTANT:** There is no "Client Detail Page" - clients are managed as a list with inline edit or modal form (similar to existing ClientsPage pattern).

**Key UI Elements:**
- Add "Notion URL" field to client create/edit form (text input with URL validation)
- Display in clients list table (optional column, or icon if URL exists)
- Display on ticket detail: Small link/icon near client name in header ("View Docs" icon)

**Layout Style:** Minimal addition to existing clients list/form pattern

#### 6. Contact Asset Management (Out of Scope for MVP)
**Future Enhancement:** View/manage contact's assets from Contacts Page - deferred to Phase 2

**Rationale:** ContactsPage is a list view without detail pages (similar to ClientsPage). Asset access primarily happens via ticket detail page (killer feature). Adding asset context to contact list is low priority.

### Navigation Strategy - Addressing Navbar Crowding

**Current Navbar Situation:**
The navbar currently has 7 items: Dashboard, Tickets, Create Ticket, Clients, Contacts, Invoices, Settings

**Problem:** Adding "Assets" as an 8th top-level item will overcrowd the navbar, especially on smaller desktop viewports.

**Proposed Solution: Nested "Manage" Dropdown**

Group related management pages under a collapsible "Manage" dropdown menu:

```
Desktop Navbar:
- Dashboard
- Tickets
- Create Ticket
- Manage ▾ (dropdown)
  - Clients
  - Contacts
  - Assets (NEW)
  - Settings
- Invoices
```

**Rationale:**
- Clients, Contacts, Assets, and Settings are all data/system management pages (not workflow pages)
- Reduces top-level nav items from 8 → 5 (significant decluttering)
- "Manage" dropdown provides semantic grouping for all configuration/data management
- Primary workflows (Dashboard, Tickets, Create Ticket, Invoices) remain top-level for quick access
- Settings naturally fits with other management functions (users, integrations, system config)

**Implementation Notes:**
- Use shadcn/ui `DropdownMenu` component for "Manage" menu
- Desktop: Click to open dropdown (not hover, for accessibility)
- Mobile: Hamburger menu shows nested structure (Manage → sub-items)
- Active state indication: Dropdown parent highlighted when on Clients/Contacts/Assets/Settings page
- Icon for "Manage": Users or Database icon from lucide-react

**Alternative Considered (Rejected):**
- **Option B:** "Assets" as sub-item under "Tickets" dropdown - Rejected because assets are managed independently, not always ticket-related
- **Option C:** No navbar link, access via Dashboard widget - Rejected because direct navigation is needed for asset browsing/management

### UI Consistency Requirements

**Color-Coded Warranty Status:**
- Red badge: `bg-red-100 text-red-800 border border-red-300` (or similar Tailwind classes)
- Yellow badge: `bg-yellow-100 text-yellow-800 border border-yellow-300`
- Green badge: `bg-green-100 text-green-800 border border-green-300`
- Gray badge: `bg-gray-100 text-gray-800` (no warranty data)

**External Tool Links:**
- ScreenConnect: Primary button style (blue), remote desktop icon
- PDQ Connect: Secondary button style (gray), deployment/package icon
- Target: `_blank` (new tab), include external link icon indicator

**Form Components:**
- Reuse existing form input components from ticket/client/contact forms
- Consistent error messaging patterns
- Inline validation feedback (not modal alerts)

---

## Technical Constraints and Integration Requirements

### Existing Technology Stack

Based on document-project analysis, the enhancement must align with:

| Category | Technology | Version | Usage | Notes |
|----------|------------|---------|-------|-------|
| Frontend Framework | React | 18.3.1 | Asset UI components | Match main frontend version |
| Frontend Language | TypeScript | 5.8.3 | Type-safe asset data models | Shared types recommended |
| Build Tool | Vite | 5.4.19 | Asset module bundling | Existing build config |
| CSS Framework | Tailwind CSS | 3.4.17 | Asset widget styling | Reuse existing config |
| UI Components | shadcn/ui (Radix UI) | 1.x | Asset forms, tables, badges | Consistent component usage |
| HTTP Client | Fetch API (native) | Native | Lenovo API calls | No new dependencies |
| Backend Framework | Node.js Express | Current | Asset REST API | Extend existing server |
| Database | PostgreSQL | 14+ | Asset tables | Use existing connection |
| Authentication | express-session cookies | Current | Asset endpoint auth | Reuse existing middleware |
| Package Manager | npm | 9+ | Dependency management | NPM workspaces pattern |

**Migration/Integration Notes:**
- AssetFlow used SQLite - PostgreSQL migration not needed (no data migration)
- AssetFlow's Lenovo warranty service code is portable (axios → native fetch conversion)
- Asset caching layer is net-new (Redis or in-memory)

### Integration Approach

#### Database Integration Strategy

**Asset Schema Addition:**
```sql
-- New assets table
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  hostname VARCHAR(255) NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE, -- required
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL, -- nullable (optional)
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  in_service_date DATE NOT NULL,
  warranty_expiration_date DATE,
  pdq_device_id VARCHAR(255),
  screenconnect_session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active' or 'retired'
  retired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_client_id ON assets(client_id);
CREATE INDEX idx_assets_contact_id ON assets(contact_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_warranty_expiration ON assets(warranty_expiration_date);

-- Extend clients table
ALTER TABLE clients ADD COLUMN notion_url VARCHAR(500);
```

**Migration Strategy:**
- Use existing migration tooling (Sequelize/TypeORM/Prisma based on current setup)
- Single migration for asset table creation
- Separate migration for clients.notion_url addition (can be deployed independently)
- No data migration required (fresh start)

#### API Integration Strategy

**RESTful Endpoint Structure:**
```
POST   /api/assets                    - Create asset
GET    /api/assets                    - List assets (with filters: client_id, contact_id, status)
GET    /api/assets/:id                - Get asset detail
PUT    /api/assets/:id                - Update asset
DELETE /api/assets/:id                - Retire asset (soft delete)
DELETE /api/assets/:id/permanent      - Permanently delete (if retired >2-3 years)

POST   /api/assets/:id/warranty-lookup - Trigger Lenovo API warranty lookup
GET    /api/assets/widget/:ticket_id   - Get assets for ticket's contact (widget endpoint)

PUT    /api/clients/:id                - Update client (including notion_url)
```

**Authentication:** All endpoints require existing session-based authentication (reuse middleware)

**Lenovo Warranty API Integration:**
- Port AssetFlow's `lenovoWarranty.js` service (https://supportapi.lenovo.com/v2.5/warranty)
- ClientID header: `LENOVO_API_KEY` environment variable
- 10-second timeout, comprehensive error handling
- Response parsing: Extract warranty end date, start date, service level, product name
- Optional: Cache warranty lookups in database (warranty_lookups table - future enhancement)

#### Frontend Integration Strategy

**Asset Module Structure:**
```
frontend/src/
  components/
    assets/
      AssetWidget.tsx         - Ticket detail widget (THE KILLER FEATURE)
      AssetDetail.tsx         - Full asset detail page
      AssetList.tsx           - Asset browse/list page
      AssetForm.tsx           - Create/edit form
      WarrantyBadge.tsx       - Color-coded warranty display
      ExternalToolLinks.tsx   - ScreenConnect/PDQ buttons
  lib/
    api/
      assets.ts               - Asset API client functions
      lenovoWarranty.ts       - Lenovo API wrapper
  types/
    assets.ts                 - Asset TypeScript interfaces
  hooks/
    useAssetCache.ts          - Client-side asset caching hook
```

**State Management:**
- React Context for asset cache (if client-side caching)
- OR rely on server-side cache with simple fetch patterns
- No Redux/Zustand needed (keep it simple)

**Async Loading Pattern:**
- AssetWidget uses React.lazy or dynamic import
- Skeleton UI during load (shadcn/ui Skeleton component)
- Error boundary for widget failures (graceful degradation)

#### Testing Integration Strategy

**Unit Tests:**
- Lenovo API service mock tests
- Warranty date color-coding logic
- URL construction functions
- Asset age calculation

**Manual QA Focus:**
- Asset widget load time on ticket detail (<500ms)
- ScreenConnect/PDQ link functionality (click, new tab, correct URL)
- Warranty color-coding visual accuracy
- Cache invalidation on asset updates

**Integration Tests (Optional):**
- Asset CRUD API endpoints
- Widget endpoint with ticket context

### Code Organization and Standards

**File Structure Approach:**
Follow existing monorepo patterns:
```
/backend/src/
  routes/assets.js          - Asset REST endpoints
  routes/warranty.js        - Warranty lookup endpoint
  services/assetCache.js    - Cache service layer
  services/lenovoWarranty.js - Lenovo API integration
  models/asset.js           - Asset model (Sequelize/TypeORM/Prisma)

/frontend/src/
  components/assets/        - Asset-specific components
  pages/AssetDetailPage.tsx - Asset detail route
  pages/AssetListPage.tsx   - Asset list route
```

**Naming Conventions:**
- Follow existing codebase conventions (camelCase JS, PascalCase components)
- Asset-related exports prefixed/namespaced: `AssetWidget`, `useAssetCache`, `assetApi`

**Coding Standards:**
- Match existing ESLint/Prettier configuration
- TypeScript strict mode (existing requirement)
- Consistent error handling patterns (existing API error format)

**Documentation Standards:**
- JSDoc comments for public API functions
- README update with asset feature section
- API endpoint documentation (if OpenAPI/Swagger exists)

### Deployment and Operations

**Build Process Integration:**
- Asset frontend code bundled with existing Vite build
- No separate deployment artifacts
- Bundle size impact: Target <50KB additional gzipped JS

**Deployment Strategy:**
- Standard Railway deployment (existing monolith)
- Database migration runs automatically (existing CI/CD pattern)
- Environment variable addition: `LENOVO_API_KEY`
- No infrastructure changes required

**Monitoring and Logging:**
- Use existing logging framework (Winston/Pino/console)
- Log Lenovo API calls (success/failure, response time)
- Log cache hit/miss rates (validate NFR9)
- Alert on asset widget load time exceeding 500ms

**Configuration Management:**
```bash
# .env additions
LENOVO_API_KEY=your_lenovo_api_key_here
ASSET_CACHE_TTL=86400  # 24 hours (or indefinite with manual invalidation)
ASSET_CACHE_TYPE=memory # 'memory' or 'redis'
```

### Risk Assessment and Mitigation

**Technical Risks:**

1. **Cache Invalidation Bugs (HIGH)**
   - **Risk:** Stale asset data displayed after updates
   - **Mitigation:**
     - Comprehensive cache invalidation tests
     - Manual "refresh cache" admin endpoint
     - Short TTL fallback (4 hours) if bugs persist
   - **Rollback:** Disable caching, accept slower queries temporarily

2. **Lenovo API Rate Limiting (MEDIUM)**
   - **Risk:** API throttling during bulk lookups
   - **Mitigation:**
     - Implement request queuing (1 request per second)
     - Cache warranty responses in database
     - Manual entry fallback always available
   - **Rollback:** Disable automatic lookups, manual entry only

3. **Performance Degradation on Ticket Pages (HIGH)**
   - **Risk:** Asset widget slows ticket detail rendering
   - **Mitigation:**
     - Async widget loading (non-blocking)
     - Performance budgets in CI (Lighthouse)
     - Feature flag to disable widget if needed
   - **Rollback:** Hide asset widget behind "View Assets" button

4. **URL Pattern Changes (LOW)**
   - **Risk:** ScreenConnect/PDQ URL structures change
   - **Mitigation:**
     - Environment variable for URL templates
     - 404 detection and fallback messaging
     - Documentation for URL pattern updates
   - **Rollback:** Display raw IDs with instructions

**Integration Risks:**

1. **Database Schema Conflicts (LOW)**
   - **Risk:** Migration fails due to naming conflicts
   - **Mitigation:** Review existing schema before migration naming
   - **Rollback:** Drop assets table, revert clients column

2. **Contact Deletion Cascade (MEDIUM)**
   - **Risk:** Assets orphaned incorrectly on contact delete
   - **Mitigation:**
     - Unit tests for cascade behavior
     - UI confirmation showing asset count before delete
   - **Rollback:** Manual SQL to reassign assets

3. **Outlook Add-in Cross-Contamination (MEDIUM)**
   - **Risk:** Asset code accidentally imported into add-in
   - **Mitigation:**
     - Linting rule: No imports from `frontend/src/components/assets` in `outlook-addin/`
     - Separate build verification
   - **Rollback:** Remove asset imports, rebuild add-in

**Deployment Risks:**

1. **Environment Variable Missing (MEDIUM)**
   - **Risk:** Deployment fails without `LENOVO_API_KEY`
   - **Mitigation:**
     - Graceful degradation (Lenovo lookup disabled, not app crash)
     - Deployment checklist includes env var verification
   - **Rollback:** Hot-add env var, restart service

---

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision:** **Single Comprehensive Epic**

This brownfield enhancement will be delivered as a single epic: **"Epic 15: Asset Management Integration"**

**Rationale:**
- All features work together toward one cohesive goal: integrate asset tracking into ticket workflows
- Asset detail pages, asset widget, Lenovo API, caching are interdependent components
- Brownfield integration extends existing Client/Contact/Ticket models - cohesive database changes
- Deploying partial features provides limited value (widget without assets = useless; assets without widget = no killer feature)
- Typical brownfield pattern: single epic for cohesive enhancements
- Clear MVP boundary: Manual asset entry with Lenovo API only (PDQ API deferred to Phase 2)

**Confirmed with user:** This story sequence is designed to minimize risk to existing system. The order prioritizes foundation → standalone features → integration, allowing incremental validation without breaking ticket workflows.

---

## Epic 15: Asset Management Integration

**Epic Goal:** Integrate asset management capabilities into the ticketing system, enabling one-click access to ScreenConnect and PDQ Connect from ticket workflows, with color-coded warranty status display and Lenovo warranty API automation. This epic eliminates 30-60 seconds of manual system-switching per support call while maintaining zero performance impact on existing ticket workflows.

**Integration Requirements:**
- Extend existing Client/Contact data model with Asset entity
- Maintain ticket creation performance (<10 seconds target)
- Outlook Add-in remains completely unchanged
- All asset features async-loaded to prevent blocking ticket workflows

### Story 15.1: Asset Database Schema and Models

As a **developer**,
I want **database tables and models for storing asset information**,
so that **the application can persist asset data with proper relationships to contacts**.

#### Acceptance Criteria

1. Database migration creates `assets` table with columns: `id`, `hostname`, `contact_id` (FK nullable), `manufacturer`, `model`, `serial_number`, `in_service_date`, `warranty_expiration_date`, `pdq_device_id`, `screenconnect_session_id`, `status` ('active'/'retired'), `retired_at`, `created_at`, `updated_at`
2. Foreign key constraint: `assets.contact_id` references `contacts.id` with ON DELETE SET NULL (assets become unassigned when contact deleted)
3. Indexes created: `idx_assets_contact_id`, `idx_assets_status`, `idx_assets_warranty_expiration`
4. Backend model/entity created for Asset with TypeScript types (if using TypeORM/Prisma) or Sequelize model
5. Model validation: hostname required, in_service_date required, dates validated, status enum validated
6. Migration runs successfully on local PostgreSQL and can be rolled back
7. Separate migration extends `clients` table: `ADD COLUMN notion_url VARCHAR(500)`
8. Both migrations tested with existing data (no breaking changes to Client/Contact/Ticket tables)

#### Integration Verification

- IV1: Existing ticket creation workflow unaffected (manual smoke test)
- IV2: Contact deletion sets asset contact_id to NULL (not cascade delete assets)
- IV3: Asset status defaults to 'active' on creation

### Story 15.2: Asset CRUD API Endpoints

As a **developer**,
I want **RESTful API endpoints for asset management**,
so that **the frontend can create, read, update, and retire assets**.

#### Acceptance Criteria

1. `POST /api/assets` creates new asset with validation (hostname, in_service_date required)
2. `GET /api/assets` returns list of active assets with filters: `?client_id=X`, `?contact_id=X`, `?status=active|retired`
3. `GET /api/assets/:id` returns single asset with full details including contact and client information
4. `PUT /api/assets/:id` updates asset fields (hostname, contact_id, manufacturer, model, serial_number, in_service_date, warranty_expiration_date, pdq_device_id, screenconnect_session_id)
5. `DELETE /api/assets/:id` soft-deletes asset (sets status='retired', retired_at=NOW)
6. `DELETE /api/assets/:id/permanent` permanently deletes asset (only if retired_at > 2 years ago)
7. All endpoints require authentication (reuse existing session middleware)
8. Endpoints return appropriate HTTP status codes (200, 201, 400, 404, 403, 500)
9. Request validation returns clear error messages (e.g., "Hostname is required", "Invalid date format")
10. Contact assignment allows null (unassigned assets)

#### Integration Verification

- IV1: API endpoints follow existing error handling patterns (consistent with tickets API)
- IV2: Authentication middleware reused (no new auth logic)
- IV3: Retired assets excluded from `GET /api/assets` default query (must explicitly request status=retired)

### Story 15.3: Asset List Page UI

As a **user**,
I want **to view and manage all assets in a list**,
so that **I can browse my asset inventory and perform bulk operations**.

#### Acceptance Criteria

1. Asset list page accessible at `/assets` route
2. Table displays: Hostname, Contact Name, Client Name, Warranty Expiration (color-coded badge), Status, Actions
3. Color-coding: Red (<30 days), Yellow (30-180 days), Green (>180 days), Gray (no date)
4. Filters: Client dropdown, Status (Active/Retired/All), search input (hostname, model, serial)
5. "Add Asset" button (top-right) opens create modal
6. Quick actions per row: View (navigate to detail), Edit (open modal), Retire (confirm dialog)
7. Empty state: "No assets found" with "Add your first asset" CTA
8. Pagination if >50 assets
9. Real-time search (debounced 300ms)
10. Responsive: Table collapses to cards on mobile

#### Integration Verification

- IV1: Page uses existing shadcn/ui Table, Button, Badge components
- IV2: Matches styling of Clients/Contacts pages (consistent UI patterns)
- IV3: Page loads in <2 seconds (existing performance standard)

### Story 15.4: Asset Detail Page and Form Modal

As a **user**,
I want **to view full asset details and edit asset information**,
so that **I can maintain accurate asset records**.

#### Acceptance Criteria

1. Asset detail page accessible at `/assets/:id` route
2. Asset header: Hostname (prominent, h1), Status badge, Client/Contact breadcrumb
3. Info card displays: Manufacturer, Model, Serial Number, In-service Date, Warranty Expiration (color-coded), PDQ Device ID, ScreenConnect Session ID
4. Contact assignment: Dropdown with all contacts + "Unassigned" option, grouped by client
5. External tool buttons: "Connect via ScreenConnect" (primary), "Open in PDQ Connect" (secondary), disabled if IDs missing
6. Action buttons: Edit (opens modal), Retire (if active, confirm dialog), Permanently Delete (if retired >2 years, confirm dialog)
7. Edit modal: All fields editable, modal width ~600px, Cancel/Save buttons
8. Create modal (from list page "Add Asset"): Same form, hostname + in_service_date required, contact optional
9. Form validation: Hostname required, dates use date picker, inline error messages
10. Created/Updated timestamps displayed (read-only)
11. Retired assets show "Retired on [date]" message

#### Integration Verification

- IV1: Modal uses shadcn/ui Dialog component (matches existing modals)
- IV2: Form inputs match existing ticket/client/contact form patterns
- IV3: ScreenConnect/PDQ buttons open in new tab (target="_blank")

### Story 15.5: Lenovo Warranty API Integration

As a **user**,
I want **to automatically lookup warranty information for Lenovo devices**,
so that **I don't have to manually enter warranty dates**.

#### Acceptance Criteria

1. Backend service `lenovoWarranty.js` ported from AssetFlow project
2. Service function `lookupLenovoWarranty(serialNumber)` calls `https://supportapi.lenovo.com/v2.5/warranty`
3. API request uses `ClientID` header with `LENOVO_API_KEY` environment variable
4. 10-second timeout with graceful error handling (network errors, 401, 404, 429)
5. Response parsing extracts: warranty_expiration_date, in_service_date (warranty start), service_level, product_name
6. API endpoint `POST /api/assets/:id/warranty-lookup` triggers lookup
7. Asset form modal: "Lookup Warranty" button appears when manufacturer field contains "Lenovo" (case-insensitive)
8. Button click triggers API call, shows loading spinner, auto-populates fields on success
9. All fields remain editable after API lookup (manual override allowed)
10. Error handling displays user-friendly messages: "Serial number not found", "API rate limit exceeded", "Network error"
11. Graceful degradation: If `LENOVO_API_KEY` missing, button shows "API key not configured" tooltip

#### Integration Verification

- IV1: Asset form works without Lenovo API (manual entry fallback)
- IV2: Non-Lenovo assets unaffected (button hidden)
- IV3: API errors don't crash form (validation errors displayed inline)

### Story 15.6: Asset Caching Layer

As a **developer**,
I want **an in-memory cache for asset data**,
so that **asset widget loads in <500ms without database queries**.

#### Acceptance Criteria

1. Backend service `assetCache.js` implements in-memory asset cache
2. Cache loads all active assets on application startup (full dataset <1000 assets)
3. Cache structure: Map keyed by contact_id → array of assets
4. Cache methods: `getAssetsByContactId(contactId)`, `invalidateCache()`, `warmCache()`
5. Cache invalidation triggers on: asset create, asset update, asset delete
6. Cache TTL: Indefinite (manual invalidation only, or configurable via `ASSET_CACHE_TTL` env var)
7. Cache hit/miss logging for monitoring (console.log cache stats on access)
8. API endpoint `GET /api/assets/widget/:ticketId` uses cache to fetch assets for ticket's contact
9. Widget endpoint returns: up to 2 most recent assets (by created_at DESC), includes hostname, warranty_expiration_date, status, external tool IDs
10. Manual cache refresh endpoint: `POST /api/assets/cache/refresh` (admin only)

#### Integration Verification

- IV1: Cache lookup completes in <10ms (validates NFR2)
- IV2: Widget endpoint returns in <100ms (validates <500ms target with rendering time)
- IV3: Cache invalidates correctly on asset updates (manual test: update asset, verify widget shows new data)

### Story 15.7: Asset Widget on Ticket Detail Page

As a **user**,
I want **to see a contact's assets on the ticket detail page**,
so that **I can quickly access ScreenConnect and PDQ Connect during support calls**.

#### Acceptance Criteria

1. Asset widget component `AssetWidget.tsx` added to Ticket Detail Page
2. Widget placement: Above time entries section, below contact information
3. Widget loads asynchronously (React.lazy or useEffect) - doesn't block ticket page render
4. Skeleton UI displayed while loading (shadcn/ui Skeleton component)
5. Widget displays up to 2 assets for ticket's assigned contact:
   - Hostname (linked to `/assets/:id`)
   - Warranty expiration date with color-coded badge (red/yellow/green/gray)
   - "Connect via ScreenConnect" button (primary, disabled if no session ID)
   - "Open in PDQ Connect" button (secondary, disabled if no device ID)
6. "View all X assets" link if contact has >2 assets (links to `/assets?contact_id={contactId}`)
7. Empty state: "No assets tracked for [Contact Name]" with "Add Asset" button
8. Widget defaults to visible, with collapse/expand toggle (chevron icon)
9. Mobile: Widget hidden by default, "View Assets" button reveals it
10. Error boundary: Widget failures don't crash ticket page (show "Unable to load assets" message)
11. Widget only appears if ticket has assigned contact (hidden if contact_id null)

#### Integration Verification

- IV1: Ticket page load time unchanged (<10 seconds, existing standard)
- IV2: Widget load time <500ms (validates NFR1)
- IV3: Existing ticket functionality unaffected (time entries, notes, close ticket all work)
- IV4: ScreenConnect/PDQ buttons construct correct URLs and open in new tab

### Story 15.8: Client Notion URL Field

As a **user**,
I want **to add a Notion documentation link to clients**,
so that **I can quickly access client documentation from ticket pages**.

#### Acceptance Criteria

1. Backend: Clients table already extended with `notion_url` column (Story 15.1 migration)
2. API: `PUT /api/clients/:id` endpoint accepts `notion_url` field (URL validation)
3. Clients list page: Add "Notion URL" column (optional, shows icon if URL exists)
4. Client create/edit form: Add "Notion URL" text input (URL format validation)
5. Ticket detail page: Display "View Docs" icon/link near client name in header (only if notion_url exists)
6. Link opens in new tab (target="_blank"), includes external link icon indicator
7. Graceful empty state: If no notion_url, no link displayed (clean UI)
8. Form validation: Must be valid URL format (https://...) or empty

#### Integration Verification

- IV1: Client CRUD operations unaffected (existing client functionality intact)
- IV2: Notion link appears on ticket detail without layout shift
- IV3: URL validation prevents broken links (invalid URLs rejected on save)

### Story 15.9: Navigation - "Manage" Dropdown

As a **user**,
I want **a "Manage" dropdown in the navbar**,
so that **I can access Clients, Contacts, Assets, and Settings without overcrowding the navbar**.

#### Acceptance Criteria

1. Navbar refactored to use shadcn/ui DropdownMenu component
2. Desktop navbar structure:
   - Dashboard
   - Tickets
   - Create Ticket
   - Manage ▾ (dropdown with: Clients, Contacts, Assets, Settings)
   - Invoices
3. "Manage" dropdown icon: Users or Database icon (lucide-react)
4. Dropdown opens on click (not hover, for accessibility)
5. Active state: "Manage" dropdown highlighted when on Clients/Contacts/Assets/Settings page
6. Mobile: Hamburger menu shows nested structure (Manage → sub-items expandable)
7. Routes remain unchanged: `/clients`, `/contacts`, `/assets`, `/settings`
8. Keyboard navigation: Tab to "Manage", Enter/Space opens dropdown, Arrow keys navigate sub-items
9. Dropdown closes on selection or click outside
10. Existing Clients/Contacts/Settings nav items removed from top level (only Manage dropdown remains)

#### Integration Verification

- IV1: All existing pages remain accessible (no broken navigation)
- IV2: Mobile menu collapses/expands correctly
- IV3: Active page indication works (visual feedback for current location)

### Story 15.10: Asset Age Calculation and Retirement Workflow

As a **user**,
I want **to see asset age and manage asset retirement**,
so that **I can plan hardware refresh cycles and maintain clean inventory**.

#### Acceptance Criteria

1. Asset detail page displays calculated age: "X years old" (from in_service_date to today)
2. Asset list page: Add "Age" column (optional, can be hidden)
3. Retire workflow:
   - "Retire" button on active asset detail page
   - Confirmation dialog: "Retire [hostname]? Asset will be hidden from active lists."
   - Sets status='retired', retired_at=NOW
   - Retired assets excluded from widget, asset list (unless status=retired filter)
4. Retired asset detail page:
   - Shows "Retired on [date]" badge
   - "Reactivate" button available (sets status='active', clears retired_at)
   - If retired >2 years: "Permanently Delete" button available
5. Permanent delete:
   - Confirmation dialog: "Permanently delete [hostname]? This cannot be undone."
   - Hard deletes asset record from database
   - Only available if retired_at > 730 days ago
6. Asset list filter: "Status" dropdown includes Active, Retired, All
7. API: Age calculation helper function: `calculateAssetAge(inServiceDate)`
8. Retired assets don't appear in widget (only active assets)

#### Integration Verification

- IV1: Asset retirement doesn't affect tickets (tickets still reference contact, not asset directly)
- IV2: Retired assets queryable for audit (can view via status=retired filter)
- IV3: Permanent delete irreversible (confirmed via database check)

### Story 15.11: Testing, Performance Validation, and Documentation

As a **developer**,
I want **to validate performance requirements and document the asset feature**,
so that **the enhancement meets all acceptance criteria and is maintainable**.

#### Acceptance Criteria

1. **Performance Validation:**
   - Asset widget load time measured: <500ms confirmed (Story 15.7)
   - Ticket page load time unchanged: <10 seconds confirmed
   - Asset list page load time: <2 seconds for 300 assets
   - Cache hit rate logged: 95%+ over 24-hour test period
2. **Manual QA Checklist:**
   - Create asset (manual + Lenovo API lookup)
   - Edit asset (change contact assignment, update fields)
   - Retire asset → verify excluded from widget
   - Reactivate asset → verify appears in widget
   - Permanently delete retired asset (>2 years old)
   - ScreenConnect/PDQ buttons open correct URLs in new tab
   - Notion URL link works from ticket detail
   - Mobile: Asset widget hidden, "View Assets" button reveals it
   - Navbar "Manage" dropdown works (desktop + mobile)
   - Empty states: No assets for contact, no Notion URL, no external tool IDs
3. **Integration Testing:**
   - Contact deletion sets assets to unassigned (not cascade delete)
   - Asset widget doesn't break ticket page if API fails
   - Cache invalidation works on asset create/update/delete
   - Lenovo API errors handled gracefully (manual test with invalid serial)
4. **Documentation:**
   - README updated with "Asset Management" section
   - Environment variables documented: `LENOVO_API_KEY`, `ASSET_CACHE_TTL` (optional)
   - API endpoints documented (if OpenAPI/Swagger exists)
   - Migration notes: Two migrations (assets table + clients.notion_url)
5. **Code Quality:**
   - ESLint/Prettier checks passing
   - TypeScript strict mode compliance
   - No console errors on asset pages
   - Lighthouse score maintained (>90 performance)

#### Integration Verification

- IV1: All 18 Functional Requirements validated (FR1-FR18)
- IV2: All 10 Non-Functional Requirements validated (NFR1-NFR10)
- IV3: All 4 Compatibility Requirements validated (CR1-CR4)
- IV4: Outlook Add-in unchanged (no asset-related imports, separate build verified)

---

