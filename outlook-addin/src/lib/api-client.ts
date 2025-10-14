const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

// Debug mode flag (controlled by VITE_DEBUG_API environment variable)
const DEBUG_API = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_API === 'true') || false;

// CSRF token cache
let csrfToken: string | null = null;

/**
 * Check if session cookie is present in browser
 * Used for debugging session issues
 */
function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('connect.sid');
}

/**
 * Log debug information (only when DEBUG_API is true)
 */
function debugLog(category: string, data: any): void {
  if (!DEBUG_API) return;
  console.log(`[API DEBUG - ${category}]`, {
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Fetch CSRF token from backend
 * Token is cached and reused for subsequent requests
 */
async function getCsrfToken(): Promise<string> {
  debugLog('CSRF Token', {
    cached: !!csrfToken,
    hasSessionCookie: hasSessionCookie(),
  });

  if (csrfToken) {
    debugLog('CSRF Token', { action: 'using cached token' });
    return csrfToken;
  }

  try {
    debugLog('CSRF Token', { action: 'fetching new token' });

    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Required to establish session
    });

    if (!response.ok) {
      debugLog('CSRF Token', {
        action: 'fetch failed',
        status: response.status,
        hasSessionCookie: hasSessionCookie(),
      });
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    csrfToken = data.csrfToken;

    debugLog('CSRF Token', {
      action: 'token fetched successfully',
      hasSessionCookie: hasSessionCookie(),
    });

    return csrfToken;
  } catch (error) {
    debugLog('CSRF Token', {
      action: 'fetch error',
      error: error instanceof Error ? error.message : String(error),
      hasSessionCookie: hasSessionCookie(),
    });
    console.error('CSRF token fetch failed:', error);
    throw new Error('Failed to initialize security token. Please refresh and try again.');
  }
}

/**
 * Clear cached CSRF token (used when token becomes invalid)
 */
function clearCsrfToken(): void {
  debugLog('CSRF Token', { action: 'clearing cached token' });
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

  // Debug log for API request
  debugLog('API Request', {
    endpoint,
    method,
    hasCsrfToken: requiresCsrf,
    hasSessionCookie: hasSessionCookie(),
  });

  try {
    const response = await fetch(url, config);

    // Debug log for API response
    debugLog('API Response', {
      endpoint,
      method,
      status: response.status,
      ok: response.ok,
      hasSessionCookie: hasSessionCookie(),
    });

    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 401) {
        debugLog('API Error', {
          endpoint,
          status: 401,
          error: 'Authentication required',
          hasSessionCookie: hasSessionCookie(),
        });
        throw new Error('Authentication required. Please log in to the web app.');
      }

      // CSRF token invalid - clear cache and let user retry
      if (response.status === 403) {
        debugLog('API Error', {
          endpoint,
          status: 403,
          error: 'CSRF token invalid',
          action: 'clearing CSRF cache',
          hasSessionCookie: hasSessionCookie(),
        });
        clearCsrfToken();
        throw new Error('Security token expired. Please try again.');
      }

      const errorData = await response.json().catch(() => ({}));
      debugLog('API Error', {
        endpoint,
        status: response.status,
        error: errorData.message || response.statusText,
        hasSessionCookie: hasSessionCookie(),
      });
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Network errors or fetch failures
    if (error instanceof TypeError) {
      debugLog('API Error', {
        endpoint,
        error: 'Network error',
        hasSessionCookie: hasSessionCookie(),
      });
      throw new Error('Network error. Check your connection and try again.');
    }
    throw error;
  }
}
