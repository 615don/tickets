# Project Brief: Lean IT Consulting Ticketing System

## Executive Summary

This project will create a friction-free ticketing system purpose-built for hourly IT consulting billing. The system replaces complex task management tools with a streamlined solution focused solely on capturing billable time accurately and generating client invoices through Xero integration.

**Core Problem:** Current ticketing systems require too many fields and slow-loading dropdowns, creating friction that causes deferred logging and forgotten billable hours, resulting in direct revenue loss.

**Target Market:** Solo IT consultants and small IT consulting firms billing clients hourly for support work, particularly those managing multiple clients with varied support requests via email.

**Key Value Proposition:** Reduce ticket creation from minutes to 5 seconds by minimizing required fields (client, contact, time), enabling real-time logging during work instead of error-prone deferred entry. Outlook Web extension captures client/contact automatically from email context, and automated monthly maintenance ticket generation eliminates repetitive data entry.

## Problem Statement

**Current State and Pain Points:**

IT consultants billing hourly need to capture every work engagement as a ticket for accurate invoicing. However, existing ticketing systems (designed for task management and team collaboration) impose significant friction through:

- Slow-loading company and client contact dropdowns
- Forced fields at creation time (description, categories, resolution types, status)
- Email notification prompts (rarely used but always presented)
- Multi-step workflows and status tracking (irrelevant for billing documentation)

This complexity transforms what should be a 5-second data capture into a multi-minute process requiring full attention.

**Impact of the Problem:**

The friction creates a destructive pattern: consultants defer ticket creation until "later," intending to batch-create tickets from memory. This results in:

- **Direct revenue loss** from forgotten billable work (small tickets that slip through)
- **Time waste** trying to reconstruct work details from memory at month-end
- **Billing disputes** when incomplete notes fail to justify charges
- **Cash flow delays** when month-end ticket catch-up postpones invoicing
- **Mental overhead** maintaining a mental list of un-logged work throughout the month

For a consultant billing 85-100 hours monthly at $180/hour, even 2-3 forgotten hours per month represents $5,000-10,000 annual revenue loss.

**Why Existing Solutions Fall Short:**

Traditional ticketing systems (Jira, Zendesk, Freshdesk, ConnectWise) are built for team collaboration and task management, not solo billing documentation. They assume:

- Tickets are created *before* work begins (work request tracking)
- Multiple people need status visibility and workflow coordination
- Detailed categorization aids reporting and resource allocation
- Rich communication features replace email

These assumptions don't match the reality of solo IT consulting where work happens reactively via email, tickets serve as billing artifacts created *during or after* work, and the consultant already knows the context without status tracking.

**Urgency and Importance:**

Every day of continued friction means continued revenue loss. With monthly billing cycles, the problem compounds—a consultant who forgets to log 30 minutes per day loses 10+ billable hours ($1,800) per month. The solution must be implemented quickly to stop this revenue leakage.

## Proposed Solution

**Core Concept and Approach:**

Build a lightweight web-based ticketing system optimized for speed of entry and accurate billing documentation. The system eliminates all non-essential fields and workflows, focusing exclusively on capturing three critical data points at ticket creation: **Client, Contact, and Time**.

The solution operates on two key principles:

1. **Minimal friction at creation** - Create tickets in 5 seconds with only essential fields, enabling real-time logging during work
2. **Rich context at closure** - Add detailed notes and descriptions when full context is available, producing complete billing documentation

**Key Differentiators from Existing Solutions:**

- **Email-centric integration**: Outlook Web extension enables ticket creation directly from email threads, auto-populating client and contact from email metadata (sender domain and email address). Your requested feature of capturing the email chain as the notes field eliminates manual note entry entirely for email-based work.

- **Billing-first architecture**: No status tracking, no workflow stages, no assignment fields—only data needed for invoice generation (time entries, descriptions, billable flags)

- **Flexible time management**: Time entries are date-stamped by work date (not ticket creation date), can be adjusted across months before invoicing, and lock automatically only after Xero invoice push

