# Data Models and Schema Changes

## Schema Integration Strategy

✅ **No database schema changes required for MVP**

The add-in leverages 100% existing database schema. All matching, contact creation, and ticket creation operations use current tables and relationships.

## Existing Data Models Leveraged

**clients** (existing table)
- **Purpose:** Client companies tracked in the system
- **Integration:** Used for domain matching via `client_domains` relationship
- **Key Attributes:**
  - `id`: INT (PK) - Client identifier
  - `company_name`: VARCHAR - Display name in add-in dropdowns
- **Add-in Usage:** Read-only for dropdowns and matching

**client_domains** (existing table, critical for add-in)
- **Purpose:** Map email domains to clients for domain-based matching
- **Integration:** Core matching infrastructure - extract domain from email, lookup client
- **Key Attributes:**
  - `id`: INT (PK)
  - `client_id`: INT (FK to clients) - Associates domain with client
  - `domain`: VARCHAR (UNIQUE) - Email domain (e.g., "acme.com")
- **Add-in Usage:** Read-only for `GET /api/clients/match-domain?domain={domain}` endpoint

**contacts** (existing table)
- **Purpose:** Individual contacts at client companies
- **Integration:** Email-to-contact matching, new contact creation from add-in
- **Key Attributes:**
  - `id`: INT (PK)
  - `client_id`: INT (FK to clients)
  - `name`: VARCHAR - Pre-filled from email sender display name
  - `email`: VARCHAR - Unique within client, matched against sender email
  - `deleted_at`: TIMESTAMP - Soft delete (excluded from matches)
- **Add-in Usage:** Read for matching (`GET /api/contacts/match-email`), Write for new contact creation

**tickets** (existing table)
- **Purpose:** Billable work tickets
- **Integration:** Add-in creates tickets via existing `POST /api/tickets` endpoint
- **Key Attributes:**
  - `id`: INT (PK)
  - `client_id`: INT (FK to clients)
  - `contact_id`: INT (FK to contacts)
  - `description`: TEXT - Optional, user-entered in add-in form
  - `notes`: TEXT - Optional, user-entered in add-in form
  - `state`: VARCHAR - "open" or "closed" based on add-in checkbox
- **Add-in Usage:** Write-only via `POST /api/tickets`

**time_entries** (existing table)
- **Purpose:** Time tracking for tickets
- **Integration:** Created automatically with ticket (1-to-1 in add-in flow)
- **Key Attributes:**
  - `work_date`: DATE - Auto-set to current date by add-in
  - `duration_hours`: DECIMAL(5,2) - Parsed from TimeInput component
  - `billable`: BOOLEAN - Always true for add-in (billable time tracking)
- **Add-in Usage:** Created implicitly via ticket creation (backend handles)

## Backward Compatibility

**Database Changes Required:** None

**Migration Strategy:** No migrations needed

**Compatibility Measures:**
- Add-in reads from existing tables without schema modifications
- New contact creation uses existing validation rules (email unique within client)
- Ticket creation follows existing payload structure (no new fields)
- Soft-deleted contacts (`deleted_at IS NOT NULL`) excluded from matches via query filters
- All queries use existing indexes (no performance impact)

---
