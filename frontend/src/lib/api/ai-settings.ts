import { apiClient } from '@/lib/api-client';

/**
 * AI Settings API Client
 * Handles all API calls related to AI configuration
 */

// Type definitions
export interface AiSettings {
  openaiApiKey: string;           // Masked on GET (e.g., "sk-***abc123")
  openaiModel: string;            // Model name (e.g., "gpt-5-mini")
  systemPrompt: string;           // Full system prompt text
  maxCompletionTokens: number;    // Token limit for AI responses (100-128000)
  configured: boolean;            // Is API key configured?
}

export interface UpdateAiSettingsPayload {
  openaiApiKey: string;           // Full API key (only sent on POST)
  openaiModel: string;
  systemPrompt: string;
  maxCompletionTokens?: number;   // Optional, defaults to 2000 on backend
}

export interface TestConnectionPayload {
  openaiApiKey: string;       // API key to test
  openaiModel: string;        // Model to test
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  model?: string;
  latency?: number;
  error?: string;
}

export interface UpdateAiSettingsResponse {
  success: boolean;
  message: string;
}

/**
 * Get current AI settings (API key will be masked)
 * GET /api/settings/ai
 */
export async function getAiSettings(): Promise<AiSettings> {
  return apiClient.get<AiSettings>('/api/settings/ai');
}

/**
 * Update AI settings (save API key, model, and prompt)
 * POST /api/settings/ai
 */
export async function updateAiSettings(
  settings: UpdateAiSettingsPayload
): Promise<UpdateAiSettingsResponse> {
  return apiClient.post<UpdateAiSettingsResponse>(
    '/api/settings/ai',
    settings
  );
}

/**
 * Test AI connection (validate API key without saving)
 * POST /api/settings/ai/test-connection
 */
export async function testAiConnection(
  payload: TestConnectionPayload
): Promise<TestConnectionResponse> {
  return apiClient.post<TestConnectionResponse>(
    '/api/settings/ai/test-connection',
    payload
  );
}

/**
 * Exported API object for convenient imports
 */
export const aiSettingsApi = {
  getAiSettings,
  updateAiSettings,
  testAiConnection,
};