- **Proactive verification**: Real-time monthly hours dashboard and daily recap emails catch forgotten tickets before month-end, preventing revenue loss

- **Automation for repetitive work**: Recurring maintenance tickets auto-generate monthly with pre-populated descriptions for designated clients, eliminating batch data entry

**Why This Solution Will Succeed:**

Current tools fail because they add friction consultants don't need (team features, workflows) while missing features consultants desperately need (instant entry, email integration, billing flexibility). By ruthlessly focusing on the billing documentation use case and eliminating everything else, this solution removes the barrier that causes revenue loss.

The Outlook extension in particular addresses the root cause: most work happens in email, so forcing consultants to leave email to log tickets guarantees deferred logging. Meeting consultants where they work (in their inbox) makes real-time logging natural instead of disruptive.

**High-Level Vision:**

A consultant receives an email from a client, performs work to resolve the issue, and clicks a single button in their Outlook sidebar. The system captures the client, contact, and email thread automatically. The consultant enters time (e.g., "45m") and clicks save—total time: 5 seconds. At end of day, they receive a recap email showing all tickets logged. At month-end, they review hours (dashboard shows 92 hours—within expected range), adjust any entries if needed, and click "Generate Xero Invoice." Done.

## Target Users

### Primary User Segment: Solo IT Consultants

**Demographic/Firmographic Profile:**
- Independent IT consultants or single-person IT consulting businesses
- Managing 10-30 active client accounts simultaneously
- Providing hourly support services (not project-based or retainer)
- Billing $150-250/hour for technical support and maintenance
- Expected monthly billable hours: 85-100 hours
- Operating in managed services provider (MSP) capacity for some clients, ad-hoc support for others

**Current Behaviors and Workflows:**
- Work happens reactively—clients send requests via email, text, or phone call
- Most work (80%+) originates from email communication
- Tickets created during or after work is performed, not as work requests
- Monthly invoicing cycle with manual review of all billable time
- Uses Xero for accounting and invoice generation
- Manages some clients' Microsoft 365 environments (relevant for contact data integration)
- Performs recurring monthly maintenance work (updates, monitoring, backups) for designated clients

**Specific Needs and Pain Points:**
- Need ultra-fast ticket creation to avoid deferred logging and revenue loss
- Cannot afford slow-loading interfaces that interrupt workflow
- Strongly prefer working in native email client (Outlook Web) rather than switching between apps
- Need to track both billable and non-billable time (to show goodwill work)
- Must be able to adjust time entries for previous months before finalizing invoices
- Require per-ticket invoice line items so clients can identify which issues cost what
- Want proactive reminders about potentially forgotten billable time
- Need automated handling of recurring maintenance tickets to eliminate month-end data entry burden

**Goals They're Trying to Achieve:**
- Capture 100% of billable time accurately without administrative burden
- Generate monthly invoices quickly with full confidence in accuracy
- Maintain detailed notes for billing dispute protection
- Provide transparent invoicing that clients understand and accept
- Minimize time spent on administrative tasks vs. billable work
- Avoid cash flow delays from late or incomplete invoicing

## Goals & Success Metrics

### Business Objectives

- **Eliminate revenue leakage from forgotten tickets**: Increase billable time capture from estimated ~90% to 98%+ within 3 months of deployment
- **Reduce administrative overhead**: Decrease time spent on ticket creation and monthly invoicing from ~4 hours/month to <1 hour/month
- **Accelerate billing cycle**: Enable same-day or next-day invoice generation at month-end (vs. current 3-5 day delay)
- **Improve billing transparency**: Achieve zero billing disputes related to missing documentation within 6 months

### User Success Metrics

- **Ticket creation speed**: Average ticket creation time <10 seconds (target: 5 seconds for email-based tickets with Outlook extension)
- **Real-time logging adoption**: 80%+ of tickets created same-day as work performed (vs. current estimated 40%)
- **Monthly hours accuracy**: Actual monthly billable hours consistently within expected range (85-100 hours) with <5% variance
- **System adoption**: 100% of billable work logged in new system within 2 weeks of launch (complete migration from old system)
- **Proactive correction rate**: 60%+ of forgotten tickets caught and added via daily recap email prompts

