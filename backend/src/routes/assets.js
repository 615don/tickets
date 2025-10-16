import express from 'express';
import { Asset } from '../models/Asset.js';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { lookupLenovoWarranty } from '../services/lenovoWarranty.js';

const router = express.Router();

// All asset routes require authentication
router.use(requireAuth);

// POST /api/assets - Create new asset
router.post('/', async (req, res) => {
  try {
    const {
      hostname,
      client_id,
      contact_id,
      manufacturer,
      model,
      serial_number,
      in_service_date,
      warranty_expiration_date,
      pdq_device_id,
      screenconnect_session_id
    } = req.body;

    // Validate required fields
    if (!hostname || hostname.trim().length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Hostname is required'
      });
    }

    if (!client_id) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Client ID is required'
      });
    }

    if (!in_service_date) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'In-service date is required'
      });
    }

    // Validate date format
    const inServiceDateParsed = new Date(in_service_date);
    if (isNaN(inServiceDateParsed.getTime())) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid date format for in_service_date'
      });
    }

    // Validate warranty date if provided
    if (warranty_expiration_date) {
      const warrantyDateParsed = new Date(warranty_expiration_date);
      if (isNaN(warrantyDateParsed.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid date format for warranty_expiration_date'
        });
      }
    }

    // Validate client exists
    const clientCheck = await query(
      'SELECT id FROM clients WHERE id = $1',
      [client_id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Client not found'
      });
    }

    // Validate contact exists and belongs to client if contact_id provided
    if (contact_id !== null && contact_id !== undefined) {
      const contactCheck = await query(
        'SELECT id, client_id FROM contacts WHERE id = $1 AND deleted_at IS NULL',
        [contact_id]
      );

      if (contactCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'NotFoundError',
          message: 'Contact not found'
        });
      }

      if (contactCheck.rows[0].client_id !== client_id) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Contact does not belong to the specified client'
        });
      }
    }

    // Create asset
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
        client_id,
        contact_id || null,
        manufacturer || null,
        model || null,
        serial_number || null,
        in_service_date,
        warranty_expiration_date || null,
        pdq_device_id || null,
        screenconnect_session_id || null
      ]
    );

    // Return snake_case as per story requirements
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while creating the asset'
    });
  }
});

