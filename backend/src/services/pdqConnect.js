/**
 * PDQ Connect API Service
 * Queries PDQ Connect API to fetch device information by serial number
 *
 * API Documentation: https://app.pdq.com/v1/api
 * Endpoint: https://app.pdq.com/v1/api/devices
 */

const PDQ_API_BASE_URL = 'https://app.pdq.com/v1/api';
const TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Sanitize serial number input
 * @param {string} serialNumber - Raw serial number input
 * @returns {string} Sanitized serial number
 */
function sanitizeSerialNumber(serialNumber) {
  if (!serialNumber) {
    return '';
  }

  // Trim whitespace and validate alphanumeric characters (allow hyphens/underscores)
  const trimmed = serialNumber.trim();

  // Check if contains only valid characters (alphanumeric + hyphen/underscore)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error('Serial number contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.');
  }

  return trimmed;
}

/**
 * Lookup PDQ device by serial number
 * @param {string} serialNumber - The device serial number
 * @returns {Promise<Object>} Normalized response with success status, pdqDeviceId, and error message
 */
export async function lookupPDQDeviceBySerial(serialNumber) {
  // Check if API key is configured (read at runtime for testability)
  const PDQ_API_KEY = process.env.PDQ_API_KEY;

  if (!PDQ_API_KEY) {
    console.log('PDQ API key not configured');
    return {
      success: false,
      pdqDeviceId: null,
      error: 'PDQ API key not configured or invalid'
    };
  }

  // Validate and sanitize serial number
  if (!serialNumber || serialNumber.trim() === '') {
    return {
      success: false,
      pdqDeviceId: null,
      error: 'Serial number is required'
    };
  }

  let sanitizedSerial;
  try {
    sanitizedSerial = sanitizeSerialNumber(serialNumber);
  } catch (error) {
    console.error('Serial number sanitization failed:', error.message);
    return {
      success: false,
      pdqDeviceId: null,
      error: error.message
    };
  }

  // Setup timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Build URL with filter parameter
    const url = new URL(`${PDQ_API_BASE_URL}/devices`);
    url.searchParams.append('filter[serialNumber]', sanitizedSerial);

    console.log(`PDQ API: Looking up device with serial ${sanitizedSerial}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PDQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle HTTP error responses
    if (!response.ok) {
      if (response.status === 401) {
        console.error('PDQ API authentication failed (401)');
        return {
          success: false,
          pdqDeviceId: null,
          error: 'PDQ API key not configured or invalid'
        };
      } else if (response.status === 404) {
        console.log('PDQ API returned 404 for serial:', sanitizedSerial);
        return {
          success: false,
          pdqDeviceId: null,
          error: 'Serial number not found in PDQ. Please enter manually if known.'
        };
      } else if (response.status === 429) {
        console.error('PDQ API rate limit exceeded (429)');
        return {
          success: false,
          pdqDeviceId: null,
          error: 'PDQ API rate limit exceeded. Please try again later.'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`PDQ API error (${response.status}):`, errorData);
        return {
          success: false,
          pdqDeviceId: null,
          error: 'Unable to connect to PDQ API. Please enter manually.'
        };
      }
    }

    // Parse the response
    const data = await response.json();

    // Log the raw response for debugging
    console.log('PDQ API raw response:', JSON.stringify(data, null, 2));

    // Check if data array is empty (no results found)
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.log('No devices found in PDQ for serial:', sanitizedSerial);
      return {
        success: false,
        pdqDeviceId: null,
        error: 'Serial number not found in PDQ. Please enter manually if known.'
      };
    }

    // Extract device ID from first match
    const device = data.data[0];
    const pdqDeviceId = device.id;

    if (!pdqDeviceId) {
      console.error('PDQ device found but missing id field:', device);
      return {
        success: false,
        pdqDeviceId: null,
        error: 'PDQ device data is incomplete. Please enter manually.'
      };
    }

    console.log(`PDQ device found: ${pdqDeviceId} for serial ${sanitizedSerial}`);

    return {
      success: true,
      pdqDeviceId: pdqDeviceId,
      error: null
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      console.error('PDQ API request timed out after', TIMEOUT_MS, 'ms');
      return {
        success: false,
        pdqDeviceId: null,
        error: 'Unable to connect to PDQ API. Please enter manually.'
      };
    }

    // Handle network errors
    if (error.cause || error.message.includes('fetch')) {
      console.error('PDQ API network error:', error);
      return {
        success: false,
        pdqDeviceId: null,
        error: 'Unable to connect to PDQ API. Please enter manually.'
      };
    }

    // Handle unexpected errors
    console.error('Unexpected error in PDQ API lookup:', error);
    return {
      success: false,
      pdqDeviceId: null,
      error: 'Unable to connect to PDQ API. Please enter manually.'
    };
  }
}