### Key Performance Indicators (KPIs)

- **Revenue capture rate**: (Logged billable hours / Estimated actual billable hours) × 100 — Target: 98%+
- **Average ticket creation time**: Measured from ticket open to save — Target: <10 seconds
- **Invoice generation time**: Time from month-end to Xero invoice push — Target: <30 minutes
- **Forgotten ticket recovery**: Number of tickets added via daily recap quick-add form — Track monthly trends
- **Time entry adjustments**: Number of time entries modified before invoice lock — Monitor for billing accuracy patterns
- **Non-billable work visibility**: Percentage of $0 line items on invoices — Target: 5-10% to demonstrate goodwill

## MVP Scope

### Core Features (Must Have)

- **Ticket Management**: Basic CRUD operations for tickets with minimal required fields at creation (client, contact, time), optional fields for description and notes that can be added later. Tickets support open/closed states and can be re-opened within 7 days of closure.

- **Client & Contact Management**: Simple database for clients (company name, domain name(s) for email auto-detection, Xero customer ID, maintenance contract type) and contacts (name, email address). Support for multiple domains per client (one-to-many relationship) for accurate email-based client identification.

- **Time Entry System**: Date-stamped time entries (by work date, not ticket date). Support for multiple time entries per ticket for multi-day work. Ability to add, edit, or delete time entries for any month until invoice is locked. Billable/non-billable flag per time entry. System accepts time in any format (hours, minutes, decimal) without imposing rounding logic.

- **Ticket Views & Navigation**:
  - Open tickets view (all currently open tickets)
  - Recently closed tickets view (last 7 days)
  - Re-open capability for tickets within 7-day window
  - Basic search for historical closed tickets (for billing disputes)

- **Xero Integration**: Manual invoice generation trigger that pushes monthly invoices to Xero with per-ticket line items formatted as "Ticket #1234 - Description". Non-billable tickets appear as $0 line items. Time entries lock after successful invoice push to prevent accidental modifications. Pre-invoice review screen showing total hours and per-client breakdown.

- **Basic Authentication**: Simple login system (username/password) sufficient for single-user MVP. More sophisticated authentication (Microsoft 365) can be added later.

### Out of Scope for MVP

- Outlook Web extension (Phase 2 priority feature)
- Automated recurring maintenance ticket generation
- Real-time monthly hours dashboard
- Daily recap email system
- Microsoft 365/CIPP contact import integration
- AI-assisted ticket description generation
- Status tracking and workflow management
- Assignment/team collaboration features
- Email notifications of any kind
- In-system email communication
- Mobile native apps (responsive web sufficient for MVP)
- Advanced reporting beyond Xero invoices
- Timer-based time entry (manual entry only for MVP)

### MVP Success Criteria

The MVP succeeds when:
1. A complete monthly billing cycle (ticket creation through Xero invoice push) can be executed using only the new system
2. Average ticket creation time is demonstrably faster than current system (<30 seconds vs. multiple minutes)
3. All time entries for a month can be reviewed, adjusted, and finalized with confidence
4. Generated Xero invoices accurately reflect all billable work with proper line item formatting
5. User can find and reference historical tickets when needed for billing disputes

## Post-MVP Vision

### Phase 2 Features

