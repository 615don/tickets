import { summarizeEmail } from '../services/openaiService.js';
import { processEmailThread } from '../services/emailThreadProcessor.js';
import { AiSettings } from '../models/AiSettings.js';

/**
 * Maps technical errors to user-friendly messages
 * @param {Error} error - Error object from AI service
 * @returns {string} User-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
  const message = error.message || '';

  // Map technical errors to user-friendly messages
  if (message.includes('rate limit') || error.error === 'RateLimitError') {
    return 'OpenAI rate limit exceeded. Please try again in a few moments.';
  }
  if (message.includes('invalid_api_key') || message.includes('AuthenticationError') || error.error === 'AuthenticationError') {
    return 'OpenAI API key is invalid. Please check settings.';
  }
  if (message.includes('timeout') || error.error === 'TimeoutError') {
    return 'AI service timed out. Please try again.';
  }

  // Default generic error
  return 'Failed to generate summary. Please try again or enter manually.';
}

/**
 * AI Summarization Controller
 * POST /api/ai/summarize-email
 *
 * Accepts email thread and returns AI-generated summary
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function summarizeEmailThread(req, res) {
  const startTime = Date.now();

  try {
    // AC2: Validate authenticated session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // AC1: Validate request payload
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Request must include "emails" array with at least one email'
      });
    }

    if (emails.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Maximum 5 emails allowed per request'
      });
    }

    // Validate each email object has required fields
    for (const email of emails) {
      if (!email.from || !email.subject || !email.body) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Each email must have "from", "subject", and "body" fields'
        });
      }
    }

    // Validate payload size (prevent abuse)
    const payloadSize = JSON.stringify(req.body).length;
    if (payloadSize > 500000) { // 500KB limit
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Request payload too large (max 500KB)'
      });
    }

    // AC3: Retrieve AI settings from database
    const aiSettings = await AiSettings.getSettings();

    // AC4: Return error if AI not configured
    if (!aiSettings || !aiSettings.openaiApiKey) {
      return res.status(400).json({
        success: false,
        error: 'AINotConfigured',
        message: 'AI summarization is not configured. Please configure OpenAI API key in settings.'
      });
    }

    // AC5: Process email thread using emailThreadProcessor with configurable word limit
    const processedThread = processEmailThread(emails, aiSettings.maxWordCount);

    // processedThread contains:
    // - selectedEmails: Array of sanitized emails
    // - truncated: boolean
    // - emailCount: number
    // - wordCount: number
    // - lengthClass: 'short' | 'medium' | 'long'

    // AC5: Call OpenAI service to generate summary
    const summary = await summarizeEmail(
      processedThread.selectedEmails,
      aiSettings,
      processedThread.lengthClass
    );

    // summary contains:
    // - description: string (one-line summary)
    // - notes: string (detailed notes)
    // - success: boolean
    // - error?: string
    // - message?: string

    // Check if AI service returned an error
    if (!summary.success) {
      // AC7: Handle AI service errors gracefully
      console.error('[AI Controller] Summarization failed:', {
        errorType: summary.error || 'UnknownError',
        message: summary.message || 'Unknown error',
        emailCount: emails.length
      });

      return res.json({
        success: false,
        error: summary.error || 'UnknownError',
        message: summary.message || getUserFriendlyErrorMessage(new Error(summary.message))
      });
    }

    // AC8: Log successful request
    console.log('[AI Controller] Summarization successful:', {
      emailCount: processedThread.emailCount,
      wordCount: processedThread.wordCount,
      truncated: processedThread.truncated,
      lengthClass: processedThread.lengthClass,
      responseTimeMs: Date.now() - startTime
    });

    // AC6: Return success response
    return res.json({
      success: true,
      description: summary.description,
      notes: summary.notes,
      truncated: processedThread.truncated,
      emailCount: processedThread.emailCount,
      wordCount: processedThread.wordCount
    });

  } catch (error) {
    // AC7: Handle unexpected errors gracefully
    // Log error with context (never log email content or API keys)
    console.error('[AI Controller] Summarization failed:', {
      errorType: error.constructor.name,
      message: error.message,
      emailCount: req.body.emails ? req.body.emails.length : 0
    });

    // Return graceful error to frontend
    return res.json({
      success: false,
      error: error.constructor.name,
      message: getUserFriendlyErrorMessage(error)
    });
  }
}
