/**
 * Authentication API endpoints
 */

import { apiClient } from '../api-client';

export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Register a new user
 */
export const register = (data: RegisterData) =>
  apiClient.post<AuthResponse>('/api/auth/register', data);

/**
 * Login with email and password
 */
export const login = (credentials: LoginCredentials) =>
  apiClient.post<AuthResponse>('/api/auth/login', credentials);

/**
 * Logout current user
 */
export const logout = () =>
  apiClient.post<{ message: string }>('/api/auth/logout');

/**
 * Get current authenticated user
 */
export const getCurrentUser = () =>
  apiClient.get<{ user: User }>('/api/auth/me');

/**
 * Update user email (requires current password)
 */
export const updateUserEmail = (email: string, currentPassword: string) =>
  apiClient.put<{ user: User; message: string }>('/api/auth/profile', {
    email,
    currentPassword,
  });

/**
 * Update user password
 */
export const updateUserPassword = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) =>
  apiClient.put<{ message: string }>('/api/auth/password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