**Outlook Web Extension (Priority #1)**
- Creates tickets directly from email context without leaving Outlook
- Auto-detects client from sender's email domain (mapped to client records)
- Auto-populates contact from sender's email address
- Captures email thread as notes field automatically, eliminating manual note entry
- Reduces ticket creation to entering time and clicking save (~5 seconds)
- Timeline: 2-3 months post-MVP

**Real-Time Monthly Hours Dashboard (Priority #2)**
- Always-visible widget showing current month's billable hours total
- Visual indicator showing if hours are within expected range (85-100)
- Helps catch missing tickets proactively before month-end
- Timeline: 2-4 weeks post-MVP

**Daily Recap Email System (Priority #3)**
- End-of-day automated email summarizing tickets logged that day
- Includes direct link to day view in ticket system
- Features quick-add form for forgotten items (embedded or linked)
- Single-day focus prevents overwhelming information
- Timeline: 3-4 weeks post-MVP

**Automated Recurring Maintenance Tickets (Priority #4)**
- Auto-generates monthly or bi-weekly maintenance tickets for designated clients
- Pre-populates with standard maintenance description templates
- Supports two maintenance types: standard and with after-hours updates/reboots
- Eliminates month-end batch entry burden
- Timeline: 1-2 months post-MVP

### Long-Term Vision

Within 12-18 months, the system becomes an invisible part of the workflow. A consultant works in their inbox responding to client emails. When they finish helping a client, they click one button in the Outlook sidebar, enter the time, and continue working. At day's end, they glance at a recap email and add any missing items via quick-add. At month-end, they open the dashboard, see their hours total is within range, review the pre-invoice summary, and push to Xero—all in under 15 minutes.

The system essentially "disappears" through automation and integration, capturing billing data as a natural byproduct of doing the work rather than as a separate administrative task.

### Expansion Opportunities

**Microsoft 365 / CIPP Integration**
- Auto-import contacts from managed client M365 environments
- Automatically sync contact data for clients under MSP management
- Eliminates manual contact creation and keeps data current
- Addresses: Only managed clients benefit; requires API complexity research

**AI-Assisted Features**
- Generate client-appropriate ticket descriptions from detailed work notes
- Smart suggestions in quick-add form based on time-of-day and recent patterns
- Predictive client/contact suggestions based on usage patterns

**Enhanced Authentication & Security**
- Microsoft 365 OAuth/SAML for enterprise-grade authentication
- Multi-factor authentication support
- Audit logging for compliance needs

**Multi-User Support**
- Expand from single-user to small team collaboration
- Per-user time tracking and reporting
- Client assignment and workload distribution

**Advanced Reporting**
- Client profitability analysis (time spent vs. revenue)
- Monthly trend reports (hours by client, service type patterns)
- Export capabilities for external analysis

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web-based application (primary interface), responsive design for mobile browsers
- **Browser/OS Support:** Modern browsers (Chrome, Edge, Safari, Firefox - last 2 versions), no IE11 requirement
- **Performance Requirements:**
  - Page load time <2 seconds
  - Ticket creation form submission <500ms
  - Search/filter operations <1 second
  - Fast, responsive dropdowns (unlike current system's slow-loading dropdowns)

### Technology Preferences

- **Frontend:** Modern JavaScript framework (React, Vue, or Svelte) with minimal dependencies for speed; consider lightweight options to optimize load times
- **Backend:** Language/framework with strong Xero API support and rapid development capability (Node.js, Python/Django, Ruby/Rails, or similar)
- **Database:** PostgreSQL or MySQL for relational data (clients, contacts, tickets, time entries); straightforward schema with good performance for small-to-medium datasets
- **Hosting/Infrastructure:** Cloud hosting (AWS, Azure, DigitalOcean, Heroku, or similar) with simple deployment pipeline; single-user workload requires minimal resources

### Architecture Considerations

- **Repository Structure:** Monorepo acceptable for MVP (frontend + backend in single repo); can separate later if needed
- **Service Architecture:** Simple monolithic architecture sufficient for MVP; microservices unnecessary for single-user system
- **Integration Requirements:**
  - Xero API integration (OAuth 2.0 authentication, invoice creation endpoints)
  - Future: Microsoft Graph API for Outlook Web extension (Phase 2)
  - Future: Microsoft 365 Partner Center / CIPP API (expansion opportunity)
- **Security/Compliance:**
  - HTTPS required for all communication
  - Secure credential storage for Xero API tokens
  - Data backup strategy (automated daily backups)
  - No special compliance requirements (HIPAA, SOC2, etc.) for MVP
  - Consider data export capability for business continuity

## Constraints & Assumptions

### Constraints

- **Budget:** Self-funded project; costs should be minimized where possible (favor cost-effective hosting, open-source technologies)
- **Timeline:** Target MVP deployment within 4-6 weeks; immediate need to stop revenue leakage justifies focused development effort
- **Resources:** Solo development or small development team; single user (consultant) for testing and feedback; no dedicated QA or design resources assumed
- **Technical:** Must integrate with Xero API (non-negotiable); must work reliably in Outlook Web for future extension phase; limited to modern browsers (no legacy browser support)

### Key Assumptions

- Monthly billing cycle remains standard practice (not moving to weekly or project-based billing)
- All clients billed at same hourly rate ($180); no client-specific or service-specific rate variations needed for MVP
- Email (specifically Outlook) will continue as primary work communication channel
- Current monthly billable hours range (85-100 hours) is representative and stable
- User has access to Xero account with API credentials
- User manages 10-30 active client accounts (dataset remains relatively small)
- Most recurring maintenance work follows predictable monthly/bi-weekly patterns
- Domain-to-client mapping will be sufficient for auto-detecting clients from email (no complex multi-tenant scenarios)
- User willing to manually set up initial client/contact data during migration
- 7-day recently closed ticket window is sufficient for re-open needs
- Time entry flexibility (edit before invoice lock) is critical; no need for time approval workflows
- User trusts their own time entries (no audit trail or approval process needed for MVP)

## Risks & Open Questions

### Key Risks

- **Xero API limitations or rate limits**: Xero API may have restrictions on invoice line item counts, character limits on descriptions, or rate limiting that affects monthly batch invoice generation. *Impact: Could prevent invoicing or require workarounds. Mitigation: Research Xero API documentation thoroughly during technical spike; test with representative data volume.*

- **Outlook Web extension development complexity**: Building Outlook add-ins may involve unexpected technical hurdles, security restrictions, or limited access to email content/metadata. *Impact: Could delay Phase 2 priority feature or require alternative approach. Mitigation: Conduct time-boxed technical spike early in Phase 2 planning; have fallback of browser bookmarklet or simplified web form.*

- **User adoption friction during migration**: Transitioning from current system to new MVP requires data migration, habit change, and learning new workflows. *Impact: Could delay full adoption or cause parallel system usage. Mitigation: Plan focused migration period; provide simple data import tools; ensure MVP is demonstrably faster than current system from day one.*

- **Domain-based client detection edge cases**: Some clients may use personal email domains, shared email addresses, or multiple unrelated domains that complicate auto-detection. *Impact: Could reduce effectiveness of Outlook extension or require frequent manual overrides. Mitigation: Design manual override capability; track edge cases during MVP usage to inform Phase 2 implementation.*

- **Time entry data loss before invoice lock**: Accidental deletion or modification of time entries before invoicing could cause billing errors. *Impact: Revenue loss or billing disputes. Mitigation: Implement soft deletes; add confirmation dialogs for destructive actions; consider audit log even for MVP.*

### Open Questions

- What happens if email domain doesn't match any client in system? (Suggested: error message with manual client selection and option to add domain to client)
- Should system send ANY notifications at all, or remain completely notification-free until daily recap feature? (Clarify notification philosophy)
- How should multiple time entries on one ticket be displayed in ticket view? (List chronologically? Sum total? Show breakdown?)
- What reports/exports beyond Xero invoices might be useful? (Monthly summaries? Client-specific reports? CSV exports?)
- Should clients be able to see their own tickets somehow, or remain purely internal tool? (Client portal consideration for future)
- What backup/export capabilities needed for business continuity? (Database backups? CSV export? Full data dump?)
- How should time be entered—text field accepting flexible formats ("45m", "1.5h", "90") or separate hour/minute inputs? (UX decision affects speed)
- Should description field support markdown or rich text, or plain text only? (Plain text simplest but may limit invoice clarity)

### Areas Needing Further Research

- Xero API invoice line item limits and character restrictions
- Xero API authentication flow and token refresh requirements
- Xero API error handling and retry strategies
- Outlook Web Add-in development requirements and security model
- Microsoft Graph API capabilities for email metadata access
- Microsoft 365 Partner Center / CIPP API authentication and data structure
- Cost comparison for hosting options at expected scale
- Performance characteristics of candidate web frameworks for fast form submissions
- Data migration strategy from current ticketing system (if applicable)

## Appendices

### A. Research Summary

This Project Brief is informed by a comprehensive brainstorming session conducted on 2025-09-29 using the BMAD-METHOD™ framework. Key findings:

**Brainstorming Session Insights:**
- 10 different brainstorming techniques applied (First Principles Thinking, Assumption Reversal, SCAMPER, Time Shifting, Five Whys, What If Scenarios, Role Playing, Morphological Analysis, Forced Relationships, Question Storming)
- 35+ distinct features and workflow elements identified
- Core insight: Friction in ticket creation directly causes revenue loss through forgotten billable hours
- Key discovery: Tickets are billing documentation artifacts created during/after work, not task management items created before work
- Email-centric workflow validated: 80%+ of work originates from email communication
- Monthly hours sanity check (85-100 hours) used as proactive verification rather than detailed audit

**Priority Validation:**
- MVP prioritization: Core ticketing system with Xero integration established as highest priority
- Phase 2 priorities validated: Outlook extension (#1), Dashboard/Daily recap (#2/#3), Maintenance automation (#4)
- Deferred features identified: M365/CIPP integration, AI assistance, advanced reporting

### B. Stakeholder Input

**Primary Stakeholder:** IT Consultant (end user)
- Confirmed pain points: Slow dropdowns, forced fields, deferred logging leading to forgotten tickets
- Validated solution approach: Minimal fields at creation, rich context at closure
- Requested feature: Email chain capture as notes field (incorporated in Outlook extension design)
- Usage patterns confirmed: Monthly billing cycle, single hourly rate, 10-30 active clients
- Edge cases identified: Multiple domains per client, re-opening tickets within 7 days, non-billable work visibility

### C. References

- Brainstorming Session Results: `docs/brainstorming-session-results.md`
- Xero Developer Documentation: https://developer.xero.com/
- Microsoft Graph API Documentation: https://docs.microsoft.com/en-us/graph/
- Outlook Add-ins Overview: https://docs.microsoft.com/en-us/office/dev/add-ins/outlook/

## Next Steps

### Immediate Actions

1. **Review and finalize Project Brief** - Share this document with any additional stakeholders; address open questions identified in Section 10
2. **Conduct Xero API technical spike** - Spend 2-3 hours exploring Xero API documentation, authentication flow, invoice creation capabilities, and limitations
3. **Select technology stack** - Choose frontend framework, backend language/framework, database, and hosting platform based on technical preferences and MVP timeline
4. **Design database schema** - Map out tables for clients, contacts, tickets, time entries with relationships and constraints
5. **Set up development environment** - Initialize repository, configure development tooling, establish CI/CD pipeline basics
6. **Build MVP in iterative phases**:
   - Phase 1: Authentication + Client/Contact CRUD (Week 1)
   - Phase 2: Ticket CRUD + Time Entry System (Week 2-3)
   - Phase 3: Xero Integration + Invoice Generation (Week 3-4)
   - Phase 4: Views/Navigation + Historical Search (Week 4-5)
   - Phase 5: Testing + Bug Fixes + Migration Tools (Week 5-6)
7. **Plan migration from current system** - Identify data to migrate, create import scripts if needed, schedule cutover date
8. **Deploy MVP and begin using** - Go live with MVP, completely transition from old system, begin measuring success metrics

### PM Handoff

This Project Brief provides the full context for the Lean IT Consulting Ticketing System. The next phase is detailed product specification and development planning.

**Recommended next activities:**
- Create PRD (Product Requirements Document) with detailed feature specifications, user stories, and acceptance criteria
- Develop wireframes/mockups for key screens (ticket creation, ticket list, pre-invoice review, client/contact management)
- Build technical architecture document detailing database schema, API structure, integration patterns
- Create development roadmap with sprint planning for 4-6 week MVP timeline

Please start in **PRD Generation Mode**, review this brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.
