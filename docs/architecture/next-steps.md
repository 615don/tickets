# Next Steps

## Story Manager Handoff

**Context:** Outlook Web Add-in brownfield enhancement architecture is complete. Existing UI mockup at `/outlook-addin` significantly de-risks the project.

**Architecture Document:** [docs/architecture-outlook-addin.md](docs/architecture-outlook-addin.md:1)

**Key Integration Requirements Validated:**
1. ✅ Separate Railway services confirmed (tickets.zollc.com, ticketapi.zollc.com)
2. ✅ `client_domains` table exists (domain matching ready)
3. ✅ Full React UI implemented (8 components exist)
4. ⚠️ Dependency alignment needed (React 19→18, Tailwind 4→3)

**Critical Technical Decisions:**
- **Authentication:** Session cookies with `SameSite=None; Secure`
- **Deployment:** Third Railway service at `outlook-addin.zollc.com`
- **API Integration:** Two new endpoints, reuse existing ticket creation
- **Zero schema changes:** All data models exist

**First Story to Implement:**

**Epic 1, Story 1.1: Office.js API Research & Capability Validation**

**Why this story first:** De-risks entire project by validating Office.js provides required email metadata access.

**Integration Checkpoints:**
1. Confirm `Office.context.mailbox.item.from` accessible
2. Validate task pane persists across email selections
3. Test in macOS + Chrome/Safari
4. Document any Office.js limitations

**Emphasis on System Integrity:**
- ⚠️ Backend CORS changes must not break main frontend
- ⚠️ Session cookie changes must not break existing sessions
- ✅ Add-in isolated (failure doesn't affect main system)

---

## Developer Handoff

**Context:** Begin with Epic 1 (Technical Discovery) to validate Office.js before building backend APIs. Existing mockup provides head start.

**Architecture Reference:** [docs/architecture-outlook-addin.md](docs/architecture-outlook-addin.md:1)

**Existing Coding Standards:**
- Frontend: React 18.3.1 + TypeScript 5.8.3 + Vite 5.4.19 + Tailwind 3.4.17
- Backend: JavaScript ES modules, Express 4.18.2, Node test runner

**Key Technical Decisions:**

1. **Dependency Alignment (Story 1.3):**
   - Downgrade React 19→18, Tailwind 4→3, Vite 7→5
   - Align with main frontend for compatibility

2. **Backend Endpoints (Epic 2):**
   - `GET /api/contacts/match-email`
   - `GET /api/clients/match-domain`
   - Use express-validator for validation

3. **CORS/Session Configuration:**
   - Update backend to allow outlook-addin.zollc.com
   - Add `sameSite: 'none'` for production

**Clear Sequencing:**

**Phase 1: Validation (Epic 1, Week 1)**
1. Office.js research (validate email access)
2. Convert to NPM workspace, align dependencies
3. Create manifest, sideload add-in
4. Deploy to Railway

**Phase 2: Backend API (Epic 2, Week 1-2)**
1. Implement matching endpoints with unit tests
2. Update CORS and session config

**Phase 3: Office.js Integration (Epic 3, Week 2)**
1. Add email selection event listener
2. Extract sender metadata
3. Update EmailContext component

**Phase 4: API Integration (Epic 4, Week 2-3)**
1. Replace mocks with real API calls
2. Wire up matching to form

**Phase 5: Submission (Epic 5, Week 3)**
1. Replace mockCreateTicket with real POST
2. Test new contact creation
3. Verify error handling

**Why this sequence:** Epic 1 validates feasibility first (fail fast), then builds backend APIs, then integrates with existing mockup (lowest risk).

---
