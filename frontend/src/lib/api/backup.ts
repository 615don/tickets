const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get CSRF token from the server
 */
async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
}

export const backupApi = {
  async generateBackup(): Promise<void> {
    // Get CSRF token for POST request
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/api/backup/generate`, {
      method: 'POST',
      credentials: 'include', // Include session cookie
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    });

    if (!response.ok) {
      // Handle error responses
      const contentType = response.headers.get('content-type');
      const hasJson = contentType?.includes('application/json');

      if (hasJson) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Backup generation failed');
      } else {
        throw new Error(`Backup generation failed with status ${response.status}`);
      }
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
    const filename = filenameMatch?.[1] || 'backup.zip';

    // Create blob from response
    const blob = await response.blob();

    // Trigger browser download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
