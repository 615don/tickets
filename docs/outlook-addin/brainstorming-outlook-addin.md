# Brainstorming Session Results: Outlook Add-in

**Session Date:** 2025-10-08
**Facilitator:** Business Analyst Mary 📊
**Participant:** David Givens
**Topic:** Outlook Web Access Add-in for Email-to-Ticket Conversion

---

## Executive Summary

**Session Goals:** Comprehensive exploration of an Office Add-in for Outlook Web Access that converts email chains into tickets with intelligent contact/client matching and optional AI-powered description and notes generation.

**Techniques Used:**
1. Role Playing (15-20 min)
2. What If Scenarios (15-20 min)
3. SCAMPER Method (20-25 min)
4. Assumption Reversal (10-15 min)

**Total Ideas Generated:** 40+ insights, enhancements, and design decisions

### Key Themes Identified:

- **Lean, focused design** - Minimal fields, no scope creep, fast workflow
- **Persistent sidebar interface** - Context-aware panel showing open tickets
- **Intelligent contact/client matching** - Auto-match by email + domain with disambiguation
- **Opt-in AI assistance** - Generate description/notes on demand, not by default
- **One-time conversion** - Email becomes ticket, no ongoing sync
- **Keyboard shortcuts** - Mac-friendly quick actions for power users
- **Billable time tracking** - 2-minute minimum default, manually adjustable
- **Future extensibility** - Sent emails, calendar events, voice-to-text summaries

---

## Technique Sessions

### 1. Role Playing - 20 minutes

**Description:** Explored the add-in from multiple stakeholder perspectives to uncover UX flows, edge cases, and requirements.

#### Ideas Generated:

**Perspective 1: You (The Busy Support Person)**

1. **Ideal workflow:** Select email → Click button → Simple interface with pre-filled fields → Create ticket
2. **Form fields needed:** Client (auto-filled, editable), Contact (auto-filled, editable), Time (manual entry, billable hours including ticket creation time), Description (optional), Notes (optional), AI generation option
3. **Modal/Popup interface:** Initially proposed as popup/modal dialog
4. **AI toggle usage:** ON when don't want to do any work (AI handles everything), OFF when know what to say
5. **Pre-filled but editable fields:** System makes suggestions but allows overrides
6. **Manual selection fallback:** When no automatic match found, show dropdowns for manual selection

**Perspective 2: The Email Sender (Client)**

7. **No client notification:** Client doesn't receive auto-reply about ticket creation
8. **One-time conversion:** Email becomes ticket, support person handles billing from there
9. **No ongoing sync:** No automatic updates from email replies to ticket
10. **Single contact association:** Only sender associated with ticket, not CC'd colleagues

**Perspective 3: The System (Matching Logic)**

11. **Contact matching priority:** First check existing contact by email address → grab client_id
12. **Domain matching:** If no contact exists, match email domain to client domains
13. **Multiple domains per client:** Clients can have multiple domain associations
14. **Disambiguation for multi-client contacts:** Same person (email) can work for multiple clients → system clarifies which client to bill
15. **Auto-create contacts:** Use email address + Display Name from sender
16. **Contact fields:** Only name and email (keep it minimal)
17. **Unique domain per client:** Domain matching is reliable (no conflicts between clients)

**Perspective 4: The AI (Email Understanding)**

18. **Email chain summarization:** Summarize latest update or latest issue from chain
19. **Description vs. Notes distinction:**
    - Description = Brief invoice line item to trigger client memory
    - Notes = Detailed technician information for billing disputes/clarification
