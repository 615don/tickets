import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  aiSettingsApi,
  type AiSettings,
  type UpdateAiSettingsPayload,
  type TestConnectionPayload,
} from '@/lib/api/ai-settings';
import { useToast } from '@/hooks/use-toast';

/**
 * TanStack Query hooks for AI Settings
 */

/**
 * Query hook to fetch AI settings
 */
export function useAiSettings() {
  return useQuery({
    queryKey: ['aiSettings'],
    queryFn: aiSettingsApi.getAiSettings,
  });
}

/**
 * Mutation hook to update AI settings
 */
export function useUpdateAiSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: aiSettingsApi.updateAiSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
      toast({
        title: 'Settings Saved',
        description: data.message || 'AI settings saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save AI settings. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to test AI connection
 */
export function useTestAiConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: aiSettingsApi.testAiConnection,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Connection Test Successful',
          description: data.message || 'Your OpenAI API key is valid.',
        });
      } else {
        toast({
          title: 'Connection Test Failed',
          description: data.error || data.message || 'Could not validate API key.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Network error during connection test.',
        variant: 'destructive',
      });
    },
  });
}
