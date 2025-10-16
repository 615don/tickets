import { query, getClient } from '../config/database.js';

/**
 * Asset Model
 * Manages hardware/device inventory for Epic 15: Asset Management Integration
 *
 * Business rules:
 * - Hostname required
 * - in_service_date required
 * - Status defaults to 'active', can be 'retired'
 * - contact_id nullable (assets can be unassigned)
 * - Assets persist when contact deleted (ON DELETE SET NULL)
 */

/**
 * Validates hostname
 * @param {string} hostname - Hostname to validate
 * @throws {Error} If hostname is invalid
 */
function validateHostname(hostname) {
  if (!hostname || typeof hostname !== 'string' || hostname.trim().length === 0) {
    throw new Error('Hostname is required');
  }
  if (hostname.length > 255) {
    throw new Error('Hostname must be 255 characters or less');
  }
}

/**
 * Validates in_service_date
 * @param {string|Date} date - Date to validate (ISO format or Date object)
 * @throws {Error} If date is invalid
 */
function validateInServiceDate(date) {
  if (!date) {
    throw new Error('In-service date is required');
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid in-service date format');
  }

  // Check if date is not in the far future (more than 1 year ahead)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (parsed > oneYearFromNow) {
    throw new Error('In-service date cannot be more than 1 year in the future');
  }
}

/**
 * Validates optional date field
 * @param {string|Date|null|undefined} date - Date to validate
 * @throws {Error} If date format is invalid
 */
function validateOptionalDate(date) {
  if (!date) return; // null/undefined is valid

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date format');
  }
}

/**
 * Validates status enum
 * @param {string} status - Status to validate
 * @throws {Error} If status is invalid
 */
function validateStatus(status) {
  if (!status) {
    throw new Error('Status is required');
  }

  const validStatuses = ['active', 'retired'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }
}

/**
 * Validates that a client exists
 * @param {number} clientId - Client ID to validate
 * @throws {Error} If client does not exist or clientId is missing
 */
async function validateClientExists(clientId) {
  if (!clientId) {
    throw new Error('Client ID is required');
  }

  const result = await query(
    'SELECT id FROM clients WHERE id = $1',
    [clientId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Client with ID ${clientId} not found`);
  }
}

/**
 * Validates that a contact exists if contact_id provided
 * @param {number|null} contactId - Contact ID to validate
 * @param {number} clientId - Client ID that contact must belong to
 * @throws {Error} If contact does not exist or doesn't belong to client
 */
async function validateContactExists(contactId, clientId) {
  if (!contactId) return; // null is valid (unassigned asset)

  const result = await query(
    'SELECT id, client_id FROM contacts WHERE id = $1 AND deleted_at IS NULL',
    [contactId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Contact with ID ${contactId} not found`);
  }

  // Ensure contact belongs to the specified client
  if (result.rows[0].client_id !== clientId) {
    throw new Error(`Contact ${contactId} does not belong to client ${clientId}`);
  }
}

/**
 * Converts database row to camelCase object
 * @param {Object} row - Database row with snake_case columns
 * @returns {Object} Object with camelCase properties
 */
function convertToCamelCase(row) {
  if (!row) return null;

  return {
    id: row.id,
    hostname: row.hostname,
    clientId: row.client_id,
    contactId: row.contact_id,
    manufacturer: row.manufacturer,
    model: row.model,
    serialNumber: row.serial_number,
    inServiceDate: row.in_service_date,
    warrantyExpirationDate: row.warranty_expiration_date,
    pdqDeviceId: row.pdq_device_id,
    screenconnectSessionId: row.screenconnect_session_id,
    status: row.status,
    retiredAt: row.retired_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Include contact info if joined
    contact: row.contact_name ? {
      id: row.contact_id,
      name: row.contact_name,
      email: row.contact_email,
      clientId: row.contact_client_id || row.client_id
    } : undefined
  };
}

