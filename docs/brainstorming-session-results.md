# Brainstorming Session Results

**Session Date:** 2025-09-29
**Facilitator:** Business Analyst Mary 📊
**Participant:** IT Consultant

---

## Executive Summary

**Topic:** Lean Ticketing System for IT Consulting Hourly Billing

**Session Goals:** Identify essential features and optimal workflows for a minimal, friction-free ticketing system purpose-built for hourly billing in IT consulting, with Xero integration and future M365/CIPP contact import capabilities.

**Techniques Used:** First Principles Thinking, Assumption Reversal, SCAMPER (Substitute), Time Shifting, Five Whys, What If Scenarios, Role Playing, Morphological Analysis, Forced Relationships, Question Storming

**Total Ideas Generated:** 35+ distinct features and workflow elements

### Key Themes Identified:
- **Minimize Friction** - Current systems are too complex; speed of ticket creation is critical to prevent forgotten billing
- **Email-Centric Workflow** - Most work happens via email; ideal system integrates directly into Outlook Web
- **Billing Documentation Over Task Management** - System exists to capture billable time, not manage work queues
- **Proactive Verification** - Real-time dashboards and daily recaps prevent forgotten tickets
- **Flexibility Before Invoice Lock** - Need ability to adjust time entries across months until invoicing triggers

---

## Technique Sessions

### First Principles Thinking - 15 minutes

**Description:** Breaking down the core business problem to its fundamental components

#### Ideas Generated:
1. Core problem: Capturing billable time accurately for client invoicing
2. Fundamental data points: time amount, work description, client, contact person
3. Current pain point: Friction in ticket creation causes deferred logging and forgotten billing
4. Work request triggers: Email (primary), text messages, phone calls
5. Ticket timing insight: Tickets are for billing documentation, not created before work begins

#### Insights Discovered:
- The real barrier to billing capture is system friction, not memory or process
- Current complex systems force users to defer ticket creation, leading to revenue loss
- Tickets serve billing/documentation purpose, not task management purpose

#### Notable Connections:
- High friction → deferred logging → forgotten tickets → lost revenue
- Simplifying ticket creation could enable real-time logging during work

---

### Assumption Reversal - 12 minutes

**Description:** Challenging the assumption that ticket creation must be time-consuming

#### Ideas Generated:
1. If ticket creation took 5 seconds, it could happen during phone calls or while working
2. Minimum viable data at creation: Contact, Customer, Time (only 3 fields)
3. Work notes and description can be added later at ticket close for full context
4. For multi-day tickets, description should be captured with each time entry
5. AI-assisted description generation could reduce manual effort
6. No need for workflow/status tracking - this isn't task management

#### Insights Discovered:
- Notes quality improves when written at ticket close (full context available)
- For tickets spanning multiple days, waiting period requires no tracking
- User has no problem remembering ticket context when returning to work

#### Notable Connections:
- Deferring notes to close time aligns with natural workflow
- Eliminating unnecessary fields (status, categories, workflow) removes friction

---

### SCAMPER Method (Substitute) - 10 minutes

**Description:** Identifying features in current system that can be eliminated or simplified

#### Ideas Generated:
1. Eliminate: Slow-loading company dropdown
2. Eliminate: Slow-loading client dropdown
3. Eliminate: Forced description at ticket creation
4. Eliminate: Email notification options (creation & closure)
5. Eliminate: Resolution category selection
6. Eliminate: Client email drafting within ticketing system
7. Keep but relocate: Email communication happens in email client, not ticket system

#### Insights Discovered:
- Current system's dropdowns and forced fields create massive friction
- Email notifications are rarely used but always prompted
- User strongly prefers native email client over in-system communication

#### Notable Connections:
- Most friction comes from unnecessary prompts and slow UI elements
- Best UX would eliminate leaving the email client entirely

---

### Time Shifting (Future State) - 10 minutes

**Description:** Envisioning ideal workflow 6 months post-implementation

