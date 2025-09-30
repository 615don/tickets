import { query, getClient } from '../config/database.js';

export const Client = {
  // Create a new client with domains
  async create({ companyName, xeroCustomerId, maintenanceContractType, domains = [] }) {
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

      // Insert domains if provided
      if (domains && domains.length > 0) {
        for (const domain of domains) {
          await client.query(
            'INSERT INTO client_domains (client_id, domain, created_at) VALUES ($1, $2, NOW())',
            [newClient.id, domain.toLowerCase()]
          );
        }
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

        // Insert new domains
        if (domains && domains.length > 0) {
          for (const domain of domains) {
            await client.query(
              'INSERT INTO client_domains (client_id, domain, created_at) VALUES ($1, $2, NOW())',
              [id, domain.toLowerCase()]
            );
          }
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
