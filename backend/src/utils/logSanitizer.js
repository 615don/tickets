/**
 * Log Sanitization Utility
 *
 * Provides functions to sanitize error logs and prevent sensitive data from being logged in production.
 * Masks passwords, tokens, session IDs, and other sensitive fields while preserving useful debugging information.
 */

// Sensitive field names that should be masked in logs
const SENSITIVE_FIELDS = [
  'password',
  'currentPassword',
  'newPassword',
  'oldPassword',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'api_key',
  'apiKey',
  'secret',
  'sessionId',
  'session_id',
  'cookie',
  'authorization',
  'csrf',
  'csrfToken'
];

// Regex patterns for sensitive data in strings
const SENSITIVE_PATTERNS = [
  { pattern: /password['":\s=]+[\w\W]{0,100}/gi, replacement: 'password=***MASKED***' },
  { pattern: /token['":\s=]+[\w\W]{0,100}/gi, replacement: 'token=***MASKED***' },
  { pattern: /authorization['":\s=]+[\w\W]{0,100}/gi, replacement: 'authorization=***MASKED***' },
  { pattern: /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, replacement: 'Bearer ***MASKED***' }
];

/**
 * Check if we're in production environment
 * @returns {boolean} True if in production
 */
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Mask a sensitive value with asterisks
 * @param {*} value - Value to mask
 * @returns {string} Masked value
 */
const maskValue = (value) => {
  if (value === null || value === undefined) return '***NULL***';
  if (typeof value === 'string' && value.length === 0) return '***EMPTY***';
  return '***MASKED***';
};

/**
 * Recursively sanitize an object by masking sensitive fields
 * @param {*} obj - Object to sanitize
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @returns {*} Sanitized copy of the object
 */
const sanitizeObject = (obj, depth = 0) => {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH_REACHED]';

  // Handle null and undefined
  if (obj === null || obj === undefined) return obj;

  // Handle primitive types
  if (typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if field name is sensitive (case-insensitive)
    const isSensitive = SENSITIVE_FIELDS.some(
      field => key.toLowerCase().includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = maskValue(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Sanitize a string by masking sensitive patterns
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  let sanitized = str;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
};

/**
 * Sanitize error object for safe logging
 * @param {Error} error - Error object to sanitize
 * @returns {Object} Sanitized error information
 */
const sanitizeError = (error) => {
  if (!error) return null;

  // In development, return full error details
  if (!isProduction()) {
    return {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    };
  }

  // In production, return minimal error info
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    name: error.name || 'Error'
    // Note: stack trace omitted in production for security
  };
};

/**
 * Sanitize request body for safe logging
 * @param {Object} body - Request body to sanitize
 * @returns {Object} Sanitized request body
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  // In development, only mask sensitive fields
  if (!isProduction()) {
    return sanitizeObject(body);
  }

  // In production, be more restrictive - only log non-sensitive fields
  const sanitized = sanitizeObject(body);

  // Remove any remaining potentially sensitive data
  delete sanitized.body;

  return sanitized;
};

/**
 * Safe console.error replacement that sanitizes data before logging
 * @param {string} message - Log message
 * @param {*} data - Data to log (optional)
 */
export const safeError = (message, data = null) => {
  if (!isProduction()) {
    // In development, log everything (but still sanitize objects)
    if (data) {
      if (data instanceof Error) {
        console.error(message, sanitizeError(data));
      } else if (typeof data === 'object') {
        console.error(message, sanitizeObject(data));
      } else if (typeof data === 'string') {
        console.error(message, sanitizeString(data));
      } else {
        console.error(message, data);
      }
    } else {
      console.error(message);
    }
  } else {
    // In production, only log the message and error code/type
    if (data instanceof Error) {
      const sanitized = sanitizeError(data);
      console.error(message, { code: sanitized.code, type: sanitized.name });
    } else {
      // Don't log data objects in production, only the message
      console.error(message);
    }
  }
};

/**
 * Safe console.log replacement for development debugging
 * @param {string} message - Log message
 * @param {*} data - Data to log (optional)
 */
export const safeLog = (message, data = null) => {
  // Only log in development
  if (!isProduction()) {
    if (data) {
      if (typeof data === 'object' && !(data instanceof Error)) {
        console.log(message, sanitizeObject(data));
      } else if (typeof data === 'string') {
        console.log(message, sanitizeString(data));
      } else {
        console.log(message, data);
      }
    } else {
      console.log(message);
    }
  }
  // In production, don't log anything (use proper logging service instead)
};

// Export individual utility functions for testing
export const _internal = {
  isProduction,
  maskValue,
  sanitizeObject,
  sanitizeString,
  sanitizeError,
  sanitizeRequestBody,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS
};