#### Ideas Generated:
1. Ideal flow: Work happens in email, ticket creation happens in email
2. Outlook Web extension captures ticket data from email context
3. Auto-detection: Customer (from email domain), Contact (from sender email)
4. Manual entry reduced to: Description and Time (only 2 fields) notes optional
5. Phone calls: Use minimal web interface as fallback
6. Text messages: Usually result in email follow-up anyway, so email capture works

#### Insights Discovered:
- Email domain can auto-map to customer
- Sender email can auto-map to contact
- 80%+ of work could be captured without leaving Outlook
- Phone calls are edge case requiring separate entry method

#### Notable Connections:
- Email contains enough metadata for automatic client/contact identification
- Reducing manual entry to 2 fields achieves the "5-second ticket creation" goal

---

### Five Whys (Billing Workflow) - 8 minutes

**Description:** Understanding the monthly billing cycle requirements

#### Ideas Generated:
1. Monthly billing is industry standard and reduces administrative overhead
2. Expected hours: 85-100 billable hours per month (sanity check range)
3. Small tickets slip through, but focus is on capturing major work
4. Recurring maintenance tickets are batch-entered at month-end
5. Maintenance could be auto-generated with pre-populated templates
6. One maintenance ticket per client per month, with multiple time entries
7. Two maintenance types: standard, and with after-hours updates/reboots
8. Only designated clients receive recurring maintenance tickets

#### Insights Discovered:
- User doesn't audit every ticket, but relies on total hours sanity check
- Recurring maintenance tickets follow predictable pattern (monthly/bi-weekly)
- Standardized descriptions acceptable for maintenance work

#### Notable Connections:
- Auto-generating maintenance tickets eliminates month-end batch entry burden
- Pre-opened tickets with standard descriptions reduce friction further

---

### What If Scenarios - 8 minutes

**Description:** Exploring proactive verification features

#### Ideas Generated:
1. Real-time monthly hours dashboard showing running total
2. Daily recap email: hours logged that day + quick verification
3. Daily recap should be single-day focused, not overwhelming week view
4. Include direct link to that day's view in ticket system
5. Extra quick-add form for forgotten small items (client, contact, time, brief note)

#### Insights Discovered:
- Real-time visibility could catch missing tickets before month-end
- Daily recap more useful than weekly (less overwhelming, more actionable)
- Quick-add form lowers barrier for retroactive small ticket logging

#### Notable Connections:
- Proactive reminders work best when they're simple and actionable
- Reducing friction applies to forgotten ticket entry, not just initial entry

---

### Role Playing (Data & Integration) - 15 minutes

**Description:** Understanding M365/CIPP integration and multi-user scenarios

#### Ideas Generated:
1. M365/CIPP integration: Auto-import contacts for managed clients
2. "Contact" = client user/end-user (standardized terminology)
3. System is single-user (just consultant) for foreseeable future
4. Non-managed clients: Manual contact creation required
5. Authentication: Microsoft 365 SAML (or alternative to be researched)
6. Revised: Basic login sufficient for MVP, M365 auth can come later

#### Insights Discovered:
- Contact auto-import only relevant for clients whose M365 environment is managed
- System doesn't need multi-user/collaboration features
- Complex authentication can be deferred to later phase

#### Notable Connections:
- M365 integration serves contact management, not authentication initially
- Single-user context simplifies MVP significantly

---

### Morphological Analysis (Invoice Generation) - 12 minutes

**Description:** Breaking down Xero integration requirements

#### Ideas Generated:
1. Invoice data: Ticket name/number + time
2. Hourly rate ($180) stored in Xero as standard rate
3. All clients billed at same rate (no rate variations)
4. One line item per ticket (gives clients cost visibility per issue)
5. Line item format: "Ticket #1234 - Description"
6. Need ability to adjust time before invoicing (add, reduce, or mark non-billable)
7. Non-billable tickets appear as $0 line items (shows goodwill work)
8. Time billed based on when work was done, not when ticket created/closed
9. Must allow adding/editing time entries for previous months before invoicing
10. Manual trigger for invoice generation (not automatic month-end)
11. Once invoiced to Xero, time entries are locked

