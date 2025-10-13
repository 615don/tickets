-- Migration 014: Add max_word_count and api_timeout_ms to ai_settings table
-- These fields allow UI configuration for email word limit and API timeout

-- Add max_word_count column (default 4000 words to control token costs)
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS max_word_count INTEGER NOT NULL DEFAULT 4000;

-- Add api_timeout_ms column (default 15000ms = 15 seconds for GPT-5 models)
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS api_timeout_ms INTEGER NOT NULL DEFAULT 15000;

-- Add constraint for max_word_count (min 100, max 10000 words)
ALTER TABLE ai_settings
ADD CONSTRAINT check_max_word_count
CHECK (max_word_count >= 100 AND max_word_count <= 10000);

-- Add constraint for api_timeout_ms (min 5000ms = 5s, max 60000ms = 60s)
ALTER TABLE ai_settings
ADD CONSTRAINT check_api_timeout_ms
CHECK (api_timeout_ms >= 5000 AND api_timeout_ms <= 60000);

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ai_settings'
  AND column_name IN ('max_word_count', 'api_timeout_ms');

-- Show current ai_settings row with new columns
SELECT id, openai_model, max_completion_tokens, max_word_count, api_timeout_ms, updated_at
FROM ai_settings
WHERE id = 1;
