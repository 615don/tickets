import { Ticket } from '../models/Ticket.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { Contact } from '../models/Contact.js';
import { getClient } from '../config/database.js';

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
