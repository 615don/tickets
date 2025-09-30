/**
 * API Client for backend communication
 * Handles authentication, error handling, and request/response formatting
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Core API client with automatic error handling and authentication
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, ...fetchConfig } = config;

    // Build URL with query parameters
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    // Default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchConfig.headers,
    };

    try {
      const response = await fetch(url.toString(), {
        ...fetchConfig,
        headers,
        credentials: 'include', // Send cookies for session auth
      });

      // Handle non-JSON responses (like 204 No Content)
      const contentType = response.headers.get('content-type');
      const hasJson = contentType?.includes('application/json');

      if (!response.ok) {
        const errorData = hasJson ? await response.json() : null;
        throw new ApiError(
          response.status,
          errorData?.message || errorData?.error || `Request failed with status ${response.status}`,
          errorData
        );
      }

      // Return null for empty responses
      if (response.status === 204 || !hasJson) {
        return null as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors or other fetch errors
      throw new ApiError(
        0,
        'Network error: Unable to reach the server',
        { originalError: error }
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Health check endpoint for testing connectivity
 */
export const checkHealth = () => apiClient.get('/api/health');
