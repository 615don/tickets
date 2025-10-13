import { InvoiceConfig } from '../models/InvoiceConfig.js';
import { AiSettings } from '../models/AiSettings.js';
import { maskApiKey } from '../utils/maskApiKey.js';
import OpenAI from 'openai';

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
    const { openaiApiKey, openaiModel, systemPrompt, maxCompletionTokens, maxWordCount, apiTimeoutMs } = req.body;

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

    // Validate maxCompletionTokens (optional, defaults to 2000)
    if (maxCompletionTokens !== undefined) {
      const tokens = parseInt(maxCompletionTokens);
      if (isNaN(tokens) || tokens < 100 || tokens > 128000) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'maxCompletionTokens must be between 100 and 128000'
        });
      }
    }

    // Validate maxWordCount (optional, defaults to 4000)
    if (maxWordCount !== undefined) {
      const wordCount = parseInt(maxWordCount);
      if (isNaN(wordCount) || wordCount < 100 || wordCount > 10000) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'maxWordCount must be between 100 and 10000'
        });
      }
    }

    // Validate apiTimeoutMs (optional, defaults to 15000)
    if (apiTimeoutMs !== undefined) {
      const timeout = parseInt(apiTimeoutMs);
      if (isNaN(timeout) || timeout < 5000 || timeout > 60000) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'apiTimeoutMs must be between 5000 and 60000'
        });
      }
    }

    // Optional: Basic API key format validation for immediate feedback
    if (!openaiApiKey.startsWith('sk-') || openaiApiKey.length < 20) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid API key format. OpenAI API keys should start with "sk-" and be at least 20 characters'
      });
    }

    // Update settings (with defaults for optional fields)
    await AiSettings.updateSettings(openaiApiKey, openaiModel, systemPrompt, maxCompletionTokens, maxWordCount, apiTimeoutMs);

    res.json({
      success: true,
      message: 'AI settings updated successfully'
    });
  } catch (error) {
    // Handle validation errors from model
    if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be between')) {
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

/**
 * POST /api/settings/ai/test-connection
 * Test OpenAI connection without saving settings
 */
export async function testAiConnection(req, res) {
  try {
    const { openaiApiKey, openaiModel } = req.body;

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

    // Create minimal test payload for OpenAI
    const testPayload = {
      model: openaiModel,
      messages: [
        {
          role: 'system',
          content: 'You are a test assistant. Respond with "OK".'
        },
        {
          role: 'user',
          content: 'Test connection'
        }
      ],
      max_completion_tokens: 50
      // Note: temperature omitted - some models only support default value
    };

    // Initialize OpenAI client with test API key and 10-second timeout
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 10000  // 10 second timeout (AC5)
    });

    // Log test attempt (never log API key)
    console.log('Test connection attempt:', { model: openaiModel, timestamp: Date.now() });

    // Make minimal chat completion call to validate connection
    const startTime = Date.now();
    await openai.chat.completions.create(testPayload);
    const latency = Date.now() - startTime;

    // Log success with latency
    console.log('Test connection success:', { model: openaiModel, latency });

    // Return success response
    res.json({
      success: true,
      message: 'Connection successful. API key is valid and model is accessible.',
      model: openaiModel,
      latency: latency
    });

  } catch (error) {
    // Handle specific OpenAI error types with clear messages

    // 401 Unauthorized - Invalid API key
    if (error.status === 401) {
      return res.json({
        success: false,
        error: 'Invalid API key. Please check your OpenAI API key and try again.'
      });
    }

    // 429 Rate Limit
    if (error.status === 429) {
      return res.json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment and try again.'
      });
    }

    // 404 Model Not Found
    if (error.status === 404) {
      return res.json({
        success: false,
        error: `Model "${req.body.openaiModel}" not found. Please check model name.`
      });
    }

    // Timeout or network errors
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return res.json({
        success: false,
        error: 'Network error - unable to reach OpenAI. Check your internet connection.'
      });
    }

    // Log error with details (never include API key)
    console.error('Test connection error:', {
      status: error.status,
      code: error.code,
      message: error.message
    });

    // Generic error fallback
    return res.json({
      success: false,
      error: error.message || 'Connection test failed. Please try again.'
    });
  }
}
