import OpenAI from 'openai';

/**
 * Summarize email thread using OpenAI API
 *
 * @param {Array} emailThread - Array of {from, subject, body} email objects (sanitized)
 * @param {Object} settings - {openaiApiKey, openaiModel, systemPrompt} from AiSettings
 * @param {String} lengthClass - 'short' | 'medium' | 'long' for smart minification
 * @returns {Promise<Object>} {description, notes, success, error?, tokensUsed, responseTimeMs}
 */
export async function summarizeEmail(emailThread, settings, lengthClass) {
  const startTime = Date.now();

  try {
    // Create OpenAI client (not global - allows dynamic API key changes)
    const client = new OpenAI({
      apiKey: settings.openaiApiKey,
      timeout: 5000, // 5-second timeout (AC5)
    });

    // Format email thread for OpenAI user message
    const emailContent = emailThread
      .map((email, idx) => `Email ${idx + 1}:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}
---`)
      .join('\n\n');

    // Adjust system prompt based on lengthClass (smart minification)
    let modifiedSystemPrompt = settings.systemPrompt;

    if (lengthClass === 'short') {
      modifiedSystemPrompt += '\n\nProvide a brief 1-2 sentence summary for notes. Avoid over-summarizing.';
    } else if (lengthClass === 'medium') {
      modifiedSystemPrompt += '\n\nProvide a concise paragraph summary for notes.';
    } else if (lengthClass === 'long') {
      modifiedSystemPrompt += '\n\nProvide a detailed multi-paragraph summary for notes, preserving key technical details.';
    }

    // Call OpenAI Chat Completions API
    const completion = await client.chat.completions.create({
      model: settings.openaiModel, // e.g., 'gpt-4o-mini'
      messages: [
        { role: 'system', content: modifiedSystemPrompt },
        { role: 'user', content: emailContent }
      ],
      temperature: 0.3, // Consistent, less creative (AC3)
      max_completion_tokens: 500, // Sufficient for description + notes (max_tokens deprecated for newer models)
      response_format: { type: 'json_object' } // Enforce JSON output
    });

    // Parse JSON response and extract description and notes
    const responseText = completion.choices[0].message.content;
    const parsed = JSON.parse(responseText);

    // Validate parsed object has required fields
    if (!parsed.description || !parsed.notes) {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'InvalidResponse',
        message: 'OpenAI response missing required fields (description or notes)',
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'InvalidResponse',
        message: 'OpenAI response missing required fields (description or notes).'
      };
    }

    // Calculate response time and extract token usage
    const tokensUsed = completion.usage?.total_tokens || 0;
    const responseTimeMs = Date.now() - startTime;

    // Log successful API call
    console.log('[OpenAI] Summarization successful:', {
      timestamp: new Date().toISOString(),
      model: settings.openaiModel,
      emailCount: emailThread.length,
      tokensUsed: tokensUsed,
      responseTimeMs: responseTimeMs,
      lengthClass: lengthClass
    });

    // Return success response
    return {
      description: parsed.description,
      notes: parsed.notes,
      success: true,
      tokensUsed,
      responseTimeMs
    };

  } catch (error) {
    // Handle OpenAI-specific errors using SDK error classes

    // AuthenticationError (401): Invalid API key
    if (error instanceof OpenAI.AuthenticationError) {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'AuthenticationError',
        message: error.message,
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'AuthenticationError',
        message: 'Invalid OpenAI API key. Please check settings and update your API key.'
      };
    }

    // RateLimitError (429): Rate limit exceeded
    if (error instanceof OpenAI.RateLimitError) {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'RateLimitError',
        message: error.message,
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'RateLimitError',
        message: 'OpenAI rate limit exceeded. Please try again in a few moments.'
      };
    }

    // APIConnectionError: Network connectivity issue
    if (error instanceof OpenAI.APIConnectionError) {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'APIConnectionError',
        message: error.message,
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'APIConnectionError',
        message: 'Unable to reach OpenAI API. Check network connection or try again later.'
      };
    }

    // TimeoutError: 5-second timeout exceeded
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'TimeoutError',
        message: error.message,
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'TimeoutError',
        message: 'AI summarization timed out after 5 seconds. Please try again.'
      };
    }

    // JSON parsing errors (malformed OpenAI response)
    if (error instanceof SyntaxError) {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'InvalidResponse',
        message: 'JSON parsing error',
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'InvalidResponse',
        message: 'OpenAI returned invalid JSON format. Please try again.'
      };
    }

    // Generic APIError: Catch-all for other OpenAI errors
    if (error instanceof OpenAI.APIError) {
      console.error('[OpenAI] Summarization failed:', {
        timestamp: new Date().toISOString(),
        error: 'APIError',
        message: error.message,
        emailCount: emailThread.length
      });

      return {
        success: false,
        error: 'APIError',
        message: `OpenAI API error: ${error.message}`
      };
    }

    // Unknown error (should not happen, but safety net)
    console.error('[OpenAI] Summarization failed:', {
      timestamp: new Date().toISOString(),
      error: error.constructor.name,
      message: error.message,
      emailCount: emailThread.length
    });

    return {
      success: false,
      error: 'UnknownError',
      message: `Unexpected error: ${error.message}`
    };
  }
}
