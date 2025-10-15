# Epic 9: Backend Contact/Client Matching Infrastructure

**Epic Goal:** Extend the existing Express backend with new API endpoints to support email-to-contact and domain-to-client matching. Build the lookup and matching logic that powers the add-in's intelligent auto-population feature, reusing the existing database schema and domain infrastructure.

## Story 9.1: Email-to-Contact Matching API Endpoint

As a **developer**,
I want **an API endpoint that looks up contacts by email address**,
so that **the add-in can find existing contacts matching email senders**.

### Acceptance Criteria

1. `GET /api/contacts/match-email?email={email}` endpoint created
2. Endpoint queries `contacts` table for exact email match (case-insensitive)
3. Response includes matched contact(s) with fields: id, name, email, client_id, client name
4. If contact exists at multiple clients, response includes all matches (array)
5. If no contact found, response returns 200 with empty array (not 404)
6. Endpoint requires authentication (401 if not logged in)
7. Email parameter validated (basic email format check)
8. Query excludes soft-deleted contacts (contacts.deleted_at IS NULL)
9. Unit tests cover: exact match, multiple clients, no match, invalid email format
10. Endpoint manually tested using curl or Postman

## Story 9.2: Domain-to-Client Matching API Endpoint

As a **developer**,
I want **an API endpoint that looks up clients by email domain**,
so that **the add-in can match emails to clients when contact doesn't exist**.

### Acceptance Criteria

1. `GET /api/clients/match-domain?domain={domain}` endpoint created
2. Endpoint queries `client_domains` table for exact domain match
3. Response includes matched client(s) with fields: id, company_name, domains (array)
4. If domain matches multiple clients, response includes all matches (array)
5. If no client found, response returns 200 with empty array
6. Endpoint requires authentication
7. Domain parameter validated (basic domain format check, e.g., no @symbols)
8. Query only returns active clients (or includes `is_active` flag in response)
9. Unit tests cover: exact match, multiple clients, no match, invalid domain
10. Endpoint manually tested

## Story 9.3: Domain Extraction Utility Function

As a **developer**,
I want **a utility function that extracts domain from email address**,
so that **both frontend and backend can consistently parse email domains**.

### Acceptance Criteria

1. Function created: `extractDomain(email: string): string | null`
2. Extracts domain from email: `user@example.com` → `example.com`
3. Handles edge cases: subdomains (`user@mail.example.com` → `mail.example.com`), uppercase, whitespace
4. Returns null for invalid email formats (no @ symbol, empty string)
5. Function is pure (no side effects) and framework-agnostic
6. Unit tests cover: standard email, subdomain, uppercase, invalid formats, edge cases
7. Function exported from shared utility module accessible to both frontend and backend
8. TypeScript type definitions included

## Story 9.4: Client Inactive Warning Data

As a **developer**,
I want **matching API responses to include client active status**,
so that **the add-in can display warnings for inactive clients**.

### Acceptance Criteria

1. Assuming `clients` table has `is_active` boolean column (verify schema)
2. `match-email` endpoint response includes `client.is_active` flag
3. `match-domain` endpoint response includes `client.is_active` flag
4. If `is_active` column doesn't exist: add database migration to create it (default true)
5. Updated unit tests to verify `is_active` flag in responses
6. API documentation updated with response schema including `is_active` field

## Story 9.5: Matching Logic Unit Tests

As a **developer**,
I want **comprehensive unit tests for matching logic**,
so that **edge cases are handled correctly**.

### Acceptance Criteria

1. Unit tests for email-to-contact matching: exact match, case-insensitive, multiple clients, no match
2. Unit tests for domain-to-client matching: exact match, subdomain variations, multiple clients, no match
3. Unit tests for domain extraction: standard formats, edge cases, invalid inputs
4. Unit tests verify soft-deleted contacts excluded from matches
5. Unit tests verify inactive clients included in results with flag
6. Tests use test database or mocked database queries (no production DB dependency)
7. All tests pass successfully
8. Code coverage for matching logic >80%

---
