import { query, getClient } from '../config/database.js';

// Domain format validation regex
const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Valid maintenance contract types
const VALID_CONTRACT_TYPES = ['Hourly', 'Monthly Retainer', 'Project-Based', 'None'];

/**
 * Validates domain format
 * @param {string} domain - Domain to validate
 * @throws {Error} If domain format is invalid
 */
function validateDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    throw new Error('Domain must be a non-empty string');
  }
  if (!DOMAIN_REGEX.test(domain)) {
    throw new Error(`Invalid domain format: ${domain}. Expected format: example.com`);
  }
}

/**
 * Validates input fields for client creation/update
 * @param {string} companyName - Company name
 * @param {string} maintenanceContractType - Maintenance contract type
 * @throws {Error} If validation fails
 */
function validateClientInput(companyName, maintenanceContractType) {
  if (!companyName || companyName.trim().length === 0) {
    throw new Error('Company name is required');
  }
  if (!VALID_CONTRACT_TYPES.includes(maintenanceContractType)) {
    throw new Error(`Invalid maintenance contract type: ${maintenanceContractType}. Must be one of: ${VALID_CONTRACT_TYPES.join(', ')}`);
  }
}

export const Client = {
  // Create a new client with domains
  async create({ companyName, xeroCustomerId, maintenanceContractType, domains = [] }) {
    // Validate input
    validateClientInput(companyName, maintenanceContractType);

    // Validate all domains before starting transaction
    if (domains && domains.length > 0) {
      domains.forEach(validateDomain);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Insert client
      const clientResult = await client.query(
        `INSERT INTO clients (company_name, xero_customer_id, maintenance_contract_type, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, company_name, xero_customer_id, maintenance_contract_type, created_at, updated_at`,
        [companyName, xeroCustomerId || null, maintenanceContractType]
      );

      const newClient = clientResult.rows[0];

      // Batch insert domains if provided
      if (domains && domains.length > 0) {
        const values = domains.map((_, i) => `($1, $${i + 2}, NOW())`).join(', ');
        const params = [newClient.id, ...domains.map(d => d.toLowerCase())];
        await client.query(
          `INSERT INTO client_domains (client_id, domain, created_at) VALUES ${values}`,
          params
        );
      }

      await client.query('COMMIT');

      // Fetch complete client with domains
      return await this.findById(newClient.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all clients with domains and contact count
  async findAll() {
    const result = await query(`
      SELECT
        c.id,
        c.company_name,
        c.xero_customer_id,
        c.maintenance_contract_type,
        c.created_at,
        c.updated_at,
        COALESCE(json_agg(cd.domain ORDER BY cd.domain) FILTER (WHERE cd.domain IS NOT NULL), '[]') as domains,
        COUNT(DISTINCT contacts.id) as contact_count
      FROM clients c
      LEFT JOIN client_domains cd ON c.id = cd.client_id
      LEFT JOIN contacts ON c.id = contacts.client_id AND contacts.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.company_name
    `);

    return result.rows;
  },

  // Get client by ID with domains and contact count
  async findById(id) {
    const result = await query(`
      SELECT
        c.id,
        c.company_name,
        c.xero_customer_id,
        c.maintenance_contract_type,
        c.created_at,
        c.updated_at,
        COALESCE(json_agg(cd.domain ORDER BY cd.domain) FILTER (WHERE cd.domain IS NOT NULL), '[]') as domains,
        COUNT(DISTINCT contacts.id) as contact_count
      FROM clients c
      LEFT JOIN client_domains cd ON c.id = cd.client_id
      LEFT JOIN contacts ON c.id = contacts.client_id AND contacts.deleted_at IS NULL
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    return result.rows[0] || null;
  },

  // Update client and replace domains
  async update(id, { companyName, xeroCustomerId, maintenanceContractType, domains }) {
    // Validate input
    validateClientInput(companyName, maintenanceContractType);

    // Validate all domains before starting transaction
    if (domains && domains.length > 0) {
      domains.forEach(validateDomain);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Update client
      const updateResult = await client.query(
        `UPDATE clients
         SET company_name = $1,
             xero_customer_id = $2,
             maintenance_contract_type = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id`,
        [companyName, xeroCustomerId || null, maintenanceContractType, id]
      );

      if (updateResult.rows.length === 0) {
        throw new Error('Client not found');
      }

      // Replace domains
      if (domains !== undefined) {
        // Delete existing domains
        await client.query('DELETE FROM client_domains WHERE client_id = $1', [id]);

        // Batch insert new domains
        if (domains && domains.length > 0) {
          const values = domains.map((_, i) => `($1, $${i + 2}, NOW())`).join(', ');
          const params = [id, ...domains.map(d => d.toLowerCase())];
          await client.query(
            `INSERT INTO client_domains (client_id, domain, created_at) VALUES ${values}`,
            params
          );
        }
      }

      await client.query('COMMIT');

      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete client (cascade deletes contacts, tickets, time entries)
  async delete(id) {
    // Check if client has any invoices
    const invoiceCheck = await query(`
      SELECT COUNT(*) as invoice_count
      FROM invoice_locks il
      JOIN time_entries te ON DATE_TRUNC('month', te.work_date) = il.month
      JOIN tickets t ON te.ticket_id = t.id
      WHERE t.client_id = $1
    `, [id]);

    if (parseInt(invoiceCheck.rows[0].invoice_count) > 0) {
      throw new Error('Cannot delete client with generated invoices');
    }

    // Get counts for confirmation
    const counts = await query(`
      SELECT
        (SELECT COUNT(*) FROM contacts WHERE client_id = $1) as contact_count,
        (SELECT COUNT(*) FROM tickets WHERE client_id = $1) as ticket_count,
        (SELECT COUNT(*) FROM time_entries te
         JOIN tickets t ON te.ticket_id = t.id
         WHERE t.client_id = $1) as time_entry_count
    `, [id]);

    // Delete client (cascade will handle related data)
    const result = await query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new Error('Client not found');
    }

    return {
      deletedClientId: id,
      deletedCounts: counts.rows[0]
    };
  },

  // Search clients by company name
  async search(searchTerm) {
    const result = await query(`
      SELECT
        c.id,
        c.company_name,
        c.xero_customer_id,
        c.maintenance_contract_type,
        c.created_at,
        COALESCE(json_agg(cd.domain ORDER BY cd.domain) FILTER (WHERE cd.domain IS NOT NULL), '[]') as domains,
        COUNT(DISTINCT contacts.id) as contact_count
      FROM clients c
      LEFT JOIN client_domains cd ON c.id = cd.client_id
      LEFT JOIN contacts ON c.id = contacts.client_id AND contacts.deleted_at IS NULL
      WHERE c.company_name ILIKE $1
      GROUP BY c.id
      ORDER BY c.company_name
    `, [`%${searchTerm}%`]);

    return result.rows;
  }
};