// GET /api/assets - List assets with filters
router.get('/', async (req, res) => {
  try {
    const {
      client_id,
      contact_id,
      status = 'active', // Default to active
      search,
      page = 1,
      limit = 50
    } = req.query;

    let sql = `
      SELECT
        a.*,
        c.name as contact_name,
        c.email as contact_email,
        cl.company_name as client_company_name
      FROM assets a
      LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN clients cl ON a.client_id = cl.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by contact
    if (contact_id) {
      sql += ` AND a.contact_id = $${paramCount}`;
      params.push(contact_id);
      paramCount++;
    }

    // Filter by client (direct client_id relationship)
    if (client_id) {
      sql += ` AND a.client_id = $${paramCount}`;
      params.push(client_id);
      paramCount++;
    }

    // Filter by status (default: active only)
    if (status && status !== 'all') {
      sql += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Search hostname, manufacturer, model, serial number
    if (search) {
      sql += ` AND (
        a.hostname ILIKE $${paramCount} OR
        a.manufacturer ILIKE $${paramCount} OR
        a.model ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sql += ` ORDER BY a.hostname`;

    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM assets a
      LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
      WHERE 1=1
    `;

    const countParams = [];
    let countParamCount = 1;

    if (contact_id) {
      countSql += ` AND a.contact_id = $${countParamCount}`;
      countParams.push(contact_id);
      countParamCount++;
    }

    if (client_id) {
      countSql += ` AND a.client_id = $${countParamCount}`;
      countParams.push(client_id);
      countParamCount++;
    }

    if (status && status !== 'all') {
      countSql += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (search) {
      countSql += ` AND (
        a.hostname ILIKE $${countParamCount} OR
        a.manufacturer ILIKE $${countParamCount} OR
        a.model ILIKE $${countParamCount} OR
        a.serial_number ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Format each asset with nested contact and client objects
    const formattedAssets = result.rows.map(asset => {
      const response = {
        id: asset.id,
        hostname: asset.hostname,
        client_id: asset.client_id,
        contact_id: asset.contact_id,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial_number: asset.serial_number,
        in_service_date: asset.in_service_date,
        warranty_expiration_date: asset.warranty_expiration_date,
        pdq_device_id: asset.pdq_device_id,
        screenconnect_session_id: asset.screenconnect_session_id,
        status: asset.status,
        retired_at: asset.retired_at,
        created_at: asset.created_at,
        updated_at: asset.updated_at
      };

      // Add nested contact info if exists
      if (asset.contact_name) {
        response.contact = {
          id: asset.contact_id,
          name: asset.contact_name,
          email: asset.contact_email,
          client_id: asset.client_id
        };
      }

      // Add nested client info if exists
      if (asset.client_company_name) {
        response.client = {
          id: asset.client_id,
          company_name: asset.client_company_name
        };
      }

      return response;
    });

    res.status(200).json({
      assets: formattedAssets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while fetching assets'
    });
  }
});

// GET /api/assets/:id - Get single asset with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid asset ID'
      });
    }

    const result = await query(
      `SELECT
        a.*,
        c.id as contact_id,
        c.name as contact_name,
        c.email as contact_email,
        c.client_id as contact_client_id,
        cl.id as client_id,
        cl.company_name as client_company_name
      FROM assets a
      LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN clients cl ON a.client_id = cl.id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Asset not found'
      });
    }

    const asset = result.rows[0];

    // Format response with nested contact and client objects
    const response = {
      id: asset.id,
      hostname: asset.hostname,
      client_id: asset.client_id,
      contact_id: asset.contact_id,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      in_service_date: asset.in_service_date,
      warranty_expiration_date: asset.warranty_expiration_date,
      pdq_device_id: asset.pdq_device_id,
      screenconnect_session_id: asset.screenconnect_session_id,
      status: asset.status,
      retired_at: asset.retired_at,
      created_at: asset.created_at,
      updated_at: asset.updated_at
    };

    // Add nested contact info if exists
    if (asset.contact_name) {
      response.contact = {
        id: asset.contact_id,
        name: asset.contact_name,
        email: asset.contact_email,
        client_id: asset.contact_client_id
      };
    }

    // Add nested client info if exists
    if (asset.client_company_name) {
      response.client = {
        id: asset.client_id,
        company_name: asset.client_company_name
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while fetching the asset'
    });
  }
});

// PUT /api/assets/:id - Update asset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hostname,
      client_id,
      contact_id,
      manufacturer,
      model,
      serial_number,
      in_service_date,
      warranty_expiration_date,
      pdq_device_id,
      screenconnect_session_id
    } = req.body;

    // Validate id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid asset ID'
      });
    }

    // Check if asset exists
    const assetCheck = await query('SELECT id FROM assets WHERE id = $1', [id]);
    if (assetCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Asset not found'
      });
    }

    // Validate required fields
    if (!hostname || hostname.trim().length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Hostname is required'
      });
    }

    if (!client_id) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Client ID is required'
      });
    }

    if (!in_service_date) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'In-service date is required'
      });
    }

    // Validate date format
    const inServiceDateParsed = new Date(in_service_date);
    if (isNaN(inServiceDateParsed.getTime())) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid date format for in_service_date'
      });
    }

    // Validate warranty date if provided
    if (warranty_expiration_date) {
      const warrantyDateParsed = new Date(warranty_expiration_date);
      if (isNaN(warrantyDateParsed.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid date format for warranty_expiration_date'
        });
      }
    }

    // Validate client exists
    const clientCheck = await query(
      'SELECT id FROM clients WHERE id = $1',
      [client_id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Client not found'
      });
    }

    // Validate contact exists and belongs to client if contact_id provided
    if (contact_id !== null && contact_id !== undefined) {
      const contactCheck = await query(
        'SELECT id, client_id FROM contacts WHERE id = $1 AND deleted_at IS NULL',
        [contact_id]
      );

      if (contactCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'NotFoundError',
          message: 'Contact not found'
        });
      }

      if (contactCheck.rows[0].client_id !== client_id) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Contact does not belong to the specified client'
        });
      }
    }

    // Update asset
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
        client_id,
        contact_id !== undefined ? contact_id : null,
        manufacturer || null,
        model || null,
        serial_number || null,
        in_service_date,
        warranty_expiration_date || null,
        pdq_device_id || null,
        screenconnect_session_id || null,
        id
      ]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while updating the asset'
    });
  }
});

// DELETE /api/assets/:id - Soft delete (retire) asset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid asset ID'
      });
    }

    // Check if asset exists
    const assetCheck = await query('SELECT id, status, retired_at FROM assets WHERE id = $1', [id]);
    if (assetCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Asset not found'
      });
    }

    const asset = assetCheck.rows[0];

    // If already retired, return idempotent response
    if (asset.status === 'retired') {
      return res.status(200).json({
        message: 'Asset retired successfully',
        asset_id: parseInt(id),
        retired_at: asset.retired_at
      });
    }

    // Retire asset
    const result = await query(
      `UPDATE assets
       SET status = 'retired',
           retired_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING retired_at`,
      [id]
    );

    res.status(200).json({
      message: 'Asset retired successfully',
      asset_id: parseInt(id),
      retired_at: result.rows[0].retired_at
    });
  } catch (error) {
    console.error('Error retiring asset:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while retiring the asset'
    });
  }
});

// DELETE /api/assets/:id/permanent - Permanently delete asset
router.delete('/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid asset ID'
      });
    }

    // Check if asset exists
    const assetCheck = await query('SELECT id, status, retired_at FROM assets WHERE id = $1', [id]);
    if (assetCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Asset not found'
      });
    }

    const asset = assetCheck.rows[0];

    // Check if asset is retired
    if (asset.status !== 'retired') {
      return res.status(403).json({
        error: 'ForbiddenError',
        message: 'Asset must be retired before permanent deletion'
      });
    }

    // Check if retired for at least 2 years (730 days)
    if (!asset.retired_at) {
      return res.status(403).json({
        error: 'ForbiddenError',
        message: 'Asset must have a retirement date'
      });
    }

    const retiredDate = new Date(asset.retired_at);
    const now = new Date();
    const daysSinceRetirement = Math.floor((now - retiredDate) / (1000 * 60 * 60 * 24));

    if (daysSinceRetirement < 730) {
      return res.status(403).json({
        error: 'ForbiddenError',
        message: `Asset must be retired for at least 2 years before permanent deletion (retired ${daysSinceRetirement} days ago)`
      });
    }

    // Permanent delete
    await query('DELETE FROM assets WHERE id = $1', [id]);

    res.status(200).json({
      message: 'Asset permanently deleted',
      asset_id: parseInt(id)
    });
  } catch (error) {
    console.error('Error permanently deleting asset:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while permanently deleting the asset'
    });
  }
});

// POST /api/assets/warranty-lookup - Lookup Lenovo warranty information (no asset ID required)
router.post('/warranty-lookup', async (req, res) => {
  try {
    const { serial_number } = req.body;

    // Validate serial_number is provided
    if (!serial_number || serial_number.trim().length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Serial number is required'
      });
    }

    // Call Lenovo warranty service
    try {
      const warrantyData = await lookupLenovoWarranty(serial_number);

      // Format response according to story requirements
      const response = {
        warranty_expiration_date: warrantyData.warrantyEndDate
          ? warrantyData.warrantyEndDate.toISOString().split('T')[0]
          : null,
        in_service_date: warrantyData.warrantyStartDate
          ? warrantyData.warrantyStartDate.toISOString().split('T')[0]
          : null,
        service_level: warrantyData.serviceLevel || null,
        product_name: warrantyData.productName || null
      };

      res.status(200).json(response);
    } catch (warrantyError) {
      // Handle specific warranty lookup errors
      const errorMessage = warrantyError.message || 'Unknown error';

      if (errorMessage.includes('Serial number not found')) {
        return res.status(404).json({
          error: 'NotFoundError',
          message: 'Serial number not found in Lenovo database'
        });
      }

      if (errorMessage.includes('rate limit')) {
        return res.status(429).json({
          error: 'RateLimitError',
          message: 'API rate limit exceeded. Please try again later.'
        });
      }

      if (errorMessage.includes('timed out') || errorMessage.includes('Unable to reach')) {
        return res.status(503).json({
          error: 'ServiceUnavailableError',
          message: 'Unable to connect to Lenovo API. Please enter warranty information manually.'
        });
      }

      if (errorMessage.includes('API key not configured')) {
        return res.status(503).json({
          error: 'ConfigurationError',
          message: 'Lenovo API key not configured'
        });
      }

      // Generic error for other cases
      console.error('Lenovo warranty lookup error:', warrantyError);
      return res.status(503).json({
        error: 'ServiceUnavailableError',
        message: 'Unable to lookup warranty information. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error in warranty lookup endpoint:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while looking up warranty information'
    });
  }
});

// POST /api/assets/:id/warranty-lookup - Lookup Lenovo warranty information (with asset ID)
router.post('/:id/warranty-lookup', async (req, res) => {
  try {
    const { id } = req.params;
    const { serial_number } = req.body;

    // Validate id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid asset ID'
      });
    }

    // Validate serial_number is provided
    if (!serial_number || serial_number.trim().length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Serial number is required'
      });
    }

    // Check if asset exists
    const assetResult = await query(
      'SELECT id, manufacturer, serial_number FROM assets WHERE id = $1',
      [id]
    );

    if (assetResult.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Asset not found'
      });
    }

    // Call Lenovo warranty service
    try {
      const warrantyData = await lookupLenovoWarranty(serial_number);

      // Format response according to story requirements
      const response = {
        warranty_expiration_date: warrantyData.warrantyEndDate
          ? warrantyData.warrantyEndDate.toISOString().split('T')[0]
          : null,
        in_service_date: warrantyData.warrantyStartDate
          ? warrantyData.warrantyStartDate.toISOString().split('T')[0]
          : null,
        service_level: warrantyData.serviceLevel || null,
        product_name: warrantyData.productName || null
      };

      res.status(200).json(response);
    } catch (warrantyError) {
      // Handle specific warranty lookup errors
      const errorMessage = warrantyError.message || 'Unknown error';

      if (errorMessage.includes('Serial number not found')) {
        return res.status(404).json({
          error: 'NotFoundError',
          message: 'Serial number not found in Lenovo database'
        });
      }

      if (errorMessage.includes('rate limit')) {
        return res.status(429).json({
          error: 'RateLimitError',
          message: 'API rate limit exceeded. Please try again later.'
        });
      }

      if (errorMessage.includes('timed out') || errorMessage.includes('Unable to reach')) {
        return res.status(503).json({
          error: 'ServiceUnavailableError',
          message: 'Unable to connect to Lenovo API. Please enter warranty information manually.'
        });
      }

      if (errorMessage.includes('API key not configured')) {
        return res.status(503).json({
          error: 'ConfigurationError',
          message: 'Lenovo API key not configured'
        });
      }

      // Generic error for other cases
      console.error('Lenovo warranty lookup error:', warrantyError);
      return res.status(503).json({
        error: 'ServiceUnavailableError',
        message: 'Unable to lookup warranty information. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error in warranty lookup endpoint:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An error occurred while looking up warranty information'
    });
  }
});

export default router;