20. **No sensitive data filtering:** Don't worry about stripping passwords/keys
21. **AI failure handling:** Use default description/notes and create ticket anyway (don't block workflow)
22. **Default description:** "Support request from [Contact Name]"
23. **Default notes:** "Original email: [date/time] from [email]" + first 20-30 words of email body

#### Insights Discovered:

- Time field represents billable hours including ticket creation time
- Email is just a trigger, ticket lives independently in the system
- Contact can exist at multiple clients (same person, different billing entities)
- Description and Notes serve different purposes in the billing workflow
- AI should never block ticket creation - always fall back to defaults

#### Notable Connections:

- Time tracking directly tied to billing requirements
- Contact/client relationship complexity requires disambiguation UI
- One-time conversion model simplifies implementation (no ongoing email monitoring)

---

### 2. What If Scenarios - 20 minutes

**Description:** Stress-tested the design with edge cases and provocative questions to uncover technical decisions and challenges.

#### Ideas Generated:

24. **Ambiguous contact scenario:** When contact exists at multiple clients, show disambiguation UI in form
25. **Disambiguation UI design:** Dropdown or selection showing contact name + client name
26. **Display Name mismatch:** Trust email address match over display name differences
27. **Wrong client selection:** Tickets are editable after creation for corrections
28. **Domain matching as new feature:** May need to build domain-to-client matching logic (either for add-in only or add to main product)
29. **No match scenario:** Show manual client dropdown + auto-create contact from email/display name (editable)
30. **No "add domain" shortcut:** Domain management happens during client onboarding, not in add-in
31. **AI failure states:** Code 500 or errors → drop to default description/notes
32. **Async AI workflow (initial idea):** Fire and forget - modal closes, AI works in background
33. **Background processing notification:** Toast notification when ticket created (if technically possible in OWA add-in)
34. **Selective AI usage:** AI only fills in blank fields - can pre-fill Description manually, let AI do Notes only
35. **Email chain complexity:** Default to latest email if multiple issues in chain
36. **Thread context:** Try to use chain for notes, default to latest if too complex
37. **Technical constraints:** All flexible (compact form OK, sidebar OK, session/cookie auth preferred, manual installation OK)
38. **Inactive client handling:** Warn but allow ticket creation
39. **Contact without email:** Not possible (email is required field on contacts)

#### Insights Discovered:

- Domain matching logic is a foundational feature that may need implementation before add-in
- Selective AI usage (fill only blank fields) provides maximum flexibility
- AI async workflow initially appealing but reconsidered later with sidebar design
- Few clients + slow onboarding = no need for domain management shortcuts
- Technical implementation details are flexible - prioritize functionality over specific tech approach

#### Notable Connections:

- Edge case handling philosophy: keep it simple, allow manual correction later
- AI never blocks workflow - defaults ensure ticket always gets created
- Email chain complexity handled pragmatically (latest email wins when ambiguous)

---

### 3. SCAMPER Method - 25 minutes

**Description:** Systematically explored enhancements and creative improvements using the SCAMPER framework (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse).

#### Ideas Generated:

**Substitute:**

40. **Browser add-in alternative:** Considered but rejected (need email metadata like display name and email address)
41. **AI as IT support provider:** Future possibility for AI to provide template docs (Tailscale setup, MFA instructions) or suggest solutions
42. **AI time estimation:** Possible but not compelling - estimate based on email length/complexity/thread count

**Combine:**

43. **No combinations:** Explicitly rejected scope creep - building lean system to avoid bloat of third-party solutions

**Adapt:**

44. **Keyboard shortcuts:** Mac-friendly shortcuts for power users
    - `Cmd+Shift+T` to trigger add-in
    - Key to toggle/trigger AI when modal/sidebar open
    - `Cmd+Enter` to submit form

**Modify:**

45. **Show recent open tickets:** Future enhancement to display recent open tickets from matched contact
46. **Add time to existing ticket:** Quick action to add time instead of creating new ticket
47. **Filter for open tickets only:** Don't show or allow reopening closed tickets
48. **Mark as closed immediately:** Checkbox to create and close ticket in one action (for work completed via email)

**Put to Other Uses:**

49. **Contact/client matching in web app:** Use same matching logic for search in main ticketing system web interface
50. **Voice-to-text + AI summarization:** Future feature for web app - talk through work done, AI summarizes for notes field
51. **Create and close workflow:** Checkbox to mark ticket closed immediately (when documenting already-completed work)

**Eliminate:**

52. **Already minimal design:** No unnecessary fields, description/notes can be blank, minimal validation

**Reverse:**

53. **AI on by default (reconsidered):** Initially appealing, later rejected in favor of opt-in
54. **Sent emails + received emails:** Both are billable events, should work for both
55. **Calendar events as ticket source:** Future enhancement - meetings are billable too
56. **Contact matching for sent emails:** Match recipient instead of sender (flip the logic)
57. **Multiple recipients handling:** Find original sender in chain or ask for clarification

#### Insights Discovered:

- Keyboard shortcuts significantly speed up power user workflow
- Showing recent open tickets enables "add time" workflow without leaving Outlook
- Voice-to-text + AI could revolutionize notes documentation
- Create and close checkbox handles "already completed work" scenario elegantly
- Sent emails and calendar events are natural extensions (same billing model)
- Unified add-in could work across received/sent emails (potentially calendar too)

#### Notable Connections:

- Contact/client matching becomes infrastructure feature useful beyond add-in
- AI capabilities extend beyond add-in to web app (voice-to-text summarization)
- Unified tool vision: one add-in for all email types (sent/received) and potentially calendar

---

### 4. Assumption Reversal - 15 minutes

**Description:** Challenged core assumptions to validate design decisions and uncover better approaches.

#### Ideas Generated:

**Assumption 1: Modal Dialog**

58. **Sidebar instead of modal:** Persistent task pane that stays open while working through emails
59. **Sidebar advantages:** See ticket form while reading email, no open/close interruption, shows ongoing context
60. **Dynamic ticket context panel:** Sidebar continuously queries for open tickets for current email's contact
61. **Auto-clear on email change:** Form refreshes automatically when selecting different email

**Assumption 2: Automatic Matching**

62. **Automatic matching validated:** Necessary to enable showing relevant open tickets (the gateway to contextual awareness)
63. **Matching enables ticket awareness:** Auto-match contact/client → Query open tickets → Show context

**Assumption 3: Async AI Processing**

64. **Synchronous AI with sidebar:** Changed from async to sync - wait 5-10 seconds while AI generates content
65. **Review before creation:** See AI output, edit if needed, then create ticket
66. **No review interruption:** Sidebar stays open anyway, so waiting is acceptable

**Assumption 4: AI Toggle Default**

67. **Remove AI toggle completely:** Replace checkbox/toggle with "Generate with AI" button
68. **Opt-in AI by default:** Most common workflow is manual, AI is less frequent enhancement
69. **Generate-then-create workflow:** Click "Generate with AI" → Wait → Review → Click "Create Ticket"

**Assumption 5: Manual Time Entry**

70. **Default time value:** 2 minutes (0.03 hours) - minimum billable time for reading/responding
71. **Prevents zero time entries:** Ensures always billing at least minimum even if forget to update

**Assumption 6: One Ticket Per Email**

72. **Keep it simple:** One email = one ticket (multiple tickets from one email is rare edge case)

#### Insights Discovered:

- Sidebar changes entire interaction model - persistent context vs. focused interruption
- Sidebar enables continuous open ticket awareness without leaving Outlook
- AI workflow changes from async to sync because sidebar stays open (no need to close quickly)
- AI toggle removed in favor of explicit "Generate with AI" button (clearer intent)
- Default time value prevents billing errors and reflects minimum service charge
- Simplicity wins - rare edge cases (multiple tickets per email) not worth complexity

#### Notable Connections:

- Modal vs. sidebar choice cascades to affect AI workflow (async vs. sync)
- Automatic matching isn't about speed - it's about enabling contextual ticket awareness
- Form behavior (auto-clear on email change) creates predictable, clean workflow
- Two-click AI workflow (generate, then create) provides control while maintaining speed

---

## Idea Categorization

### Immediate Opportunities
*Ideas ready to implement now (MVP scope)*

1. **Persistent Sidebar Interface**
   - Description: Task pane that stays open, shows ticket creation form and dynamically updates based on selected email
   - Why immediate: Core UX pattern that enables all other features, well-defined requirements
   - Resources needed: Office Add-in development expertise, understanding of Office.js APIs

2. **Intelligent Contact/Client Matching**
   - Description: Auto-match contact by email address, fallback to domain matching against client domains, with disambiguation UI for multi-client contacts
   - Why immediate: Essential for core functionality, matching logic is well-defined through edge case exploration
   - Resources needed: Backend API for contact lookup and domain matching, database query optimization

3. **Manual Ticket Creation Form**
   - Description: Pre-filled but editable fields (Client, Contact, Time, Description, Notes) with "Mark as closed immediately" checkbox
   - Why immediate: Core workflow, all field requirements defined, minimal validation needed
   - Resources needed: Form UI in sidebar, API integration to create tickets

4. **Default Time Entry**
   - Description: Pre-fill Time field with 0.03 hours (2 minutes) as minimum billable time
   - Why immediate: Simple to implement, prevents billing errors, well-justified business rule
   - Resources needed: Form default value logic

5. **Disambiguation UI for Multi-Client Contacts**
   - Description: When contact exists at multiple clients, show dropdown/selection to choose which client to bill
   - Why immediate: Critical for accurate billing, edge case but must handle correctly from launch
   - Resources needed: Contact lookup API returning all client associations, selection UI component

6. **Auto-Create Contacts**
   - Description: When email doesn't match existing contact but domain matches client, create new contact with email address and display name
   - Why immediate: Reduces friction, requirements are clear (name + email only)
   - Resources needed: Contact creation API, form to show/edit auto-created contact before ticket creation

7. **Domain-to-Client Matching Logic**
   - Description: Match email domain against clients' domain lists to infer client when no contact exists
   - Why immediate: Essential for auto-matching workflow, may need to implement in core product if not already present
   - Resources needed: Client domain storage (support multiple domains per client), matching algorithm, investigation into existing codebase

8. **Inactive Client Warning**
   - Description: Show warning when matched client is marked inactive, allow ticket creation anyway
   - Why immediate: Simple validation, prevents surprise billing to inactive accounts
   - Resources needed: Client status check, warning UI component

### Future Innovations
*Ideas requiring development/research*

1. **AI Description & Notes Generation**
   - Description: "Generate with AI" button that reads email content and populates Description (brief invoice line item) and Notes (detailed context) fields, with synchronous processing (wait 5-10 seconds, review, then create)
   - Development needed: AI API integration (OpenAI/Anthropic), prompt engineering for description vs. notes distinction, email content extraction, error handling with defaults
   - Timeline estimate: 2-3 weeks (dependent on AI API selection and integration complexity)

2. **Show Recent Open Tickets**
   - Description: Sidebar displays recent open tickets for matched contact, with option to add time to existing ticket instead of creating new one
   - Development needed: API to query open tickets by contact, UI to display ticket list, "Add time" workflow as alternative to "Create new"
   - Timeline estimate: 1-2 weeks

3. **Keyboard Shortcuts (Mac)**
   - Description: `Cmd+Shift+T` to trigger add-in, keyboard shortcuts within sidebar to navigate form and trigger actions
   - Development needed: Office Add-in keyboard shortcut registration, focus management in sidebar
   - Timeline estimate: 1 week

4. **Sent Email Support**
   - Description: Add-in works on sent emails with contact/client matching flipped (match recipient instead of sender), handle multiple recipients by finding original sender in chain or asking for clarification
   - Development needed: Email direction detection, recipient extraction and matching, multi-recipient disambiguation UI
   - Timeline estimate: 1-2 weeks

5. **Calendar Event Integration**
   - Description: Convert calendar events (meetings) into tickets with time pre-filled from event duration
   - Development needed: Research Office Add-in support for Calendar (may require separate add-in), calendar event data extraction, similar form UI
   - Timeline estimate: 2-3 weeks (dependent on technical feasibility research)

6. **Voice-to-Text + AI Summarization (Web App)**
   - Description: In main ticketing web app, enable voice input for Notes field with AI summarization to clean up spoken notes into professional documentation
   - Development needed: Voice-to-text API integration, AI summarization for spoken content, web app UI for voice recording
   - Timeline estimate: 2-3 weeks

7. **Contact/Client Matching in Web App**
   - Description: Extend contact/client matching logic to web app's contact search for auto-associating clients
   - Development needed: Reuse matching logic from add-in, integrate into web app search/contact forms
   - Timeline estimate: 1 week

8. **AI Knowledge Base Assistant**
   - Description: AI retrieves template documents (Tailscale setup, MFA instructions) or suggests solutions based on email content
   - Development needed: Knowledge base of template documents, AI retrieval/RAG implementation, suggestion UI
   - Timeline estimate: 3-4 weeks

### Moonshots
*Ambitious, transformative concepts*

1. **AI as IT Support Provider**
   - Description: AI not only documents the ticket but actually performs IT support services (auto-responds to common issues, executes fixes)
   - Transformative potential: Fully automated support for routine issues, freeing up time for complex problems
   - Challenges to overcome: Trust and reliability, security and access control, distinguishing when AI can handle vs. requires human intervention, liability concerns

### Insights & Learnings
*Key realizations from the session*

- **Lean by design philosophy**: Explicitly rejecting scope creep and third-party bloat is a core principle guiding every decision. This focus on minimalism is the project's competitive advantage.

- **Billing workflow drives requirements**: Time tracking, description vs. notes distinction, and default time values all stem from billing needs. Understanding the invoicing context is critical.

- **Sidebar changes everything**: Shifting from modal to sidebar fundamentally altered AI workflow (async → sync), enabled open ticket awareness, and created persistent context. The interface choice has cascading implications.

- **Automatic matching as enabler**: Contact/client matching isn't primarily about speed - it's the gateway to showing relevant open tickets and providing contextual awareness. The matching logic enables the real value proposition.

- **AI as opt-in enhancement**: Most workflow is manual (processing many emails quickly), AI is for occasional complex situations. This usage pattern drove the decision to make AI explicit opt-in rather than default behavior.

- **One-time conversion model simplifies**: Email becomes ticket, no ongoing sync. This architectural decision avoids complexity of monitoring email threads, webhook integration, and state synchronization.

- **Same person, multiple clients**: The contact/client relationship is more complex than one-to-one. Disambiguation UI is critical for accurate billing when consultants/contacts work across multiple client organizations.

- **Editable after creation**: "Edit later" philosophy reduces pressure on initial ticket creation. Don't need perfect data upfront, can correct at invoice time.

- **Domain matching as infrastructure**: The email domain to client matching logic may need to be built as a core platform feature, not just add-in functionality. This could benefit web app too.

- **Unified tool vision**: Sent emails, received emails, and calendar events are all billable events that could share the same interface pattern. Think beyond received emails only.

- **Default values prevent errors**: 2-minute minimum time entry ensures billing baseline and prevents accidentally creating zero-time tickets. Small UX details that protect business operations.

- **Keyboard shortcuts for power users**: When processing high volumes, keyboard navigation is significantly faster than clicking. Power user features enhance adoption.

---

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: MVP Outlook Add-in (Received Emails, Manual Creation)

- **Rationale:** Core functionality that delivers immediate value. Sidebar with contact/client matching and manual ticket creation solves the primary use case: quickly creating tickets from emails without leaving Outlook. This establishes the foundation for all future enhancements.

- **Next steps:**
  1. Investigate Office Add-in development requirements (Office.js, manifest, authentication)
  2. Research domain matching - does it exist in current codebase or need to build?
  3. Create technical architecture document with Architect
  4. Implement sidebar UI with form fields (Client, Contact, Time, Description, Notes, Close checkbox)
  5. Implement contact/client matching logic with disambiguation UI
  6. Build auto-create contact functionality
  7. Integrate with ticket creation API
  8. Manual testing with real email scenarios
  9. Document installation process for Outlook Web

- **Resources needed:**
  - Frontend developer familiar with Office.js and Add-in development
  - Backend API endpoints for contact lookup, domain matching, ticket creation
  - Access to Office 365 developer tenant for testing
  - Time for testing and iteration (1-2 weeks)

- **Timeline:** 3-4 weeks for MVP

---

#### #2 Priority: AI Description & Notes Generation

- **Rationale:** High-value enhancement that differentiates this tool from simple email forwarding. When handling complex email chains or when pressed for time, AI can save significant effort. Synchronous processing with review step ensures quality control.

- **Next steps:**
  1. Select AI API provider (OpenAI GPT-4, Anthropic Claude, or other)
  2. Design prompts for description vs. notes generation
  3. Implement email content extraction from Outlook email object
  4. Build "Generate with AI" button with loading state
  5. Implement default fallback (description + notes templates) for API failures
  6. Test with variety of email types (simple requests, complex chains, multiple issues)
  7. Optimize prompt engineering based on results
  8. Implement selective AI (only fill blank fields)

- **Resources needed:**
  - AI API subscription/credits
  - Developer time for integration and prompt engineering
  - Test dataset of representative emails
  - Budget for API calls (monitor costs during development)

- **Timeline:** 2-3 weeks (after MVP complete)

---

#### #3 Priority: Show Recent Open Tickets & Add Time Workflow

- **Rationale:** This feature leverages the contact/client matching to provide context and enables a second major workflow: adding time to existing tickets without leaving Outlook. Reduces context switching and makes the add-in more powerful than just ticket creation.

- **Next steps:**
  1. Design API endpoint to query open tickets by contact_id
  2. Design sidebar UI to display open ticket list (ticket number, brief description, date opened)
  3. Implement "Add Time to Ticket #1234" action as alternative to "Create New Ticket"
  4. Handle form state transition between "create new" and "add time" modes
  5. Test with scenarios where contact has 0, 1, or multiple open tickets
  6. Consider pagination if contact has many open tickets (edge case)

- **Resources needed:**
  - Backend API development (query open tickets)
  - Frontend UI components for ticket list display
  - Design consideration for UX when switching between create/add-time modes

- **Timeline:** 1-2 weeks (after AI generation complete)

---

## Reflection & Follow-up

### What Worked Well

- **Role Playing technique** uncovered rich detail about each stakeholder's needs and the system's decision-making logic
- **What If Scenarios** stress-tested edge cases early, preventing surprises during development
- **SCAMPER** generated creative enhancements while respecting the "no scope creep" philosophy
- **Assumption Reversal** led to the crucial sidebar insight that cascaded into improved AI workflow
- **Interactive dialogue** allowed real-time course correction (e.g., sidebar revelation, AI workflow pivot)
- **Numbered options** made technique selection and decision points clear
- **Progressive flow** from divergent (generate ideas) to convergent (refine and prioritize) felt natural

### Areas for Further Exploration

- **Office Add-in technical capabilities**: Research exactly what Outlook Web Add-ins can access (email thread vs. single message, calendar integration possibilities, authentication options)
- **Domain matching implementation**: Investigate whether domain-to-client matching already exists in codebase or needs to be built from scratch
- **AI API selection**: Evaluate OpenAI vs. Anthropic vs. other providers for description/notes generation (cost, quality, speed)
- **Keyboard shortcut technical implementation**: How to register global shortcuts in Office Add-ins, platform compatibility (Mac/Windows)
- **Sent email and calendar feasibility**: Can one add-in handle both Mail and Calendar contexts, or are separate add-ins required?

### Recommended Follow-up Techniques

- **Morphological Analysis**: Once AI API is selected, systematically explore parameter combinations (model, temperature, prompt structure, context length) to optimize output quality
- **Five Whys**: If technical blockers emerge (e.g., can't access email thread, can't share auth session), dig deep into root causes and alternative solutions
- **Time Shifting**: "How would this have been built in 2015 (before AI)? How will it work in 2030 (when AI is ubiquitous)?" to stress-test the architecture's longevity

### Questions That Emerged

- Can Office Add-ins for Outlook Web share authentication session/cookies with the main web app, or do they require separate auth?
- Does Office.js provide access to full email thread or only the currently selected message?
- What are the technical constraints for keyboard shortcut registration in Office Add-ins?
- Can one Office Add-in context support both Mail and Calendar, or must they be separate add-ins?
- Should domain-to-client matching be built as core platform feature or scoped to add-in only?
- What is the current state of contact/client relationships in the database schema? Are there existing constraints or assumptions that would affect multi-client contact support?
- What AI model best balances cost vs. quality for description/notes generation? (needs experimentation)
- How should the system handle internationalization (non-English emails) for AI generation?
- What analytics/telemetry should be tracked to understand add-in usage and optimize workflow?

### Next Session Planning

- **Suggested topics:**
  1. Deep dive into AI prompt engineering workshop (optimizing description vs. notes generation)
  2. UX flow mapping for disambiguation scenarios (wireframes and interaction design)
  3. Technical architecture session with development team (Office Add-in patterns, API design, authentication)
  4. Voice-to-text + AI summarization feature exploration (for web app notes field)

- **Recommended timeframe:**
  - Technical architecture session: Within 1 week (before development starts)
  - AI prompt engineering workshop: After MVP complete, before AI integration begins (3-4 weeks out)
  - UX flow mapping: Within 2 weeks (parallel to MVP development for validation)

- **Preparation needed:**
  - Research Office Add-in technical documentation
  - Review current codebase contact/client schema and API endpoints
  - Gather sample representative emails for testing
  - Set up Office 365 developer tenant for add-in testing
  - Select preliminary AI API provider for experimentation

---

*Session facilitated using the BMAD-METHOD™ brainstorming framework*
