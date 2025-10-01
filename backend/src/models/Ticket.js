import { query, getClient } from '../config/database.js';

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
 * Validates that a contact exists
 * @param {number} contactId - Contact ID to validate
 * @throws {Error} If contact does not exist
 */
async function validateContactExists(contactId) {
  const result = await query('SELECT id FROM contacts WHERE id = $1 AND deleted_at IS NULL', [contactId]);
  if (result.rows.length === 0) {
    throw new Error(`Contact with ID ${contactId} not found`);
  }
}

/**
 * Validates ticket state
 * @param {string} state - State to validate
 * @throws {Error} If state is invalid
 */
function validateState(state) {
  const validStates = ['open', 'closed'];
  if (!validStates.includes(state)) {
    throw new Error(`Invalid state: ${state}. Must be one of: ${validStates.join(', ')}`);
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
    contactId: row.contact_id,
    contactName: row.contact_name,
    description: row.description,
    notes: row.notes,
    state: row.state,
    closedAt: row.closed_at,
    totalHours: row.total_hours ? parseFloat(row.total_hours) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const Ticket = {
  // Create a new ticket
  async create({ clientId, contactId, description = null, notes = null, state = 'open' }) {
    // Validate input
    await validateClientExists(clientId);
    await validateContactExists(contactId);
    validateState(state);

    const result = await query(
      `INSERT INTO tickets (client_id, contact_id, description, notes, state, closed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, client_id, contact_id, description, notes, state, closed_at, created_at, updated_at`,
      [clientId, contactId, description, notes, state, state === 'closed' ? new Date().toISOString() : null]
    );

    // Return with client and contact names
    return await this.findById(result.rows[0].id);
  },

  // Get all tickets with optional filtering
  async findAll(filters = {}) {
    let sql = `
      SELECT
        t.id,
        t.client_id,
        t.contact_id,
        t.description,
        t.notes,
        t.state,
        t.closed_at,
        t.created_at,
        t.updated_at,
        c.company_name as client_name,
        co.name as contact_name,
        COALESCE(SUM(te.duration_hours) FILTER (WHERE te.deleted_at IS NULL), 0) as total_hours
      FROM tickets t
      JOIN clients c ON t.client_id = c.id
      JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN time_entries te ON t.id = te.ticket_id
    `;

    const params = [];
    const conditions = [];
    let paramCount = 1;

    // Filter by state
    if (filters.state) {
      validateState(filters.state);
      conditions.push(`t.state = $${paramCount}`);
      params.push(filters.state);
      paramCount++;
    }

    // Filter by client
    if (filters.clientId) {
      conditions.push(`t.client_id = $${paramCount}`);
      params.push(filters.clientId);
      paramCount++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
      GROUP BY t.id, c.company_name, co.name
      ORDER BY t.updated_at DESC
    `;

    const result = await query(sql, params);
    return result.rows.map(convertToCamelCase);
  },

  // Get ticket by ID with related data
  async findById(id) {
    const result = await query(`
      SELECT
        t.id,
        t.client_id,
        t.contact_id,
        t.description,
        t.notes,
        t.state,
        t.closed_at,
        t.created_at,
        t.updated_at,
        c.company_name as client_name,
        co.name as contact_name,
        COALESCE(SUM(te.duration_hours) FILTER (WHERE te.deleted_at IS NULL), 0) as total_hours
      FROM tickets t
      JOIN clients c ON t.client_id = c.id
      JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN time_entries te ON t.id = te.ticket_id
      WHERE t.id = $1
      GROUP BY t.id, c.company_name, co.name
    `, [id]);

    return convertToCamelCase(result.rows[0]);
  },

  // Update ticket
  async update(id, { description, notes, state }) {
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    if (state !== undefined) {
      validateState(state);
      updates.push(`state = $${paramCount}`);
      params.push(state);
      paramCount++;

      // Handle closed_at timestamp
      if (state === 'closed') {
        updates.push(`closed_at = NOW()`);
      } else if (state === 'open') {
        updates.push(`closed_at = NULL`);
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE tickets
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id`,
      params
    );

    if (result.rows.length === 0) {
      throw new Error('Ticket not found');
    }

    return await this.findById(id);
  },

  // Delete ticket (cascade deletes time_entries via database constraint)
  async delete(id) {
    // Get ticket info before deletion
    const ticket = await this.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get time entries count
    const timeEntriesResult = await query(
      'SELECT COUNT(*) as count FROM time_entries WHERE ticket_id = $1',
      [id]
    );

    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);

    return {
      deletedTicketId: id,
      timeEntriesDeleted: parseInt(timeEntriesResult.rows[0].count)
    };
  }
};
