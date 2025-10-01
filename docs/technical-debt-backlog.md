# Technical Debt & Improvement Backlog

This document tracks technical debt, improvements, and future enhancements identified during development and QA reviews across all completed stories.

## Priority Definitions

- **High**: Should be addressed in next 1-2 sprints
- **Medium**: Address within current epic or next epic
- **Low**: Nice-to-have, address when capacity allows

---

## High Priority

### TD-001: Add Integration Tests for Contact Management UI
**Source**: Story 2.6 QA Review
**Date Added**: 2025-10-01
**Priority**: High
**Effort**: Large (8 hours)

**Description**:
No automated tests exist for critical contact CRUD operations. Only manual testing was performed.

**Risk**:
Regression risk during refactoring, slower development velocity for UI changes.

**Recommendation**:
Add integration tests for core flows before Epic 3:
- Contact creation with validation
- Contact editing and updates
- Contact deletion with ticket reassignment
- Search and filtering
- Client filtering

**Files Affected**:
- `frontend/src/components/ContactForm.tsx`
- `frontend/src/components/ContactList.tsx`
- `frontend/src/components/DeleteContactDialog.tsx`
- New: Integration test suite files

**Acceptance Criteria**:
- [ ] Integration test suite created for contact management
- [ ] All critical user flows have test coverage
- [ ] Tests pass in CI/CD pipeline
- [ ] Test coverage report shows >70% coverage for contact components

---

### TD-002: Add Integration Tests for Contact Deletion Transaction
**Source**: Story 2.7 QA Review
**Date Added**: 2025-10-01
**Priority**: High
**Effort**: Medium (6-8 hours)

**Description**:
No automated tests exist for the critical deletion transaction that reassigns tickets to system contacts.

**Risk**:
Regression risk for ticket reassignment logic, which is critical for data integrity.

**Recommendation**:
Add backend integration tests covering:
- System contact creation during deletion
- Ticket reassignment to deleted contact
- Transaction rollback on errors
- Prevention of system contact deletion

**Files Affected**:
- `backend/src/models/Contact.js`
- New: `backend/src/models/Contact.test.js`

**Acceptance Criteria**:
- [ ] Integration test suite created for contact deletion
- [ ] Transaction logic thoroughly tested
- [ ] Edge cases covered (multiple deletions, rollback scenarios)
- [ ] Tests pass in CI/CD pipeline

---

### TD-003: Add Integration Tests for Ticket Creation API
**Source**: Story 3.3 QA Review
**Date Added**: 2025-10-01
**Priority**: High
**Effort**: Medium (2-3 hours)

**Description**:
No automated tests exist for the POST /api/tickets endpoint. Only manual testing was performed during Story 3.3 development.

**Risk**:
Regressions may go undetected in future changes. Critical functionality lacks automated validation.

**Recommendation**:
Add integration tests covering all 9 acceptance criteria:
- Successful ticket creation with minimal fields
- Successful ticket creation with optional description/notes
- Time entry duration parsing ("2h", "90m", "1h30m")
- workDate defaulting to current date
- billable defaulting to true
- Contact-client validation (reject mismatched contactId)
- Missing required fields validation
- Invalid duration format handling
- Authentication requirement (401 if not logged in)

**Files Affected**:
- `backend/src/controllers/ticketController.js`
- New: `backend/src/controllers/ticketController.test.js`

**Acceptance Criteria**:
- [ ] Integration test suite created for POST /api/tickets
- [ ] All 9 acceptance criteria have corresponding test cases
- [ ] Tests pass in CI/CD pipeline
- [ ] Test coverage report shows >80% coverage for ticketController.js

---

## Medium Priority

