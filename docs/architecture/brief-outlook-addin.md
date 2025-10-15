# Project Brief: Outlook Web Add-in for Email-to-Ticket Conversion

**Date:** 2025-10-08
**Author:** Business Analyst Mary
**Status:** Ready for PM Handoff

---

## Executive Summary

**Outlook Web Add-in for Email-to-Ticket Conversion** is a persistent sidebar interface integrated into Outlook Web Access that enables instant ticket creation from emails with intelligent contact/client matching, optional AI-powered content generation, and contextual awareness of open tickets. The add-in solves the critical friction problem in capturing billable time by eliminating the need to leave email—the primary work environment—to document support activities. Designed for solo IT consultants performing hourly billing, the add-in prioritizes speed and minimal data entry while maintaining accurate billing records. The key value proposition is reducing ticket creation time from minutes to seconds, preventing forgotten billable work, and providing contextual awareness without context switching.

---

## Problem Statement

### Current State & Pain Points

IT consultants performing hourly billing work primarily through email communication—responding to support requests, troubleshooting issues, and documenting solutions. The current workflow requires switching from Outlook to a separate ticketing system to log billable time, which introduces significant friction. This friction manifests as:

- **Context switching overhead**: Leaving email to open ticketing system, losing focus on email workflow
- **Data re-entry burden**: Manually typing client name, contact information, and work description that's already visible in the email
- **Forgotten billable time**: When ticket creation takes too long, consultants defer logging with intention to "do it later," resulting in forgotten tickets and lost revenue
- **No contextual awareness**: Unable to see if open tickets already exist for a contact without leaving email

### Impact

The friction problem directly impacts revenue capture. Even a few forgotten tickets per month can result in thousands of dollars in lost annual billing. Beyond revenue loss, deferred ticket creation creates administrative burden at month-end when trying to reconstruct work from memory.

### Why Existing Solutions Fall Short

Third-party ticketing systems are bloated with features designed for large teams (workflow management, assignments, priorities, status tracking, notifications) that add unnecessary complexity for solo consultants. These systems optimize for task management rather than billing documentation, creating friction through:

- Slow-loading dropdowns and mandatory fields
- Complex workflows that don't match consultant reality
- No integration with email clients where work actually happens
- Feature bloat that clutters interfaces and slows operations

### Urgency

Every day without this solution represents potential lost revenue. The ticketing system exists and is being actively used for billing, making now the ideal time to extend it with email integration before workflow patterns solidify around inefficient manual processes.

---

## Proposed Solution

### Core Concept

An Outlook Web Add-in that embeds ticket creation directly into the email workflow through a persistent sidebar interface. The add-in intelligently auto-matches contacts and clients using email addresses and domain matching, pre-fills ticket fields, displays open tickets for the current contact, and optionally leverages AI to generate ticket descriptions and notes from email content.

### Key Differentiators

- **Zero context switching**: Ticket creation happens within Outlook, never leaving the email environment
- **Intelligent pre-filling**: Email metadata (sender, domain, display name) automatically populates contact/client fields
- **Contextual awareness**: Sidebar displays open tickets for matched contact, enabling "add time" workflow without switching to web app
- **Opt-in AI assistance**: "Generate with AI" button provides help when needed without forcing it on every ticket
- **Minimal required fields**: Only Time field is mandatory (defaults to 2 minutes); Description and Notes can be blank or AI-generated
- **Lean by design**: No scope creep—focused solely on capturing billable time, not managing workflows

### Why This Will Succeed

This solution succeeds because it meets users where they already work (email) rather than forcing them to adopt new tools or workflows. By reducing ticket creation to seconds instead of minutes and eliminating the cognitive burden of context switching, it removes the friction that causes forgotten billable work. The design philosophy explicitly rejects feature bloat in favor of speed and simplicity.

### High-Level Vision

The add-in becomes the primary method for capturing billable work, extending beyond received emails to sent emails (documenting solutions provided) and calendar events (documenting meetings). AI capabilities evolve from simple description generation to knowledge base integration (suggesting solution templates) and voice-to-text note capture in the web app. The contact/client matching logic becomes infrastructure reused throughout the ticketing system.

---

## Target Users

### Primary User Segment: Solo IT Consultant (Hourly Billing)

**Demographic/Firmographic Profile:**
- Independent IT consultant or very small IT services firm (1-3 people)
- Provides managed services and ad-hoc support to small/medium business clients
- Bills hourly for support work ($180/hour rate)
- Manages 10-20 active clients with varying support needs
- Expected monthly billable hours: 85-100 hours

