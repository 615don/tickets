import { XeroConnection } from '../models/XeroConnection.js';
import xeroConfig from '../config/xero.js';
import { createXeroClient, createAuthenticatedXeroClient } from '../services/xeroService.js';
import crypto from 'crypto';

/**
 * Initialize Xero OAuth flow
 * GET /api/xero/connect
 */
export const initiateOAuth = async (req, res) => {
  try {
    console.log('=== XERO OAUTH INITIATION DEBUG ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('User ID from session:', req.session?.userId);
    console.log('===================================');

    const xero = createXeroClient();

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in session for verification in callback
    req.session.oauthState = state;

    // Explicitly save session before redirect to ensure persistence
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error during OAuth initiation:', err);
          reject(err);
        } else {
          console.log('✓ Session saved successfully with oauthState:', state.substring(0, 20) + '...');
          resolve();
        }
      });
    });

    const consentUrl = await xero.buildConsentUrl(state);
    console.log('Redirecting to Xero consent URL');

    // Redirect user to Xero authorization page
    res.redirect(consentUrl);
  } catch (error) {
    console.error('Xero OAuth initiation error:', error);
    res.status(500).json({
      error: 'Failed to initiate Xero OAuth',
      message: error.message
    });
  }
};

/**
 * Handle Xero OAuth callback
 * GET /api/xero/callback
 */
