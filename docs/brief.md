# Project Brief: Asset Management Integration

## Executive Summary

The **Asset Management Integration** project integrates asset tracking capabilities from AssetFlow into the existing ticketing system, creating a unified workflow that eliminates system switching and enables rapid access to critical IT asset information during support operations.

**Primary Problem:** Technicians currently switch between multiple systems (Tickets → Notion → ScreenConnect → PDQ Connect) to access asset information during support calls, creating friction that discourages inventory maintenance and slows active troubleshooting workflows.

**Target Market:** Internal use by Zero One LLC support technicians managing approximately 300 client assets across existing Client/Contact relationships.

**Key Value Proposition:** One-click access to remote support tools (ScreenConnect) and deployment systems (PDQ Connect) directly from ticket and asset pages, while maintaining zero performance impact on ticket creation workflows. The integration creates a positive feedback loop where easy asset access incentivizes inventory maintenance, which in turn improves support efficiency and billing accuracy.

---

## Problem Statement

**Current State and Pain Points:**

Support technicians managing client IT assets currently operate across fragmented systems:
- **Ticketing System** for work logging and time tracking
- **Notion documentation** for asset inventory spreadsheets
- **ScreenConnect** for remote desktop access
- **PDQ Connect** for deployment and device management

Each support interaction requires manual context switching between these systems. When a technician receives a call from a client about a computer issue, they must:
1. Create or open a ticket in the ticketing system
2. Navigate to Notion to find the client's asset inventory sheet
3. Identify which computer the client is referencing (by name or description)
4. Manually search ScreenConnect's interface to find the matching computer
5. Optionally check PDQ Connect for device details or deployment history

This multi-system workflow adds 30-60 seconds of friction to every support interaction and creates a negative feedback loop: the difficulty of accessing asset information discourages technicians from keeping the inventory updated, which makes the inventory less useful, which further reduces motivation to maintain it.

**Impact of the Problem:**

The fragmented workflow creates several measurable impacts:

- **Time waste during active support:** 30-60 seconds per ticket searching for computers in ScreenConnect, compounding across 10-15 daily support interactions (5-15 minutes/day lost)
- **Deferred inventory maintenance:** Friction discourages real-time asset updates, causing inventory drift and reducing system value
- **Revenue leakage:** Poor asset tracking makes time-to-asset attribution difficult, reducing accuracy of billable maintenance reporting
- **Reduced service quality:** Inability to quickly access warranty status or asset age limits proactive client communication about hardware refresh needs
- **Mental overhead:** Technicians maintain mental maps of which clients have which computers rather than trusting the system

For a 300-asset environment with 10-15 daily support interactions, the cumulative time loss is approximately 20-60 hours annually—time that could be spent on billable work or proactive client services.

**Why Existing Solutions Fall Short:**

Current tools were built for different purposes:
- **AssetFlow** was designed as a standalone asset management system with excellent data model and Lenovo warranty integration, but lacks ticketing integration
- **Ticketing System** focuses on time tracking and billing but has no asset context
- **Notion** provides flexible documentation but requires manual searching and offers no API integration with support tools
- **ScreenConnect** and **PDQ Connect** are powerful remote tools but require manual device lookup by name/hostname

No existing solution bridges the gap between ticketing workflows and asset information with the required performance characteristics (instant access without slowing ticket creation).

**Urgency and Importance:**

The Outlook Add-in integration is scheduled for deployment soon, making this the optimal time to introduce asset integration:
- **Brownfield advantage:** Existing Client/Contact structure provides foundation for asset relationships
- **Performance requirement:** Ticket creation speed is already optimized; asset integration must not degrade it
- **Positive timing:** Adding value (asset access) alongside new feature (Outlook Add-in) improves adoption
- **Business case:** Better asset tracking enables better billing attribution for maintenance work, creating measurable ROI

Every week of delay means continued time waste and missed opportunities for proactive client service (warranty expiration alerts, lifecycle management).

---

## Proposed Solution

**Core Concept and Approach:**

Integrate asset management directly into the ticketing system by building on the AssetFlow foundation, adding API integrations with PDQ Connect and ScreenConnect, and creating asset displays within the ticketing interface. The solution operates through three architectural layers:

