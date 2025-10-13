import { InvoiceConfig } from '../models/InvoiceConfig.js';
import { AiSettings } from '../models/AiSettings.js';
import { maskApiKey } from '../utils/maskApiKey.js';

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

/**
 * GET /api/settings/ai
 * Get current AI settings (with masked API key)
 */
export async function getAiSettings(req, res) {
  try {
    const settings = await AiSettings.getSettings();

    // Mask API key for response
    const maskedSettings = {
      ...settings,
      openaiApiKey: maskApiKey(settings.openaiApiKey)
    };

    res.json(maskedSettings);
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to fetch AI settings'
    });
  }
}

/**
 * POST /api/settings/ai
 * Update AI settings
 */
export async function updateAiSettings(req, res) {
  try {
    const { openaiApiKey, openaiModel, systemPrompt } = req.body;

    // Validate required fields
    if (!openaiApiKey) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'openaiApiKey is required'
      });
    }

    if (!openaiModel) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'openaiModel is required'
      });
    }

    if (!systemPrompt) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'systemPrompt is required'
      });
    }

    // Optional: Basic API key format validation for immediate feedback
    if (!openaiApiKey.startsWith('sk-') || openaiApiKey.length < 20) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid API key format. OpenAI API keys should start with "sk-" and be at least 20 characters'
      });
    }

    // Update settings
    await AiSettings.updateSettings(openaiApiKey, openaiModel, systemPrompt);

    res.json({
      success: true,
      message: 'AI settings updated successfully'
    });
  } catch (error) {
    // Handle validation errors from model
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'ValidationError',
        message: error.message
      });
    }

    console.error('Error updating AI settings:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to update AI settings'
    });
  }
}
