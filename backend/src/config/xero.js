/**
 * Xero configuration module
 * Centralizes access to Xero environment variables
 */

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUri: process.env.XERO_REDIRECT_URI,
  scopes: process.env.XERO_SCOPES ? process.env.XERO_SCOPES.split(' ') : [],
  encryptionKey: process.env.ENCRYPTION_KEY,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
};

/**
 * Validate Xero configuration
 * @throws {Error} If required environment variables are missing
 */
export function validateXeroConfig() {
  const required = ['clientId', 'clientSecret', 'redirectUri', 'encryptionKey'];
  const missing = required.filter(key => !xeroConfig[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Xero configuration: ${missing.map(k => k.toUpperCase()).join(', ')}`
    );
  }

  if (xeroConfig.encryptionKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  if (xeroConfig.scopes.length === 0) {
    throw new Error('XERO_SCOPES must be specified');
  }
}

export default xeroConfig;