1. **Asset Management Core** - Database schema for assets, clients, and contacts with cached warranty data from Lenovo API
2. **External Tool Integration** - Stored device identifiers enable instant URL construction for PDQ Connect and ScreenConnect (no runtime API calls)
3. **Unified Interface** - Asset detail pages and ticket detail widgets provide contextual access to asset information and external tools

The solution prioritizes **asset detail pages as the foundation**, then extends asset visibility into **ticket detail pages as a convenience feature**—inverting the original request but matching actual workflow priorities discovered during brainstorming.

**Key Differentiators from Existing Solutions:**

- **Performance-first architecture:** Asset data fully cached (300 assets enable aggressive caching), warranty data treated as static, external tool IDs stored at creation time—resulting in zero API latency during ticket workflows

- **Simplified UI optimized for speed:** Minimal data display (hostname, color-coded warranty date, PDQ link, ScreenConnect link) eliminates cognitive load and enables instant visual scanning

- **Positive feedback loop design:** Easy asset access from tickets incentivizes inventory maintenance → updated inventory increases system value → increased value drives more usage

- **Semi-automated asset onboarding:** PDQ Connect API + Lenovo Warranty API integration auto-populates 90% of asset data from serial number, reducing data entry friction that discourages inventory maintenance

- **Context-aware integration points:** Asset widgets appear in web interface only (Outlook Add-in remains unchanged), preserving add-in performance and simplicity

**Why This Solution Will Succeed:**

The brainstorming session identified **ScreenConnect quick access as the killer feature**—eliminating manual device search in ScreenConnect's interface saves 30-60 seconds per active support call. By focusing on this high-value use case and maintaining strict performance requirements (ticket creation cannot slow down), the solution delivers immediate measurable value without risk of rejection due to performance degradation.

The small dataset (300 assets) and simple data relationships (1-2 assets per contact typically) enable aggressive optimization strategies that wouldn't scale to enterprise systems but are perfect for this use case.

**High-Level Vision:**

A technician receives a call from a client about their computer. They open the ticket detail page, see the contact's assets displayed with warranty status instantly visible via color coding. One click launches ScreenConnect remote session—no hunting through ScreenConnect's interface. Another click opens PDQ Connect deploy page for that specific device. The technician resolves the issue, logs time, and closes the ticket—all without leaving the ticketing system.

Over time, the inventory stays current because accessing assets is easier than working around their absence. Warranty expiration reports enable proactive client communication about hardware refresh cycles, adding service value and creating upsell opportunities.

---

## Target Users

### Primary User Segment: Support Technicians (Active Troubleshooting)

**Demographic/Firmographic Profile:**
- IT support technicians at Zero One LLC
- Managing 10-30 active client accounts simultaneously
- Handling 10-15 support interactions daily (mix of phone calls, email requests, proactive maintenance)
- Working primarily from web-based ticketing interface during active support calls
- Using Outlook Add-in for post-work time logging

**Current Behaviors and Workflows:**
- **Active support workflow:** Receive client call → create/open ticket → search for computer in ScreenConnect → perform remote work → log time → close ticket
- **Passive logging workflow:** Complete work in person or via phone guidance → use Outlook Add-in to log time from email thread
- Currently maintain mental maps of which clients have which computers (e.g., "John at ABC Corp has the ThinkPad")
- Frequently need to interrupt support calls to search Notion sheets for asset information
- Manually search ScreenConnect interface by computer name when remote access needed

**Specific Needs and Pain Points:**
- Need instant access to ScreenConnect without manual searching (biggest time waste)
- Cannot afford any slowdown in ticket creation speed (performance-critical)
- Need to see warranty status at a glance to set client expectations about hardware support
- Want to maintain asset inventory but current friction makes updates feel burdensome
- Need to associate time entries with specific assets for maintenance billing accuracy
- Require quick access to PDQ Connect for deployment and device management tasks

**Goals They're Trying to Achieve:**
- Minimize time spent on administrative tasks during active support calls
- Provide faster response times to clients (reduce "hold on, let me find your computer" moments)
- Maintain accurate asset inventory without significant time investment
- Improve billing accuracy for maintenance work through better asset-to-ticket association
- Deliver proactive service by knowing warranty status and asset age

---

## Goals & Success Metrics

### Business Objectives

