# Sprint Change Proposal - Epic 1 & 2 Course Correction

**Date:** 2025-09-30
**Prepared By:** Sarah (PO Agent)
**Status:** Pending Approval

---

## Executive Summary

Epics 1 & 2 were marked complete in git commits but do not meet their acceptance criteria. Backend APIs are fully functional, but frontend integration was never completed. Development proceeded using Lovable (UI builder) which created mock data interfaces, while backend APIs were built separately without integration. Critical framework artifacts (architecture document, sharded documents, story files) were never created.

**Recommended Action:** Complete Epics 1 & 2 properly using Direct Adjustment approach before proceeding to Epic 3.

---

## 1. Identified Issue Summary

### Core Problem
**Fundamental disconnect between frontend and backend** - Development proceeded with frontend mock data and backend APIs built independently, with no integration layer connecting them.

### Specific Gaps Identified

**Epic 1: Foundation & Authentication**
- ✅ Backend: Fully functional authentication system
  - Routes: [/api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me](backend/src/routes/auth.js)
  - Controllers: [authController.js](backend/src/controllers/authController.js:1)
  - Middleware: Session-based auth with HTTP-only cookies
  - Models: User model with bcrypt password hashing
- ❌ Frontend: **Missing completely**
  - No login/register pages
  - No authentication context/state management
  - No protected route guards
  - No auth hooks
  - Story 1.3 AC #5-7 not met

**Epic 2: Client & Contact Management**
- ✅ Backend: Fully functional CRUD APIs
  - Client API: [clientController.js](backend/src/controllers/clientController.js), [routes/clients.js](backend/src/routes/clients.js)
  - Contact API: [contactController.js](backend/src/controllers/contactController.js), [routes/contacts.js](backend/src/routes/contacts.js)
