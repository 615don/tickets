import { Ticket } from '../models/Ticket.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { Contact } from '../models/Contact.js';
import { InvoiceLock } from '../models/InvoiceLock.js';
import { getClient } from '../config/database.js';
import { parseTimeEntry } from '@tickets/shared';

// GET /api/tickets - Get all tickets with optional filters
export const getAllTickets = async (req, res) => {
  try {
    const { state, client_id } = req.query;

    const filters = {};
    if (state) {
      filters.state = state;
    }
    if (client_id) {
      filters.clientId = parseInt(client_id, 10);
    }

    const tickets = await Ticket.findAll(filters);

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};

// GET /api/tickets/:id - Get single ticket with time entries
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Ticket with ID ${id} not found`
      });
    }

    // Get time entries for ticket
    const timeEntries = await TimeEntry.findByTicketId(id);

    // Include time entries in response
    const ticketWithEntries = {
      ...ticket,
      timeEntries
    };

    res.status(200).json(ticketWithEntries);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};

// POST /api/tickets - Create new ticket with initial time entry
export const createTicket = async (req, res) => {
  try {
    const { clientId, contactId, description, notes, timeEntry } = req.body;

    // Validate required fields
    if (!clientId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'clientId is required'
      });
    }

    if (!contactId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'contactId is required'
      });
    }

    if (!timeEntry || !timeEntry.duration) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'timeEntry with duration is required'
      });
    }

    // Validate contact belongs to client
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Contact not found'
      });
    }

    // Note: Contact model returns snake_case (client_id) not camelCase
    const contactClientId = contact.clientId || contact.client_id;
    if (contactClientId !== clientId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Contact does not belong to specified client'
      });
    }

    // Use transaction to ensure atomic ticket + time entry creation
    const dbClient = await getClient();

    try {
      await dbClient.query('BEGIN');

      // Create ticket
      const ticket = await Ticket.create({
        clientId,
        contactId,
        description: description || null,
        notes: notes || null,
        state: 'open'
      });

      // Create initial time entry
      const workDate = timeEntry.workDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const billable = timeEntry.billable !== undefined ? timeEntry.billable : true;

      await TimeEntry.create({
        ticketId: ticket.id,
        workDate,
        duration: timeEntry.duration,
        billable
      });

      await dbClient.query('COMMIT');

      // Return created ticket
      res.status(201).json(ticket);

    } catch (dbError) {
      await dbClient.query('ROLLBACK');
      throw dbError;
    } finally {
      dbClient.release();
    }

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};

// PUT /api/tickets/:id - Update ticket
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, notes, state } = req.body;

    // Validate at least one field is provided
    if (description === undefined && notes === undefined && state === undefined) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'At least one field (description, notes, state) must be provided'
      });
    }

    // Validate state if provided
    if (state !== undefined) {
      const validStates = ['open', 'closed'];
      if (!validStates.includes(state)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: `Invalid state: ${state}. Must be one of: ${validStates.join(', ')}`
        });
      }
    }

    // Check if ticket exists first
    const existingTicket = await Ticket.findById(id);

    if (!existingTicket) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Ticket with ID ${id} not found`
      });
    }

    // Handle state transitions with close/re-open logic
    if (state !== undefined) {
      if (state === 'closed') {
        // Closing: Set closed_at timestamp (idempotent)
        await Ticket.close(id);
      } else if (state === 'open') {
        // Re-opening: Validate 7-day window if ticket is currently closed
        if (existingTicket.state === 'closed') {
          const canReopen = Ticket.canReopen(existingTicket.closedAt);
          if (!canReopen) {
            return res.status(400).json({
              error: 'ValidationError',
              message: 'Cannot re-open tickets closed more than 7 days ago'
            });
          }
          await Ticket.reopen(id);
        }
        // If already open, no special handling needed
      }
    }

    // Update description/notes if provided
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length > 0) {
      await Ticket.update(id, updates);
    }

    // Return updated ticket
    const ticket = await Ticket.findById(id);
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);

    // Handle "Ticket not found" error from model
    if (error.message === 'Ticket not found') {
      return res.status(404).json({
        error: 'NotFound',
        message: `Ticket with ID ${req.params.id} not found`
      });
    }

    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};

// POST /api/tickets/:id/time-entries - Add time entry to ticket
export const addTimeEntry = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { workDate, duration, billable = true } = req.body;

    // Validate required fields
    if (!workDate) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'workDate is required'
      });
    }

    if (!duration) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'duration is required'
      });
    }

    // Verify ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Ticket with ID ${ticketId} not found`
      });
    }

    // Check if month is locked
    const isLocked = await InvoiceLock.isMonthLocked(workDate);
    if (isLocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot add time entries for locked month'
      });
    }

    // Parse duration
    const parseResult = parseTimeEntry(duration);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error
      });
    }

    // Create time entry
    const timeEntry = await TimeEntry.create({
      ticketId,
      workDate,
      duration,
      billable
    });

    // Update ticket timestamp
    await Ticket.touch(ticketId);

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Add time entry error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};
