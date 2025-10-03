import { query } from '../config/database.js';
import { InvoiceLock } from '../models/InvoiceLock.js';

/**
 * Groups flat SQL results (individual time entries) into nested client → tickets structure
 * @param {Array} rows - Raw SQL rows with time entry data
 * @returns {Array} Array of client objects with nested tickets and time entries
 */
function groupByClient(rows) {
  const clientMap = new Map();
  const ticketMap = new Map();

  rows.forEach(row => {
    // Get or create client entry
    if (!clientMap.has(row.client_id)) {
      clientMap.set(row.client_id, {
        clientId: row.client_id,
        clientName: row.client_name,
        subtotalHours: 0,
        tickets: []
      });
    }

    const client = clientMap.get(row.client_id);
    const ticketKey = `${row.client_id}-${row.ticket_id}`;

    // Get or create ticket entry
    if (!ticketMap.has(ticketKey)) {
      const ticket = {
        ticketId: row.ticket_id,
        description: row.description,
        contactId: row.contact_id,
        contactName: row.contact_name,
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        billable: false, // Will be set to true if any billable hours found
        missingDescription: row.missing_description,
        timeEntries: []
      };
      ticketMap.set(ticketKey, ticket);
      client.tickets.push(ticket);
    }

    const ticket = ticketMap.get(ticketKey);

    // Add time entry to ticket
    const timeEntry = {
      id: row.time_entry_id,
      workDate: row.work_date,
      durationHours: parseFloat(row.duration_hours),
      billable: row.billable
    };
    ticket.timeEntries.push(timeEntry);

    // Aggregate hours
    const hours = parseFloat(row.duration_hours);
    ticket.totalHours += hours;

    if (row.billable) {
      ticket.billableHours += hours;
      ticket.billable = true; // Mark ticket as billable if any billable hours
      client.subtotalHours += hours; // Only billable hours count in subtotal
    } else {
      ticket.nonBillableHours += hours;
    }
  });

  return Array.from(clientMap.values());
}

/**
 * Calculates total billable hours across all clients
 * @param {Array} clients - Array of client objects
 * @returns {number} Total billable hours
 */
function calculateTotalBillable(clients) {
  return clients.reduce((total, client) => total + client.subtotalHours, 0);
}

/**
 * Calculates month boundaries for SQL query
 * @param {string} month - Month in YYYY-MM format
 * @returns {Object} Object with startDate and endDate strings
 */
function calculateMonthBoundaries(month) {
  const [year, monthValue] = month.split('-').map(Number);
  const startDate = `${month}-01`;

  // Calculate next month
  let nextYear = year;
  let nextMonthValue = monthValue + 1;
  if (nextMonthValue > 12) {
    nextMonthValue = 1;
    nextYear += 1;
  }

  const endDate = `${nextYear}-${String(nextMonthValue).padStart(2, '0')}-01`;
  return { startDate, endDate };
}

/**
 * GET /api/invoices/preview?month=YYYY-MM
 * Returns invoice preview data with tickets grouped by client
 */
export const previewInvoice = async (req, res) => {
  try {
    const { month } = req.query;

    // Check lock status
    const isLocked = await InvoiceLock.isMonthLocked(`${month}-01`);

    // Calculate month boundaries
    const { startDate, endDate } = calculateMonthBoundaries(month);

    // Query time entries with joins
    const result = await query(
      `SELECT
        te.id AS time_entry_id,
        te.work_date,
        te.duration_hours,
        te.billable,
        t.id AS ticket_id,
        t.description,
        t.client_id,
        c.company_name AS client_name,
        t.contact_id,
        ct.name AS contact_name,
        CASE WHEN t.description IS NULL OR t.description = '' THEN true ELSE false END AS missing_description
      FROM time_entries te
      JOIN tickets t ON te.ticket_id = t.id
      JOIN clients c ON t.client_id = c.id
      JOIN contacts ct ON t.contact_id = ct.id
      WHERE
        te.work_date >= $1
        AND te.work_date < $2
        AND te.deleted_at IS NULL
      ORDER BY c.company_name, t.id, te.work_date`,
      [startDate, endDate]
    );

    // Transform and group data
    const clients = groupByClient(result.rows);
    const totalBillableHours = calculateTotalBillable(clients);

    res.json({
      month,
      isLocked,
      totalBillableHours,
      clients
    });
  } catch (error) {
    console.error('Error previewing invoice:', error);
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to retrieve invoice preview'
    });
  }
};