#### Insights Discovered:
- Per-ticket line items help clients identify problem users/areas
- Non-billable work should be visible to demonstrate value
- Invoicing must be flexible until user manually triggers push to Xero

#### Notable Connections:
- Locking time entries only after invoice prevents accidental premature finalization
- Manual trigger essential because user may need to catch up on previous month's logging

---

### Forced Relationships (Data Connections) - 10 minutes

**Description:** Identifying necessary client and contact data points

#### Ideas Generated:
1. Contacts need: Name, Email address (phone numbers stored elsewhere)
2. Clients need: Company name, Domain name(s), Xero customer ID, Maintenance contract type
3. Multiple domains per client supported (one-to-many relationship)
4. Manual domain mapping at client setup initially
5. M365/CIPP integration will handle domain mapping later for managed clients

#### Insights Discovered:
- Minimal contact data reduces administrative burden
- Domain-to-client mapping enables email auto-detection
- Some clients have 2-3 domains that must all map to same client record

#### Notable Connections:
- Domain mapping is key enabler for Outlook extension auto-detection
- M365 integration will eventually eliminate manual domain configuration

---

### Question Storming (Navigation & Views) - 8 minutes

**Description:** User-generated questions about daily system usage

#### Ideas Generated:
1. Need to view all open tickets
2. Need to view recently closed tickets (last 7 days)
3. Rarely need old closed tickets (can archive after 7 days)
4. Ability to re-open tickets within 7-day window
5. After 7 days, creating new ticket is acceptable
6. Re-opening ticket: New time goes on current month's invoice
7. Time billed by date worked, not by ticket creation/close date

#### Insights Discovered:
- Recently closed tickets serve as safety net for mistakes and follow-ups
- 7-day window strikes balance between access and clutter
- No need for complex search of historical tickets (very rare use case)

#### Insights Discovered (Additional):
8. Need search/view capability for old closed tickets (rare, but necessary for billing disputes with new clients)

#### Notable Connections:
- Re-open workflow aligns with natural pattern of follow-up issues
- Time-entry dating by work date (not ticket date) is critical for accurate monthly billing

---

### Role Playing (Edge Cases) - 6 minutes

**Description:** Testing system design against real-world scenarios

#### Ideas Generated:
1. Time tracking: 5-minute increment rounding preferred
2. Initial email responses >5 minutes: Billing starts then
3. Initial email responses <5 minutes: Billing starts with actual work
4. Notes field needed: Detailed work performed (for billing dispute reference)
5. Description field: Short title/summary for invoice line item

#### Insights Discovered:
- User has clear mental model for when billing time starts
- Two-field approach (description + notes) serves different purposes
- Description optimized for invoice readability
- Notes optimized for detailed billing justification

#### Notable Connections:
- Description/notes separation prevents invoice line items from being too verbose
- 5-minute rounding balances accuracy with simplicity

---

## Idea Categorization

### Immediate Opportunities
*Ideas ready to implement now*

1. **MVP Ticketing System**
   - Description: Core CRUD operations with minimal fields (client, contact, time, description, notes, billable flag)
   - Why immediate: Replaces current system's core functionality with dramatically reduced friction
   - Resources needed: Web framework, database, basic authentication

2. **Client & Contact Management**
   - Description: Simple database for clients (name, domains, Xero ID, maintenance type) and contacts (name, email)
   - Why immediate: Foundation for all ticket operations and auto-detection features
   - Resources needed: Database schema design, basic CRUD interfaces

3. **Basic Xero Integration**
   - Description: Manual push of monthly invoices with per-ticket line items
   - Why immediate: Essential for billing workflow; Xero API is well-documented
   - Resources needed: Xero API credentials, integration logic, pre-invoice review screen

4. **Ticket Views & Navigation**
   - Description: Open tickets view, recently closed (7 days) view, re-open capability
   - Why immediate: Core daily workflow requirements
   - Resources needed: Database queries, simple list views

