// Debug endpoints for troubleshooting
// Only active when DEBUG_SESSIONS environment variable is set to 'true'

import express from 'express';

const router = express.Router();

/**
 * GET /api/debug/session
 *
 * Returns current session state for debugging cross-origin authentication issues
 *
 * Only available when DEBUG_SESSIONS=true environment variable is set
 * Returns 404 when debug mode is disabled for security
 *
 * Response includes:
 * - Session metadata (sessionID, userId, userEmail if authenticated)
 * - Cookie configuration (maxAge, expires, domain, sameSite, secure)
 * - Request metadata (origin, IP address, user-agent)
 */
router.get('/session', (req, res) => {
  // Only enable debug endpoint when explicitly configured
  if (process.env.DEBUG_SESSIONS !== 'true') {
    return res.status(404).json({
      error: 'Not found',
      message: 'This endpoint is only available in debug mode'
    });
  }

  // Extract session information
  const sessionInfo = {
    // Session state
    hasSession: !!req.session,
    sessionID: req.sessionID || null,
    userId: req.session?.userId || null,
    userEmail: req.session?.userEmail || null,
    authenticated: !!(req.session?.userId),

    // Cookie configuration
    cookieConfig: {
      maxAge: req.session?.cookie?.maxAge || null,
      expires: req.session?.cookie?.expires || null,
      domain: req.session?.cookie?.domain || null,
      sameSite: req.session?.cookie?.sameSite || null,
      secure: req.session?.cookie?.secure || false,
      httpOnly: req.session?.cookie?.httpOnly || false,
    },

    // Request metadata
    request: {
      origin: req.headers.origin || null,
      referer: req.headers.referer || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      hasCookieHeader: !!req.headers.cookie,
    },

    // Timestamp
    timestamp: new Date().toISOString(),
  };

  res.json(sessionInfo);
});

export default router;
