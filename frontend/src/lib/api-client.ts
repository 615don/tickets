/**
 * API Client for backend communication
 * Handles authentication, error handling, and request/response formatting
 */

// Use relative URL in production (proxied), absolute in dev if needed
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  private csrfToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Fetch CSRF token from the server
   */
  private async fetchCsrfToken(): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    this.csrfToken = data.csrfToken;
    return this.csrfToken;
  }

  /**
   * Get or fetch CSRF token
   */
  private async getCsrfToken(): Promise<string> {
    if (!this.csrfToken) {
      await this.fetchCsrfToken();
    }
    return this.csrfToken!;
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

    // Add CSRF token for state-changing requests
    const method = fetchConfig.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = await this.getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
    }

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
        // If CSRF token is invalid, refresh and retry once
        if (response.status === 403 && method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          this.csrfToken = null;
          const newCsrfToken = await this.getCsrfToken();
          headers['X-CSRF-Token'] = newCsrfToken;

          const retryResponse = await fetch(url.toString(), {
            ...fetchConfig,
            headers,
            credentials: 'include',
          });

          if (retryResponse.ok) {
            const retryContentType = retryResponse.headers.get('content-type');
            const retryHasJson = retryContentType?.includes('application/json');

            if (retryResponse.status === 204 || !retryHasJson) {
              return null as T;
            }
            return await retryResponse.json();
          }
        }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
