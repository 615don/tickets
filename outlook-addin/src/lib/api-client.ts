const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include session cookies for auth
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to the web app.');
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
