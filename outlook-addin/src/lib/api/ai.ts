import { apiClient } from '../api-client';

/**
 * Email object for AI summarization
 * Matches backend expectation from emailThreadProcessor
 */
export interface EmailForSummarization {
  from: string;
  subject: string;
  body: string;
}

/**
 * Request payload for AI summarization endpoint
 */
export interface SummarizeEmailRequest {
  emails: EmailForSummarization[];
}

/**
 * Response from AI summarization endpoint
 * Backend returns description, notes, and metadata
 */
export interface SummarizeEmailResponse {
  description: string;
  notes: string;
  truncated: boolean;
  emailCount: number;
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Type guard to validate API response shape
 * Ensures response has required fields before using
 */
function isSummarizeEmailResponse(obj: unknown): obj is SummarizeEmailResponse {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  const record = obj as Record<string, unknown>;
  return (
    (typeof record.description === 'string' || record.success === false) &&
    (typeof record.notes === 'string' || record.success === false)
  );
}

/**
 * Summarize email thread using AI
 * Calls POST /api/ai/summarize-email endpoint
 *
 * @param emails - Array of email objects to summarize (1-5 emails)
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise resolving to AI-generated summary with description and notes
 * @throws Error for authentication failures (401) or network errors
 *
 * **Error Handling:**
 * - 401 (Unauthorized): Throws error - user must log in to web app
 * - 400 (AI not configured): Returns response with success=false and error message
 * - 500 (AI service failure): Returns response with success=false and user-friendly message
 * - Network errors: Throws error with descriptive message
 * - Aborted requests: Throws AbortError
 *
 * **Usage:**
 * ```typescript
 * try {
 *   const summary = await summarizeEmail(emails, abortSignal);
 *   if (summary.success !== false) {
 *     // Use summary.description and summary.notes
 *   } else {
 *     // Handle graceful failure - log error, leave fields empty
 *     console.error('AI unavailable:', summary.error);
 *   }
 * } catch (error) {
 *   // Authentication or network error - show error to user
 *   console.error('AI request failed:', error);
 * }
 * ```
 *
 * Story 7.8: AI Summarization Integration (New Tickets)
 */
export async function summarizeEmail(
  emails: EmailForSummarization[],
  signal?: AbortSignal
): Promise<SummarizeEmailResponse> {
  // Validate input
  if (!emails || emails.length === 0) {
    throw new Error('At least one email required for summarization');
  }

  if (emails.length > 5) {
    throw new Error('Maximum 5 emails allowed per summarization request');
  }

  try {
    const response = await apiClient<SummarizeEmailResponse>(
      '/api/ai/summarize-email',
      {
        method: 'POST',
        body: JSON.stringify({ emails }),
        signal, // Pass abort signal to apiClient
      }
    );

    // Validate response shape
    if (!isSummarizeEmailResponse(response)) {
      console.error('Invalid AI response format:', response);
      return {
        description: '',
        notes: '',
        truncated: false,
        emailCount: emails.length,
        success: false,
        error: 'InvalidResponse',
        message: 'AI service returned unexpected format',
      };
    }

    return response;
  } catch (error) {
    // Propagate AbortError (request was cancelled) - let caller handle it
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    // apiClient throws for 401 (auth required) - propagate to caller
    if (error instanceof Error && error.message.includes('Authentication required')) {
      throw error;
    }

    // Network or other errors - return graceful failure response
    console.error('AI summarization request failed:', error);
    return {
      description: '',
      notes: '',
      truncated: false,
      emailCount: emails.length,
      success: false,
      error: 'RequestFailed',
      message: error instanceof Error ? error.message : 'Failed to reach AI service',
    };
  }
}
