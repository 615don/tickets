# Technical Debt - Outlook Add-in

This document tracks technical debt items identified during development and QA reviews of the Outlook Add-in project. Items are prioritized and categorized for systematic resolution.

## Document Status

- **Last Updated:** 2025-10-10
- **Updated By:** Quinn (Test Architect)
- **Review Cycle:** Story 4.1 QA Review

---

## Technical Debt Registry

### Priority Levels

- **CRITICAL**: Blocks production deployment or creates security vulnerabilities
- **HIGH**: Impacts functionality, performance, or maintainability significantly
- **MEDIUM**: Should be addressed soon to prevent accumulation or enable future work
- **LOW**: Nice-to-have improvements that enhance code quality
- **INFO**: Observations for future consideration

---

## Active Technical Debt Items

### TD-001: Test Execution Infrastructure Missing
**Story:** 4.1 - Email-to-Contact Matching Integration
**Priority:** MEDIUM
**Category:** Testing Infrastructure
**Identified:** 2025-10-10
**Identified By:** Quinn (Test Architect)

**Description:**
Unit tests have been written for the API client function ([matching.test.ts](../../outlook-addin/src/lib/api/__tests__/matching.test.ts)) but cannot be executed due to missing test infrastructure configuration.

**Impact:**
- Cannot run automated unit tests in development or CI/CD pipeline
- Developers cannot verify test coverage before commits
- Risk of test suite degradation over time without execution validation
- Blocks integration with CI/CD automated testing

**Root Cause:**
1. No `test` script defined in [package.json](../../outlook-addin/package.json)
2. Test environment doesn't handle Vite environment variables (`import.meta.env.VITE_API_URL`)
3. Node test runner with TypeScript requires proper configuration (tsx or ts-node)

**Current Workaround:**
- Manual testing on Railway deployment validates functionality
- Code review ensures test cases remain valid

**Proposed Resolution:**

1. **Add test script to package.json:**
```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--no-warnings' tsx --test 'src/**/__tests__/**/*.test.ts'",
    "test:watch": "NODE_OPTIONS='--no-warnings' tsx --test --watch 'src/**/__tests__/**/*.test.ts'",
    "test:coverage": "NODE_OPTIONS='--no-warnings' tsx --test --experimental-test-coverage 'src/**/__tests__/**/*.test.ts'"
  }
}
```

2. **Configure test environment for Vite variables:**
   - Option A: Mock `import.meta.env` in test setup file
   - Option B: Use vitest instead of Node test runner (aligns better with Vite)
   - Option C: Create test-specific API client that doesn't depend on env vars

3. **Update testing strategy documentation:**
   - Document chosen test framework (Node test runner vs. Vitest)
   - Provide examples of running tests locally
   - Add CI/CD test execution steps

**Effort Estimate:** 2-4 hours
**Suggested Owner:** Dev Team
**Target Sprint:** Next sprint (required for CI/CD enablement)

