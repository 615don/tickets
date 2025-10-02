import { query, getClient } from '../config/database.js';
import xeroConfig from '../config/xero.js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text in format: iv:encrypted
 */
function encrypt(text) {
  if (!text) return null;

  if (!xeroConfig.encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  const keyHex = xeroConfig.encryptionKey;
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts text encrypted with AES-256-CBC
 * @param {string} text - Encrypted text in format: iv:encrypted
 * @returns {string} Decrypted text
 */
function decrypt(text) {
  if (!text) return null;

  if (!xeroConfig.encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(xeroConfig.encryptionKey, 'hex');
  const parts = text.split(':');

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export const XeroConnection = {
  /**
   * Save or update Xero tokens for a user
   * @param {Object} params - Connection parameters
   * @param {number} params.userId - User ID
   * @param {string} params.accessToken - Xero access token
   * @param {string} params.refreshToken - Xero refresh token
   * @param {Date} params.tokenExpiresAt - Token expiration timestamp
   * @param {string} params.organizationName - Xero organization name
   * @param {string} params.organizationId - Xero organization ID
   * @returns {Object} Connection record
   */
  async saveTokens({ userId, accessToken, refreshToken, tokenExpiresAt, organizationName, organizationId }) {
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);

    const result = await query(`
      INSERT INTO xero_connections (
        user_id,
        organization_name,
        organization_id,
        access_token,
        refresh_token,
        token_expires_at,
        connected_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        organization_name = EXCLUDED.organization_name,
        organization_id = EXCLUDED.organization_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        updated_at = NOW()
      RETURNING id, user_id, organization_name, organization_id, token_expires_at, connected_at, last_sync_at, updated_at
    `, [userId, organizationName, organizationId, encryptedAccessToken, encryptedRefreshToken, tokenExpiresAt]);

    return result.rows[0];
  },

  /**
   * Get active connection for system (first user's connection)
   * @returns {Object|null} Connection with decrypted tokens or null
   */
  async getActiveConnection() {
    const result = await query(`
      SELECT
        id,
        user_id,
        organization_name,
        organization_id,
        access_token,
        refresh_token,
        token_expires_at,
        connected_at,
        last_sync_at,
        updated_at
      FROM xero_connections
      ORDER BY id ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const connection = result.rows[0];

    // Decrypt tokens
    return {
      ...connection,
      access_token: decrypt(connection.access_token),
      refresh_token: decrypt(connection.refresh_token)
    };
  },

  /**
   * Get connection status (without tokens)
   * @returns {Object|null} Connection status
   */
  async getStatus() {
    const result = await query(`
      SELECT
        id,
        organization_name,
        organization_id,
        token_expires_at,
        connected_at,
        last_sync_at,
        updated_at,
        CASE
          WHEN token_expires_at > NOW() THEN true
          ELSE false
        END as is_connected
      FROM xero_connections
      ORDER BY id ASC
      LIMIT 1
    `);

    return result.rows[0] || null;
  },

  /**
   * Update tokens after refresh
   * @param {number} connectionId - Connection ID
   * @param {string} accessToken - New access token
   * @param {string} refreshToken - New refresh token
   * @param {Date} tokenExpiresAt - New expiration timestamp
   * @returns {Object} Updated connection
   */
  async refreshTokens(connectionId, accessToken, refreshToken, tokenExpiresAt) {
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);

    const result = await query(`
      UPDATE xero_connections
      SET
        access_token = $1,
        refresh_token = $2,
        token_expires_at = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, user_id, organization_name, organization_id, token_expires_at, connected_at, last_sync_at, updated_at
    `, [encryptedAccessToken, encryptedRefreshToken, tokenExpiresAt, connectionId]);

    return result.rows[0];
  },

  /**
   * Update last sync timestamp
   * @param {number} connectionId - Connection ID
   */
  async updateLastSync(connectionId) {
    await query(`
      UPDATE xero_connections
      SET last_sync_at = NOW()
      WHERE id = $1
    `, [connectionId]);
  },

  /**
   * Disconnect and delete connection
   * @returns {boolean} Success status
   */
  async disconnect() {
    const result = await query('DELETE FROM xero_connections RETURNING id');
    return result.rows.length > 0;
  }
};
