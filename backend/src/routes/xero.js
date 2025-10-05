import express from 'express';
import {
  initiateOAuth,
  handleCallback,
  getStatus,
  disconnect,
  getOnlineInvoiceUrl
} from '../controllers/xeroController.js';
import { requireAuth } from '../middleware/auth.js';
import { oauthRateLimiter } from '../middleware/rateLimiter.js';
import { validateOAuthCallback } from '../middleware/validation.js';

const router = express.Router();

// GET /api/xero/connect - Initiate OAuth flow (requires auth + rate limiting)
router.get('/connect', oauthRateLimiter, requireAuth, initiateOAuth);

// GET /api/xero/callback - OAuth callback (public - Xero redirects here, rate limited + validated)
router.get('/callback', oauthRateLimiter, validateOAuthCallback, handleCallback);

// GET /api/xero/status - Get connection status (requires auth)
router.get('/status', requireAuth, getStatus);

// POST /api/xero/disconnect - Disconnect Xero (requires auth)
router.post('/disconnect', requireAuth, disconnect);

// GET /api/xero/invoices/:invoiceId/online-url - Get online invoice URL (requires auth)
router.get('/invoices/:invoiceId/online-url', requireAuth, getOnlineInvoiceUrl);

export default router;