**Current Behaviors and Workflows:**
- Works primarily through Outlook Web Access for client communication
- Receives support requests via email (primary channel), occasional phone calls, and text messages
- Responds to issues directly in email, performing troubleshooting and documenting solutions
- Currently logs billable time in separate ticketing system after completing work
- Uses Mac for daily operations
- Invoices clients monthly through Xero integration

**Specific Needs and Pain Points:**
- Needs to capture billable time without interrupting email-based work flow
- Struggles with forgotten tickets when ticket creation takes too long
- Loses revenue from unbilled work that gets forgotten
- Wants minimal data entry—most information already visible in email
- Needs to know if open tickets already exist for a contact without leaving email
- Prefers keyboard shortcuts and fast workflows over clicking through UIs
- Explicitly rejects feature-bloated third-party solutions

**Goals They're Trying to Achieve:**
- Capture 100% of billable time accurately for proper client invoicing
- Minimize administrative overhead of billing documentation
- Stay focused on email workflow without constant context switching
- Create tickets in seconds, not minutes
- Maintain detailed notes for billing disputes without slowing down during work
- Generate accurate monthly invoices that reflect all work performed

**Note:** No secondary user segment needed—this is a single-user tool designed specifically for the consultant's workflow.

---

## Goals & Success Metrics

### Business Objectives

- **Increase revenue capture by eliminating forgotten tickets**: Target 100% billable time capture vs. current estimated 90-95%, translating to $5,000-10,000 additional annual revenue
- **Reduce ticket creation time by 80%**: From 2-3 minutes per ticket to 15-30 seconds, saving 20-30 hours per year in administrative overhead
- **Enable real-time ticket logging**: Create tickets during or immediately after work, not deferred to end-of-day or end-of-week
- **Achieve 80%+ adoption rate for email-originated work**: Make add-in the primary ticket creation method for email-based support requests within 3 months of launch

### User Success Metrics

- **Time to create ticket**: Average ticket creation time < 30 seconds (vs. 2-3 minutes baseline)
- **Context switches per day**: Reduce email-to-ticketing-system switches from 10-15/day to near-zero
- **Tickets created per day**: Increase from current baseline by 15-20% (capturing previously forgotten work)
- **User satisfaction**: Self-reported reduction in "billing documentation frustration"
- **Keyboard shortcut usage**: 50%+ of tickets created using keyboard shortcuts after 1 month (power user adoption)

### Key Performance Indicators (KPIs)

- **Monthly billable hours captured**: Target 85-100 hours/month with <5% variance from expected (validates complete capture)
- **Add-in usage rate**: 80%+ of tickets created via add-in (vs. web app) for email-originated work within 3 months
- **AI feature adoption**: 20-30% of tickets use "Generate with AI" button (validates opt-in model)
- **Ticket creation latency**: 90% of tickets created within 1 hour of email receipt (vs. current deferred logging pattern)
- **Zero forgotten ticket months**: Achieve 3+ consecutive months with billable hours in expected range without month-end scramble

---

## MVP Scope

### Core Features (Must Have)

- **Persistent Sidebar Interface**: Task pane in Outlook Web that stays open while working through emails, automatically updates based on selected email
- **Intelligent Contact/Client Matching**: Auto-match contact by email address, fallback to domain matching against client domain lists, with disambiguation UI when contact exists at multiple clients
- **Manual Ticket Creation Form**: Pre-filled but editable fields—Client (dropdown), Contact (dropdown/display), Time (default 0.03 hours), Description (optional), Notes (optional), "Mark as closed immediately" checkbox
- **Auto-Create Contacts**: When email doesn't match existing contact but domain matches client, automatically create new contact using email address and display name (editable before ticket creation)
- **Domain-to-Client Matching Logic**: Backend infrastructure to match email domains against clients' domain lists (multiple domains per client supported)
- **Form Auto-Clear on Email Selection**: When selecting different email, sidebar automatically refreshes with new email's contact/client match
- **Inactive Client Warning**: Display warning when matched client is marked inactive, but allow ticket creation
- **Received Email Support**: Works on incoming emails with sender-based matching
- **Mac-Compatible**: Full functionality on macOS using Outlook Web Access

### Out of Scope for MVP