5. **Time Entry Flexibility**
   - Description: Date-stamped time entries, ability to edit before invoicing, lock after invoicing
   - Why immediate: Critical for accurate monthly billing and catch-up logging
   - Resources needed: Time entry data model, invoice status tracking

### Future Innovations
*Ideas requiring development/research*

1. **Outlook Web Extension**
   - Description: Create tickets directly from email with auto-detected client/contact
   - Development needed: Outlook add-in development, domain-to-client lookup, email context parsing
   - Timeline estimate: 2-3 months post-MVP

2. **Recurring Maintenance Ticket Automation**
   - Description: Auto-generate monthly maintenance tickets for designated clients with standard descriptions
   - Development needed: Scheduled job system, maintenance contract configuration, template engine
   - Timeline estimate: 1-2 months post-MVP

3. **Real-Time Monthly Hours Dashboard**
   - Description: Always-visible running total of current month's billable hours
   - Development needed: Dashboard UI, real-time calculation logic, visual design
   - Timeline estimate: 2-4 weeks post-MVP

4. **Daily Recap Email System**
   - Description: End-of-day email with hours logged, direct link to day view, quick-add form
   - Development needed: Email templating, scheduled job, quick-add form interface
   - Timeline estimate: 3-4 weeks post-MVP

5. **Microsoft 365 Authentication**
   - Description: Replace basic login with M365 OAuth/SAML
   - Development needed: OAuth flow implementation, M365 app registration, security research
   - Timeline estimate: 2-3 weeks, can be done anytime post-MVP

6. **Historical Ticket Search**
   - Description: Search and view old closed tickets (for billing disputes)
   - Development needed: Search interface, query optimization, archive data access
   - Timeline estimate: 1-2 weeks post-MVP

### Moonshots
*Ambitious, transformative concepts*

1. **M365 Partner Center / CIPP Integration**
   - Description: Auto-import client contacts from managed M365 environments
   - Transformative potential: Eliminates manual contact creation for majority of clients; keeps contact data automatically synchronized
   - Challenges to overcome: API complexity, authentication/permissions, mapping CIPP data to internal client records, handling clients with multiple tenants

2. **AI-Assisted Ticket Descriptions**
   - Description: Automatically generate concise, invoice-appropriate descriptions from work notes
   - Transformative potential: Reduces mental load of crafting client-facing descriptions; ensures consistent professional tone
   - Challenges to overcome: AI model selection/integration, prompt engineering for billing context, user review/edit workflow, cost considerations

3. **Quick-Add Form with Smart Suggestions**
   - Description: Ultra-minimal entry form that learns from patterns and suggests likely clients/contacts
   - Transformative potential: Makes forgotten ticket entry nearly effortless; predictive suggestions based on time of day, recent work patterns
   - Challenges to overcome: Machine learning model training, sufficient data for predictions, balancing automation with control

### Insights & Learnings
*Key realizations from the session*

- **Friction is the enemy of revenue**: Every unnecessary field, slow dropdown, or modal dialog costs real money in forgotten billing
- **Email is the universal interface**: Most work originates from and concludes in email; fighting this pattern creates friction
- **Tickets are billing artifacts, not tasks**: Reframing the purpose eliminates entire categories of unnecessary features (workflows, assignments, priorities, etc.)
- **Two types of simplicity**: Minimal fields at creation (speed) + detailed notes at close (context) serve different needs
- **Automation should target repetitive pain points**: Recurring maintenance tickets are predictable and time-consuming to manually create each month
- **Proactive verification beats reactive correction**: Real-time dashboards and daily recaps prevent forgotten tickets more effectively than trying to remember at month-end
- **Flexibility until commitment**: Allow time entry adjustments across months until user manually triggers invoice push to Xero
- **Visibility builds client trust**: Per-ticket invoice line items and $0 goodwill entries help clients understand and accept billing