- **Eliminate ScreenConnect search time waste:** Reduce time spent searching for computers in ScreenConnect from 30-60 seconds to <5 seconds (one-click access), saving 5-15 minutes per day (20-60 hours annually)
- **Increase inventory maintenance adoption:** Achieve 80%+ asset coverage for active client contacts within 3 months of deployment through reduced friction
- **Improve maintenance billing attribution:** Enable asset-specific time tracking for 60%+ of maintenance tickets within 6 months, improving billing accuracy and client transparency
- **Enable proactive service delivery:** Generate quarterly warranty expiration reports for clients, creating upsell opportunities for hardware refresh planning

### User Success Metrics

- **ScreenConnect access speed:** Average time from ticket detail page to ScreenConnect session launch <5 seconds (vs. current 30-60 seconds)
- **Asset widget load performance:** Asset data displays on ticket detail page with <500ms latency (no impact on perceived page load time)
- **Inventory completeness:** 80%+ of active contacts have at least one asset assigned within 3 months
- **System adoption:** 90%+ of technicians use asset widgets regularly (defined as clicking ScreenConnect/PDQ links at least 3x per week)
- **Positive feedback loop indicator:** Month-over-month increase in asset updates/additions (indicates growing system value)

### Key Performance Indicators (KPIs)

- **ScreenConnect link click rate:** (ScreenConnect clicks / Total tickets) × 100 — Target: 40%+ (indicates feature utility)
- **Asset widget engagement:** (Tickets with asset widget interaction / Total tickets with contact assignment) × 100 — Target: 50%+
- **Average asset onboarding time:** Time from asset creation start to save — Target: <3 minutes with semi-automated PDQ/Lenovo integration
- **Warranty data freshness:** Percentage of assets with warranty data <12 months old — Target: 90%+
- **Cache performance:** Asset data cache hit rate — Target: 95%+ (validates caching strategy)
- **Zero performance degradation:** Ticket creation speed remains <10 seconds (asset integration must not slow core workflow)

---

## MVP Scope

### Core Features (Must Have)

