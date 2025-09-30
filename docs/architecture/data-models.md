# Data Models

The core data models represent the business entities shared between frontend and backend. These models are derived from the implemented database schema and PRD requirements.

## User

**Purpose:** Represents authenticated users who can access the ticketing system. Single-user MVP design with multi-user support in schema.

**Key Attributes:**
- `id`: number - Unique identifier (auto-generated)
- `email`: string - User email (unique, used for login)
- `name`: string - User's display name
- `passwordHash`: string - Bcrypt hashed password (backend only, never sent to frontend)
- `createdAt`: Date - Account creation timestamp
- `updatedAt`: Date - Last modification timestamp

**TypeScript Interface:**
```typescript
// Shared type (frontend)
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string; // ISO 8601 timestamp
}

// Backend only (includes password hash)
export interface UserEntity extends User {
  passwordHash: string;
  updatedAt: string;
}
```

**Relationships:**
- One User has many Xero Connections (one-to-one in practice for MVP)

## Client

**Purpose:** Represents client companies that work is performed for. Central entity for billing and organization.

**Key Attributes:**
- `id`: number - Unique identifier
- `companyName`: string - Client company name (required)
- `xeroCustomerId`: string | null - Xero contact ID for invoice generation
- `maintenanceContractType`: enum - Contract type (Hourly | Monthly Retainer | Project-Based | None)
- `domains`: string[] - Email domains for auto-detection (one-to-many relationship)
- `contactCount`: number - Computed count of active contacts (frontend only)
- `createdAt`: Date - Record creation timestamp
- `updatedAt`: Date - Last modification timestamp

**TypeScript Interface:**
```typescript
export interface Client {
  id: number;
  companyName: string;
  xeroCustomerId: string | null;
  maintenanceContractType: 'Hourly' | 'Monthly Retainer' | 'Project-Based' | 'None';
  domains: string[];
  contactCount?: number; // Computed field from backend
  createdAt: string;
  updatedAt?: string;
}

// Create/Update request (frontend to backend)
export interface ClientRequest {
  companyName: string;
  xeroCustomerId?: string;
  maintenanceContractType: 'Hourly' | 'Monthly Retainer' | 'Project-Based' | 'None';
  domains: string[];
}
```

**Relationships:**
- One Client has many Contacts (one-to-many)
- One Client has many Tickets (one-to-many)
- One Client has many Domains (one-to-many, stored in separate `client_domains` table)

## Contact

**Purpose:** Represents individual people at client companies. Associates tickets with specific client contacts.

**Key Attributes:**
- `id`: number - Unique identifier
- `clientId`: number - Foreign key to Client
- `name`: string - Contact full name
- `email`: string - Contact email address (unique for active contacts)
- `isSystemContact`: boolean - True for auto-generated "Deleted Contact" records
- `deletedAt`: Date | null - Soft delete timestamp (null = active)
- `createdAt`: Date - Record creation timestamp
- `updatedAt`: Date - Last modification timestamp

**TypeScript Interface:**
```typescript
export interface Contact {
  id: number;
  clientId: number;
  clientName?: string; // Populated via JOIN in API responses
  name: string;
  email: string;
  isSystemContact: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Create/Update request
export interface ContactRequest {
  clientId: number;
  name: string;
  email: string;
}
```

**Relationships:**
- Many Contacts belong to one Client (many-to-one)
- One Contact has many Tickets (one-to-many)
- System Contacts are auto-created per client when contacts are deleted (preserves ticket history)

## Ticket

**Purpose:** Represents billable work items. Core entity for time tracking and invoicing.

**Key Attributes:**
- `id`: number - Unique identifier (sequential ticket number)
- `clientId`: number - Foreign key to Client
- `contactId`: number - Foreign key to Contact
- `description`: string | null - Work description (required before invoicing)
- `notes`: string | null - Additional notes (optional, internal use)
- `state`: enum - Ticket state (open | closed)
- `closedAt`: Date | null - Timestamp when ticket was closed
- `totalHours`: number - Computed sum of all time entries (frontend only)
- `createdAt`: Date - Ticket creation timestamp
- `updatedAt`: Date - Last modification timestamp