---

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: MVP Ticketing System with Xero Integration
- **Rationale:** Core functionality that replaces current painful system; enables immediate productivity gains and accurate billing
- **Next steps:**
  1. Choose tech stack (web framework, database, hosting)
  2. Design database schema (tickets, clients, contacts, time entries)
  3. Build basic authentication
  4. Implement ticket CRUD with minimal fields
  5. Create client/contact management interfaces
  6. Develop Xero API integration for invoice push
  7. Build pre-invoice review screen with sanity checks
- **Resources needed:** Developer time, Xero sandbox/test account, hosting environment
- **Timeline:** 4-6 weeks for functional MVP

#### #2 Priority: Real-Time Monthly Hours Dashboard + Daily Recap Email
- **Rationale:** These proactive verification features directly address the "forgotten ticket" problem; high ROI for preventing lost revenue
- **Next steps:**
  1. Design dashboard UI showing current month hours vs. expected range (85-100)
  2. Implement real-time calculation and display
  3. Build daily recap email template
  4. Create scheduled job for end-of-day email delivery
  5. Add quick-add form linked from daily recap
- **Resources needed:** Email service integration (SendGrid, AWS SES, etc.), job scheduler
- **Timeline:** 2-3 weeks post-MVP

#### #3 Priority: Outlook Web Extension for Email-Based Ticket Creation
- **Rationale:** Eliminates majority of friction by enabling ticket creation without leaving email; captures context automatically
- **Next steps:**
  1. Research Outlook Web Add-in development requirements
  2. Build domain-to-client lookup system
  3. Create add-in UI (compact form within email pane)
  4. Implement auto-population of client/contact from email metadata
  5. Test across different email scenarios (new threads, replies, forwards)
  6. Publish to organization add-in store
- **Resources needed:** Outlook Add-in development expertise, testing with various email clients
- **Timeline:** 2-3 months post-MVP

---

## Reflection & Follow-up

### What Worked Well
- First Principles Thinking uncovered the core insight that friction causes revenue loss
- Assumption Reversal challenged the "ticket creation must be complex" belief
- Time Shifting helped visualize the ideal workflow end-to-end
- Question Storming from user perspective revealed navigation requirements
- Progressive technique flow (broad to specific) matched the "figure out essentials + how it works" goal

### Areas for Further Exploration
- **Authentication options**: Research M365 OAuth vs. SAML vs. simpler alternatives for single-user context
- **Tech stack selection**: Evaluate frameworks for rapid MVP development (Rails, Django, Next.js, etc.)
- **Xero API capabilities**: Investigate invoice line item limits, custom fields, and error handling
- **Outlook Add-in limitations**: Understand what metadata is accessible and performance constraints
- **Time entry UX**: Explore timer-based entry vs. manual entry vs. hybrid approach
- **Mobile access**: Determine if responsive web is sufficient or if native mobile app needed for phone call scenarios

### Recommended Follow-up Techniques
- **Prototyping Session**: Create low-fidelity mockups of key screens (ticket creation, dashboard, pre-invoice review) to validate UX assumptions
- **Technical Spike**: Time-boxed exploration of Outlook Add-in and Xero API to de-risk integration challenges
- **User Story Mapping**: Break down MVP features into detailed user stories for development planning

### Questions That Emerged
- What happens if email domain doesn't match any client in system? (Error handling, manual override, suggest similar?)
- Should system send any notifications ever, or completely notification-free?
- How should multiple time entries on one ticket be displayed in ticket view?
- What reports/exports beyond Xero invoices might be useful? (Monthly summaries, client-specific reports?)
- Should clients be able to see their own tickets somehow, or purely internal tool?
- What backup/export capabilities needed for business continuity?

### Next Session Planning
- **Suggested topics:**
  1. Technical architecture planning session (database design, API structure, hosting strategy)
  2. UX/UI design session with mockups for core workflows
  3. Xero integration deep-dive (API capabilities, error handling, testing strategy)
- **Recommended timeframe:** Within 1-2 weeks while insights are fresh
- **Preparation needed:** Review Xero API documentation, gather current system pain point examples (screenshots), list any additional edge cases that come to mind

---

*Session facilitated using the BMAD-METHOD™ brainstorming framework*