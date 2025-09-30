# Database Schema

The database schema is implemented in PostgreSQL 14+ using migrations. All tables include timestamps for auditing, and relationships enforce referential integrity through foreign keys.

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ xero_connections : "has (system-wide)"

    clients ||--o{ client_domains : "has many"
    clients ||--o{ contacts : "has many"
    clients ||--o{ tickets : "has many"

    contacts ||--o{ tickets : "has many"

    tickets ||--o{ time_entries : "has many"

    invoice_locks }o--|| time_entries : "locks by work_date month"

    users {
        int id PK
        varchar email UK
        varchar password_hash
        varchar name
        timestamp created_at
        timestamp updated_at
    }

    clients {
        int id PK
        varchar company_name
        varchar xero_customer_id
        varchar maintenance_contract_type
        timestamp created_at
        timestamp updated_at
    }

    client_domains {
        int id PK
        int client_id FK
        varchar domain UK
        timestamp created_at
    }

    contacts {
        int id PK
        int client_id FK
        varchar name
        varchar email
        boolean is_system_contact
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    tickets {
        int id PK
        int client_id FK
        int contact_id FK
        text description
        text notes
        varchar state
        timestamp closed_at
        timestamp created_at
        timestamp updated_at
    }

    time_entries {
        int id PK
        int ticket_id FK
        date work_date
        decimal duration_hours
        boolean billable
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    invoice_locks {
        int id PK
        date month UK
        jsonb xero_invoice_ids
        timestamp locked_at
    }

    xero_connections {
        int id PK
        int user_id FK UK
        varchar organization_name
        varchar organization_id
        text access_token
        text refresh_token
        timestamp token_expires_at
        timestamp connected_at
        timestamp last_sync_at
        timestamp updated_at
    }
```

## Key Schema Features

**Soft Deletes:**
- `contacts.deleted_at` - Preserves ticket history when contacts removed
- `time_entries.deleted_at` - Audit trail per NFR9
- Partial unique index on `contacts(email)` excludes deleted records

**Cascade Behavior:**
- Client deletion cascades to: client_domains, contacts, tickets, time_entries
- Contact deletion does NOT cascade (handled in application logic - reassigns to system contact)
- Ticket deletion cascades to: time_entries

**Indexes:**
- All foreign key columns indexed for JOIN performance
- `idx_time_entries_work_date` for monthly invoice aggregation
- `idx_tickets_state` for open/closed filtering
- `idx_invoice_locks_month` for fast lock validation

**Data Types:**
- `work_date`: DATE (no time component, eliminates timezone issues)
- `duration_hours`: DECIMAL(5,2) (up to 999.99 hours, 2 decimal places)
- `xero_invoice_ids`: JSONB (flexible schema for invoice metadata)

See full schema DDL in implementation: [backend/src/utils/migrate.js](backend/src/utils/migrate.js:1)

---