- **Asset Detail Page with External Tool Integration:**
  - CRUD operations for assets (hostname, manufacturer, model, serial number, warranty expiration, contact assignment, PDQ device ID, ScreenConnect session ID)
  - Color-coded warranty expiration display (red: expired, yellow/amber: expiring soon <90 days, green: valid)
  - ScreenConnect link with one-click launch to remote session
  - PDQ Connect link with one-click access to device deploy page
  - Manual refresh button for warranty data (static display, manual update only)
  - **Rationale:** This is the foundation—everything builds on asset detail pages (brainstorming idea #9)

- **Asset Caching Strategy:**
  - Full cache of all asset data (300 assets) loaded on application startup
  - Cache invalidation on asset create/update/delete operations
  - Cache warmup on application restart
  - **Rationale:** Small dataset enables aggressive caching for zero-latency access (brainstorming idea #1)

- **Simple Asset Widget on Ticket Detail Page:**
  - Display up to 2 most relevant contact assets (by warranty expiration or creation date)
  - Show hostname, color-coded warranty date, PDQ link, ScreenConnect link for each asset
  - "View all assets" link if contact has >2 assets
  - Graceful "No assets tracked for this contact" message when contact has no assets
  - Asynchronous loading (doesn't block ticket page render)
  - **Rationale:** Enables ScreenConnect quick access from tickets (killer feature per brainstorming idea #13)

- **Client Notion Documentation Link:**
  - Add `notion_url` field to Client model
  - Display Notion documentation link in ticket detail header (near client information)
  - Simple one-time setup at client onboarding
  - **Rationale:** Quick win that expands client context integration (brainstorming idea #12, #24)

- **Manual Asset Creation Workflow:**
  - Form-based asset creation with manual field entry
  - Contact assignment (select from existing contacts)
  - PDQ device ID field (manual entry)
  - ScreenConnect session ID field (manual entry)
  - Warranty expiration field (manual entry for MVP)
  - **Rationale:** Establishes foundation; automation comes in Phase 2

### Out of Scope for MVP

- **Semi-automated asset onboarding via PDQ/Lenovo APIs** (Priority #1 for Phase 2)
- **Intelligent asset discovery from PDQ** (suggest matching devices for contacts)
- **Lenovo Warranty API integration** (manual warranty entry for MVP)
- **"Create Ticket from Asset" workflow** (reverse workflow)
- **Asset age reporting and 5-year replacement planning**
- **Asset lifecycle management via PDQ "last seen" data**
- **Context-aware asset widget display** (different prominence based on ticket source)
- **Asset maintenance labor tracking and analytics**
- **Client-facing asset health dashboard**
- **Bulk asset operations**
- **Advanced asset search and filtering**
- **Asset history/audit trail**
- **Asset-to-ticket time association tracking** (beyond manual workflow)

### MVP Success Criteria

The MVP succeeds when:
1. A technician can create an asset with external tool IDs and see ScreenConnect/PDQ links functional on asset detail page in <3 minutes
2. Asset widget loads on ticket detail page with <500ms latency (no perceived slowdown)
3. ScreenConnect link from ticket detail successfully launches remote session (one-click access validated)
4. Contacts with no assets display gracefully without errors or broken UI
5. Asset data cache maintains 95%+ hit rate and invalidates correctly on updates
6. Ticket creation speed remains unchanged (<10 seconds) with asset widget present
7. Technicians report ScreenConnect search time reduced from 30-60 seconds to <5 seconds

---

## Post-MVP Vision

### Phase 2 Features

**Semi-Automated Asset Onboarding (Priority #1)**
- **Timeline:** 2-3 weeks post-MVP
- **Description:** Transform asset creation from manual form entry to guided automation
- **Workflow:**
  1. Technician selects contact
  2. System queries PDQ Connect API for devices, displays matches
  3. Technician selects device from list
  4. System auto-populates: manufacturer, model, serial number, hostname, PDQ device ID
  5. If Lenovo device, system queries Lenovo Warranty API for warranty expiration and in-service date
  6. System parses SKU field to extract model name
  7. Technician reviews pre-filled data, adds ScreenConnect session ID, confirms
- **Value:** Reduces asset onboarding from manual entry to <90 seconds; eliminates data entry friction that discourages inventory maintenance (addresses brainstorming idea #34, #35)

**Intelligent Asset Discovery from PDQ (Priority #2)**
- **Timeline:** 1-2 weeks post-MVP
- **Description:** When contact has no assets, suggest matching devices from PDQ Connect
- **Workflow:** System queries PDQ for devices matching contact name patterns (FirstName LastName, firstnamelastname, first-initial-lastname), presents matches for technician confirmation
- **Value:** Proactively discovers existing assets, reducing manual searching and improving inventory completeness

**"Create Ticket from Asset" Workflow (Priority #3)**
- **Timeline:** 3-5 days post-MVP
- **Description:** Add "Create Ticket" button to asset detail and asset list pages
- **Workflow:** Pre-populates ticket form with contact information from asset assignment
- **Value:** Enables reverse workflow (asset → ticket) to complement ticket → asset workflow

**Asset Age Reporting (Priority #4)**
- **Timeline:** 1 week post-MVP
- **Description:** Report showing assets approaching 5-year lifecycle threshold
- **Workflow:** Calculate approximate asset age from warranty expiration (expiration - 1 year or - 3 years depending on warranty length), generate quarterly reports of aging assets
- **Value:** Enables proactive client communication about hardware refresh planning, creates upsell opportunities

### Long-Term Vision

Within 12-18 months, asset management becomes seamlessly integrated into daily support workflows. Technicians no longer think about "accessing the asset system"—asset information is simply there when needed. ScreenConnect launches happen instinctively with one click. Warranty status is visible at a glance via color coding. Asset inventory stays current because updating it is easier than working around missing data.

The positive feedback loop is fully established: easy access drives usage → usage reveals value → value motivates maintenance → maintenance increases value.

Quarterly reports to clients about aging hardware demonstrate proactive service, differentiate Zero One LLC from reactive competitors, and create natural opportunities for hardware refresh projects.

### Expansion Opportunities

**Asset Lifecycle Management via PDQ Integration**
- Automated detection of decommissioned assets via PDQ "last seen" data
- Flag stale assets (not seen in PDQ for >90 days) for review
- Maintain inventory hygiene automatically
- **Timeline:** 3-4 months post-MVP

**Asset Maintenance Labor Tracking**
- Automatically associate ticket time entries with assets
- Generate per-asset labor reports showing maintenance costs
- Enable billing clients for asset-specific maintenance contracts
- Show ROI of asset tracking through improved billing capture
- **Timeline:** 6-9 months post-MVP (requires data model design)

**Proactive Client Asset Health Dashboard**
- Client-facing view showing their asset fleet status
- Warranty expiration calendar
- Recommended replacement timeline
- Maintenance history per asset
- Positions Zero One LLC as strategic IT partner vs. reactive support
- **Timeline:** 12-18 months post-MVP (requires client portal development)

**Context-Aware Asset Widget Display**
- Adjust asset widget prominence based on ticket source (Outlook vs. Web)
- Minimize in Outlook Add-in tickets (post-work logging)
- Emphasize in web interface tickets (active support)
- **Timeline:** 2-3 months post-MVP

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web-based application integrated into existing ticketing system (brownfield integration)
- **Browser/OS Support:** Modern browsers (Chrome, Edge, Safari, Firefox - last 2 versions); matches existing ticketing system requirements
- **Performance Requirements:**
  - Asset widget load time <500ms (imperceptible to user)
  - Ticket creation page load time unchanged (<2 seconds total)
  - Asset detail page load time <1 second
  - Cache lookup time <10ms (in-memory or Redis)
  - ScreenConnect/PDQ link construction <5ms (simple string concatenation)
  - **Critical:** Zero degradation to ticket creation speed

### Technology Preferences

- **Frontend:**
  - Extend existing ticketing system frontend (likely React-based given modern stack)
  - Lightweight asset widget component with async data loading
  - CSS for warranty color-coding (red/yellow/green)
  - Minimize bundle size impact (<50KB additional JavaScript)

- **Backend:**
  - Extend existing ticketing system backend (Node.js/Express based on project context)
  - RESTful API endpoints for asset CRUD operations
  - Cache middleware layer (Redis or in-memory for MVP)
  - Future: PDQ Connect API integration library
  - Future: Lenovo Warranty API integration library

- **Database:**
  - Extend existing PostgreSQL database (assumed from ticketing system)
  - New tables: `assets`, potentially extend `clients` table with `notion_url` field
  - Foreign key relationships: assets → contacts (one-to-many)
  - Indexed fields: contact_id, pdq_device_id, warranty_expiration for fast queries

- **Caching:**
  - Redis for production (persistent, shared across instances if needed)
  - In-memory caching acceptable for MVP (single instance deployment)
  - Cache strategy: full asset dataset cached, TTL=indefinite (invalidate on mutations only)

### Architecture Considerations

- **Repository Structure:**
  - Integrate into existing ticketing system monorepo
  - Asset management as new feature module within existing codebase
  - Shared authentication and authorization with ticketing system

- **Service Architecture:**
  - Extend existing monolithic architecture (matches ticketing system)
  - Asset service layer for business logic
  - Cache service layer for performance optimization
  - No microservices needed (300 assets, single-team development)

- **Integration Requirements:**
  - **ScreenConnect URL Construction:**
    - Pattern: `https://zollc.screenconnect.com/Host#Access///{sessionID}/Join`
    - No API required—pure client-side URL construction from stored `screenconnect_session_id`
  - **PDQ Connect URL Construction (MVP):**
    - Pattern: `https://app.pdq.com/zero-one-llc/devices/{pdq_device_id}/info`
    - No API required for MVP—URL construction from stored `pdq_device_id`
  - **PDQ Connect API (Phase 2):**
    - REST API authentication (API key or OAuth)
    - Endpoints: device search, device details retrieval
    - Rate limiting considerations
  - **Lenovo Warranty API (Phase 2):**
    - REST API with serial number lookup
    - Response parsing for warranty expiration, in-service date, SKU details
    - Error handling for non-Lenovo devices

- **Security/Compliance:**
  - Leverage existing ticketing system authentication (session-based or JWT)
  - Asset data access control matches contact access control (technicians see all)
  - Secure storage of API credentials (Phase 2: PDQ/Lenovo API keys in environment variables)
  - HTTPS required (already implemented in ticketing system)
  - No PII beyond existing contact data (assets are business equipment)
  - Data backup strategy matches existing ticketing system backups

### Data Model

**Assets Table (New)**
```
- id (primary key)
- hostname (string, required)
- manufacturer (string, nullable)
- model (string, nullable)
- serial_number (string, nullable)
- warranty_expiration (date, nullable)
- contact_id (foreign key → contacts.id, required)
- pdq_device_id (string, nullable)
- screenconnect_session_id (string, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**Clients Table (Extended)**
```
+ notion_url (string, nullable)
```

**Indexes:**
- `assets.contact_id` (for fast contact → assets lookup)
- `assets.warranty_expiration` (for aging/expiration reports)

---

## Constraints & Assumptions

### Constraints

- **Budget:** Internal project with development time as primary cost; minimize external service costs (favor open-source, existing infrastructure)
- **Timeline:** MVP target within 2-3 weeks to capitalize on Outlook Add-in deployment timing; Phase 2 automation within 4-6 weeks post-MVP
- **Resources:** Single developer or small team; existing ticketing system codebase as foundation; no dedicated QA resources (developer testing + user acceptance testing)
- **Technical:**
  - Must integrate with existing ticketing system architecture (brownfield constraints)
  - Must maintain existing ticket creation performance (non-negotiable)
  - Outlook Add-in explicitly excluded from asset integration scope
  - ScreenConnect session IDs must be manually obtained (no automation API discovered yet)
  - PDQ Connect API access requires API key (pending availability confirmation)
  - Lenovo Warranty API access requires investigation (availability unknown)

### Key Assumptions

- **Dataset Size:** Asset count will remain <1000 for foreseeable future (enables aggressive caching strategy)
- **Client/Contact Structure:** Existing ticketing system has robust Client and Contact models suitable for asset relationships
- **Performance Baseline:** Current ticket creation speed is <10 seconds and must not degrade
- **User Acceptance:** Technicians will naturally adopt features that demonstrably save time (no forced adoption needed)
- **Asset Relationships:** Typical contact has 1-2 assets (simple display logic sufficient); edge cases (>2 assets) are rare
- **Warranty Data Stability:** Warranty information changes infrequently (manual updates acceptable; no real-time sync needed)
- **External Tool Stability:** ScreenConnect and PDQ Connect URL patterns remain stable over time
- **PDQ Device ID Availability:** PDQ Connect provides consistent device identifiers that can be stored and referenced
- **ScreenConnect Session ID Stability:** Session IDs don't change once established (or changes are infrequent enough for manual updates)
- **Access Patterns:** Asset access primarily happens from ticket detail pages during active support (validates widget placement)
- **Deployment Environment:** Single-instance application deployment for MVP (multi-instance scaling not immediately needed)
- **Browser Compatibility:** Users operate on modern browsers (no IE11 or legacy browser support required)
- **Authentication Model:** Existing ticketing system authentication is sufficient (no separate asset system login needed)
- **Data Migration:** AssetFlow data can be exported and imported into new system (migration path exists)
- **Business Continuity:** Asset data backup strategy matches existing ticketing system practices (no special requirements)

---

## Risks & Open Questions

### Key Risks

- **Performance degradation during asset widget loading:** Asset widget could slow ticket detail page rendering if not implemented with proper async loading. *Impact: Would violate core requirement and cause feature rejection. Mitigation: Implement lazy loading with skeleton UI, measure page load metrics, use React.lazy or similar code-splitting for widget component.*

- **Cache invalidation bugs:** Stale cached data could display outdated asset information if cache invalidation logic has bugs. *Impact: Technicians see wrong warranty dates or obsolete asset assignments. Mitigation: Implement comprehensive cache invalidation tests, add cache version tracking, provide manual "refresh" capability.*

- **ScreenConnect/PDQ URL pattern changes:** External tools could change their URL structures, breaking stored links. *Impact: One-click access feature becomes non-functional. Mitigation: Document URL patterns, monitor for 404 errors, implement fallback messaging if links break, maintain flexibility to update URL construction logic.*

- **Manual data entry friction during MVP:** Manual asset creation could be so tedious that technicians avoid using the system. *Impact: Low adoption rate, inventory remains incomplete, positive feedback loop doesn't establish. Mitigation: Time-box MVP validation to 2 weeks, accelerate Phase 2 automation if adoption is low, gather user feedback early.*

- **PDQ Connect API unavailability or restrictions:** API may not exist, require expensive licensing, or have prohibitive rate limits. *Impact: Phase 2 automation delayed or redesigned. Mitigation: Research API availability during MVP development, have fallback plan (continue manual entry or explore alternative automation).*

- **Lenovo Warranty API access barriers:** API may require business partnership, have costs, or lack coverage for warranty data. *Impact: Semi-automated onboarding provides less value than planned. Mitigation: Research API during MVP, accept manual warranty entry as fallback, prioritize PDQ automation over Lenovo automation.*

- **Asset-to-contact assignment complexity:** Edge cases (shared devices, transfer between contacts, retired contacts) could create data integrity issues. *Impact: Orphaned assets, incorrect contact associations, confusion. Mitigation: Design clear transfer workflows, implement soft delete for contacts with assets, add asset search/filter capabilities.*

### Open Questions

- **How should asset transfer between contacts be handled?** (E.g., contact leaves company, asset reassigned to replacement)
- **Should decommissioned/retired assets be deleted or archived?** (Soft delete with "archived" status? Separate table?)
- **What warranty expiration threshold defines "expiring soon" for yellow color-coding?** (30 days? 60 days? 90 days? User preference?)
- **Should assets have a "primary" designation when contacts have multiple devices?** (To prioritize display in 2-asset widget limit)
- **How to handle shared devices (e.g., conference room equipment)?** (Assign to special "shared" contact? Client-level assets?)
- **Should there be asset categories beyond implied type (laptop/desktop/server)?** (Printers, network equipment, phones?)
- **What happens when PDQ device ID or ScreenConnect session ID becomes invalid?** (Display error? Hide link? Show warning?)
- **Should asset widget show on ticket creation page or only ticket detail page?** (Original brainstorming suggested detail only, but worth confirming)
- **How many AssetFlow records need to be migrated?** (Initial dataset size for planning import scripts)
- **Should there be a bulk import capability for initial AssetFlow migration?** (CSV import? API endpoint? Manual entry acceptable?)
- **What reports beyond warranty expiration are immediately valuable?** (Assets by client? Assets by age? Assets without warranty data?)
- **Should asset detail page show related tickets (tickets for this contact)?** (Provides context but adds complexity)

### Areas Needing Further Research

- **PDQ Connect API documentation and authentication:** Determine endpoints available, authentication method (API key, OAuth), rate limits, data structure
- **Lenovo Warranty API access process:** Investigate registration requirements, costs (if any), data coverage, response format, error handling
- **ScreenConnect session ID automation possibilities:** Research if ScreenConnect provides API for session ID lookup (low priority)
- **AssetFlow data export format:** Understand export structure to plan migration scripts
- **Existing ticketing system caching implementation:** Review current cache strategy to align asset caching approach
- **React component architecture in ticketing system:** Understand existing patterns to maintain consistency in asset widget development
- **Database migration strategy:** Review existing migration tooling (Sequelize, Knex, raw SQL) for asset table creation
- **Performance testing approach:** Identify tools and methodology for measuring ticket page load time impact

---

## Appendices

### A. Research Summary

This Project Brief is informed by a comprehensive brainstorming session conducted on 2025-10-16 using the BMAD-METHOD™ framework. The session employed four structured brainstorming techniques to explore asset management integration comprehensively.

**Brainstorming Session Insights:**
- **Techniques Applied:** What If Scenarios, First Principles Thinking, Role Playing (multi-perspective), SCAMPER Method
- **Total Ideas Generated:** 35 distinct ideas across integration approaches, features, and workflows
- **Session Duration:** Approximately 60 minutes with structured technique rotation
- **Key Discovery:** Asset detail page identified as foundation priority (inverting original request focus on ticket integration)

**Core Findings:**
- **Performance is binary:** Ticket creation speed cannot degrade—any slowdown means feature failure (idea #14)
- **ScreenConnect quick access is killer feature:** Eliminating manual search saves 30-60 seconds per active support call (idea #13)
- **Positive feedback loop critical:** Easy access drives maintenance → maintenance increases value → value drives usage (idea #6)
- **Small dataset enables optimization:** 300 assets allows aggressive caching without infrastructure concerns (idea #1)
- **API integration timing:** Store external IDs at creation, eliminate runtime API calls (idea #8)
- **Automation reduces friction:** Semi-automated onboarding via PDQ/Lenovo APIs addresses maintenance barrier (ideas #34, #35)

**Priority Validation:**
- **Immediate Opportunities (5 items):** Asset detail page, Notion link, graceful no-assets handling, caching, ticket widget
- **Future Innovations (6 items):** Semi-automated onboarding, intelligent discovery, age reporting, lifecycle management, reverse workflow, labor tracking
- **Moonshots (2 items):** Full labor tracking analytics, client-facing health dashboard

### B. Stakeholder Input

**Primary Stakeholder:** Support Technicians at Zero One LLC (end users)

**Pain Points Validated:**
- Manually searching ScreenConnect interface wastes 30-60 seconds per active support call
- Context switching between Tickets → Notion → ScreenConnect → PDQ creates cognitive overhead
- Friction in accessing asset data discourages inventory maintenance (negative feedback loop)
- Inability to quickly see warranty status limits proactive client communication

**Solution Preferences Expressed:**
- ScreenConnect quick access highest priority (active support workflow)
- Performance non-negotiable: ticket creation cannot slow down
- Simple UI preferred: hostname, warranty date, quick links only
- Manual workflow acceptable for MVP if automation comes quickly (Phase 2)
- Outlook Add-in should remain unchanged (explicit constraint)

**Workflow Patterns Identified:**
- Two distinct ticket creation patterns: Outlook (passive logging) vs. Web (active support)
- Web interface tickets need asset integration; Outlook Add-in tickets do not
- Typical contact has 1-2 assets (simple relationships)
- Asset assignments maintained mentally currently (indicates value once friction removed)

### C. References

- **Brainstorming Session Results:** [docs/brainstorming-session-results.md](docs/brainstorming-session-results.md)
- **AssetFlow Project:** Previous asset management system (data model reference)
- **PDQ Connect:** https://www.pdq.com/pdq-connect/
- **ScreenConnect (ConnectWise Control):** https://www.connectwise.com/platform/unified-management/control
- **Lenovo Warranty Lookup:** https://support.lenovo.com/us/en/warrantylookup (research Lenovo API availability)

---

## Next Steps

### Immediate Actions

1. **Review and finalize Project Brief** - Share with stakeholders for validation; address open questions from Section 10
2. **Confirm technical assumptions** - Verify existing ticketing system uses React + Node.js + PostgreSQL as assumed
3. **Research API availability** - Investigate PDQ Connect API and Lenovo Warranty API access during MVP development (parallel track)
4. **Design database schema** - Create migration for `assets` table and `clients.notion_url` field extension
5. **Plan AssetFlow data migration** - Export existing AssetFlow data, design import scripts or manual migration process
6. **Set up development environment** - Create feature branch, configure local development with cache layer (Redis or in-memory)
7. **Build MVP iteratively**:
   - **Week 1:** Asset CRUD (backend API + database), Asset detail page UI, URL construction logic
   - **Week 2:** Asset caching implementation, Asset widget component, Ticket detail integration
   - **Week 3:** Client Notion link, Graceful empty states, Performance testing, Bug fixes
8. **Conduct user acceptance testing** - Deploy to staging, gather technician feedback on performance and usability
9. **Deploy MVP to production** - Launch asset management integration, monitor performance metrics
10. **Begin Phase 2 planning** - Based on MVP feedback, prioritize semi-automated onboarding or other Phase 2 features

### PM Handoff

This Project Brief provides the full context for the **Asset Management Integration** project. The next phase is detailed product specification and development planning.

**Recommended next activities:**
- **Create PRD (Product Requirements Document)** with detailed user stories, acceptance criteria, and wireframes
- **Design technical architecture document** detailing database schema, API endpoints, caching strategy, component structure
- **Create development roadmap** with sprint planning for 2-3 week MVP timeline
- **Plan Phase 2 automation** based on API research findings (PDQ Connect, Lenovo Warranty)

Please start in **PRD Generation Mode** or **Development Mode**, review this brief thoroughly to work with the user to create detailed specifications, asking for any necessary clarification or suggesting improvements.

---

