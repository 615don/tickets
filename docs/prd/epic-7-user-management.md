# Epic 7: User Management - Brownfield Enhancement

## Epic Goal

Enable management of the existing user account (email and password changes) with a foundation for future multi-user support, ensuring the single-user system can evolve without requiring architectural changes.

## Epic Description

### Existing System Context

- **Current relevant functionality:** Single hardcoded user exists in both local and production environments with basic authentication (login/logout/session management)
- **Technology stack:** Express + bcrypt authentication, express-session with PostgreSQL session storage, React frontend with React Query
- **Integration points:**
  - Backend: User model ([backend/src/models/User.js](backend/src/models/User.js)), authController ([backend/src/controllers/authController.js](backend/src/controllers/authController.js)), auth routes ([backend/src/routes/auth.js](backend/src/routes/auth.js))
  - Frontend: Settings page ([frontend/src/components/Settings.tsx](frontend/src/components/Settings.tsx)) currently handles Xero, invoices, backup/restore
  - Database: `users` table with id, email, password_hash, name, created_at, updated_at

### Enhancement Details

- **What's being added/changed:**
  1. User profile management UI in Settings page for changing email and password
  2. Backend API endpoints for secure email and password updates
  3. Password strength validation and confirmation workflows
  4. Email change with re-authentication requirement for security
  5. Session invalidation on credential changes

- **How it integrates:**
  - New "User Profile" section added to existing Settings page
  - New routes added to existing auth router (`PUT /api/auth/profile`, `PUT /api/auth/password`)
  - Leverages existing User model with new update methods
  - Uses existing express-validator and bcrypt patterns

- **Success criteria:**
  - User can change their email address with password re-authentication
  - User can change their password with current password verification
  - Password changes enforce strength requirements (existing validation)
  - All sessions invalidated after credential changes (security)
  - UI provides clear feedback and error handling
  - No breaking changes to existing authentication flow

## Stories

1. **Story 1: Backend User Profile Update APIs**
   - Create secure API endpoints for email and password changes
   - Implement password re-authentication for email changes
   - Add session invalidation on credential updates
   - Include comprehensive validation and error handling

2. **Story 2: User Profile Management UI**
   - Add "User Profile" section to Settings page
   - Create forms for email change (with password confirmation)
   - Create form for password change (current + new + confirm)
   - Integrate with backend APIs using React Query
   - Handle success/error states with toast notifications

3. **Story 3: Security Hardening & Testing**
   - Add rate limiting to profile update endpoints
   - Implement audit logging for credential changes
   - Write comprehensive tests for update flows
   - Test session invalidation and re-authentication

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only adding new endpoints)
- [x] Database schema changes are backward compatible (no schema changes needed)
- [x] UI changes follow existing patterns (Settings page sections, shadcn/ui components)
- [x] Performance impact is minimal (single-user system, infrequent updates)

## Risk Mitigation

- **Primary Risk:** User locks themselves out by changing credentials incorrectly or forgetting new password
- **Mitigation:**
  - Require current password confirmation for all changes
  - Clear UI feedback and validation before submission
  - Consider adding "test user reset" utility for development (already exists: [backend/src/utils/reset-test-user.js](backend/src/utils/reset-test-user.js))
- **Rollback Plan:**
  - No database migrations required - feature is purely additive
  - Can disable routes in auth router if issues arise
  - Database backups available via existing backup/restore feature (Epic 6)

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (login/logout/session management still works)
- [x] Integration points working correctly (Settings page, auth endpoints, User model)
- [x] Documentation updated appropriately (API endpoints documented)
- [x] No regression in existing features (existing auth flow unaffected)

## Validation Checklist

### Scope Validation

- [x] Epic can be completed in 1-3 stories maximum (3 stories defined)
- [x] No architectural documentation is required (follows existing patterns)
- [x] Enhancement follows existing patterns (express-validator, bcrypt, shadcn/ui, Settings sections)
- [x] Integration complexity is manageable (isolated to auth controller and Settings page)

### Risk Assessment

- [x] Risk to existing system is low (additive only, no breaking changes)
- [x] Rollback plan is feasible (disable routes, use backup/restore)
- [x] Testing approach covers existing functionality (includes regression testing)
- [x] Team has sufficient knowledge of integration points (well-documented User model and auth flow)

### Completeness Check

- [x] Epic goal is clear and achievable (manage existing user credentials)
- [x] Stories are properly scoped (backend APIs → UI → security/testing)
- [x] Success criteria are measurable (functional requirements with clear outcomes)
- [x] Dependencies are identified (User model, Settings page, auth middleware)

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running **Node.js/Express backend with React/TypeScript frontend**
- Integration points:
  - User model ([backend/src/models/User.js](backend/src/models/User.js)) with existing create/update/verify methods
  - Auth controller ([backend/src/controllers/authController.js](backend/src/controllers/authController.js)) and routes ([backend/src/routes/auth.js](backend/src/routes/auth.js))
  - Settings page ([frontend/src/components/Settings.tsx](frontend/src/components/Settings.tsx)) with existing SettingsSection pattern
- Existing patterns to follow:
  - express-validator for input validation (see auth routes)
  - bcrypt for password hashing (see User model)
  - express-session for session management
  - shadcn/ui components with React Query for frontend
  - SettingsSection component wrapper for Settings page sections
- Critical compatibility requirements:
  - Must not break existing login/logout/session functionality
  - Must enforce password strength requirements (existing validatePasswordStrength utility)
  - Must invalidate sessions on credential changes
  - Must require password re-authentication for security-sensitive changes
- Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering **secure user credential management for the existing single-user system with extensibility for future multi-user support**."