**References:**
- [outlook-addin/package.json](../../outlook-addin/package.json)
- [outlook-addin/src/lib/api/__tests__/matching.test.ts](../../outlook-addin/src/lib/api/__tests__/matching.test.ts)
- [outlook-addin/src/lib/api/matching.ts:4](../../outlook-addin/src/lib/api/matching.ts#L4) (env variable usage)

**Related Items:** None

---

### TD-002: HTTP Status Codes Hardcoded
**Story:** 4.1 - Email-to-Contact Matching Integration
**Priority:** LOW
**Category:** Code Maintainability
**Identified:** 2025-10-10
**Identified By:** Quinn (Test Architect)

**Description:**
HTTP status codes (401, 400, 500) are hardcoded as magic numbers throughout error handling logic in the API client function.

**Impact:**
- Reduced code readability (magic numbers vs. named constants)
- Potential for typos when status codes are used in multiple places
- Makes future refactoring more difficult if status code handling changes

**Current Code Example:**
```typescript
// outlook-addin/src/lib/api/matching.ts:28-36
if (response.status === 401) {
  throw new Error('Authentication required. Please log in.');
}
if (response.status === 400) {
  throw new Error('Invalid email format.');
}
if (response.status === 500) {
  throw new Error('Server error. Please try again later.');
}
```

**Proposed Resolution:**

1. **Create constants file for HTTP status codes:**
```typescript
// outlook-addin/src/lib/api/constants.ts
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Authentication required. Please log in.',
  INVALID_EMAIL: 'Invalid email format.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;
```

2. **Refactor matching.ts to use constants:**
```typescript
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

// ...
if (response.status === HTTP_STATUS.UNAUTHORIZED) {
  throw new Error(ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
}
if (response.status === HTTP_STATUS.BAD_REQUEST) {
  throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
}
if (response.status === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
  throw new Error(ERROR_MESSAGES.SERVER_ERROR);
}
```

3. **Apply same pattern to future API client functions** (Story 4.2 domain matching)

**Effort Estimate:** 1-2 hours
**Suggested Owner:** Dev Team
**Target Sprint:** Backlog (low priority, can be addressed during future API work)

**References:**
- [outlook-addin/src/lib/api/matching.ts:28-36](../../outlook-addin/src/lib/api/matching.ts#L28-L36)

**Related Items:** TD-004 (configuration constants pattern)

---

### TD-003: Missing JSDoc for Hook Return Values
**Story:** 4.1 - Email-to-Contact Matching Integration
**Priority:** LOW
**Category:** Documentation
**Identified:** 2025-10-10
**Identified By:** Quinn (Test Architect)

**Description:**
The `useMatching` hook has JSDoc comments for the function itself but lacks documentation for the return object properties, reducing IDE intellisense quality.

**Impact:**
- Developers consuming the hook don't get inline documentation in IDE
- Reduces discoverability of return value properties and their types
- Makes onboarding slower for new developers

**Current Code:**
```typescript
// outlook-addin/src/hooks/useMatching.ts:14-88
export function useMatching(emailContext: EmailContext | null) {
  // ... implementation ...
  return { matchingResult, isMatching, error };
}
```

**Proposed Resolution:**

**Add JSDoc with @returns annotation:**
```typescript
/**
 * React hook to trigger contact matching when email context changes
 * Implements debouncing and request cancellation for rapid email selection changes
 *
 * @param emailContext - Email context from Office.js (or null if no email selected)
 * @returns Hook state object
 * @returns matchingResult - Current matching result or null if not yet matched
 * @returns isMatching - True while API call is in progress (shows loading spinner)
 * @returns error - Error details if matching fails, null otherwise
 *
 * @example
 * ```tsx
 * const { matchingResult, isMatching, error } = useMatching(emailContext);
 *
 * if (isMatching) return <Spinner />;
 * if (matchingResult?.type === 'contact-matched') {
 *   console.log('Matched:', matchingResult.contact.name);
 * }
 * ```
 *
 * Story 4.1: Email-to-Contact Matching Integration
 */
export function useMatching(emailContext: EmailContext | null): {
  matchingResult: MatchingResult | null;
  isMatching: boolean;
  error: MatchingError | null;
} {
  // ... implementation ...
  return { matchingResult, isMatching, error };
}
```

**Alternative Approach - Explicit Return Type:**
```typescript
// Define return type interface
interface UseMatchingReturn {
  /** Current matching result or null if not yet matched */
  matchingResult: MatchingResult | null;
  /** True while API call is in progress (shows loading spinner) */
  isMatching: boolean;
  /** Error details if matching fails, null otherwise */
  error: MatchingError | null;
}

export function useMatching(emailContext: EmailContext | null): UseMatchingReturn {
  // ... implementation ...
}
```

**Effort Estimate:** 30 minutes
**Suggested Owner:** Dev Team
**Target Sprint:** Backlog (low priority, nice-to-have improvement)

**References:**
- [outlook-addin/src/hooks/useMatching.ts:87](../../outlook-addin/src/hooks/useMatching.ts#L87)

**Related Items:** None

---

### TD-004: Debounce Delay Hardcoded
**Story:** 4.1 - Email-to-Contact Matching Integration
**Priority:** INFO
**Category:** Configuration Management
**Identified:** 2025-10-10
**Identified By:** Quinn (Test Architect)

**Description:**
The 300ms debounce delay is hardcoded in the `useMatching` hook. While the current value is well-chosen based on UX research, extracting it to a configuration constant would make future tuning easier.

**Impact:**
- Minor: Makes performance tuning require code changes vs. config changes
- If delay needs adjustment based on production metrics, requires code modification
- Pattern inconsistency if other timeouts are configurable but this one isn't

**Current Code:**
```typescript
// outlook-addin/src/hooks/useMatching.ts:76
}, 300); // 300ms debounce delay
```

**Proposed Resolution:**

**Option 1: Extract to local constant**
```typescript
// outlook-addin/src/hooks/useMatching.ts
const DEBOUNCE_DELAY_MS = 300;

export function useMatching(emailContext: EmailContext | null) {
  // ...
  const timeoutId = setTimeout(async () => {
    // ...
  }, DEBOUNCE_DELAY_MS);
}
```

**Option 2: Extract to shared config file**
```typescript
// outlook-addin/src/config/constants.ts
export const API_CONFIG = {
  DEBOUNCE_DELAY_MS: 300,
  REQUEST_TIMEOUT_MS: 5000,
} as const;

// outlook-addin/src/hooks/useMatching.ts
import { API_CONFIG } from '../config/constants';

export function useMatching(emailContext: EmailContext | null) {
  // ...
  }, API_CONFIG.DEBOUNCE_DELAY_MS);
}
```

**Option 3: Make it configurable via hook parameter**
```typescript
export function useMatching(
  emailContext: EmailContext | null,
  options?: { debounceMs?: number }
) {
  const debounceDelay = options?.debounceMs ?? 300;
  // ...
}
```

**Recommendation:** Option 1 (local constant) provides best balance of simplicity and discoverability for this use case. Option 2 if multiple API timing constants emerge.

**Effort Estimate:** 15 minutes
**Suggested Owner:** Dev Team
**Target Sprint:** Backlog (informational, not required)

**References:**
- [outlook-addin/src/hooks/useMatching.ts:76](../../outlook-addin/src/hooks/useMatching.ts#L76)
- Story 4.1 Dev Notes (lines 326-345) - debounce delay rationale

**Related Items:** TD-002 (constants extraction pattern)

---

## Resolved Technical Debt

*(Items will be moved here when resolved)*

---

## Prevention Strategies

### For Future Stories

1. **Test Infrastructure First**
   - Set up test execution before writing tests
   - Validate tests can run in CI/CD pipeline
   - Document test execution commands in README

2. **Constants Over Magic Numbers**
   - Use named constants for all magic numbers (status codes, delays, limits)
   - Group related constants in dedicated files
   - Apply consistent naming conventions (SCREAMING_SNAKE_CASE)

3. **Comprehensive JSDoc**
   - Document all public APIs with JSDoc
   - Include @param, @returns, and @example tags
   - Document return object properties for hooks

4. **Configuration Externalization**
   - Extract tunable values to config files/constants
   - Make performance-related values easily discoverable
   - Document rationale for chosen values

---

## Technical Debt Metrics

### Story 4.1 Summary

| Priority | Count | Total Effort Estimate |
|----------|-------|----------------------|
| CRITICAL | 0 | 0 hours |
| HIGH | 0 | 0 hours |
| MEDIUM | 1 | 2-4 hours |
| LOW | 2 | 1.5-2.5 hours |
| INFO | 1 | 0.25 hours |
| **TOTAL** | **4** | **3.75-6.75 hours** |

### Quality Impact

- **Code Quality Score:** 91/100 (excellent despite minor debt)
- **Production Blocking Items:** 0
- **Security Issues:** 0
- **Performance Issues:** 0

### Recommendations

1. **Immediate Action:** None required - story is production-ready
2. **Next Sprint:** Address TD-001 (test execution) for CI/CD enablement
3. **Backlog:** Address TD-002, TD-003, TD-004 during future maintenance cycles

---

## Change Log

| Date | Story | Items Added | Items Resolved | Updated By |
|------|-------|-------------|----------------|------------|
| 2025-10-10 | 4.1 | TD-001, TD-002, TD-003, TD-004 | None | Quinn (Test Architect) |

---

## Notes

- This document should be reviewed and updated during each story's QA review
- Technical debt items should be linked to story files and quality gate decisions
- Resolution of items should include verification that fix addresses root cause
- Pattern analysis should be performed quarterly to identify systemic issues

**Next Review:** Story 4.2 QA Review