**Phase 2+ Features (Planned for Future Implementation):**
- AI description and notes generation ("Generate with AI" button)
- Show recent open tickets from matched contact
- Add time to existing ticket workflow
- Keyboard shortcuts (Cmd+Shift+T, etc.)
- Sent email support (recipient-based matching)
- Calendar event integration
- Multiple recipients disambiguation
- Contact/client matching in web app
- Email thread analysis (beyond latest email)
- Toast notifications on ticket creation
- Analytics/telemetry tracking

**Not Currently Planned:**
- Voice-to-text in web app
- Mobile support

### MVP Success Criteria

**MVP is considered successful when:**
1. Add-in installs and loads reliably in Outlook Web Access
2. Contact/client matching works correctly for 90%+ of emails (with manual selection fallback for edge cases)
3. Tickets are created successfully with proper client/contact associations
4. Form fields pre-fill correctly and are editable
5. User can create a ticket in <30 seconds for matched emails
6. No data loss or corruption in ticket creation
7. User adopts add-in for 50%+ of email-based ticket creation within 2 weeks

---

## Post-MVP Vision

### Phase 2 Features

**Priority 1: AI Description & Notes Generation (2-3 weeks)**
- "Generate with AI" button that reads email content and populates Description (brief invoice line item) and Notes (detailed context) fields
- Synchronous processing with loading state (wait 5-10 seconds, review output, then create)
- Selective AI: only fills blank fields (user can pre-fill Description manually, let AI generate Notes only)
- Default fallback for API failures: "Support request from [Contact Name]" + "Original email: [date/time] from [email]" + first 20-30 words

**Priority 2: Show Recent Open Tickets & Add Time Workflow (1-2 weeks)**
- Sidebar displays recent open tickets for matched contact (ticket number, brief description, date opened)
- "Add Time to Ticket #1234" action as alternative to creating new ticket
- Reduces need to switch to web app for follow-up work on existing tickets

**Priority 3: Keyboard Shortcuts (1 week)**
- `Cmd+Shift+T` to trigger/open add-in
- Keyboard navigation within sidebar form
- `Cmd+Enter` to submit form
- Power user optimization for high-volume email processing

**Priority 4: Sent Email Support (1-2 weeks)**
- Add-in works on sent emails with flipped matching logic (match recipient instead of sender)
- Handle multiple recipients: find original sender in chain or ask for clarification
- Enables documenting solutions provided via email response

### Long-term Vision (6-12 months)

**Unified Billable Event Capture:**
- Single add-in handles received emails, sent emails, and calendar events
- All billable activities captured without leaving Microsoft 365 environment
- Calendar integration pre-fills Time field from event duration

**AI-Powered Knowledge Assistant:**
- AI retrieves template documents (Tailscale setup guides, MFA instructions)
- AI suggests solutions based on email content patterns
- Builds knowledge base from historical ticket resolutions

**Infrastructure Reuse:**
- Contact/client matching logic extended to web app search
- Domain matching becomes core platform feature
- Matching intelligence improves across entire ticketing system

### Expansion Opportunities

**Enhanced AI Capabilities:**
- Email thread analysis (beyond latest email only)
- Automatic time estimation based on email complexity
- Multi-language support for international clients

**Cross-Platform Extensions:**
- Contact/client matching used in web app ticket creation
- Smart suggestions based on historical patterns
- Integration with other communication channels (Teams, Slack) if workflow expands beyond email

**Analytics & Optimization:**
- Track add-in usage patterns to identify optimization opportunities
- A/B testing for AI prompt improvements
- Telemetry to understand which features drive adoption

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Outlook Web Access (Office 365) on macOS
- **Browser/OS Support:** Modern browsers (Chrome, Safari, Edge) on macOS; Windows compatibility nice-to-have but not required for MVP
- **Performance Requirements:** Sidebar loads in <2 seconds; contact/client matching completes in <500ms; ticket creation completes in <1 second

### Technology Preferences

- **Frontend:** Office.js for add-in development; React or vanilla JavaScript for sidebar UI; existing ticketing system uses React (frontend) so alignment preferred
- **Backend:** Node.js/Express backend already in place; extend existing API endpoints for contact lookup, domain matching, ticket creation
- **Database:** PostgreSQL (existing database); extend schema to support multiple domains per client if not already present
- **Hosting/Infrastructure:** Existing infrastructure for ticketing system; add-in manifest hosted separately for Office Add-in store or sideloading

### Architecture Considerations

