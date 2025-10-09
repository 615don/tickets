# Epic 4: Contact/Client Matching & Auto-Population

**Epic Goal:** Integrate the sidebar with backend matching APIs to automatically identify contacts and clients based on email senders. Implement the matching hierarchy (exact email match → domain match → manual fallback) and handle edge cases like disambiguation and inactive clients, providing clear visual feedback for matching status.

## Story 4.1: Email-to-Contact Matching Integration

As a **developer**,
I want **the sidebar to call the match-email API when an email is selected**,
so that **existing contacts are automatically identified**.

### Acceptance Criteria

1. API client function created: `matchContactByEmail(email: string)`
2. Function calls `GET /api/contacts/match-email` endpoint
3. Function handles authentication (session cookies or token in header)
4. React hook or effect triggers API call when email context changes
5. Matching results stored in sidebar state
6. Loading state displayed during API call (spinner in email context area)
7. Error handling for API failures (network error, 401 unauthorized)
8. API call debounced if email selection changes rapidly
9. Unit tests for API client function (mocked fetch)

## Story 4.2: Domain-to-Client Fallback Matching

As a **developer**,
I want **the sidebar to fall back to domain matching when email match fails**,
so that **clients are identified even for unknown contacts**.

### Acceptance Criteria

1. Domain extracted from sender email using `extractDomain()` utility
2. If `matchContactByEmail` returns empty array, trigger `matchClientByDomain(domain)` API call
3. API client function created: `matchClientByDomain(domain: string)`
4. Function calls `GET /api/clients/match-domain` endpoint
5. Domain matching results stored in sidebar state alongside contact matching results
6. Matching hierarchy enforced: exact match takes precedence over domain match
7. Both API calls happen sequentially: email match first, then domain match if needed
8. Error handling for domain matching failures
9. Unit tests for fallback logic

## Story 4.3: Matching Status Visual Feedback

As a **user**,
I want **clear visual indicators showing matching status**,
so that **I understand whether the add-in found my contact/client**.

### Acceptance Criteria

1. Visual indicator displayed in email context component: matched (✓ green), no match (? gray), loading (spinner)
2. Exact contact match: Display "✓ Matched: [Client Name] - [Contact Name]" with green badge
3. Domain match (new contact): Display "⚠ New contact at [Client Name]" with yellow/orange badge
4. No match: Display "? No match found - manual selection required" with gray badge
5. Inactive client warning: Display "⚠ Inactive client" badge if `client.is_active = false`
6. Icons and colors align with branding guidelines (accessible color contrast)
7. Visual feedback appears within 500ms of matching completion (NFR2 performance target)
8. Tooltips provide additional context on hover (optional)

## Story 4.4: Disambiguation UI for Multiple Client Matches

As a **user**,
I want **to select the correct client when a contact exists at multiple clients**,
so that **I can create tickets for the right client context**.

### Acceptance Criteria

1. Disambiguation UI appears when `matchContactByEmail` returns multiple clients
2. UI displays radio buttons or dropdown: "This contact exists at multiple clients. Select one:"
3. Each option shows client name
4. User selection updates sidebar state with chosen client_id
5. Form fields auto-populate after client selection
6. Disambiguation UI hidden for single client match (auto-selected)
7. UI supports keyboard navigation (Tab, Enter to select)
8. Selected client persists for current email (doesn't reset on re-render)
9. Visual design follows progressive disclosure pattern (only shown when needed)

## Story 4.5: Manual Client/Contact Selection Fallback

As a **user**,
I want **to manually select client and contact from dropdowns when auto-matching fails**,
so that **I can still create tickets even for unmatched emails**.

### Acceptance Criteria

1. Client dropdown component displays all active clients (alphabetically sorted)
2. Contact dropdown component displays contacts for selected client
3. Dropdowns appear when no match found (manual mode)
4. Dropdowns editable even when match found (user can override auto-selection)
5. Client dropdown loads on sidebar initialization (cached for performance)
6. Contact dropdown filters dynamically based on selected client
7. Empty state for contact dropdown: "No contacts for this client"
8. Dropdowns use accessible UI components (keyboard navigation, ARIA labels)
9. Loading states for dropdowns while data fetches

---
