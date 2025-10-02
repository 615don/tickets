import { validationResult } from 'express-validator';
import { Contact } from '../models/Contact.js';
import { Client } from '../models/Client.js';
import { Ticket } from '../models/Ticket.js';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

/**
 * Reusable validation middleware for common patterns
 * These can be used independently or chained together
 */

/**
 * Validates that required fields are present in request body
 * @param {string[]} fields - Array of required field names
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/tickets', validateRequired(['clientId', 'contactId']), handler);
 */
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      // Check nested fields (e.g., 'timeEntry.duration')
      const parts = field.split('.');
      let value = req.body;

      for (const part of parts) {
        value = value?.[part];
        if (value === undefined || value === null || value === '') {
          missing.push(field);
          break;
        }
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validates field types in request body
 * @param {Object} typeMap - Map of field names to expected types ('string', 'number', 'boolean', 'object', 'array', 'integer')
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/tickets', validateTypes({ clientId: 'integer', description: 'string' }), handler);
 */
export const validateTypes = (typeMap) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, expectedType] of Object.entries(typeMap)) {
      const value = req.body[field];

      // Skip validation if field is not present (use validateRequired for presence)
      if (value === undefined || value === null) {
        continue;
      }

      let actualType = typeof value;

      // Special handling for arrays
      if (expectedType === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        }
        continue;
      }

      // Special handling for integers
      if (expectedType === 'integer') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          errors.push(`${field} must be an integer`);
        }
        continue;
      }

      if (actualType !== expectedType) {
        errors.push(`${field} must be a ${expectedType}, got ${actualType}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: errors.join('; ')
      });
    }

    next();
  };
};

/**
 * Validates that a contact belongs to the specified client
 * Expects req.body to contain both clientId and contactId
 * Attaches validated contact object to req.validatedContact
 *
 * @example
 * router.post('/tickets', validateContactBelongsToClient, handler);
 */
export const validateContactBelongsToClient = async (req, res, next) => {
  try {
    const { clientId, contactId } = req.body;

    // Check if contact exists
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Contact not found'
      });
    }

    // Verify contact belongs to client
    if (contact.clientId !== clientId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Contact does not belong to specified client'
      });
    }

    // Attach validated contact to request for use in route handler
    req.validatedContact = contact;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that a client exists
 * Expects req.body.clientId or req.params.clientId
 * Attaches validated client object to req.validatedClient
 *
 * @example
 * router.post('/tickets', validateClientExists, handler);
 */
export const validateClientExists = async (req, res, next) => {
  try {
    const clientId = req.body.clientId || req.params.clientId;

    if (!clientId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'clientId is required'
      });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Client with ID ${clientId} not found`
      });
    }

    // Attach validated client to request
    req.validatedClient = client;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that a contact exists
 * Expects req.body.contactId or req.params.contactId
 * Attaches validated contact object to req.validatedContact
 *
 * @example
 * router.post('/tickets', validateContactExists, handler);
 */
export const validateContactExists = async (req, res, next) => {
  try {
    const contactId = req.body.contactId || req.params.contactId;

    if (!contactId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'contactId is required'
      });
    }

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Contact with ID ${contactId} not found`
      });
    }

    // Attach validated contact to request
    req.validatedContact = contact;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that a ticket exists
 * Expects req.params.id or req.body.ticketId
 * Attaches validated ticket object to req.validatedTicket
 *
 * @example
 * router.put('/tickets/:id', validateTicketExists, handler);
 */
export const validateTicketExists = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.body.ticketId;

    if (!ticketId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'ticketId is required'
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Ticket with ID ${ticketId} not found`
      });
    }

    // Attach validated ticket to request
    req.validatedTicket = ticket;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates numeric parameters (e.g., IDs in URL params)
 * @param {string[]} params - Array of parameter names to validate
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/tickets/:id', validateNumericParams(['id']), handler);
 */
export const validateNumericParams = (params) => {
  return (req, res, next) => {
    const errors = [];

    for (const param of params) {
      const value = req.params[param];

      if (value === undefined) {
        continue;
      }

      const numValue = Number(value);
      if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
        errors.push(`${param} must be a positive integer`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: errors.join('; ')
      });
    }

    next();
  };
};

/**
 * Validates enum values
 * @param {string} field - Field name to validate
 * @param {string[]} allowedValues - Array of allowed values
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/tickets', validateEnum('state', ['open', 'closed']), handler);
 */
export const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    const value = req.body[field] || req.query[field];

    // Skip if field not present
    if (value === undefined || value === null) {
      return next();
    }

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `${field} must be one of: ${allowedValues.join(', ')}`
      });
    }

    next();
  };
};
