import { query, getClient } from '../config/database.js';
import { InvoiceLock } from '../models/InvoiceLock.js';
import { XeroConnection } from '../models/XeroConnection.js';
import { InvoiceConfig } from '../models/InvoiceConfig.js';
import { createAuthenticatedXeroClient } from '../services/xeroService.js';
import { validationResult } from 'express-validator';

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
        xeroCustomerId: row.xero_customer_id,
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
      ticket.billable = true; // Mark ticket as billable if any billable hours found
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
 * Gets last day of month from YYYY-MM format
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} Date in YYYY-MM-DD format (last day of month)
 */
function getLastDayOfMonth(month) {
  const [year, monthValue] = month.split('-').map(Number);
  // Create date for first day of next month, then subtract 1 day
  const lastDay = new Date(year, monthValue, 0);
  return lastDay.toISOString().split('T')[0];
}

/**
 * Adds days to a date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} days - Number of days to add
 * @returns {string} New date in YYYY-MM-DD format
 */
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Gets month name from YYYY-MM format
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} Month name (e.g., "September")
 */
function getMonthName(month) {
  const [year, monthValue] = month.split('-');
  const date = new Date(year, monthValue - 1, 1);
  return date.toLocaleString('en-US', { month: 'long' });
}

/**
 * Get last day of current month in YYYY-MM-DD format
 * Handles leap years automatically
 * @returns {string} Date in YYYY-MM-DD format
 */
function getLastDayOfCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Month + 1, day 0 = last day of current month
  const lastDay = new Date(year, month + 1, 0);

  return lastDay.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Builds Xero invoice objects from preview data
 * @param {Object} previewData - Invoice preview data
 * @param {Object} config - Invoice configuration with xeroInvoiceStatus
 * @returns {Array} Array of Xero invoice objects
 */
