# Epic 4: Xero Integration & Invoice Generation

**Epic Goal:** Integrate with Xero API using OAuth 2.0 authentication, implement invoice generation with per-ticket line items, build pre-invoice review screen with description validation, enable invoice push to Xero, and implement time entry locking after successful invoice generation. This epic completes the end-to-end billing workflow from ticket creation through client invoicing.

## Story 4.1: Xero OAuth Configuration & Connection

As a **developer**,
I want **to configure Xero OAuth 2.0 integration and securely store credentials**,
so that **the application can authenticate with Xero API** (NFR5, NFR11).

### Acceptance Criteria

1. Xero app created in Xero Developer Portal with OAuth 2.0 credentials (Client ID, Client Secret)
2. Backend environment variables configured for Xero credentials and callback URL
3. OAuth callback route implemented (`/api/xero/callback`) to receive authorization code
4. Token exchange logic implemented to convert authorization code to access/refresh tokens
5. Tokens stored encrypted in database (NFR5) or secure credential storage
6. Token refresh logic implemented to automatically refresh expired access tokens
7. Xero SDK/library installed and configured (official Node.js or Python SDK)
8. Connection test endpoint (`/api/xero/status`) returns connection status and authenticated organization name
9. Admin UI page to initiate Xero OAuth flow (button triggers authorization redirect)
10. Documentation or setup validation confirms "Consulting Services" product exists in connected Xero organization (NFR11)

## Story 4.2: Invoice Lock Mechanism

As a **developer**,
I want **database schema and logic to track invoice locks per month**,
so that **time entries cannot be modified after invoicing** (FR17).

### Acceptance Criteria

1. Database migration creates `invoice_locks` table with columns: `id`, `month` (date, unique), `locked_at`, `xero_invoice_ids` (JSON array or text)
2. Backend function to check if a given month is locked (returns boolean)
3. Time entry update/delete endpoints validate month not locked before allowing modifications (403 error if locked)
4. Invoice lock creation function stores month and timestamp
5. Model/entity created for InvoiceLock with appropriate types
6. Index created on `invoice_locks.month` for fast lookup
7. Existing time entry validation updated to check lock status (Story 3.5 enhancement)
8. Unit tests cover lock validation logic and edge cases (month boundaries, timezone handling)

## Story 4.3: Pre-Invoice Review Data Aggregation

As a **developer**,
I want **backend logic to aggregate tickets by month for invoice review**,
so that **the frontend can display pre-invoice summary** (FR16).

### Acceptance Criteria

1. API endpoint `GET /api/invoices/preview?month=YYYY-MM` returns invoice preview data
2. Response groups tickets by client with subtotals per client
3. Response includes total billable hours across all clients for the month
4. Response flags tickets missing descriptions (per FR3 requirement)
5. Calculation includes all time entries with work_date in specified month
6. Calculation sums duration_hours for billable time entries only
7. Non-billable tickets included in data with $0 amount calculated (FR15)
8. Endpoint validates month is not already locked (return lock status in response)
9. Response format structured for easy UI rendering (client grouping, line item details)
10. Endpoint requires authentication

## Story 4.4: Invoice Generation & Xero Push Logic

As a **developer**,
I want **backend logic to generate and push invoices to Xero**,
so that **monthly billing can be automated** (FR13, FR14, FR15).

### Acceptance Criteria

1. API endpoint `POST /api/invoices/generate` accepts month parameter and initiates invoice generation
2. Endpoint validates all tickets for the month have descriptions (400 error if any missing, per FR3)
3. Endpoint validates month is not already locked (400 error if locked)
4. For each client with billable time, create Xero invoice via API
5. Invoice line items formatted as "Ticket #[ID] - [Description]" per FR14
6. Each line item references Xero "Consulting Services" product/service item and includes: description (ticket format) and quantity (duration_hours as decimal). Xero applies the configured rate and accounting mappings automatically (NFR11)
7. Non-billable tickets included as line items with quantity = hours and unit price overridden to $0 (per FR15)
8. Successful Xero push creates invoice_lock record for the month per FR17
9. Response includes Xero invoice IDs and confirmation message
10. Transaction handling: rollback invoice_lock if any Xero API call fails
11. Error handling for Xero API failures (rate limits, invalid customer ID, network errors, missing "Consulting Services" item)
12. Unit tests for invoice data transformation, integration tests with Xero sandbox

## Story 4.5: Pre-Invoice Review UI

As a **user**,
I want **to review all tickets before generating invoices**,
so that **I can verify accuracy and add missing descriptions** (FR16).

### Acceptance Criteria

1. Pre-invoice review screen accessible from main navigation
2. Month selector allows choosing which month to review (defaults to current month)
3. Screen displays total billable hours for selected month prominently
4. Tickets grouped by client with per-client subtotals
5. Each ticket shows: ID, description, total hours, billable/non-billable status
6. Tickets missing descriptions highlighted with warning indicator
7. Inline edit capability for descriptions directly in review screen (quick-fix workflow)
8. "Generate Invoices" button visible only when all descriptions present
9. Button disabled with tooltip message if descriptions missing or month already locked
10. Screen shows lock status if month already invoiced (display-only mode)
11. Clear indication of which tickets are non-billable ($0 line items)
12. Screen loads in <2 seconds per NFR2

## Story 4.6: Invoice Generation UI & Confirmation

As a **user**,
I want **to generate and push invoices to Xero with confirmation**,
so that **I can complete monthly billing confidently** (FR13).

### Acceptance Criteria

1. "Generate Invoices" button in pre-invoice review screen (Story 4.5) triggers generation
2. Confirmation dialog shown before invoicing: "Generate invoices for [Month]? This will lock all time entries for this month."
3. User confirms, system calls invoice generation API (Story 4.4)
4. Loading indicator shown during Xero API calls (may take several seconds)
5. Success message displayed with summary: "Generated X invoices for Y clients. Total: $Z"
6. Success message includes links to Xero invoices (if Xero provides URLs)
7. Error handling displays clear messages: missing descriptions, Xero connection errors, API failures
8. After successful generation, review screen switches to locked/read-only mode
9. "View in Xero" links provided for easy access to generated invoices
10. Action logged (optional but recommended for audit trail)

## Story 4.7: Xero Connection Management UI

As a **user**,
I want **to connect and manage my Xero integration**,
so that **I can authenticate the application with my Xero account**.

### Acceptance Criteria

1. Settings or Admin page includes Xero connection section
2. If not connected: "Connect to Xero" button initiates OAuth flow
3. OAuth flow redirects to Xero login/authorization page
4. After authorization, user redirected back to app with success message
5. If connected: Display connection status, organization name, and last sync timestamp
6. "Disconnect" button available to revoke Xero connection
7. Connection test button to verify credentials still valid
8. Error messages displayed for connection failures (invalid credentials, network errors)
9. Help text explains why Xero connection is required

---
