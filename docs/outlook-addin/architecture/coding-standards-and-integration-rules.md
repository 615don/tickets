# Coding Standards and Integration Rules

## Existing Standards Compliance

**Code Style:** TypeScript with strict mode, ESLint rules from main frontend
**Linting Rules:** ESLint config aligned with main frontend
**Testing Patterns:** Node test runner for backend, manual testing for add-in UI

## Enhancement-Specific Standards

**Office.js Integration:**
1. All Office.js API calls wrapped in try-catch error handlers
2. Office.onReady() called before any Office.js API access
3. Office.js errors fail gracefully (show manual mode, never crash)

**API Integration:**
1. All API calls use centralized API client
2. API client includes `credentials: 'include'` for session cookies
3. Authentication errors (401) handled with clear messaging

**TypeScript Standards:**
1. Shared types imported from `@tickets/shared`
2. Add-in-specific types remain in `outlook-addin/src/types.ts`
3. No `any` types without justification

## Critical Integration Rules

**Existing API Compatibility:**
```typescript
// Ticket creation payload must match existing format
const payload = {
  clientId: number,
  contactId: number,
  description: string,
  notes: string,
  state: 'open' | 'closed',
  timeEntry: {
    workDate: string, // ISO date format YYYY-MM-DD
    durationHours: number, // Decimal hours
    billable: true,
  },
  newContact?: {
    name: string,
    email: string,
  }
};
```

**Database Integration:**
1. No direct database access from add-in (all via API)
2. Backend excludes soft-deleted contacts in match queries

**Error Handling:**
1. Network errors preserve form data for retry
2. Validation errors display inline next to fields

---