**TypeScript Interface:**
```typescript
export interface Ticket {
  id: number;
  clientId: number;
  clientName?: string; // Populated via JOIN
  contactId: number;
  contactName?: string; // Populated via JOIN
  description: string | null;
  notes: string | null;
  state: 'open' | 'closed';
  closedAt: string | null;
  totalHours?: number; // Computed from time entries
  createdAt: string;
  updatedAt: string;
}

// Create request (minimal fields for fast entry)
export interface CreateTicketRequest {
  clientId: number;
  contactId: number;
  description?: string;
  notes?: string;
  timeEntry: {
    workDate?: string; // Defaults to today
    duration: string; // Flexible format: "2h", "1.5", "90m"
    billable?: boolean; // Defaults to true
  };
}

// Update request
export interface UpdateTicketRequest {
  description?: string;
  notes?: string;
  state?: 'open' | 'closed';
}
```

**Relationships:**
- Many Tickets belong to one Client (many-to-one)
- Many Tickets belong to one Contact (many-to-one)
- One Ticket has many Time Entries (one-to-many)

## TimeEntry

**Purpose:** Represents individual time entries for billable/non-billable hours. Enables multiple work sessions per ticket.

**Key Attributes:**
- `id`: number - Unique identifier
- `ticketId`: number - Foreign key to Ticket
- `workDate`: Date - Date work was performed (no time component)
- `durationHours`: number - Hours worked (decimal, e.g., 1.5 for 90 minutes)
- `billable`: boolean - Whether time is billable (true) or non-billable (false)
- `deletedAt`: Date | null - Soft delete timestamp (audit trail per NFR9)
- `createdAt`: Date - Entry creation timestamp
- `updatedAt`: Date - Last modification timestamp

**TypeScript Interface:**
```typescript
export interface TimeEntry {
  id: number;
  ticketId: number;
  workDate: string; // ISO date (YYYY-MM-DD)
  durationHours: number; // Decimal hours
  billable: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Create/Update request
export interface TimeEntryRequest {
  workDate: string;
  duration: string; // Flexible format, parsed on backend
  billable: boolean;
}
```

**Relationships:**
- Many Time Entries belong to one Ticket (many-to-one)
- Time Entries are locked when associated month has invoice lock

## InvoiceLock

**Purpose:** Prevents modification of time entries after invoices are generated. Ensures billing integrity.

**Key Attributes:**
- `id`: number - Unique identifier
- `month`: Date - Month locked (YYYY-MM-01 format, unique)
- `xeroInvoiceIds`: object - JSON array of Xero invoice IDs generated
- `lockedAt`: Date - Timestamp when lock was created

**TypeScript Interface:**
```typescript
export interface InvoiceLock {
  id: number;
  month: string; // ISO date (YYYY-MM-01)
  xeroInvoiceIds: string[];
  lockedAt: string;
}
```

**Relationships:**
- Locks apply to all Time Entries where `workDate` falls within the locked month
- No foreign keys, enforced via application logic

## XeroConnection

**Purpose:** Stores OAuth credentials and connection state for Xero API integration. **System-wide singleton** (not per-user).

**Key Attributes:**
- `id`: number - Unique identifier
- `userId`: number - Foreign key to User (NOTE: Should be removed in future migration for system-wide singleton)
- `organizationName`: string | null - Xero organization name
- `organizationId`: string | null - Xero organization ID
- `accessToken`: string | null - Encrypted OAuth access token
- `refreshToken`: string | null - Encrypted OAuth refresh token
- `tokenExpiresAt`: Date | null - Access token expiration timestamp
- `connectedAt`: Date - Initial connection timestamp
- `lastSyncAt`: Date | null - Last successful API call timestamp
- `updatedAt`: Date - Last modification timestamp

**TypeScript Interface:**
```typescript
export interface XeroConnection {
  id: number;
  userId: number;
  organizationName: string | null;
  organizationId: string | null;
  isConnected: boolean; // Computed: accessToken is valid
  connectedAt: string;
  lastSyncAt: string | null;
  updatedAt: string;
}

// Frontend never receives tokens (security)
```

**Relationships:**
- One Xero Connection per system (should be system-wide singleton)
- Current schema has user_id FK (to be removed in future migration)

---
