/**
 * User profile management hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserEmail, updateUserPassword } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api-client';

/**
 * Hook for updating user email
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ email, currentPassword }: { email: string; currentPassword: string }) =>
      updateUserEmail(email, currentPassword),
    onSuccess: () => {
      // Invalidate auth query to refresh session
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
      toast({
        title: 'Email updated successfully',
      });
    },
    onError: (error: Error | ApiError) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update email',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating user password
 */
export function useUpdatePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
      confirmPassword,
    }: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => updateUserPassword(currentPassword, newPassword, confirmPassword),
    onSuccess: () => {
      toast({
        title: 'Password updated successfully',
      });
    },
    onError: (error: Error | ApiError) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    },
  });
}
