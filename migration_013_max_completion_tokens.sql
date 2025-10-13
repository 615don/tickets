-- Migration 013: Add max_completion_tokens to ai_settings table
-- This allows users to configure the token limit for AI responses via the GUI

-- Add max_completion_tokens column with default value of 2000
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS max_completion_tokens INTEGER NOT NULL DEFAULT 2000;

-- Add constraint to ensure reasonable token limits (min 100, max 128000 per GPT-5 docs)
ALTER TABLE ai_settings
ADD CONSTRAINT check_max_completion_tokens
CHECK (max_completion_tokens >= 100 AND max_completion_tokens <= 128000);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ai_settings' AND column_name = 'max_completion_tokens';

-- Show current ai_settings row
SELECT id, openai_model, max_completion_tokens, updated_at
FROM ai_settings
WHERE id = 1;
