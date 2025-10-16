import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database migrations - Epic 1: Foundation
const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
  },
  {
    name: '002_create_clients_table',
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        xero_customer_id VARCHAR(255),
        maintenance_contract_type VARCHAR(50) CHECK (maintenance_contract_type IN ('Hourly', 'Monthly Retainer', 'Project-Based', 'None')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
    `
  },
  {
    name: '003_create_client_domains_table',
    sql: `
      CREATE TABLE IF NOT EXISTS client_domains (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        domain VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_client_domains_client_id ON client_domains(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_domains_domain ON client_domains(domain);
    `
  },
  {
    name: '004_create_contacts_table',
    sql: `
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        is_system_contact BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_email ON contacts(email) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at);
    `
  },
  {
    name: '005_create_tickets_table',
    sql: `
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        contact_id INTEGER NOT NULL REFERENCES contacts(id),
        description TEXT,
        notes TEXT,
        state VARCHAR(20) NOT NULL CHECK (state IN ('open', 'closed')) DEFAULT 'open',
        closed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state);
      CREATE INDEX IF NOT EXISTS idx_tickets_closed_at ON tickets(closed_at);
    `
  },
  {
    name: '006_create_time_entries_table',
    sql: `
      CREATE TABLE IF NOT EXISTS time_entries (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        work_date DATE NOT NULL,
        duration_hours DECIMAL(5,2) NOT NULL CHECK (duration_hours > 0 AND duration_hours <= 24),
        billable BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_time_entries_ticket_id ON time_entries(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_work_date ON time_entries(work_date);
      CREATE INDEX IF NOT EXISTS idx_time_entries_deleted_at ON time_entries(deleted_at);
    `
  },
  {
    name: '007_create_invoice_locks_table',
    sql: `
      CREATE TABLE IF NOT EXISTS invoice_locks (
        id SERIAL PRIMARY KEY,
        month DATE NOT NULL UNIQUE,
        xero_invoice_ids JSONB,
        locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_invoice_locks_month ON invoice_locks(month);
    `
  },
  {
    name: '008_create_xero_connections_table',
    sql: `
      CREATE TABLE IF NOT EXISTS xero_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_name VARCHAR(255),
        organization_id VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_xero_connections_user_id ON xero_connections(user_id);
    `
  },
  {
    name: '009_create_invoice_config_table',
    sql: `
      CREATE TABLE IF NOT EXISTS invoice_config (
        id SERIAL PRIMARY KEY,
        xero_invoice_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_single_row CHECK (id = 1),
        CONSTRAINT check_valid_status CHECK (
          xero_invoice_status IN ('DRAFT', 'AUTHORISED')
        )
      );

      INSERT INTO invoice_config (id, xero_invoice_status)
      VALUES (1, 'DRAFT')
      ON CONFLICT (id) DO NOTHING;
    `
  },
  {
    name: '010_update_client_contract_types',
    sql: `
      -- Drop old CHECK constraint
      ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_maintenance_contract_type_check;

      -- Update existing values
      UPDATE clients SET maintenance_contract_type = 'On Demand'
      WHERE maintenance_contract_type IN ('Hourly', 'Project-Based', 'None');

      UPDATE clients SET maintenance_contract_type = 'Regular Maintenance'
      WHERE maintenance_contract_type = 'Monthly Retainer';

      -- Add new CHECK constraint
      ALTER TABLE clients ADD CONSTRAINT clients_maintenance_contract_type_check
      CHECK (maintenance_contract_type IN ('On Demand', 'Regular Maintenance'));
    `
  },
  {
    name: '011_create_audit_logs_table',
    sql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        success BOOLEAN NOT NULL DEFAULT false,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    `
  },
  {
    name: '012_create_ai_settings_table',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_settings (
        id SERIAL PRIMARY KEY CHECK (id = 1),
        openai_api_key TEXT NOT NULL,
        openai_model VARCHAR(50) NOT NULL DEFAULT 'gpt-5-mini',
        system_prompt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO ai_settings (id, openai_api_key, openai_model, system_prompt)
      VALUES (
        1,
        '',
        'gpt-5-mini',
        'You are an AI assistant helping to summarize email threads for IT consulting ticket creation.

Generate two outputs:
1. Description: A concise one-line summary suitable for invoice line items (max 100 characters)
2. Notes: A detailed summary of the email thread for billing reference and memory jogging

Rules:
- Focus on technical issues, requests, and context
- Preserve important details (error messages, dates, versions, steps taken)
- Omit pleasantries and signature content
- Adjust summary length based on email content length (short emails = brief notes, long threads = detailed notes)
- Use professional, neutral tone

Respond with JSON format:
{
  "description": "one-line summary here",
  "notes": "detailed multi-paragraph summary here"
}'
      )
      ON CONFLICT (id) DO NOTHING;
    `
  },
  {
    name: '013_add_max_completion_tokens_to_ai_settings',
    sql: `
      -- Add max_completion_tokens column to ai_settings table
      ALTER TABLE ai_settings
      ADD COLUMN IF NOT EXISTS max_completion_tokens INTEGER NOT NULL DEFAULT 2000;

      -- Add constraint to ensure reasonable token limits (min 100, max 128000 per GPT-5 docs)
      ALTER TABLE ai_settings
      ADD CONSTRAINT check_max_completion_tokens
      CHECK (max_completion_tokens >= 100 AND max_completion_tokens <= 128000);
    `
  },
  {
    name: '014_create_google_drive_tokens_table',
    sql: `
      CREATE TABLE IF NOT EXISTS google_drive_tokens (
        id SERIAL PRIMARY KEY CHECK (id = 1),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date BIGINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: '015_create_backup_settings_table',
    sql: `
      CREATE TABLE IF NOT EXISTS backup_settings (
        id SERIAL PRIMARY KEY CHECK (id = 1),
        enabled BOOLEAN NOT NULL DEFAULT false,
        schedule_cron VARCHAR(100) NOT NULL DEFAULT '0 0 * * *',
        retention_days INTEGER NOT NULL DEFAULT 10,
        last_backup_at TIMESTAMP WITH TIME ZONE,
        last_backup_status VARCHAR(50),
        last_backup_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO backup_settings (id, enabled, schedule_cron, retention_days)
      VALUES (1, false, '0 0 * * *', 10)
      ON CONFLICT (id) DO NOTHING;
    `
  },
  {
    name: '016_add_composite_indexes',
    sql: `
      -- Composite index for dashboard queries (filter by client + state)
      -- Optimizes: SELECT * FROM tickets WHERE client_id = ? AND state = ?
      CREATE INDEX IF NOT EXISTS idx_tickets_client_state
      ON tickets(client_id, state);

      -- Composite index for invoice aggregation (work_date + billable flag)
      -- Partial index excludes soft-deleted entries
      -- Optimizes: SELECT SUM(duration_hours) FROM time_entries
      --            WHERE work_date BETWEEN ? AND ? AND billable = true AND deleted_at IS NULL
      CREATE INDEX IF NOT EXISTS idx_time_entries_work_date_billable
      ON time_entries(work_date, billable)
      WHERE deleted_at IS NULL;

      -- Partial index for active contacts by client
      -- Optimizes: SELECT * FROM contacts WHERE client_id = ? AND deleted_at IS NULL
      CREATE INDEX IF NOT EXISTS idx_contacts_client_active
      ON contacts(client_id)
      WHERE deleted_at IS NULL;
    `
  },
  {
    name: '017_add_contact_name_snapshot_to_tickets',
    sql: `
      -- Add contact_name_snapshot column to preserve historical contact names
      -- This implements TD-004: Audit trail for deleted contacts
      -- When a contact is deleted, their name is captured in this column
      -- so tickets can display the original contact name instead of "(Deleted Contact)"
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS contact_name_snapshot VARCHAR(255);

      -- Add comment for documentation
      COMMENT ON COLUMN tickets.contact_name_snapshot IS
        'Preserves the original contact name when a contact is deleted. Used to display historical information instead of "(Deleted Contact)".';
    `
  },
  {
    name: '018_create_assets_table',
    sql: `
      -- Create assets table for Epic 15: Asset Management Integration
      -- Stores hardware/device information linked to contacts
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        hostname VARCHAR(255) NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        manufacturer VARCHAR(255),
        model VARCHAR(255),
        serial_number VARCHAR(255),
        in_service_date DATE NOT NULL,
        warranty_expiration_date DATE,
        pdq_device_id VARCHAR(255),
        screenconnect_session_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'retired')),
        retired_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_assets_contact_id ON assets(contact_id);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_warranty_expiration ON assets(warranty_expiration_date);
      CREATE INDEX IF NOT EXISTS idx_assets_hostname ON assets(hostname);

      -- Comments for documentation
      COMMENT ON TABLE assets IS 'Stores client hardware/device inventory with warranty and support tool integration';
      COMMENT ON COLUMN assets.contact_id IS 'Links asset to contact; set to NULL if contact is deleted (preserves asset record)';
      COMMENT ON COLUMN assets.status IS 'Asset lifecycle state: active (in use) or retired (decommissioned)';
      COMMENT ON COLUMN assets.pdq_device_id IS 'Integration ID for PDQ Inventory/Deploy';
      COMMENT ON COLUMN assets.screenconnect_session_id IS 'Integration ID for ScreenConnect/ConnectWise Control';
    `
  },
  {
    name: '019_add_clients_notion_url',
    sql: `
      -- Add notion_url column to clients table for Epic 15: Asset Management Integration
      -- Enables quick access to client documentation from ticket pages
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS notion_url VARCHAR(500);

      -- Comment for documentation
      COMMENT ON COLUMN clients.notion_url IS 'Link to client documentation in Notion (optional)';
    `
  }
];

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  const client = await pool.connect();

  try {
    // Create migrations table to track which migrations have run
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const migration of migrations) {
      // Check if migration already ran
      const result = await client.query(
        'SELECT id FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${migration.name}`);

        // Run migration in a transaction
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration.name]
          );
          await client.query('COMMIT');
          console.log(`✓ ${migration.name} completed\n`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`⊘ ${migration.name} already ran`);
      }
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