### TD-004: Implement Audit Trail for Deleted Contacts
**Source**: Story 2.7 QA Review (AC#6 Deferred)
**Date Added**: 2025-10-01
**Priority**: Medium
**Effort**: Large (6-8 hours)

**Description**:
Original contact names are not preserved after deletion. Tickets show "(Deleted Contact)" instead of historical contact information.

**Impact**:
Cannot show historical contact information in ticket views, reducing data visibility.

**Deferred Reason**:
Story 2.7 Task 5 marked as incomplete - implementation deferred to Epic 3+ per story notes.

**Recommendation**:
Implement one of two options:
- **Option 1**: Denormalized contact name in tickets table (contact_name_snapshot)
- **Option 2**: Separate audit table tracking contact changes

**Files Affected**:
- `backend/src/models/Contact.js`
- `backend/src/utils/migrate.js` (tickets table schema modification)
- Potentially: `backend/src/models/Ticket.js`

**Acceptance Criteria**:
- [ ] Historical contact names preserved after deletion
- [ ] Migration created to add contact_name_snapshot or audit table
- [ ] Contact.delete() updates snapshot before reassignment
- [ ] Ticket views display historical contact names
- [ ] Tests added for audit trail functionality

---

### TD-005: Standardize Contact Model to Return camelCase
**Source**: Story 3.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Medium
**Effort**: Small (1 hour)

**Description**:
Contact model returns snake_case properties (`client_id`, `is_system_contact`) while Ticket and TimeEntry models return camelCase (`clientId`, `contactId`). This inconsistency creates confusion and requires workarounds.

**Current Workaround**:
Controller uses compatibility check: `contact.clientId || contact.client_id` (ticketController.js:44)

**Risk**:
Maintainability concern. New developers may be confused by inconsistent conventions.

**Recommendation**:
Add `convertToCamelCase()` function to Contact model (similar to Ticket.js:43-61 and TimeEntry.js:73-86) to ensure consistent camelCase returns across all models.

**Files Affected**:
- `backend/src/models/Contact.js`
- `backend/src/controllers/ticketController.js` (remove workaround after fix)
- `backend/src/controllers/contactController.js` (if affected)

**Acceptance Criteria**:
- [ ] Contact.findById() returns camelCase properties
- [ ] Contact.findAll() returns camelCase properties
- [ ] Remove compatibility workaround from ticketController.js
- [ ] Verify no breaking changes in existing contact endpoints
- [ ] Update tests if any exist

---

### TD-006: Extract Validation Logic to Reusable Middleware
**Source**: Story 3.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Medium
**Effort**: Medium (2-3 hours)

**Description**:
Validation logic in ticketController.js (lines 13-32) is inline and not reusable. As more endpoints are added, validation patterns will be duplicated.

**Recommendation**:
Create reusable validation middleware for common patterns:
- Required field validation
- Type validation (integer, string, object)
- Custom validators (e.g., contactBelongsToClient)

**Example Structure**:
```javascript
// backend/src/middleware/validation.js
export const validateRequired = (fields) => (req, res, next) => { ... }
export const validateContactBelongsToClient = async (req, res, next) => { ... }
```

**Files Affected**:
- New: `backend/src/middleware/validation.js`
- `backend/src/controllers/ticketController.js` (refactor to use middleware)
- Future ticket/time entry endpoints

**Acceptance Criteria**:
- [ ] Validation middleware created with reusable functions
- [ ] ticketController.js refactored to use middleware
- [ ] Tests added for validation middleware
- [ ] Documentation added for how to use validation middleware

---

### TD-007: Add Password Strength Validation (REL-102)
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Medium
**Effort**: Small (1-2 hours)

**Description**:
Authentication system only validates password length (8+ characters), with no complexity requirements.

**Risk**:
Users can create weak passwords that pass validation but are easily compromised.

**Recommendation**:
Add password strength validation beyond length:
- Require mix of uppercase/lowercase
- Require at least one number
- Require at least one special character
- Check against common password lists

**Files Affected**:
- `backend/src/controllers/authController.js`
- `frontend/src/components/RegisterForm.tsx` (add client-side validation)

**Acceptance Criteria**:
- [ ] Password complexity rules implemented
- [ ] Clear error messages guide users to create strong passwords
- [ ] Frontend validation matches backend rules
- [ ] Tests added for password strength validation

---

### TD-008: Sanitize Error Logging in Production (OBS-101)
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Medium
**Effort**: Small (1 hour)

**Description**:
Error logging in production may log sensitive data (passwords, tokens, session IDs).

**Risk**:
Security issue - sensitive data may appear in production logs.

**Recommendation**:
Sanitize error logging to avoid logging sensitive data in production:
- Mask password fields in request body logs
- Mask session tokens
- Only log error codes/messages, not full request bodies

**Files Affected**:
- `backend/src/controllers/authController.js`
- Other controllers that log errors

**Acceptance Criteria**:
- [ ] Error logging sanitized for production
- [ ] Sensitive fields masked in logs
- [ ] Development logs still provide full detail for debugging
- [ ] Configuration driven by NODE_ENV

---

### TD-009: Make Cookie Name Configurable (SEC-105)
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Medium
**Effort**: Minimal (15 minutes)

**Description**:
Session cookie name 'connect.sid' is hardcoded instead of configurable.

**Impact**:
Low priority best practice improvement. Hardcoded cookie names slightly reduce security through obscurity.

**Recommendation**:
Move cookie name to environment configuration.

**Files Affected**:
- `backend/src/controllers/authController.js:119`
- `.env.example` (add COOKIE_NAME)

**Acceptance Criteria**:
- [ ] Cookie name configurable via environment variable
- [ ] Default value provided in .env.example
- [ ] Documentation updated

---

## Low Priority

### TD-010: Implement Structured Logging Library
**Source**: Story 1.2 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Medium (3-4 hours)

**Description**:
Basic console.log/console.error used throughout application. No structured logging for production observability.

**Recommendation**:
Consider structured logging library (pino, winston) for better production observability:
- Structured JSON logs
- Log levels (debug, info, warn, error)
- Request correlation IDs
- Performance metrics

**Files Affected**:
- `backend/src/config/database.js`
- All controllers and middleware

**Acceptance Criteria**:
- [ ] Logging library selected and configured
- [ ] All console.log/error replaced with structured logging
- [ ] Log levels appropriate for each message
- [ ] Production logs are JSON formatted

---

### TD-011: Add Connection Pool Metrics Endpoint
**Source**: Story 1.2 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (1-2 hours)

**Description**:
No observability into database connection pool health (active/idle connections, wait time).

**Recommendation**:
Add connection pool metrics endpoint for monitoring:
- Total/active/idle connection counts
- Wait time statistics
- Connection errors

**Files Affected**:
- `backend/src/config/database.js`
- New: `backend/src/routes/monitoring.js`

**Acceptance Criteria**:
- [ ] Metrics endpoint created (GET /api/monitoring/pool)
- [ ] Endpoint protected by auth or internal-only access
- [ ] Metrics exposed in format compatible with monitoring tools

---

### TD-012: Document Migration Rollback Strategy
**Source**: Story 1.2 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (1 hour)

**Description**:
Migrations are forward-only (idempotent but no explicit DOWN migrations). Rollback strategy not documented.

**Recommendation**:
Document migration rollback strategy:
- How to handle failed migrations
- Process for rolling back schema changes
- Data backup requirements before migrations

**Files Affected**:
- `backend/src/utils/migrate.js`
- New: `docs/architecture/migration-rollback-strategy.md`

**Acceptance Criteria**:
- [ ] Rollback strategy documented
- [ ] Process for handling failed migrations defined
- [ ] Backup requirements specified

---

### TD-013: Add Search Input Sanitization (SEC-202)
**Source**: Story 2.1 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (30 minutes)

**Description**:
Search with ILIKE could be slow with malicious patterns (ReDoS protection).

**Recommendation**:
Add input sanitization for search terms:
- Length limits (e.g., max 100 characters)
- Escape special regex characters
- Rate limiting on search endpoints

**Files Affected**:
- `backend/src/models/Client.js`
- `backend/src/models/Contact.js`

**Acceptance Criteria**:
- [ ] Search input length limited
- [ ] Special characters escaped or rejected
- [ ] Rate limiting configured for search endpoints

---

### TD-014: Add Index on maintenance_contract_type (PERF-201)
**Source**: Story 2.1 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Minimal (15 minutes)

**Description**:
No index on maintenance_contract_type column. May need index if filtering by this column becomes common.

**Recommendation**:
Monitor query patterns. Add index if filtering by contract type becomes frequent.

**Files Affected**:
- `backend/src/utils/migrate.js` (clients table)

**Acceptance Criteria**:
- [ ] Query patterns monitored
- [ ] Index added if needed
- [ ] Performance improvement measured

---

### TD-015: Add Explicit DOWN Migrations
**Source**: Story 2.1 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Medium (varies per migration)

**Description**:
Migrations use idempotent CREATE IF NOT EXISTS but lack explicit DOWN migrations for rollback.

**Recommendation**:
Consider adding explicit DOWN migrations for rollback capability.

**Files Affected**:
- `backend/src/utils/migrate.js`
- All migration scripts

**Acceptance Criteria**:
- [ ] DOWN migration pattern defined
- [ ] Historical migrations updated (if needed)
- [ ] Documentation updated

---

### TD-016: Add JSDoc Comments for Contact Model (DOC-301)
**Source**: Story 2.2 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (30 minutes)

**Description**:
Contact model validation functions have JSDoc, but public CRUD methods lack documentation.

**Recommendation**:
Add JSDoc comments for public CRUD methods (create, findAll, findById, update, delete).

**Files Affected**:
- `backend/src/models/Contact.js`

**Acceptance Criteria**:
- [ ] JSDoc added for all public methods
- [ ] Parameter types documented
- [ ] Return types documented
- [ ] Usage examples provided

---

### TD-017: Add JSDoc Comments for Client Model (DOC-401)
**Source**: Story 2.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (30 minutes)

**Description**:
Client model methods lack JSDoc documentation similar to Contact model validation helpers.

**Recommendation**:
Add JSDoc comments for Client model methods (similar to Contact model).

**Files Affected**:
- `backend/src/models/Client.js`

**Acceptance Criteria**:
- [ ] JSDoc added for all public methods
- [ ] Parameter types documented
- [ ] Return types documented

---

### TD-018: Standardize Domain Validation Regex (CONSISTENCY-401)
**Source**: Story 2.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Minimal (15 minutes)

**Description**:
Domain validation regex inconsistent between routes and model (both work, but inconsistent).

**Recommendation**:
Standardize domain validation regex between routes and model for consistency.

**Files Affected**:
- `backend/src/routes/clients.js`
- `backend/src/models/Client.js`

**Acceptance Criteria**:
- [ ] Single regex pattern used in both locations
- [ ] Extract to shared constant if appropriate

---

### TD-019: Align Route and Model Validation (CONSISTENCY-501)
**Source**: Story 2.4 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (30 minutes)

**Description**:
Route name validation (min 2 chars) differs from model validation (min 1 char, non-empty). Route is more restrictive, which is safer, so very low priority.

**Recommendation**:
Align route and model validation rules for consistency (make model match route, or document why different).

**Files Affected**:
- `backend/src/routes/contacts.js`
- `backend/src/models/Contact.js`

**Acceptance Criteria**:
- [ ] Validation rules aligned or difference documented
- [ ] Tests updated if rules change

---

### TD-020: Remove Duplicate Domain Filtering (REFACTOR-701)
**Source**: Story 2.5 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Minimal (15 minutes)

**Description**:
Duplicate domain filtering exists in both API service and form submit handler.

**Recommendation**:
Remove duplicate domain filtering logic (keep in one location).

**Files Affected**:
- `frontend/src/lib/api/clients.ts`
- `frontend/src/components/ClientForm.tsx`

**Acceptance Criteria**:
- [ ] Duplicate logic removed
- [ ] Functionality verified unchanged

---

### TD-021: Add Loading State for Deletion Counts (ENHANCE-701)
**Source**: Story 2.5 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (1 hour)

**Description**:
No loading state shown while fetching deletion counts in client list.

**Recommendation**:
Add loading state/skeleton while fetching deletion counts for better UX.

**Files Affected**:
- `frontend/src/components/ClientList.tsx`

**Acceptance Criteria**:
- [ ] Loading state displayed during fetch
- [ ] User experience improved

---

### TD-022: Verify Email Uniqueness Backend Constraint
**Source**: Story 2.6 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (1 hour)

**Description**:
Client-side validation checks existingEmails array. Race condition possible if two users create same email simultaneously. Backend should enforce uniqueness.

**Recommendation**:
Verify backend constraint exists for email uniqueness.

**Files Affected**:
- `backend/src/models/Contact.js`
- Database schema (contacts table)

**Acceptance Criteria**:
- [ ] Backend constraint verified or added
- [ ] Duplicate email creation returns proper error
- [ ] Frontend handles backend validation error gracefully

---

### TD-023: Fix Delete Dialog Ticket Count
**Source**: Story 2.6 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (2 hours)

**Description**:
ticketCount prop hardcoded to 0 in ContactList.tsx:332. Dialog doesn't show actual ticket count before deletion.

**Recommendation**:
Fetch ticket count from backend or include in Contact type returned by API.

**Files Affected**:
- `frontend/src/components/ContactList.tsx`
- `frontend/src/components/DeleteContactDialog.tsx`
- `backend/src/controllers/contactController.js` (add ticket count to response)

**Acceptance Criteria**:
- [ ] Actual ticket count displayed in delete dialog
- [ ] User informed before deleting contact with tickets

---

### TD-024: Add Search Input Debouncing
**Source**: Story 2.6 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (1 hour)

**Description**:
Search input not debounced. Could cause performance issues at scale with rapid typing.

**Recommendation**:
Consider debouncing search input (300-500ms delay) for performance at scale.

**Files Affected**:
- `frontend/src/components/ContactList.tsx`

**Acceptance Criteria**:
- [ ] Search input debounced
- [ ] Performance improved during rapid typing

---

### TD-025: Add API Rate Limiting Monitoring
**Source**: Story 2.6 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Medium (2-3 hours)

**Description**:
No rate limiting monitoring in place for API endpoints.

**Recommendation**:
Add API rate limiting monitoring (if not already present) to prevent abuse.

**Files Affected**:
- New: `backend/src/middleware/rateLimit.js`
- All API routes

**Acceptance Criteria**:
- [ ] Rate limiting configured for API endpoints
- [ ] Monitoring/alerting for rate limit violations
- [ ] Documentation updated

---

### TD-026: Align System Contact Naming Terminology
**Source**: Story 2.7 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Minimal (30 minutes)

**Description**:
Contact name is "(Deleted Contact)" in backend, but Badge shows "System" in UI. Minor inconsistency in terminology.

**Recommendation**:
Align terminology between backend and frontend, or clarify intent in documentation.

**Files Affected**:
- `backend/src/models/Contact.js`
- `frontend/src/components/ContactList.tsx`

**Acceptance Criteria**:
- [ ] Terminology aligned or difference documented
- [ ] User-facing labels consistent

---

### TD-027: Add Database Index on is_system_contact
**Source**: Story 2.7 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Minimal (15 minutes)

**Description**:
No index on is_system_contact column. May cause full table scan when checking for system contacts.

**Recommendation**:
Add composite index when contact count exceeds 10,000 records.

**Files Affected**:
- `backend/src/utils/migrate.js` (contacts table)

**Acceptance Criteria**:
- [ ] Index added when scale requires it
- [ ] Query performance measured
- [ ] Migration created and tested

---

### TD-028: Add 2FA Support (Future Enhancement)
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Large (20+ hours)

**Description**:
No two-factor authentication support for enhanced security.

**Recommendation**:
Consider adding 2FA support for future enhancement (TOTP or SMS-based).

**Files Affected**:
- `backend/src/controllers/authController.js`
- `frontend/src/components/LoginForm.tsx`
- Database schema (users table - add 2fa fields)

**Acceptance Criteria**:
- [ ] 2FA implementation researched
- [ ] User opt-in mechanism designed
- [ ] Recovery codes implemented

---

### TD-029: Add Remember Me Functionality
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Medium (4-6 hours)

**Description**:
No "remember me" functionality for extended sessions.

**Recommendation**:
Consider adding "remember me" checkbox to extend session duration.

**Files Affected**:
- `backend/src/controllers/authController.js`
- `frontend/src/components/LoginForm.tsx`

**Acceptance Criteria**:
- [ ] Remember me checkbox added to login form
- [ ] Extended session duration configured
- [ ] Security implications documented

---

### TD-030: Add Password Reset Flow
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Large (8-12 hours)

**Description**:
No password reset flow for users who forget passwords.

**Recommendation**:
Add email-based password reset flow:
- Forgot password link
- Email with reset token
- Token expiration (e.g., 1 hour)
- New password form

**Files Affected**:
- `backend/src/controllers/authController.js`
- `frontend/src/components/ForgotPasswordForm.tsx` (new)
- `frontend/src/components/ResetPasswordForm.tsx` (new)
- Email service integration

**Acceptance Criteria**:
- [ ] Password reset flow implemented
- [ ] Email templates created
- [ ] Token expiration enforced
- [ ] Security best practices followed

---

### TD-031: Add Account Lockout After Failed Attempts
**Source**: Story 1.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Medium (4-6 hours)

**Description**:
No account lockout after multiple failed login attempts (brute force protection).

**Recommendation**:
Add account lockout after X failed attempts (e.g., 5 attempts, 15-minute lockout).

**Files Affected**:
- `backend/src/controllers/authController.js`
- Database schema (users table - add failed_attempts, locked_until)

**Acceptance Criteria**:
- [ ] Failed attempt tracking implemented
- [ ] Account lockout enforced
- [ ] Unlock mechanism provided (time-based or admin)
- [ ] User informed of lockout status

---

### TD-032: Extract Validation Helpers for Reusability (REFACTOR-401)
**Source**: Story 2.3 QA Review
**Date Added**: 2025-10-01
**Priority**: Low
**Effort**: Small (1-2 hours)

**Description**:
Validation helpers in controllers could be extracted for better testability and reusability.

**Recommendation**:
Extract validation helpers to separate functions or middleware.

**Files Affected**:
- `backend/src/routes/clients.js`
- `backend/src/controllers/clientController.js`
- New: `backend/src/utils/validation.js`

**Acceptance Criteria**:
- [ ] Validation helpers extracted
- [ ] Reusable across controllers
- [ ] Tests added for validation functions

---

## Completed Items

### ~~TD-FIXED: Redundant Duration Parsing in Ticket Controller~~
**Source**: Story 3.3 QA Review
**Date Completed**: 2025-10-01
**Status**: ✅ FIXED during QA review

**Description**:
Controller was parsing duration with parseTimeEntry but TimeEntry.create() also parses it internally.

**Resolution**:
Removed redundant parseTimeEntry import and pre-validation from ticketController.js. TimeEntry.create() now handles all parsing internally.

**Files Modified**:
- `backend/src/controllers/ticketController.js`

---

## Summary Statistics

**Total Active Items**: 32
- **High Priority**: 3 items (all test automation)
- **Medium Priority**: 6 items (audit trail, model consistency, security)
- **Low Priority**: 23 items (documentation, optimizations, future enhancements)

**By Category**:
- **Testing/Quality**: 3 items (HIGH - test automation gaps)
- **Security**: 5 items (password strength, logging, rate limiting)
- **Performance**: 4 items (indexes, debouncing, monitoring)
- **Maintainability**: 10 items (documentation, consistency, refactoring)
- **Features/Enhancements**: 10 items (2FA, password reset, audit trail)

**Most Critical Items**:
1. **TD-001, TD-002, TD-003**: Add automated test coverage (HIGH priority)
2. **TD-004**: Implement audit trail for deleted contacts (MEDIUM priority, deferred from Story 2.7)
3. **TD-005**: Standardize model return format to camelCase (MEDIUM priority)
4. **TD-007**: Add password strength validation (MEDIUM priority)

---

## Review Schedule

This backlog should be reviewed:
- During sprint planning (before each new epic)
- After each QA review (when new items are added)
- At the end of each epic (to prioritize accumulated debt)
- Monthly for long-running projects

**Last Reviewed**: 2025-10-01
**Last Updated**: 2025-10-01
**Next Review**: End of Epic 3 or next sprint planning
**Items Added This Review**: 32 (initial comprehensive scan of Stories 1.1-3.3)
