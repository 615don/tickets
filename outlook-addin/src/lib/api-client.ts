const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

// CSRF token cache
let csrfToken: string | null = null;

/**
 * Fetch CSRF token from backend
 * Token is cached and reused for subsequent requests
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Required to establish session
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('CSRF token fetch failed:', error);
    throw new Error('Failed to initialize security token. Please refresh and try again.');
  }
}

/**
 * Clear cached CSRF token (used when token becomes invalid)
 */
function clearCsrfToken(): void {
  csrfToken = null;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method?.toUpperCase() || 'GET';

  // Fetch CSRF token for state-changing methods
  const requiresCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  let headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresCsrf) {
    const token = await getCsrfToken();
    headers = {
      ...headers,
      'X-CSRF-Token': token,
    };
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include session cookies for auth
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to the web app.');
      }

      // CSRF token invalid - clear cache and let user retry
      if (response.status === 403) {
        clearCsrfToken();
        throw new Error('Security token expired. Please try again.');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Network errors or fetch failures
    if (error instanceof TypeError) {
      throw new Error('Network error. Check your connection and try again.');
    }
    throw error;
  }
}
