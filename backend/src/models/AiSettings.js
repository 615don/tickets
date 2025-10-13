import pool from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const VALID_MODELS = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'];

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant helping to summarize email threads for IT consulting ticket creation.

Generate two outputs:
1. Description: A concise one-line summary suitable for invoice line items (max 100 characters)
2. Notes: A detailed summary of the email thread for billing reference and memory jogging

Rules:
- Focus on technical issues, requests, and context
- Preserve important details (error messages, dates, versions, steps taken)
- Omit pleasantries and signature content
- Adjust summary length based on email content length (short emails = brief notes, long threads = detailed notes)
- Use professional, neutral tone

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks. Output raw JSON only.

Respond with this exact JSON format:
{
  "description": "one-line summary here",
  "notes": "detailed multi-paragraph summary here"
}`;

/**
 * AiSettings model for managing AI configuration settings
 * This is a singleton table with only one row (id=1)
 */
export const AiSettings = {
  /**
   * Get current AI settings
   * Creates default if not exists
   * @returns {Promise<{openaiApiKey: string, openaiModel: string, systemPrompt: string, maxCompletionTokens: number, maxWordCount: number, apiTimeoutMs: number, configured: boolean}>}
   */
  async getSettings() {
    const result = await pool.query(
      'SELECT openai_api_key, openai_model, system_prompt, max_completion_tokens, max_word_count, api_timeout_ms FROM ai_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      // Return default settings (table should have been created by migration)
      return {
        openaiApiKey: '',
        openaiModel: 'gpt-5-mini',
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        maxCompletionTokens: 2000,
        maxWordCount: 4000,
        apiTimeoutMs: 15000,
        configured: false
      };
    }

    const row = result.rows[0];

    // Decrypt API key if it exists and is not empty
    let openaiApiKey = row.openai_api_key;
    if (openaiApiKey && openaiApiKey !== '') {
      try {
        openaiApiKey = decrypt(openaiApiKey);
      } catch (error) {
        console.error('Failed to decrypt API key:', error.message);
        // Return empty key if decryption fails
        openaiApiKey = '';
      }
    }

    return {
      openaiApiKey,
      openaiModel: row.openai_model,
      systemPrompt: row.system_prompt,
      maxCompletionTokens: row.max_completion_tokens || 2000,
      maxWordCount: row.max_word_count || 4000,
      apiTimeoutMs: row.api_timeout_ms || 15000,
      configured: openaiApiKey !== ''
    };
  },

  /**
   * Update AI settings
   * @param {string} apiKey - OpenAI API key
   * @param {string} model - Model name (gpt-5, gpt-5-mini, gpt-5-nano)
   * @param {string} systemPrompt - System prompt text
   * @param {number} maxCompletionTokens - Maximum completion tokens (100-128000)
   * @param {number} maxWordCount - Maximum word count for email threads (100-10000)
   * @param {number} apiTimeoutMs - API timeout in milliseconds (5000-60000)
   * @returns {Promise<{openaiApiKey: string, openaiModel: string, systemPrompt: string, maxCompletionTokens: number, maxWordCount: number, apiTimeoutMs: number, configured: boolean}>}
   * @throws {Error} If validation fails
   */
  async updateSettings(apiKey, model, systemPrompt, maxCompletionTokens = 2000, maxWordCount = 4000, apiTimeoutMs = 15000) {
    // Validate inputs
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('openaiApiKey is required');
    }

    if (!VALID_MODELS.includes(model)) {
      throw new Error(
        `Invalid openaiModel. Must be one of: ${VALID_MODELS.join(', ')}`
      );
    }

    if (!systemPrompt || systemPrompt.trim() === '') {
      throw new Error('systemPrompt is required');
    }

    // Validate maxCompletionTokens
    const tokens = parseInt(maxCompletionTokens);
    if (isNaN(tokens) || tokens < 100 || tokens > 128000) {
      throw new Error('maxCompletionTokens must be between 100 and 128000');
    }

    // Validate maxWordCount
    const wordCount = parseInt(maxWordCount);
    if (isNaN(wordCount) || wordCount < 100 || wordCount > 10000) {
      throw new Error('maxWordCount must be between 100 and 10000');
    }

    // Validate apiTimeoutMs
    const timeout = parseInt(apiTimeoutMs);
    if (isNaN(timeout) || timeout < 5000 || timeout > 60000) {
      throw new Error('apiTimeoutMs must be between 5000 and 60000');
    }

    // Encrypt API key before storage
    const encryptedApiKey = encrypt(apiKey);

    // Update singleton row
    await pool.query(
      `UPDATE ai_settings
       SET openai_api_key = $1, openai_model = $2, system_prompt = $3, max_completion_tokens = $4, max_word_count = $5, api_timeout_ms = $6, updated_at = NOW()
       WHERE id = 1`,
      [encryptedApiKey, model, systemPrompt, tokens, wordCount, timeout]
    );

    return {
      openaiApiKey: apiKey, // Return unencrypted key
      openaiModel: model,
      systemPrompt,
      maxCompletionTokens: tokens,
      maxWordCount: wordCount,
      apiTimeoutMs: timeout,
      configured: true
    };
  }
};
