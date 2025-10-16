/**
 * Lenovo Warranty Lookup Service
 * Uses Lenovo Support API v2.5 to fetch warranty information
 *
 * API Documentation: https://supportapi.lenovo.com/documentation
 * Endpoint: https://supportapi.lenovo.com/v2.5/warranty
 */

const LENOVO_API_BASE_URL = 'https://supportapi.lenovo.com/v2.5';
const LENOVO_API_KEY = process.env.LENOVO_API_KEY;
const TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Lookup warranty information for a Lenovo device by serial number
 * @param {string} serialNumber - The device serial number
 * @returns {Promise<Object>} Warranty information
 */
export async function lookupLenovoWarranty(serialNumber) {
  if (!LENOVO_API_KEY) {
    throw new Error('Lenovo API key not configured. Please set LENOVO_API_KEY environment variable.');
  }

  if (!serialNumber || serialNumber.trim() === '') {
    throw new Error('Serial number is required');
  }

  // Setup timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = new URL(`${LENOVO_API_BASE_URL}/warranty`);
    url.searchParams.append('Serial', serialNumber.trim());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'ClientID': LENOVO_API_KEY,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle HTTP error responses
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Lenovo API key. Please check your ClientID.');
      } else if (response.status === 404) {
        throw new Error('Serial number not found in Lenovo database.');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Lenovo API error (${response.status}): ${errorData.message || 'Unknown error'}`);
      }
    }

    // Parse the response
    const data = await response.json();

    // Log the raw response for debugging
    console.log('Lenovo API raw response:', JSON.stringify(data, null, 2));

    // Handle different response formats
    if (!data || data.length === 0) {
      throw new Error('No warranty information found for this serial number');
    }

    // Lenovo API returns an array, get the first result
    const warrantyInfo = Array.isArray(data) ? data[0] : data;

    console.log('Processing warranty info:', JSON.stringify(warrantyInfo, null, 2));

    // Extract warranty details
    const warranty = parseWarrantyData(warrantyInfo);

    console.log('Parsed warranty:', warranty);

    return {
      success: true,
      serialNumber: serialNumber,
      warrantyEndDate: warranty.endDate,
      warrantyStartDate: warranty.startDate,
      serviceLevel: warranty.serviceLevel,
      productName: warranty.productName,
      rawResponse: warrantyInfo
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      throw new Error('Unable to reach Lenovo API. Request timed out.');
    }

    // Handle network errors
    if (error.cause || error.message.includes('fetch')) {
      throw new Error('Unable to reach Lenovo API. Please check your internet connection.');
    }

    // Re-throw already formatted errors
    throw error;
  }
}

/**
 * Parse warranty data from Lenovo API response
 * @param {Object} data - Raw API response data
 * @returns {Object} Parsed warranty information
 */
function parseWarrantyData(data) {
  // Lenovo API response structure may vary, handle different formats
  let endDate = null;
  let startDate = null;
  let serviceLevel = 'Unknown';
  let productName = 'Unknown';

  try {
    // Extract product information
    if (data.Product) {
      // Extract product name from Product path
      const productParts = data.Product.split('/');
      productName = productParts[productParts.length - 2] || data.Product;
    } else if (data.ProductName) {
      productName = data.ProductName;
    } else if (data.Model) {
      productName = data.Model;
    }

    // Lenovo API v2.5 returns warranty info in an array
    if (data.Warranty && Array.isArray(data.Warranty) && data.Warranty.length > 0) {
      // Find the warranty with the latest end date (usually the base warranty)
      let latestWarranty = data.Warranty[0];

      for (const warranty of data.Warranty) {
        const currentEnd = new Date(warranty.End);
        const latestEnd = new Date(latestWarranty.End);

        if (currentEnd > latestEnd) {
          latestWarranty = warranty;
        }
      }

      // Set the warranty dates from the latest warranty
      if (latestWarranty.End) {
        endDate = new Date(latestWarranty.End);
      }
      if (latestWarranty.Start) {
        startDate = new Date(latestWarranty.Start);
      }
      if (latestWarranty.Name) {
        serviceLevel = latestWarranty.Name;
      } else if (latestWarranty.Description) {
        serviceLevel = latestWarranty.Description.substring(0, 100); // Limit length
      }
    }
    // Fallback: Check for direct properties
    else if (data.WarrantyEnd) {
      endDate = new Date(data.WarrantyEnd);
      startDate = data.WarrantyStart ? new Date(data.WarrantyStart) : null;
      serviceLevel = data.WarrantyType || data.ServiceType || 'Unknown';
    } else if (data.End) {
      endDate = new Date(data.End);
      startDate = data.Start ? new Date(data.Start) : null;
      serviceLevel = data.Type || 'Unknown';
    }

  } catch (parseError) {
    console.error('Error parsing Lenovo warranty data:', parseError);
  }

  return {
    endDate,
    startDate,
    serviceLevel,
    productName
  };
}

/**
 * Test if Lenovo API is configured and accessible
 * @returns {Promise<boolean>} True if API is working
 */
export async function testLenovoAPI() {
  if (!LENOVO_API_KEY) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(`${LENOVO_API_BASE_URL}/warranty`);
    url.searchParams.append('Serial', 'TEST123'); // This will likely return 404, but that's ok for testing auth

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'ClientID': LENOVO_API_KEY,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 404 is ok - means API key works but serial not found
    if (response.status === 404) {
      return true;
    }

    // 401 means API key is invalid
    if (response.status === 401) {
      return false;
    }

    return response.ok;
  } catch (error) {
    clearTimeout(timeoutId);
    return false;
  }
}