**Repository Structure:**
- Option 1: Add-in code in `/outlook-addin` folder within existing monorepo
- Option 2: Separate repository with shared API client library
- Preference: Keep in monorepo for easier cross-cutting changes (domain matching logic, contact schema)

**Service Architecture:**
- Add-in communicates with existing ticketing system REST API
- No new microservices needed
- Reuse authentication session/cookies from web app if technically possible (research needed)

**Integration Requirements:**
- Office.js API for email metadata access (sender, display name, body content)
- Existing backend API endpoints: `GET /api/contacts/match`, `GET /api/clients/by-domain`, `POST /api/tickets`, `POST /api/contacts`
- May need new endpoint: `GET /api/contacts/:id/clients` (for disambiguation UI)

**Security/Compliance:**
- Email content never stored on backend (only processed for AI generation if user opts in)
- Authentication required before add-in can access ticketing API
- Standard HTTPS/TLS for all API communication
- No special compliance requirements (no HIPAA, PCI-DSS, etc.)

### Technical Unknowns Requiring Research

- Can Office Add-ins share authentication session/cookies with parent web app?
- Does Office.js provide access to full email thread or only selected message?
- What are keyboard shortcut registration capabilities in Office Add-ins?
- Can one add-in support both Mail and Calendar contexts, or separate add-ins required?
- Performance implications of sidebar staying open continuously vs. opening on-demand

---

## Constraints & Assumptions

### Constraints

- **Budget:** No external budget constraints; AI API costs acceptable for single-user usage (estimated $10-50/month depending on usage)
- **Timeline:** Target 3-4 weeks for MVP, then iterative 1-2 week cycles for Phase 2 features
- **Resources:** Solo development with Claude Code as primary development tool; no dedicated QA team (manual testing by user)
- **Technical:**
  - Must work with Outlook Web Access (no native Outlook client support needed)
  - Limited to Office.js API capabilities (may restrict access to certain email metadata)
  - Manual add-in installation acceptable (no Office Store publishing requirement for MVP)
  - macOS primary platform; Windows compatibility secondary

### Key Assumptions

- Email is and will remain the primary channel for client support requests (90%+ of billable work)
- Current ticketing system API is stable and can be extended without major refactoring
- Office Add-in platform is reliable and Microsoft will maintain backward compatibility
- Domain-to-client mapping will be manually configured during client onboarding (no automatic discovery needed)
- User will manually manage client domain lists (no need for auto-sync from M365/CIPP in MVP)
- Contact email addresses are unique within a client (same email across multiple clients handled via disambiguation UI)
- User has Office 365 account with permissions to sideload add-ins
- Two-minute minimum billing increment is acceptable default (user can adjust per ticket)
- Tickets are editable after creation, so perfect accuracy on creation not critical
- AI API providers (OpenAI/Anthropic) will maintain service availability and pricing stability

---

## Risks & Open Questions

### Key Risks

- **Office Add-in API Limitations**: Office.js may not provide access to full email threads or certain metadata needed for optimal functionality. *Mitigation: Research Office.js capabilities early in MVP; fall back to single-email processing if thread access unavailable.*

- **Authentication Complexity**: If add-in cannot share session/cookies with web app, may require separate authentication flow adding friction. *Mitigation: Research auth options in first week; implement simplest viable approach even if requires login per session.*

- **Domain Matching Not Yet Implemented**: Current codebase may not have domain-to-client mapping infrastructure. *Mitigation: Investigate existing schema/API in discovery phase; budget 3-5 days for implementation if needed.*

- **Contact/Client Schema Constraints**: Database may have constraints preventing contacts from existing at multiple clients. *Mitigation: Review schema early; plan migration if needed before add-in development.*

- **AI API Costs Escalation**: Heavy AI usage could exceed budget expectations. *Mitigation: Implement usage tracking; make AI opt-in rather than default; set monthly budget alerts.*

- **Low Adoption Due to Friction**: If add-in installation or authentication creates too much friction, user may revert to web app. *Mitigation: Prioritize seamless installation documentation; minimize authentication steps; collect feedback early.*

- **Performance Degradation**: Sidebar staying open continuously could impact Outlook performance. *Mitigation: Implement efficient polling/caching for open tickets feature; lazy-load components; profile performance during testing.*

### Open Questions

