// Session debugging middleware
// Logs detailed session information for troubleshooting cross-origin authentication issues
// Only active when DEBUG_SESSIONS environment variable is set to 'true'

/**
 * Middleware that logs session-related information for debugging
 *
 * Logs include:
 * - Request metadata (timestamp, method, path, origin)
 * - Session state (sessionID, userId, hasSession)
 * - Cookie information (header presence, not full values for security)
 * - Session configuration (maxAge, expires)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const sessionDebugMiddleware = (req, res, next) => {
  // Only log if DEBUG_SESSIONS environment variable is explicitly set to 'true'
  if (process.env.DEBUG_SESSIONS !== 'true') {
    return next();
  }

  // Extract session information safely
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.headers.origin || 'none',
    sessionID: req.sessionID || 'none',
    userId: req.session?.userId || 'none',
    userEmail: req.session?.userEmail || 'none',
    hasSession: !!req.session,
    cookieHeaderPresent: !!req.headers.cookie,
    // Only log first 100 chars of cookie header for security
    cookieHeaderPreview: req.headers.cookie ? req.headers.cookie.substring(0, 100) + '...' : 'none',
    sessionAge: req.session?.cookie?.maxAge || 'none',
    sessionExpires: req.session?.cookie?.expires || 'none',
  };

  // Use console.log (not console.error) to avoid alarming in logs
  console.log('[SESSION DEBUG]', JSON.stringify(debugInfo, null, 2));

  next();
};