- ⚠️ Frontend: **Partially complete**
  - ✅ UI pages exist: [ClientsPage.tsx](frontend/src/pages/ClientsPage.tsx), [ContactsPage.tsx](frontend/src/pages/ContactsPage.tsx)
  - ✅ API client infrastructure: [api-client.ts](frontend/src/lib/api-client.ts:1)
  - ✅ API integration modules: [clients.ts](frontend/src/lib/api/clients.ts:1), [contacts.ts](frontend/src/lib/api/contacts.ts:1)
  - ✅ Custom hooks: [useClients.ts](frontend/src/hooks/useClients.ts), [useContacts.ts](frontend/src/hooks/useContacts.ts)
  - ❌ Components using mock data instead of hooks
  - Mock data found in: [Index.tsx:6](frontend/src/pages/Index.tsx#L6), [CreateTicketPage.tsx](frontend/src/pages/CreateTicketPage.tsx), [TicketDetail.tsx](frontend/src/components/TicketDetail.tsx), [InvoiceReview.tsx](frontend/src/components/InvoiceReview.tsx), [Settings.tsx](frontend/src/components/Settings.tsx)

### Process Violations
1. ❌ Architecture document never created (required BMad artifact)
2. ❌ PRD not sharded despite core-config.yaml expecting it
3. ❌ Story files never created in [docs/stories/](docs/stories/)
4. ❌ Development proceeded without architectural guidance
5. ❌ Epics marked complete without meeting acceptance criteria
6. ❌ Git commits claim completion prematurely

---

## 2. Epic Impact Summary

### Current Epics
- **Epic 1:** Must be reopened and completed (frontend auth missing)
- **Epic 2:** Must be reopened and completed (mock data replacement needed)

### Future Epics
- **Epic 3 (Core Ticket & Time Entry):** **BLOCKED** - Requires functional authentication for ticket creation
- **Epic 4 (Xero Integration):** Indirectly blocked by Epic 1
- **Epic 5 (Views & Search):** Indirectly blocked by Epic 1

### Epic Sequencing
No changes needed to epic order. Must complete Epics 1 & 2 properly before proceeding to Epic 3.

---

## 3. Artifact Adjustment Needs

### Critical Missing Artifacts (Must Create)
1. **Architecture Document** - [docs/architecture.md](docs/architecture.md)
   - Tech stack documentation (React, TypeScript, Express, PostgreSQL, Xero API)
   - API contract specifications
   - Data model documentation
   - Authentication flow diagrams
   - Component architecture
   - State management patterns
   - **Owner:** Architect agent

2. **Sharded PRD** - [docs/prd/](docs/prd/)
   - Shard existing [docs/prd.md](docs/prd.md) into epic-specific files
   - Epic-{n}-*.md pattern per core-config.yaml
   - **Owner:** PO agent (Sarah)

3. **Story Files** - [docs/stories/](docs/stories/)
   - Individual story YAML files for development work
   - Epic 1 remaining stories (frontend auth)
   - Epic 2 remaining stories (mock data replacement)
   - **Owner:** PO agent (Sarah)

### Artifacts to Update
1. **Git Commit Messages** - Document actual state (in progress, not complete)
2. **PRD Epic Status** - Mark Epic 1 & 2 as "In Progress" in tracking

### Artifacts Not Requiring Changes
- ✅ PRD content (goals, requirements, epic definitions are accurate)
- ✅ Backend codebase (functional and meeting requirements)
- ✅ Frontend UI components (built correctly, just need wiring)
- ✅ Database schema (migrations functional)

---

## 4. Recommended Path Forward: Direct Adjustment

### Rationale
1. Backend code is solid and fully functional - preserve it
2. Frontend UI exists and is well-built - just needs integration
3. Completing existing work faster than rollback/rebuild (~10-15 hours vs ~2-3 weeks)
4. Creates proper foundation for Epic 3+
5. Allows framework process to be followed going forward
6. No code waste

### High-Level Action Plan

#### Phase 1: Create Missing Framework Artifacts (PO & Architect)
**Estimated Time:** 3-4 hours

1. **Shard PRD** (PO agent - Sarah)
   - Create [docs/prd/](docs/prd/) directory
   - Extract each epic to separate file
   - Maintain epic-{n}-*.md naming pattern
   - Duration: 30 minutes

2. **Create Architecture Document** (Architect agent)
   - Document actual implemented tech stack
   - Document API contracts (auth, clients, contacts)
   - Document data models from migrations
   - Document authentication flow (session-based)
   - Document frontend component architecture
   - Document state management approach
   - Create architecture diagrams
   - Shard to [docs/architecture/](docs/architecture/)
   - Duration: 2-3 hours

3. **Create Story Files** (PO agent - Sarah)
   - Create [docs/stories/](docs/stories/) directory
   - Break down Epic 1 frontend work into stories
   - Break down Epic 2 integration work into stories
   - Use story-tmpl.yaml template
   - Duration: 1 hour

#### Phase 2: Complete Epic 1 Frontend Authentication (Dev)
**Estimated Time:** 4-6 hours

**Story 1.3.1: Authentication Context & State Management**
- Create auth context provider
- Implement useAuth hook
- Handle login/logout state
- Persist auth state

**Story 1.3.2: Login & Registration Pages**
- Build login page UI
- Build registration page UI
- Integrate with [/api/auth](backend/src/routes/auth.js) endpoints
- Form validation and error handling
- Redirect on successful auth

**Story 1.3.3: Protected Route Guards**
- Implement route protection wrapper
- Redirect unauthenticated users to login
- Handle authentication state loading
- Update routing configuration

**Story 1.3.4: Frontend Auth Integration Testing**
- Test login/logout flow
- Test registration flow
- Test protected route access
- Test session persistence

#### Phase 3: Complete Epic 2 Frontend Integration (Dev)
**Estimated Time:** 2-3 hours

**Story 2.5.1: Client Management UI Integration**
- Replace mock data in [ClientList.tsx](frontend/src/components/ClientList.tsx)
- Integrate useClients hook
- Connect CRUD operations to [clientsApi](frontend/src/lib/api/clients.ts:65)
- Error handling and loading states

**Story 2.6.1: Contact Management UI Integration**
- Replace mock data in [ContactList.tsx](frontend/src/components/ContactList.tsx)
- Integrate useContacts hook
- Connect CRUD operations to [contactsApi](frontend/src/lib/api/contacts.ts:56)
- Error handling and loading states

**Story 2.7: Dashboard Integration**
- Replace mock data in [Index.tsx](frontend/src/pages/Index.tsx:6)
- Fetch real statistics from backend
- Display actual tickets (when Epic 3 complete)
- Loading and error states

#### Phase 4: Validation & Documentation (PO)
**Estimated Time:** 1-2 hours

- Validate all Epic 1 acceptance criteria met
- Validate all Epic 2 acceptance criteria met
- Test end-to-end user flows
- Update documentation
- Create proper completion commit

### Total Estimated Effort
**10-15 hours** to properly complete Epics 1 & 2

---

## 5. PRD MVP Impact

### MVP Scope Changes
**No changes to MVP scope.** All original requirements remain valid.

### MVP Timeline Impact
- Epic 3 start delayed by approximately 1-2 days
- Ensures solid foundation prevents future rework
- Net positive impact on overall MVP timeline

### MVP Goals Impact
All original MVP goals remain achievable:
- ✅ Eliminate revenue leakage from forgotten billable hours
- ✅ Reduce ticket creation time to under 10 seconds
- ✅ Decrease monthly administrative overhead to under 1 hour
- ✅ Enable same-day invoice generation through Xero
- ✅ Provide transparent billing documentation
- ✅ Support 100% billable time capture

---

## 6. Detailed Story Breakdown

### Epic 1: Frontend Authentication Stories

#### Story 1.3.1: Authentication Context & State Management
```yaml
id: story-1.3.1
epic: 1
title: Authentication Context & State Management
description: Create React context and hooks for managing authentication state throughout the application
assignee: Dev
status: todo
priority: critical
blockers: []
dependencies: []
estimated_hours: 2
acceptance_criteria:
  - AuthContext created with login/logout/user state
  - useAuth hook provides authentication state to components
  - Auth state persists across page refreshes via session cookie
  - Loading state handled during auth check
  - Error states handled gracefully
technical_notes:
  - Use React Context API
  - Check /api/auth/me on app initialization
  - Store minimal user data in state (id, email, name)
  - Cookie handling automatic via fetch credentials: 'include'
```

#### Story 1.3.2: Login & Registration Pages
```yaml
id: story-1.3.2
epic: 1
title: Login & Registration Pages
description: Build login and registration page UIs integrated with backend auth endpoints
assignee: Dev
status: todo
priority: critical
blockers: []
dependencies: [story-1.3.1]
estimated_hours: 2
acceptance_criteria:
  - Login page at /login with email/password form
  - Registration page at /register with email/password/name form
  - Forms validate input client-side (email format, password length 8+)
  - Successful login/register redirects to dashboard
  - Error messages display for invalid credentials
  - Forms integrate with /api/auth/login and /api/auth/register
technical_notes:
  - Use existing form component patterns
  - POST to /api/auth/login with { email, password }
  - POST to /api/auth/register with { email, password, name }
  - Handle 400/401 errors with user-friendly messages
  - Update AuthContext state on success
```

#### Story 1.3.3: Protected Route Guards
```yaml
id: story-1.3.3
epic: 1
title: Protected Route Guards
description: Implement route protection to redirect unauthenticated users to login
assignee: Dev
status: todo
priority: critical
blockers: []
dependencies: [story-1.3.1, story-1.3.2]
estimated_hours: 1
acceptance_criteria:
  - ProtectedRoute component wraps authenticated routes
  - Unauthenticated users redirected to /login
  - Redirect preserves intended destination for post-login redirect
  - All existing pages (dashboard, clients, contacts, etc.) protected
  - Login/register pages accessible without authentication
technical_notes:
  - Check useAuth().isAuthenticated
  - Use React Router Navigate for redirects
  - Store intended URL in state for post-login redirect
  - Show loading state while checking auth
```

#### Story 1.3.4: Logout Functionality & Navigation
```yaml
id: story-1.3.4
epic: 1
title: Logout Functionality & Navigation
description: Implement logout functionality and add auth-aware navigation
assignee: Dev
status: todo
priority: high
blockers: []
dependencies: [story-1.3.1, story-1.3.2, story-1.3.3]
estimated_hours: 1
acceptance_criteria:
  - Logout button in navigation/header
  - Clicking logout calls /api/auth/logout
  - Successful logout clears auth state and redirects to /login
  - Navigation shows user email/name when authenticated
  - Navigation hides when unauthenticated
technical_notes:
  - POST to /api/auth/logout
  - Clear AuthContext state
  - Navigate to /login
  - Update Sidebar or Header component
```

### Epic 2: Mock Data Replacement Stories

#### Story 2.5.1: Client Management UI Integration
```yaml
id: story-2.5.1
epic: 2
title: Client Management UI Integration
description: Replace mock data in client components with real API integration
assignee: Dev
status: todo
priority: high
blockers: []
dependencies: [story-1.3.1]
estimated_hours: 1.5
acceptance_criteria:
  - ClientList component uses useClients hook instead of mock data
  - Create/Edit/Delete operations call clientsApi methods
  - Loading states display during API calls
  - Error states display on API failures
  - Success messages display on successful operations
  - List refreshes after create/update/delete
technical_notes:
  - Remove mockClients array
  - Use useClients() hook from frontend/src/hooks/useClients.ts
  - Existing clientsApi already implemented in frontend/src/lib/api/clients.ts
  - Handle ApiError exceptions from api-client
```

#### Story 2.6.1: Contact Management UI Integration
```yaml
id: story-2.6.1
epic: 2
title: Contact Management UI Integration
description: Replace mock data in contact components with real API integration
assignee: Dev
status: todo
priority: high
blockers: []
dependencies: [story-1.3.1, story-2.5.1]
estimated_hours: 1.5
acceptance_criteria:
  - ContactList component uses useContacts hook instead of mock data
  - Create/Edit/Delete operations call contactsApi methods
  - Loading states display during API calls
  - Error states display on API failures
  - Success messages display on successful operations
  - List refreshes after create/update/delete
  - Client dropdown populated from real client data
technical_notes:
  - Remove mockContacts array
  - Use useContacts() hook from frontend/src/hooks/useContacts.ts
  - Existing contactsApi already implemented in frontend/src/lib/api/contacts.ts
  - Client dropdown should use data from useClients
```

#### Story 2.7.1: Dashboard Statistics Integration
```yaml
id: story-2.7.1
epic: 2
title: Dashboard Statistics Integration
description: Replace mock dashboard statistics with real data (or prepare for Epic 3)
assignee: Dev
status: todo
priority: medium
blockers: []
dependencies: [story-1.3.1]
estimated_hours: 1
acceptance_criteria:
  - Remove mockStats from Index.tsx
  - Display client count from real API
  - Display contact count from real API
  - Ticket-related stats show zero or "Coming in Epic 3" placeholder
  - Loading state while fetching data
  - Error handling for failed requests
technical_notes:
  - Use useClients and useContacts hooks
  - Count clients: clients.length
  - Count contacts: contacts.length
  - Ticket stats will be implemented in Epic 3
  - Consider creating useDashboardStats hook
```

---

## 7. Agent Handoff Plan

### Workflow Sequence

1. **PO Agent (Sarah) - Current**
   - Shard PRD document
   - Create initial story files
   - **Deliverable:** Sharded PRD, story YAML files

2. **Architect Agent - Next**
   - Create architecture document from actual implementation
   - Document tech stack, APIs, data models, flows
   - Shard architecture document
   - **Deliverable:** [docs/architecture.md](docs/architecture.md), sharded to [docs/architecture/](docs/architecture/)

3. **PO Agent (Sarah) - Return**
   - Validate story files against architecture
   - Refine acceptance criteria if needed
   - Prepare stories for dev handoff
   - **Deliverable:** Validated, ready-to-implement story files

4. **Dev Agent - Implementation**
   - Implement Epic 1 stories (authentication frontend)
   - Implement Epic 2 stories (mock data replacement)
   - Test against acceptance criteria
   - **Deliverable:** Functional Epic 1 & 2 implementation

5. **PO Agent (Sarah) - Final Validation**
   - Validate all acceptance criteria met
   - Test end-to-end flows
   - Approve epic completion
   - **Deliverable:** Validated, properly completed Epics 1 & 2

6. **Dev Agent - Epic 3 Begin**
   - Proceed with Epic 3: Core Ticket & Time Entry System
   - **Prerequisite:** Epics 1 & 2 fully complete and validated

### Success Criteria

**Epic 1 Complete When:**
- [ ] Users can register new accounts
- [ ] Users can log in with email/password
- [ ] Users can log out
- [ ] Unauthenticated users redirected to login
- [ ] All protected routes require authentication
- [ ] Session persists across page refreshes
- [ ] All Story 1.3 acceptance criteria met

**Epic 2 Complete When:**
- [ ] Client list displays real data from API
- [ ] Users can create/edit/delete clients (real operations)
- [ ] Contact list displays real data from API
- [ ] Users can create/edit/delete contacts (real operations)
- [ ] Dashboard shows real client/contact counts
- [ ] No mock data remains in components
- [ ] All Story 2.5-2.7 acceptance criteria met

**Process Complete When:**
- [ ] Architecture document created and sharded
- [ ] PRD sharded to docs/prd/
- [ ] All story files created in docs/stories/
- [ ] All stories implemented and validated
- [ ] Framework process established for Epic 3+

---

## 8. Risk Assessment

### Low Risks ✅
- Backend code already functional (no changes needed)
- Frontend UI already built (just needs wiring)
- API integration infrastructure exists (hooks, api-client)
- Clear acceptance criteria defined in PRD
- Estimated effort is manageable (10-15 hours)

### Medium Risks ⚠️
- Frontend auth patterns may need refinement during implementation
- Session cookie configuration may need adjustment for frontend
- CORS configuration may need updates for local development

### Mitigation Strategies
- Architect agent documents actual backend implementation first
- Dev agent tests auth flow incrementally
- Environment variables documented for local dev setup
- Story acceptance criteria provide clear validation points

### Rollback Plan
If Direct Adjustment approach encounters blockers:
- Backend remains functional (no changes made)
- Frontend UI remains intact
- Can pivot to Option 2 (Rollback) if necessary
- No irreversible changes until validation complete

---

## 9. Next Immediate Actions

### User Actions
1. **Review and approve this Sprint Change Proposal**
2. **Switch to PO agent (Sarah)** - "Let's proceed with the plan"
   - I will shard the PRD
3. **Switch to Architect agent** - "Create architecture document for ticketing system"
   - Architect creates docs/architecture.md
4. **Return to PO agent (Sarah)** - "Architecture doc complete, create story files"
   - I will create story YAML files
5. **Switch to Dev agent** - "Implement Epic 1 stories from docs/stories/"
   - Dev implements authentication frontend
6. **Continue with Dev agent** - "Implement Epic 2 stories"
   - Dev replaces mock data
7. **Return to PO agent (Sarah)** - "Validate Epic 1 & 2 completion"
   - I will validate acceptance criteria

### Timeline
- **Today:** Approve proposal, shard PRD (30 min)
- **Today/Tomorrow:** Architecture doc creation (2-3 hours)
- **Tomorrow:** Story file creation (1 hour)
- **Tomorrow/Next:** Epic 1 implementation (4-6 hours)
- **Next:** Epic 2 implementation (2-3 hours)
- **Next:** Validation and Epic 3 start

---

## Appendices

### Appendix A: File Structure After Completion

```
docs/
├── prd.md (master document)
├── prd/
│   ├── epic-1-foundation-authentication.md
│   ├── epic-2-client-contact-management.md
│   ├── epic-3-core-ticket-time-entry.md
│   ├── epic-4-xero-integration.md
│   └── epic-5-views-search.md
├── architecture.md (master document)
├── architecture/
│   ├── tech-stack.md
│   ├── api-contracts.md
│   ├── data-models.md
│   ├── auth-flow.md
│   ├── component-architecture.md
│   ├── coding-standards.md
│   └── source-tree.md
├── stories/
│   ├── story-1.3.1-auth-context.yaml
│   ├── story-1.3.2-login-pages.yaml
│   ├── story-1.3.3-route-guards.yaml
│   ├── story-1.3.4-logout-nav.yaml
│   ├── story-2.5.1-client-ui-integration.yaml
│   ├── story-2.6.1-contact-ui-integration.yaml
│   └── story-2.7.1-dashboard-integration.yaml
├── brief.md
└── brainstorming-session-results.md
```

### Appendix B: Backend Endpoints Inventory

**Authentication Endpoints** (implemented in [backend/src/routes/auth.js](backend/src/routes/auth.js))
- POST /api/auth/register - Create new user
- POST /api/auth/login - Authenticate user
- POST /api/auth/logout - Clear session
- GET /api/auth/me - Get current user

**Client Endpoints** (implemented in [backend/src/routes/clients.js](backend/src/routes/clients.js))
- GET /api/clients - List all clients
- GET /api/clients/:id - Get client by ID
- POST /api/clients - Create client
- PUT /api/clients/:id - Update client
- DELETE /api/clients/:id - Delete client

**Contact Endpoints** (implemented in [backend/src/routes/contacts.js](backend/src/routes/contacts.js))
- GET /api/contacts - List all contacts
- GET /api/contacts?client_id=X - Filter by client
- GET /api/contacts/:id - Get contact by ID
- POST /api/contacts - Create contact
- PUT /api/contacts/:id - Update contact
- DELETE /api/contacts/:id - Soft delete contact

### Appendix C: Frontend Integration Points

**API Client Infrastructure**
- [frontend/src/lib/api-client.ts](frontend/src/lib/api-client.ts:1) - Core API client with auth handling
- [frontend/src/lib/api/clients.ts](frontend/src/lib/api/clients.ts:1) - Client API methods
- [frontend/src/lib/api/contacts.ts](frontend/src/lib/api/contacts.ts:1) - Contact API methods

**Custom Hooks**
- [frontend/src/hooks/useClients.ts](frontend/src/hooks/useClients.ts) - Client data hook (ready to use)
- [frontend/src/hooks/useContacts.ts](frontend/src/hooks/useContacts.ts) - Contact data hook (ready to use)
- Missing: useAuth hook (to be created in Story 1.3.1)

**Components Requiring Integration**
- [frontend/src/pages/Index.tsx](frontend/src/pages/Index.tsx:6) - Dashboard with mock stats
- [frontend/src/components/ClientList.tsx](frontend/src/components/ClientList.tsx) - Client management (has mock data)
- [frontend/src/components/ContactList.tsx](frontend/src/components/ContactList.tsx) - Contact management (has mock data)
- [frontend/src/pages/CreateTicketPage.tsx](frontend/src/pages/CreateTicketPage.tsx) - Uses mock clients/contacts
- [frontend/src/components/TicketDetail.tsx](frontend/src/components/TicketDetail.tsx) - Uses mock data
- [frontend/src/components/InvoiceReview.tsx](frontend/src/components/InvoiceReview.tsx) - Uses mock data
- [frontend/src/components/Settings.tsx](frontend/src/components/Settings.tsx) - Uses mock data

---

**End of Sprint Change Proposal**

---

## Approval Required

**Please review this proposal and confirm:**
- [ ] I approve the Direct Adjustment approach (Option 1)
- [ ] I approve the estimated timeline and effort
- [ ] I approve the agent handoff workflow
- [ ] I am ready to proceed with PRD sharding and architecture document creation

**Upon approval, next action:** PO agent (Sarah) will shard the PRD document.
