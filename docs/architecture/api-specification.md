# API Specification

The system uses a RESTful API architecture for communication between the React frontend and Express backend. All endpoints require session-based authentication (except auth endpoints) and return JSON responses.

## Base URL

- **Development:** `http://localhost:3001`
- **Production:** `https://tickets.zollc.com`

## Authentication

**Method:** Session-based authentication via HTTP-only cookies

**Cookie Name:** `connect.sid`

**Protected Routes:** All `/api/*` endpoints except:
- `/api/health`
- `/api/auth/*`
- `/api/xero/callback`

## Key API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user and create session
- `POST /api/auth/logout` - Destroy session
- `GET /api/auth/me` - Get current authenticated user

**Clients:**
- `GET /api/clients` - List all clients (with optional search)
- `POST /api/clients` - Create new client with domains
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client (cascade or block if invoiced)

**Contacts:**
- `GET /api/contacts` - List all contacts (with optional client filter)
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/:id` - Get contact by ID
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Soft delete contact, reassign tickets

**Tickets (Epic 3):**
- `GET /api/tickets` - List tickets with filters (state, client)
- `POST /api/tickets` - Create ticket with initial time entry
- `GET /api/tickets/:id` - Get ticket with all time entries
- `PUT /api/tickets/:id` - Update ticket (description, notes, state)

**Time Entries (Epic 3):**
- `POST /api/tickets/:id/time-entries` - Add time entry to ticket
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Soft delete time entry

**Invoices (Epic 4):**
- `GET /api/invoices/preview?month=YYYY-MM` - Preview invoice data before generation
- `POST /api/invoices/generate` - Generate and push invoices to Xero

**Xero Integration (Epic 4):**
- `GET /api/xero/connect` - Initiate OAuth flow
- `GET /api/xero/callback` - OAuth callback handler
- `GET /api/xero/status` - Get connection status
- `POST /api/xero/disconnect` - Revoke Xero tokens

## Error Response Format

All errors follow a consistent structure:

```json
{
  "error": "ValidationError",
  "message": "Human-readable explanation"
}
```

## Data Transformation

**Backend → Frontend:** snake_case → camelCase (handled in API service layer)

**Example:**
```javascript
// Backend response
{ company_name: "Acme Corp", xero_customer_id: "123" }

// Frontend after transformation
{ companyName: "Acme Corp", xeroCustomerId: "123" }
```

## Multi-Month Ticket Handling

**Critical:** Invoice preview and generation filter time entries by `work_date` month, not by ticket creation date. This allows tickets to span multiple months:

- Ticket created in January with time entries in January and February
- January invoice includes only January time entries
- February invoice includes only February time entries
- After January invoice, January entries are locked; February entries remain editable

See "Core Workflows" section for detailed sequence diagram.

---
