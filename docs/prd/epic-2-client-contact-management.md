# Epic 2: Client & Contact Management

**Epic Goal:** Implement complete CRUD (Create, Read, Update, Delete) operations for Clients and Contacts, establishing the foundational data entities required for ticket creation. This epic delivers a fully functional client database that enables accurate billing organization and prepares the system for ticket workflows.

## Story 2.1: Client Data Model & Database Schema

As a **developer**,
I want **database tables and models for storing client information**,
so that **the application can persist client data with appropriate relationships and constraints**.

### Acceptance Criteria

1. Database migration creates `clients` table with columns: `id`, `company_name`, `xero_customer_id`, `maintenance_contract_type`, `created_at`, `updated_at`
2. Database migration creates `client_domains` table with columns: `id`, `client_id` (foreign key), `domain`, supporting one-to-many relationship
3. Backend models/entities created for Client and ClientDomain with appropriate TypeScript/Python types
4. Database enforces unique constraint on `client_domains.domain` (no domain duplicates across all clients)
5. Cascading delete configured - deleting client removes associated domains
6. Model includes validation rules (e.g., company_name required, domain format validation)
7. Migration runs successfully on local and can be rolled back

## Story 2.2: Contact Data Model & Database Schema

As a **developer**,
I want **database tables and models for storing contact information**,
so that **the application can persist contacts associated with clients**.

### Acceptance Criteria

1. Database migration creates `contacts` table with columns: `id`, `client_id` (foreign key), `name`, `email`, `created_at`, `updated_at`, `deleted_at` (nullable, for soft deletes)
2. Backend model/entity created for Contact with appropriate types
3. Foreign key constraint enforces `contacts.client_id` references valid client
4. Database enforces unique constraint on `email` for non-deleted contacts
5. Cascading delete configured - deleting client removes associated contacts
6. Model includes validation rules (name required, email format validation)
7. Migration runs successfully and can be rolled back

## Story 2.3: Client Management API Endpoints

As a **developer**,
I want **RESTful API endpoints for client CRUD operations**,
so that **the frontend can manage client data**.

### Acceptance Criteria

1. `POST /api/clients` creates new client with domains (accepts array of domain strings)
2. `GET /api/clients` returns list of all clients with associated domains
3. `GET /api/clients/:id` returns single client with domains and contact count
4. `PUT /api/clients/:id` updates client and replaces domains list
5. `DELETE /api/clients/:id` removes client - returns 403 error if any invoice locks reference this client's tickets, otherwise cascade deletes all contacts, tickets, and time entries with confirmation dialog showing data counts
6. All endpoints require authentication (401 if not logged in)
7. Endpoints return appropriate HTTP status codes (200, 201, 400, 404, 500)
8. Request validation returns clear error messages (e.g., "domain format invalid")
9. API endpoints tested manually using cURL/Postman or unit tests

## Story 2.4: Contact Management API Endpoints

As a **developer**,
I want **RESTful API endpoints for contact CRUD operations**,
so that **the frontend can manage contact data**.

### Acceptance Criteria

1. `POST /api/contacts` creates new contact (requires valid `client_id`)
2. `GET /api/contacts` returns list of all non-deleted contacts with client information
3. `GET /api/contacts?client_id=X` filters contacts by client
4. `GET /api/contacts/:id` returns single contact with full client details
5. `PUT /api/contacts/:id` updates contact information
6. `DELETE /api/contacts/:id` soft-deletes contact and reassigns all associated tickets to system-created "Deleted Contact" for that client (preserves ticket history)
7. All endpoints require authentication (401 if not logged in)
8. Endpoints return appropriate HTTP status codes and validation error messages
9. API endpoints tested manually or with unit tests

## Story 2.5: Client Management UI

As a **user**,
I want **a screen to create, view, edit, and delete clients**,
so that **I can maintain my client database**.

### Acceptance Criteria

1. Clients list page displays all clients in table/list format with company name and domain count
2. "Add Client" button opens form with fields: company_name, xero_customer_id, maintenance_contract_type, domains (dynamic list input)
3. Domain input allows adding multiple domains with add/remove buttons
4. Submitting form creates client and displays success message
5. Each client row has "Edit" and "Delete" actions
6. Edit opens pre-populated form, saving updates the client
7. Delete shows confirmation dialog before removing client, including count of contacts/tickets/time entries that will be deleted
8. Form validation displays inline error messages (e.g., "Company name required")
9. Page accessible via navigation link from dashboard/header
10. Responsive design works on mobile viewports

## Story 2.6: Contact Management UI

As a **user**,
I want **a screen to create, view, edit, and delete contacts**,
so that **I can maintain my contact database**.

### Acceptance Criteria

1. Contacts list page displays all contacts in table format with name, email, and client company name
2. "Add Contact" button opens form with fields: name, email, client (dropdown)
3. Client dropdown populated from existing clients
4. Submitting form creates contact and displays success message
5. Each contact row has "Edit" and "Delete" actions
6. Edit opens pre-populated form, saving updates the contact
7. Delete shows confirmation dialog before removing contact
8. Form validation displays inline error messages (e.g., "Invalid email format")
9. Page accessible via navigation link from dashboard/header
10. List can be filtered by client using dropdown or search
11. Responsive design works on mobile viewports

## Story 2.7: System Contact Management

As a **developer**,
I want **automatic creation of system "Deleted Contact" records per client**,
so that **ticket history is preserved when contacts are removed**.

### Acceptance Criteria

1. System creates "Deleted Contact" record for each client on first contact deletion
2. "Deleted Contact" has email format: `deleted+{client_id}@system.local`
3. All tickets for deleted contact automatically reassigned to client's "Deleted Contact"
4. System contacts cannot be manually deleted
5. UI displays "(Deleted Contact)" label for system-created contacts
6. Ticket detail view shows original contact name in audit history if available

---
