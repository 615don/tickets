/**
 * Xero service layer
 * Centralizes Xero client instantiation and API interactions
 */

import { XeroClient } from 'xero-node';
import xeroConfig from '../config/xero.js';

/**
 * Create a new Xero client instance
 * Factory function to reduce duplication across controllers
 * @returns {XeroClient} Configured Xero client
 */
export function createXeroClient() {
  return new XeroClient({
    clientId: xeroConfig.clientId,
    clientSecret: xeroConfig.clientSecret,
    redirectUris: [xeroConfig.redirectUri],
    scopes: xeroConfig.scopes,
  });
}

/**
 * Create Xero client with existing token set
 * Used for API calls with stored credentials
 * @param {Object} tokenSet - Token set with access_token, refresh_token
 * @returns {Promise<XeroClient>} Configured Xero client with tokens
 */
export async function createAuthenticatedXeroClient(tokenSet) {
  const xero = createXeroClient();

  await xero.setTokenSet({
    access_token: tokenSet.access_token,
    refresh_token: tokenSet.refresh_token,
    expires_in: 1800, // 30 minutes
  });

  return xero;
}
