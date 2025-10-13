import { useState, useEffect } from 'react';
import { useAiSettings, useUpdateAiSettings, useTestAiConnection } from '@/hooks/useAiSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';

/**
 * AI Settings Section Component
 * Form for configuring OpenAI API integration
 */
export function AiSettingsSection() {
  // State management
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-5-mini');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [maxCompletionTokens, setMaxCompletionTokens] = useState(2000);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Hooks
  const { data: settings, isLoading } = useAiSettings();
  const updateMutation = useUpdateAiSettings();
  const testConnectionMutation = useTestAiConnection();

  // Initialize form state when settings load
  useEffect(() => {
    if (settings) {
      // Only update if API key is not masked (means it's the initial load or a real key)
      if (apiKey === '' || !apiKey.includes('***')) {
        setApiKey(settings.openaiApiKey);
      }
      setModel(settings.openaiModel);
      setSystemPrompt(settings.systemPrompt);
      setMaxCompletionTokens(settings.maxCompletionTokens || 2000);
      setIsModified(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Handlers
  const handleTestConnection = async () => {
    if (!apiKey) return;

    await testConnectionMutation.mutateAsync({
      openaiApiKey: apiKey,
      openaiModel: model,
    });
  };

  const handleSave = async () => {
    // Validate API key format (client-side check)
    if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
      return; // Button should be disabled, but extra safety
    }
    if (!systemPrompt) return;

    await updateMutation.mutateAsync({
      openaiApiKey: apiKey,
      openaiModel: model,
      systemPrompt: systemPrompt,
      maxCompletionTokens: maxCompletionTokens,
    });

    setIsModified(false);
  };

  // Loading state
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading AI settings...</div>;
  }

  // Client-side validation
  // Note: Masked keys (containing '***') are considered valid since they're already saved
  const isMaskedKey = apiKey && apiKey.includes('***');
  const isApiKeyValid = isMaskedKey || (apiKey && apiKey.startsWith('sk-') && apiKey.length >= 20);
  const isSaveDisabled =
    !isModified ||
    !isApiKeyValid ||
    !systemPrompt ||
    updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* OpenAI API Key Field */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">OpenAI API Key</Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showApiKey ? 'text' : 'password'}
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsModified(true);
            }}
            className="pr-10"
            aria-label="OpenAI API Key"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
          >
            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {apiKey && !isApiKeyValid && (
          <p className="text-xs text-destructive">
            API key must start with "sk-" and be at least 20 characters
          </p>
        )}
        {isMaskedKey && (
          <p className="text-xs text-muted-foreground">
            API key is saved and masked for security. Enter a new key to update or test.
          </p>
        )}
        {!isMaskedKey && (
          <p className="text-xs text-muted-foreground">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              OpenAI Platform
            </a>
          </p>
        )}
      </div>

      {/* AI Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model">AI Model</Label>
        <Select
          value={model}
          onValueChange={(value) => {
            setModel(value);
            setIsModified(true);
          }}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-5-mini">GPT-5 Mini (Default)</SelectItem>
            <SelectItem value="gpt-5">GPT-5</SelectItem>
            <SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          GPT-5 Mini is recommended for cost-effectiveness
        </p>
      </div>

      {/* Max Completion Tokens */}
      <div className="space-y-2">
        <Label htmlFor="maxCompletionTokens">Max Completion Tokens</Label>
        <Input
          id="maxCompletionTokens"
          type="number"
          min="100"
          max="128000"
          step="100"
          value={maxCompletionTokens}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 100 && value <= 128000) {
              setMaxCompletionTokens(value);
              setIsModified(true);
            }
          }}
          aria-label="Maximum completion tokens"
        />
        <p className="text-xs text-muted-foreground">
          Token limit for AI responses (100-128,000). GPT-5 uses tokens for both reasoning and output. Default: 2000
        </p>
      </div>

      {/* System Prompt Textarea */}
      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          rows={8}
          value={systemPrompt}
          onChange={(e) => {
            setSystemPrompt(e.target.value);
            setIsModified(true);
          }}
          placeholder="Enter custom system prompt..."
          className="font-mono text-sm"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Customize how AI summarizes emails</span>
          <span
            className={
              systemPrompt.length > 2000
                ? 'text-amber-600 font-medium'
                : 'text-muted-foreground'
            }
          >
            {systemPrompt.length} characters{' '}
            {systemPrompt.length > 2000 && '(long prompts increase costs)'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={!apiKey || isMaskedKey || testConnectionMutation.isPending}
          title={isMaskedKey ? "Enter a new API key to test connection" : ""}
        >
          {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={handleSave} disabled={isSaveDisabled}>
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
