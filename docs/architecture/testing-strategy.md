# Testing Strategy

## Integration with Existing Tests

**Existing Test Framework:** Node test runner for backend unit tests
**Coverage Target:** >80% for matching logic

## New Testing Requirements

**Unit Tests for Backend Matching:**
- **Location:** `backend/src/controllers/__tests__/matchingController.test.js`
- **Scenarios:**
  - Email-to-contact matching (exact match, multiple clients, no match, case-insensitive)
  - Domain-to-client matching (exact match, multiple clients, no match)
  - Domain extraction utility (standard email, subdomain, uppercase, invalid)

**Manual Testing for Add-in UI:**
- Office.js integration (email selection, metadata extraction)
- Email-to-contact matching (exact match, disambiguation, domain match, no match)
- Form submission (success, error handling, validation)
- Cross-browser tests (Chrome, Safari on macOS)

**No Automated E2E Tests for MVP:** Office Add-in E2E testing requires complex Outlook automation not justified for 3-4 week timeline

## Regression Testing

**Existing System Verification:**
1. Main frontend unchanged (tickets.zollc.com still works)
2. Backend API compatibility (both web app and add-in work)
3. Database integrity (tickets from add-in visible in web app)

---