function buildXeroInvoices(previewData, config) {
  const invoices = [];
  const invoiceDate = getLastDayOfMonth(previewData.month);
  const dueDate = getLastDayOfCurrentMonth(); // Use current month last day
  const [year] = previewData.month.split('-');
  const monthName = getMonthName(previewData.month);

  for (const client of previewData.clients) {
    // Skip clients with no xero_customer_id
    if (!client.xeroCustomerId) {
      console.warn(`Skipping client ${client.clientId} - no xero_customer_id`);
      continue;
    }

    const lineItems = [];

    for (const ticket of client.tickets) {
      if (ticket.billableHours > 0 && ticket.nonBillableHours > 0) {
        // Mixed: Create two line items
        lineItems.push({
          description: `Ticket #${ticket.ticketId} - ${ticket.description} (Billable)`,
          quantity: ticket.billableHours,
          itemCode: 'Consulting Services'
          // unitAmount omitted - Xero uses item default rate
        });
        lineItems.push({
          description: `Ticket #${ticket.ticketId} - ${ticket.description} (Non-billable)`,
          quantity: ticket.nonBillableHours,
          unitAmount: 0,
          itemCode: 'Consulting Services'
        });
      } else if (ticket.billableHours > 0) {
        // Pure billable
        lineItems.push({
          description: `Ticket #${ticket.ticketId} - ${ticket.description}`,
          quantity: ticket.billableHours,
          itemCode: 'Consulting Services'
        });
      } else {
        // Pure non-billable
        lineItems.push({
          description: `Ticket #${ticket.ticketId} - ${ticket.description}`,
          quantity: ticket.nonBillableHours,
          unitAmount: 0,
          itemCode: 'Consulting Services'
        });
      }
    }

    // Skip clients with no line items
    if (lineItems.length === 0) {
      continue;
    }

    invoices.push({
      type: 'ACCREC',
      contact: { contactID: client.xeroCustomerId },
      date: invoiceDate,
      dueDate: dueDate,
      lineItems: lineItems,
      status: config.xeroInvoiceStatus,
      reference: `${monthName} ${year} Services`
    });
  }

  return invoices;
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

    // Query time entries with joins - include xero_customer_id
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
        c.xero_customer_id,
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

/**
 * POST /api/invoices/generate
 * Generates invoices and pushes them to Xero
 */
export const generateInvoices = async (req, res) => {
  const dbClient = await getClient();

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'ValidationError',
        message: errors.array()[0].msg
      });
    }

    const { month } = req.body;

    // Check if month already locked
    const isLocked = await InvoiceLock.isMonthLocked(`${month}-01`);
    if (isLocked) {
      return res.status(400).json({
        error: 'InvoiceLockError',
        message: `Month ${month} is already locked. Invoices have already been generated.`
      });
    }

    // Get preview data (reuse existing logic)
    const { startDate, endDate } = calculateMonthBoundaries(month);
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
        c.xero_customer_id,
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

    const clients = groupByClient(result.rows);
    const totalBillableHours = calculateTotalBillable(clients);

    // Check for missing descriptions
    const ticketsWithMissingDesc = [];
    clients.forEach(client => {
      client.tickets.forEach(ticket => {
        if (ticket.missingDescription) {
          ticketsWithMissingDesc.push(ticket.ticketId);
        }
      });
    });

    if (ticketsWithMissingDesc.length > 0) {
      const ticketList = ticketsWithMissingDesc.map(id => `#${id}`).join(', ');
      return res.status(400).json({
        error: 'ValidationError',
        message: `Cannot generate invoices. Missing descriptions for tickets: ${ticketList}`
      });
    }

    // Get Xero connection
    const connection = await XeroConnection.getActiveConnection();
    if (!connection) {
      return res.status(400).json({
        error: 'XeroConnectionError',
        message: 'Xero is not connected. Please connect to Xero in Settings before generating invoices.'
      });
    }

    // Create authenticated Xero client
    const xeroClient = await createAuthenticatedXeroClient({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token
    });

    // Get tenant ID (organization ID)
    const tenantId = connection.organization_id;

    // Verify "Consulting Services" item exists
    // Note: This is a simple check - in production you might want to cache this
    try {
      const itemsResponse = await xeroClient.accountingApi.getItems(tenantId, undefined, `Code=="Consulting Services"`);
      if (!itemsResponse.body.items || itemsResponse.body.items.length === 0) {
        return res.status(400).json({
          error: 'XeroSetupError',
          message: 'Xero item \'Consulting Services\' not found. Please create this item in your Xero organization: Settings > Products and Services > Add New Item. Set item code to \'Consulting Services\' and configure your hourly rate.'
        });
      }
    } catch (itemError) {
      console.error('Error verifying Consulting Services item:', itemError);
      return res.status(500).json({
        error: 'XeroApiError',
        message: 'Failed to verify Xero setup. Please try again or contact support.'
      });
    }

    // Fetch invoice configuration
    const config = await InvoiceConfig.getConfig();
    console.log(`Generating invoices with status: ${config.xeroInvoiceStatus}`);

    // Build invoice data
    const previewData = { month, clients };
    const xeroInvoices = buildXeroInvoices(previewData, config);

    if (xeroInvoices.length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'No invoices to generate. All clients must have a Xero customer ID.'
      });
    }

    // Begin database transaction
    await dbClient.query('BEGIN');

    const xeroInvoiceIds = [];
    const invoiceMetadata = [];

    // Push invoices to Xero
    for (let i = 0; i < xeroInvoices.length; i++) {
      const invoice = xeroInvoices[i];
      const clientData = clients[i]; // Corresponding client data

      try {
        const response = await xeroClient.accountingApi.createInvoices(
          tenantId,
          { invoices: [invoice] }
        );

        const xeroInvoice = response.body.invoices[0];
        xeroInvoiceIds.push(xeroInvoice.invoiceID); // Store invoice ID (GUID) for OnlineInvoice API endpoint

        // Store metadata for this invoice
        invoiceMetadata.push({
          clientId: clientData.clientId,
          clientName: clientData.clientName,
          xeroInvoiceId: xeroInvoice.invoiceID,
          hours: clientData.subtotalHours,
          lineItemCount: invoice.lineItems.length
        });
      } catch (xeroError) {
        await dbClient.query('ROLLBACK');

        // Handle specific Xero errors
        if (xeroError.statusCode === 429) {
          return res.status(429).set('Retry-After', '60').json({
            error: 'XeroApiError',
            message: 'Xero API rate limit exceeded. Please try again in 60 seconds.'
          });
        }

        if (xeroError.statusCode === 400) {
          const errorMessage = xeroError.message || xeroError.body?.message || '';
          if (errorMessage.toLowerCase().includes('contact')) {
            return res.status(400).json({
              error: 'XeroApiError',
              message: 'Invalid Xero customer ID for one or more clients. Please verify customer mappings in Xero.'
            });
          }
        }

        console.error('Xero API error:', xeroError);
        return res.status(500).json({
          error: 'XeroApiError',
          message: 'Failed to create invoices in Xero. Please try again or contact support.'
        });
      }
    }

    // Create invoice lock
    try {
      await InvoiceLock.create(`${month}-01`, xeroInvoiceIds, invoiceMetadata);
      await dbClient.query('COMMIT');
    } catch (lockError) {
      await dbClient.query('ROLLBACK');
      console.error('Failed to create invoice lock:', lockError);
      return res.status(500).json({
        error: 'DatabaseError',
        message: 'Failed to create invoice lock. Invoices may have been created in Xero but month was not locked. Please verify in Xero UI and contact support if manual cleanup is needed.'
      });
    }

    // Success response
    res.json({
      success: true,
      month,
      clientsInvoiced: xeroInvoices.length,
      totalBillableHours,
      xeroInvoiceIds,
      xeroInvoiceStatus: config.xeroInvoiceStatus,
      message: `Successfully generated ${xeroInvoices.length} invoices for ${getMonthName(month)} ${month.split('-')[0]}`
    });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error generating invoices:', error);
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to generate invoices. Please try again or contact support.'
    });
  } finally {
    dbClient.release();
  }
};