export const Asset = {
  /**
   * Create a new asset
   * @param {Object} assetData - Asset data
   * @returns {Promise<Object>} Created asset
   */
  async create({
    hostname,
    clientId,
    contactId = null,
    manufacturer = null,
    model = null,
    serialNumber = null,
    inServiceDate,
    warrantyExpirationDate = null,
    pdqDeviceId = null,
    screenconnectSessionId = null
  }) {
    // Validate input
    validateHostname(hostname);
    validateInServiceDate(inServiceDate);
    validateOptionalDate(warrantyExpirationDate);
    await validateClientExists(clientId);
    await validateContactExists(contactId, clientId);

    const result = await query(
      `INSERT INTO assets (
        hostname,
        client_id,
        contact_id,
        manufacturer,
        model,
        serial_number,
        in_service_date,
        warranty_expiration_date,
        pdq_device_id,
        screenconnect_session_id,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
      RETURNING *`,
      [
        hostname,
        clientId,
        contactId,
        manufacturer,
        model,
        serialNumber,
        inServiceDate,
        warrantyExpirationDate,
        pdqDeviceId,
        screenconnectSessionId
      ]
    );

    return convertToCamelCase(result.rows[0]);
  },

  /**
   * Get all assets with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of assets
   */
  async findAll(filters = {}) {
    let sql = `
      SELECT
        a.*,
        c.name as contact_name,
        c.email as contact_email,
        c.client_id
      FROM assets a
      LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by contact
    if (filters.contactId) {
      sql += ` AND a.contact_id = $${paramCount}`;
      params.push(filters.contactId);
      paramCount++;
    }

    // Filter by client (direct client_id relationship)
    if (filters.clientId) {
      sql += ` AND a.client_id = $${paramCount}`;
      params.push(filters.clientId);
      paramCount++;
    }

    // Filter by status
    if (filters.status) {
      sql += ` AND a.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Search hostname, manufacturer, model, serial number
    if (filters.search) {
      sql += ` AND (
        a.hostname ILIKE $${paramCount} OR
        a.manufacturer ILIKE $${paramCount} OR
        a.model ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ` ORDER BY a.hostname`;

    const result = await query(sql, params);
    return result.rows.map(convertToCamelCase);
  },

  /**
   * Get asset by ID
   * @param {number} id - Asset ID
   * @returns {Promise<Object|null>} Asset or null
   */
  async findById(id) {
    const result = await query(
      `SELECT
        a.*,
        c.name as contact_name,
        c.email as contact_email,
        c.client_id
      FROM assets a
      LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
      WHERE a.id = $1`,
      [id]
    );

    return convertToCamelCase(result.rows[0]);
  },

  /**
   * Update asset
   * @param {number} id - Asset ID
   * @param {Object} assetData - Updated asset data
   * @returns {Promise<Object>} Updated asset
   */
  async update(id, {
    hostname,
    clientId,
    contactId,
    manufacturer,
    model,
    serialNumber,
    inServiceDate,
    warrantyExpirationDate,
    pdqDeviceId,
    screenconnectSessionId
  }) {
    // Validate input
    validateHostname(hostname);
    validateInServiceDate(inServiceDate);
    validateOptionalDate(warrantyExpirationDate);
    await validateClientExists(clientId);
    await validateContactExists(contactId, clientId);

    const result = await query(
      `UPDATE assets
       SET hostname = $1,
           client_id = $2,
           contact_id = $3,
           manufacturer = $4,
           model = $5,
           serial_number = $6,
           in_service_date = $7,
           warranty_expiration_date = $8,
           pdq_device_id = $9,
           screenconnect_session_id = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        hostname,
        clientId,
        contactId,
        manufacturer,
        model,
        serialNumber,
        inServiceDate,
        warrantyExpirationDate,
        pdqDeviceId,
        screenconnectSessionId,
        id
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Asset not found');
    }

    return convertToCamelCase(result.rows[0]);
  },

  /**
   * Retire an asset (soft delete with retired status)
   * @param {number} id - Asset ID
   * @returns {Promise<Object>} Retired asset
   */
  async retireAsset(id) {
    const result = await query(
      `UPDATE assets
       SET status = 'retired',
           retired_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Asset not found');
    }

    return convertToCamelCase(result.rows[0]);
  },

  /**
   * Reactivate a retired asset
   * @param {number} id - Asset ID
   * @returns {Promise<Object>} Reactivated asset
   */
  async reactivateAsset(id) {
    const result = await query(
      `UPDATE assets
       SET status = 'active',
           retired_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Asset not found');
    }

    return convertToCamelCase(result.rows[0]);
  },

  /**
   * Get all active assets
   * @returns {Promise<Array>} Array of active assets
   */
  async getActiveAssets() {
    return this.findAll({ status: 'active' });
  },

  /**
   * Get assets by contact ID
   * @param {number} contactId - Contact ID
   * @returns {Promise<Array>} Array of assets
   */
  async getAssetsByContactId(contactId) {
    return this.findAll({ contactId });
  },

  /**
   * Get assets by client ID
   * @param {number} clientId - Client ID
   * @returns {Promise<Array>} Array of assets
   */
  async getAssetsByClientId(clientId) {
    return this.findAll({ clientId });
  },

  /**
   * Delete an asset permanently
   * Should only be used for retired assets older than retention period
   * @param {number} id - Asset ID
   * @returns {Promise<Object>} Deleted asset info
   */
  async delete(id) {
    // Check if asset is retired and older than 2 years
    const checkResult = await query(
      `SELECT status, retired_at FROM assets WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Asset not found');
    }

    const asset = checkResult.rows[0];

    if (asset.status !== 'retired') {
      throw new Error('Only retired assets can be permanently deleted');
    }

    if (!asset.retired_at) {
      throw new Error('Asset must have a retirement date');
    }

    const retiredDate = new Date(asset.retired_at);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    if (retiredDate > twoYearsAgo) {
      throw new Error('Asset must be retired for at least 2 years before permanent deletion');
    }

    // Permanent delete
    const result = await query(
      'DELETE FROM assets WHERE id = $1 RETURNING id',
      [id]
    );

    return {
      deletedAssetId: result.rows[0].id,
      message: 'Asset permanently deleted'
    };
  }
};
