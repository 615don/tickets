/**
 * Input validation middleware
 * Validates and sanitizes request parameters
 */

import { validationResult } from 'express-validator';
import xeroConfig from '../config/xero.js';

/**
 * Generic validation middleware for express-validator
 * Processes validation results and returns errors if any
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validate OAuth callback parameters
 */
export const validateOAuthCallback = (req, res, next) => {
  const { code, state } = req.query;

  // Validate code parameter
  if (code) {
    // Code should be alphanumeric with possible dashes/underscores
    if (typeof code !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(code)) {
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=invalid_code`);
    }

    // Reasonable length check (Xero codes are typically 100-200 chars)
    if (code.length > 500) {
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=invalid_code`);
    }
  }

  // Validate state parameter
  if (state) {
    // State should be hex string (64 chars for our 32-byte random)
    if (typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state)) {
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=invalid_state`);
    }
  }

  next();
};

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 */
export const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') return '';

  // Trim whitespace
  let sanitized = str.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required fields in request body
 * Supports nested fields with dot notation (e.g., 'timeEntry.duration')
 */
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const errors = [];

    for (const field of fields) {
      const keys = field.split('.');
      let value = req.body;

      for (const key of keys) {
        value = value?.[key];
      }

      if (value === undefined || value === null || value === '') {
        errors.push({ field, message: `${field} is required` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

/**
 * Validate numeric URL parameters
 */
export const validateNumericParams = (params) => {
  return (req, res, next) => {
    const errors = [];

    for (const param of params) {
      const value = req.params[param];
      if (value && (isNaN(value) || !Number.isInteger(Number(value)))) {
        errors.push({ param, message: `${param} must be a valid integer` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

/**
 * Validate enum values in query parameters
 */
export const validateEnum = (param, allowedValues) => {
  return (req, res, next) => {
    const value = req.query[param];

    if (value && !allowedValues.includes(value)) {
      return res.status(400).json({
        errors: [{
          param,
          message: `${param} must be one of: ${allowedValues.join(', ')}`
        }]
      });
    }

    next();
  };
};

/**
 * Validate that contact belongs to client
 * Requires clientId and contactId in request body
 */
export const validateContactBelongsToClient = async (req, res, next) => {
  const { clientId, contactId } = req.body;

  if (!clientId || !contactId) {
    return next();
  }

  try {
    const { default: pool } = await import('../db.js');
    const result = await pool.query(
      'SELECT id FROM contacts WHERE id = $1 AND client_id = $2',
      [contactId, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        errors: [{ message: 'Contact does not belong to the specified client' }]
      });
    }

    next();
  } catch (error) {
    console.error('Error validating contact:', error);
    return res.status(500).json({ error: 'Validation error' });
  }
};