- Can Office Add-ins for Outlook Web share authentication session/cookies with the main web app, or do they require separate auth?
- Does Office.js provide access to full email thread or only the currently selected message?
- What are the technical constraints for keyboard shortcut registration in Office Add-ins?
- Can one Office Add-in context support both Mail and Calendar, or must they be separate add-ins?
- Should domain-to-client matching be built as core platform feature or scoped to add-in only?
- What is the current state of contact/client relationships in the database schema? Are there existing constraints that would affect multi-client contact support?
- What AI model best balances cost vs. quality for description/notes generation? (needs experimentation with OpenAI GPT-4, Anthropic Claude)
- How should the system handle internationalization (non-English emails) for AI generation?
- What is the expected email volume per day to properly estimate performance requirements?

### Areas Needing Further Research

- **Office Add-in Development**: Review official Microsoft documentation for Outlook Web Add-ins, authentication patterns, manifest requirements, sideloading process
- **Email Metadata Access**: Test what data Office.js exposes (thread vs. single message, sender details, body content formats)
- **Current Codebase Schema**: Investigate contacts table, clients table, domain storage, existing API endpoints for contact/client operations
- **AI API Selection**: Compare OpenAI GPT-4 Turbo vs. Anthropic Claude 3.5 Sonnet for email summarization quality, cost, and latency
- **Authentication Options**: Research Office Add-in SSO, token-based auth, session sharing possibilities

---

## Appendices

### A. Research Summary

**Brainstorming Session (2025-10-08):**
- Comprehensive 4-technique brainstorming session exploring Outlook Add-in feature
- Techniques used: Role Playing, What If Scenarios, SCAMPER Method, Assumption Reversal
- Key insight: Sidebar interface (vs. modal) fundamentally improves workflow by enabling persistent context and open ticket awareness
- 72+ ideas generated covering MVP requirements, edge cases, future enhancements, and design decisions
- Full session results documented in [docs/brainstorming-outlook-addin.md](docs/brainstorming-outlook-addin.md)

**Key Findings:**
- Contact/client matching logic may need to be built as new infrastructure feature
- AI should be opt-in (not default) based on usage pattern analysis
- Sidebar enables synchronous AI workflow (vs. async fire-and-forget)
- Domain matching is gateway to contextual ticket awareness
- 2-minute default time prevents billing errors

### B. Stakeholder Input

**Primary Stakeholder (User/Product Owner):**
- Explicit "no scope creep" mandate—reject feature bloat that plagues third-party solutions
- Strong preference for speed over perfection ("edit later" philosophy)
- Mac-first platform requirement
- Keyboard shortcuts highly valued for power user workflow
- AI assistance valuable but must not block or slow core workflow

### C. References

- [Brainstorming Session Results: Outlook Add-in](docs/brainstorming-outlook-addin.md) - Full brainstorming documentation
- [Project Architecture](docs/architecture.md) - Existing ticketing system architecture
- [Office Add-ins Documentation](https://learn.microsoft.com/en-us/office/dev/add-ins/) - Microsoft official docs (to be reviewed)
- [Office.js API Reference](https://learn.microsoft.com/en-us/javascript/api/outlook) - Outlook-specific API documentation

---

## Next Steps

### Immediate Actions

1. **Technical Discovery (Week 1, Days 1-2)**: Research Office Add-in capabilities, authentication options, and Office.js API limitations; review current codebase for domain matching and contact/client schema
2. **Domain Matching Implementation (Week 1, Days 3-5)**: Build or extend backend infrastructure for domain-to-client matching if not already present; add multiple domains per client support
3. **Add-in Scaffolding (Week 2, Days 1-2)**: Create Office Add-in manifest, set up development environment, implement basic sidebar UI framework
4. **Contact/Client Matching Logic (Week 2, Days 3-5)**: Implement email-to-contact lookup, domain-to-client fallback, disambiguation UI for multi-client contacts
5. **Ticket Creation Integration (Week 3, Days 1-3)**: Build form with pre-filled fields, integrate with ticket creation API, implement auto-create contact flow
6. **Testing & Refinement (Week 3, Days 4-5 + Week 4)**: Manual testing with real email scenarios, performance optimization, documentation for installation
7. **MVP Launch (End of Week 4)**: Deploy and begin using in production, collect feedback for Phase 2 prioritization

### PM Handoff

This Project Brief provides the full context for **Outlook Web Add-in for Email-to-Ticket Conversion**. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.

---

*Document created using the BMAD-METHOD™ strategic analysis framework*
