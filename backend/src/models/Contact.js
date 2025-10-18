import { query, getClient } from '../config/database.js';

// Email format validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates contact name
 * @param {string} name - Contact name to validate
 * @throws {Error} If name is invalid
 */
function validateName(name) {
  if (!name || name.trim().length === 0) {
    throw new Error('Contact name is required');
  }
  if (name.length > 255) {
    throw new Error('Contact name must be 255 characters or less');
  }
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @throws {Error} If email format is invalid
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }
}

/**
 * Validates that a client exists
 * @param {number} clientId - Client ID to validate
 * @throws {Error} If client does not exist
 */
async function validateClientExists(clientId) {
  const result = await query('SELECT id FROM clients WHERE id = $1', [clientId]);
  if (result.rows.length === 0) {
    throw new Error(`Client with ID ${clientId} not found`);
  }
}

/**
 * Converts database row to camelCase object
 * @param {Object} row - Database row with snake_case columns
 * @returns {Object} Object with camelCase properties
 */
function convertToCamelCase(row) {
  if (!row) return null;

  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    name: row.name,
    email: row.email,
    isSystemContact: row.is_system_contact,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const Contact = {
  // Create a new contact
  async create({ clientId, name, email }) {
    // Validate input
    validateName(name);
    validateEmail(email);
    await validateClientExists(clientId);

    const result = await query(
      `INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
       VALUES ($1, $2, $3, FALSE, NOW(), NOW())
       RETURNING id, client_id, name, email, is_system_contact, created_at, updated_at`,
      [clientId, name, email.toLowerCase()]
    );

    // Return with client name
    return await this.findById(result.rows[0].id);
  },

  // Get all non-deleted contacts with client info
  async findAll(filters = {}) {
    let sql = `
      SELECT
        c.id,
        c.client_id,
        c.name,
        c.email,
        c.is_system_contact,
        c.created_at,
        c.updated_at,
        cl.company_name as client_name
      FROM contacts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.deleted_at IS NULL AND c.is_system_contact = FALSE
    `;

    const params = [];
    let paramCount = 1;

    // Filter by client
    if (filters.clientId) {
      sql += ` AND c.client_id = $${paramCount}`;
      params.push(filters.clientId);
      paramCount++;
    }

    // Search by name or email
    if (filters.search) {
      sql += ` AND (c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ` ORDER BY cl.company_name, c.name`;

    const result = await query(sql, params);
    return result.rows.map(convertToCamelCase);
  },

  // Get contact by ID
  async findById(id) {
    const result = await query(`
      SELECT
        c.id,
        c.client_id,
        c.name,
        c.email,
        c.is_system_contact,
        c.created_at,
        c.updated_at,
        cl.company_name as client_name
      FROM contacts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `, [id]);

    return convertToCamelCase(result.rows[0]);
  },

  // Update contact
  async update(id, { name, email, clientId }) {
    // Validate input
    validateName(name);
    validateEmail(email);
    await validateClientExists(clientId);

    const result = await query(
      `UPDATE contacts
       SET name = $1,
           email = $2,
           client_id = $3,
           updated_at = NOW()
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id`,
      [name, email.toLowerCase(), clientId, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Contact not found');
    }

    return await this.findById(id);
  },

  // Soft delete contact and reassign tickets
  async delete(id) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get contact info
      const contactResult = await client.query(
        'SELECT client_id, name, email FROM contacts WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (contactResult.rows.length === 0) {
        throw new Error('Contact not found');
      }

      const contact = contactResult.rows[0];

      // Check if contact is a system contact
      const systemCheck = await client.query(
        'SELECT is_system_contact FROM contacts WHERE id = $1',
        [id]
      );

      if (systemCheck.rows[0]?.is_system_contact) {
        throw new Error('Cannot delete system contact');
      }

      // Get or create "Deleted Contact" for this client
      let deletedContact = await client.query(
        `SELECT id FROM contacts
         WHERE client_id = $1
         AND is_system_contact = TRUE
         AND email LIKE 'deleted+%@system.local'`,
        [contact.client_id]
      );

      if (deletedContact.rows.length === 0) {
        // Create system deleted contact
        deletedContact = await client.query(
          `INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
           VALUES ($1, '(Deleted Contact)', $2, TRUE, NOW(), NOW())
           RETURNING id`,
          [contact.client_id, `deleted+${contact.client_id}@system.local`]
        );
      }

      const deletedContactId = deletedContact.rows[0].id;

      // Update contact_name_snapshot for all tickets before reassigning
      // This preserves the original contact name for historical display
      await client.query(
        `UPDATE tickets
         SET contact_name_snapshot = $1
         WHERE contact_id = $2 AND contact_name_snapshot IS NULL`,
        [contact.name, id]
      );

      // Reassign all tickets to deleted contact
      const ticketUpdate = await client.query(
        'UPDATE tickets SET contact_id = $1 WHERE contact_id = $2',
        [deletedContactId, id]
      );

      // Reassign all assets to deleted contact
      const assetUpdate = await client.query(
        'UPDATE assets SET contact_id = $1 WHERE contact_id = $2',
        [deletedContactId, id]
      );

      // Soft delete the contact
      await client.query(
        'UPDATE contacts SET deleted_at = NOW() WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');

      return {
        deletedContactId: id,
        deletedContactName: contact.name,
        ticketsReassigned: ticketUpdate.rowCount,
        assetsReassigned: assetUpdate.rowCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Check if email already exists (for validation)
  async emailExists(email, excludeId = null) {
    let sql = 'SELECT id FROM contacts WHERE email = $1 AND deleted_at IS NULL';
    const params = [email.toLowerCase()];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows.length > 0;
  },

  // Match contacts by email address (case-insensitive)
  async matchByEmail(email) {
    const result = await query(`
      SELECT
        c.id,
        c.client_id,
        c.name,
        c.email,
        c.is_system_contact,
        c.created_at,
        c.updated_at,
        cl.company_name as client_name
      FROM contacts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE LOWER(c.email) = LOWER($1)
        AND c.deleted_at IS NULL
        AND c.is_system_contact = FALSE
      ORDER BY cl.company_name, c.name
    `, [email]);

    return result.rows.map(row => ({
      contact: {
        id: row.id,
        name: row.name,
        email: row.email,
        clientId: row.client_id
      },
      client: {
        id: row.client_id,
        name: row.client_name
      }
    }));
  }
};
