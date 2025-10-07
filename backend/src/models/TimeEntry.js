import { query } from '../config/database.js';
import { parseTimeEntry } from '../shared/utils/parseTimeEntry.js';

/**
 * Validates that a ticket exists
 * @param {number} ticketId - Ticket ID to validate
 * @throws {Error} If ticket does not exist
 */
async function validateTicketExists(ticketId) {
  const result = await query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
  if (result.rows.length === 0) {
    throw new Error(`Ticket with ID ${ticketId} not found`);
  }
}

/**
 * Validates duration hours
 * @param {number} durationHours - Duration in hours to validate
 * @throws {Error} If duration is invalid
 */
function validateDurationHours(durationHours) {
  if (typeof durationHours !== 'number' || isNaN(durationHours)) {
    throw new Error('Duration hours must be a number');
  }
  if (durationHours <= 0) {
    throw new Error('Duration hours must be greater than 0');
  }
  if (durationHours > 24) {
    throw new Error('Duration hours cannot exceed 24');
  }
}

/**
 * Validates work date
 * @param {string} workDate - Work date to validate (YYYY-MM-DD format)
 * @throws {Error} If work date is invalid or in the future
 */
function validateWorkDate(workDate) {
  if (!workDate || typeof workDate !== 'string') {
    throw new Error('Work date is required');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(workDate)) {
    throw new Error('Work date must be in YYYY-MM-DD format');
  }

  const date = new Date(workDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    throw new Error('Work date cannot be in the future');
  }
}

/**
 * Validates billable flag
 * @param {boolean} billable - Billable flag to validate
 * @throws {Error} If billable is not a boolean
 */
function validateBillable(billable) {
  if (typeof billable !== 'boolean') {
    throw new Error('Billable must be a boolean value');
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
    ticketId: row.ticket_id,
    workDate: row.work_date,
    durationHours: parseFloat(row.duration_hours),
    billable: row.billable,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const TimeEntry = {
  // Create a new time entry
  async create({ ticketId, workDate, duration, billable = true }) {
    // Parse duration string to decimal hours
    const parseResult = parseTimeEntry(duration);

    if (!parseResult.success) {
      throw new Error(parseResult.error);
    }

    const durationHours = parseResult.hours;

    // Validate input
    await validateTicketExists(ticketId);
    validateWorkDate(workDate);
    validateDurationHours(durationHours);
    validateBillable(billable);

    const result = await query(
      `INSERT INTO time_entries (ticket_id, work_date, duration_hours, billable, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, ticket_id, work_date, duration_hours, billable, deleted_at, created_at, updated_at`,
      [ticketId, workDate, durationHours, billable]
    );

    return convertToCamelCase(result.rows[0]);
  },

  // Get all non-deleted time entries for a ticket
  async findByTicketId(ticketId) {
    const result = await query(`
      SELECT
        id,
        ticket_id,
        work_date,
        duration_hours,
        billable,
        deleted_at,
        created_at,
        updated_at
      FROM time_entries
      WHERE ticket_id = $1 AND deleted_at IS NULL
      ORDER BY work_date ASC, created_at ASC
    `, [ticketId]);

    return result.rows.map(convertToCamelCase);
  },

  // Get single time entry by ID
  async findById(id) {
    const result = await query(`
      SELECT
        id,
        ticket_id,
        work_date,
        duration_hours,
        billable,
        deleted_at,
        created_at,
        updated_at
      FROM time_entries
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return convertToCamelCase(result.rows[0]);
  },

  // Update time entry
  async update(id, { workDate, duration, billable }) {
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (workDate !== undefined) {
      validateWorkDate(workDate);
      updates.push(`work_date = $${paramCount}`);
      params.push(workDate);
      paramCount++;
    }

    if (duration !== undefined) {
      // Parse duration string to decimal hours
      const parseResult = parseTimeEntry(duration);

      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      const durationHours = parseResult.hours;
      validateDurationHours(durationHours);
      updates.push(`duration_hours = $${paramCount}`);
      params.push(durationHours);
      paramCount++;
    }

    if (billable !== undefined) {
      validateBillable(billable);
      updates.push(`billable = $${paramCount}`);
      params.push(billable);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE time_entries
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING id, ticket_id, work_date, duration_hours, billable, deleted_at, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new Error('Time entry not found');
    }

    return convertToCamelCase(result.rows[0]);
  },

  // Soft delete time entry (sets deleted_at timestamp)
  async softDelete(id) {
    const result = await query(
      `UPDATE time_entries
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, ticket_id, work_date, duration_hours, billable, deleted_at, created_at, updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Time entry not found');
    }

    return convertToCamelCase(result.rows[0]);
  }
};