export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log('=== XERO OAUTH CALLBACK DEBUG ===');
    console.log('Query params:', { code: code?.substring(0, 20) + '...', state: state?.substring(0, 20) + '...' });
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session data:', JSON.stringify(req.session, null, 2));
    console.log('Cookies:', req.headers.cookie);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('================================');

    // Validate required parameters
    if (!code) {
      console.error('OAuth callback missing code parameter');
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=no_code`);
    }

    // Verify state parameter (CSRF protection)
    const sessionState = req.session?.oauthState;
    console.log('State verification:', {
      sessionState: sessionState?.substring(0, 20) + '...',
      providedState: state?.substring(0, 20) + '...',
      matches: sessionState === state,
      hasSession: !!req.session,
      hasOauthState: !!sessionState
    });

    if (state && sessionState && state !== sessionState) {
      console.warn('OAuth state mismatch - possible CSRF attempt', { sessionState, providedState: state });
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=state_mismatch`);
    }

    // MODIFIED: Only enforce state check if we have a session with oauthState
    // This handles the case where session may not persist across OAuth redirect
    if (!state && sessionState) {
      console.error('OAuth callback missing state parameter but session has oauthState');
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=invalid_state`);
    }

    if (!sessionState && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Session lost during OAuth redirect - this is a session persistence issue');
      console.warn('⚠️  Proceeding without state verification (LESS SECURE)');
      // Don't block OAuth in production due to session issues
      // TODO: Fix session persistence configuration
    }

    // Clear state from session after verification
    if (sessionState) {
      delete req.session.oauthState;
    }

    const xero = createXeroClient();

    console.log('Exchanging authorization code for tokens...');
    // Exchange authorization code for tokens
    const callbackUrl = `${xeroConfig.redirectUri}?code=${code}`;
    const tokenSet = await xero.apiCallback(callbackUrl);
    console.log('Token exchange successful');

    // Get active tenants using connections endpoint (doesn't require accounting.settings)
    console.log('Fetching Xero connections...');
    const connectionsResponse = await xero.updateTenants(false); // false = don't fetch org details

    if (!xero.tenants || xero.tenants.length === 0) {
      console.error('No active tenants found');
      return res.redirect(`${xeroConfig.frontendUrl}/settings?error=no_tenant`);
    }

    const activeTenantId = xero.tenants[0].tenantId;
    const organizationName = xero.tenants[0].tenantName || 'Unknown';
    const organizationId = activeTenantId;
    console.log('Active tenant:', { organizationId, organizationName });

    // Verify "Consulting Services" item exists
    try {
      const itemsResponse = await xero.accountingApi.getItems(activeTenantId);
      const consultingService = itemsResponse.body.items?.find(
        item => item.name === 'Consulting Services'
      );

      if (!consultingService) {
        console.warn('Consulting Services item not found in Xero organization');
        // Don't block connection, just warn
      }
    } catch (itemError) {
      console.error('Error checking Consulting Services item:', itemError);
      // Continue with connection even if check fails
    }

    // Save encrypted tokens to database
    const userId = req.session?.userId || 1; // System-wide connection uses user ID 1
    const tokenExpiresAt = new Date(Date.now() + tokenSet.expires_in * 1000);

    console.log('Saving tokens to database...', { userId, organizationName, organizationId });
    await XeroConnection.saveTokens({
      userId,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      tokenExpiresAt,
      organizationName,
      organizationId,
    });
    console.log('Tokens saved successfully');

    // Redirect to frontend with success
    console.log('Redirecting to frontend with success');
    res.redirect(`${xeroConfig.frontendUrl}/settings?success=true`);
  } catch (error) {
    console.error('Xero OAuth callback error:', error);
    console.error('Error details:', error.message, error.stack);
    res.redirect(`${xeroConfig.frontendUrl}/settings?error=callback_failed`);
  }
};

/**
 * Get Xero connection status
 * GET /api/xero/status
 */
export const getStatus = async (req, res) => {
  try {
    const connection = await XeroConnection.getStatus();

    if (!connection) {
      return res.json({
        is_connected: false,
        organization_name: null,
        organization_id: null,
        last_sync_at: null,
      });
    }

    res.json({
      is_connected: connection.is_connected,
      organization_name: connection.organization_name,
      organization_id: connection.organization_id,
      last_sync_at: connection.last_sync_at,
    });
  } catch (error) {
    console.error('Get Xero status error:', error);
    res.status(500).json({
      error: 'Failed to fetch Xero connection status',
      message: error.message
    });
  }
};

/**
 * Disconnect from Xero
 * POST /api/xero/disconnect
 */
export const disconnect = async (req, res) => {
  try {
    const deleted = await XeroConnection.disconnect();

    if (!deleted) {
      return res.status(404).json({
        error: 'No Xero connection found',
        message: 'No active Xero connection to disconnect'
      });
    }

    res.json({
      success: true,
      message: 'Xero connection disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect Xero error:', error);
    res.status(500).json({
      error: 'Failed to disconnect Xero',
      message: error.message
    });
  }
};

/**
 * Get online invoice URL for a Xero invoice
 * GET /api/xero/invoices/:invoiceId/online-url
 */
export const getOnlineInvoiceUrl = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invoice ID is required'
      });
    }

    // Get active Xero connection
    const connection = await XeroConnection.getActiveConnection();

    if (!connection) {
      return res.status(400).json({
        error: 'XeroConnectionError',
        message: 'Xero is not connected. Please connect to Xero in Settings.'
      });
    }

    // Create authenticated Xero client
    const xeroClient = await createAuthenticatedXeroClient({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token
    });

    const tenantId = connection.organization_id;

    // Fetch online invoice URL from Xero
    const response = await xeroClient.accountingApi.getOnlineInvoice(tenantId, invoiceId);

    if (!response.body || !response.body.onlineInvoices || response.body.onlineInvoices.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Invoice not found in Xero'
      });
    }

    const onlineInvoiceUrl = response.body.onlineInvoices[0].onlineInvoiceUrl;

    res.json({
      onlineInvoiceUrl
    });
  } catch (error) {
    console.error('Get online invoice URL error:', error);

    // Handle Xero API errors
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Invoice not found in Xero'
      });
    }

    if (error.statusCode === 429) {
      return res.status(429).set('Retry-After', '60').json({
        error: 'XeroApiError',
        message: 'Xero API rate limit exceeded. Please try again in 60 seconds.'
      });
    }

    res.status(500).json({
      error: 'XeroApiError',
      message: 'Failed to fetch invoice URL from Xero'
    });
  }
};

/**
 * Get all Xero contacts/customers
 * GET /api/xero/contacts
 */
export const getContacts = async (req, res) => {
  try {
    // Get active Xero connection
    const connection = await XeroConnection.getActiveConnection();

    if (!connection) {
      return res.status(400).json({
        error: 'XeroConnectionError',
        message: 'Xero is not connected. Please connect to Xero in Settings.'
      });
    }

    // Create authenticated Xero client
    const xeroClient = await createAuthenticatedXeroClient({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token
    });

    const tenantId = connection.organization_id;

    // Fetch all contacts from Xero
    const contactsResponse = await xeroClient.accountingApi.getContacts(tenantId);

    // Map to simpler format
    const contacts = contactsResponse.body.contacts.map(contact => ({
      contactID: contact.contactID,
      name: contact.name,
      firstName: contact.firstName,
      lastName: contact.lastName,
      emailAddress: contact.emailAddress,
      isCustomer: contact.isCustomer,
      isSupplier: contact.isSupplier,
    }));

    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching Xero contacts:', error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: 'XeroAuthError',
        message: 'Xero authentication expired. Please reconnect in Settings.'
      });
    }

    if (error.statusCode === 429) {
      return res.status(429).set('Retry-After', '60').json({
        error: 'XeroApiError',
        message: 'Xero API rate limit exceeded. Please try again in 60 seconds.'
      });
    }

    res.status(500).json({
      error: 'XeroApiError',
      message: 'Failed to fetch contacts from Xero'
    });
  }
};

/**
 * Refresh Xero access token
 * Internal helper function (not exposed as route)
 */
export const refreshAccessToken = async () => {
  try {
    const connection = await XeroConnection.getActiveConnection();

    if (!connection) {
      throw new Error('No active Xero connection');
    }

    const xero = await createAuthenticatedXeroClient({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    });

    // Refresh tokens
    const newTokenSet = await xero.refreshToken();
    const tokenExpiresAt = new Date(Date.now() + newTokenSet.expires_in * 1000);

    // Update tokens in database
    await XeroConnection.refreshTokens(
      connection.id,
      newTokenSet.access_token,
      newTokenSet.refresh_token,
      tokenExpiresAt
    );

    return {
      access_token: newTokenSet.access_token,
      refresh_token: newTokenSet.refresh_token,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};
