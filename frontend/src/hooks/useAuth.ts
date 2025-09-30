/**
 * Authentication state management hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, login, logout, LoginCredentials } from '@/lib/api/auth';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api-client';

/**
 * Hook for managing authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Query current user
  const {
    data: currentUser,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      try {
        const response = await getCurrentUser();
        return response.user;
      } catch (err) {
        // If 401, user is not authenticated (this is expected)
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Update the current user in cache
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      navigate('/');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear user from cache
      queryClient.setQueryData(['auth', 'currentUser'], null);
      // Invalidate all queries to clear cached data
      queryClient.invalidateQueries();
      navigate('/login');
    },
  });

  return {
    user: currentUser ?? null,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    login: (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    logout: () => logoutMutation.mutateAsync(),
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