/**
 * GET /api/invoices/history
 * Returns list of all invoice locks with aggregated billable hours
 */
export const getInvoiceHistory = async (req, res) => {
  try {
    // Query invoice locks with metadata
    const result = await query(
      `SELECT
        il.id,
        il.month,
        il.locked_at,
        il.xero_invoice_ids,
        il.invoice_metadata
      FROM invoice_locks il
      ORDER BY il.month DESC`
    );

    // Transform data to match frontend expectations
    const history = result.rows.map(row => ({
      id: row.id,
      month: row.month.toISOString().substring(0, 7), // Convert YYYY-MM-DD to YYYY-MM
      lockedAt: row.locked_at,
      xeroInvoiceIds: row.xero_invoice_ids || [], // JSONB already parsed by pg library
      invoices: row.invoice_metadata || [] // Individual invoice details
    }));

    res.json(history);
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to retrieve invoice history'
    });
  }
};

/**
 * DELETE /api/invoices/:id/invoice/:invoiceId
 * Removes a specific invoice from a lock
 */
export const deleteInvoiceFromLock = async (req, res) => {
  try {
    const { id, invoiceId } = req.params;

    // Validate IDs
    const lockId = parseInt(id, 10);
    if (isNaN(lockId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid lock ID'
      });
    }

    if (!invoiceId || typeof invoiceId !== 'string') {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid invoice ID'
      });
    }

    // Remove invoice from lock
    const result = await InvoiceLock.removeInvoiceFromLock(lockId, invoiceId);

    if (!result) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Invoice lock not found'
      });
    }

    if (result.deleted) {
      // Entire lock was deleted because no invoices remained
      res.json({
        success: true,
        lockDeleted: true,
        message: 'Last invoice removed. Invoice lock has been deleted.'
      });
    } else {
      // Lock was updated with remaining invoices
      res.json({
        success: true,
        lockDeleted: false,
        message: 'Invoice removed from lock successfully'
      });
    }
  } catch (error) {
    console.error('Error removing invoice from lock:', error);
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to remove invoice from lock'
    });
  }
};

/**
 * DELETE /api/invoices/:id
 * Deletes an invoice lock to allow re-invoicing
 */
export const deleteInvoiceLock = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid invoice ID'
      });
    }

    // Delete the invoice lock
    const result = await query(
      'DELETE FROM invoice_locks WHERE id = $1 RETURNING id, month',
      [invoiceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Invoice lock not found'
      });
    }

    const deletedLock = result.rows[0];
    const monthStr = deletedLock.month.toISOString().substring(0, 7);

    res.json({
      success: true,
      message: `Invoice lock for ${monthStr} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting invoice lock:', error);
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to delete invoice lock'
    });
  }
};
