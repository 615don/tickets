import { InvoiceConfig } from '../models/InvoiceConfig.js';

/**
 * GET /api/settings/invoice-config
 * Get current invoice configuration
 */
export async function getInvoiceConfig(req, res) {
  try {
    const config = await InvoiceConfig.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching invoice config:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to fetch invoice configuration'
    });
  }
}

/**
 * PUT /api/settings/invoice-config
 * Update invoice configuration
 */
export async function updateInvoiceConfig(req, res) {
  try {
    const { xeroInvoiceStatus } = req.body;

    if (!xeroInvoiceStatus) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'xeroInvoiceStatus is required'
      });
    }

    const config = await InvoiceConfig.updateConfig(xeroInvoiceStatus);

    res.json({
      success: true,
      xeroInvoiceStatus: config.xeroInvoiceStatus,
      message: 'Invoice configuration updated successfully'
    });
  } catch (error) {
    if (error.message.includes('Invalid xeroInvoiceStatus')) {
      return res.status(400).json({
        error: 'ValidationError',
        message: error.message
      });
    }

    console.error('Error updating invoice config:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to update invoice configuration'
    });
  }
}
