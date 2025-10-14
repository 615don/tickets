import NodeCache from 'node-cache';

/**
 * In-memory cache for read-heavy data
 * - Client list (rarely changes, frequently accessed)
 * - Future: Contact list, Xero connection status
 */

// Initialize cache with 5 minute TTL
const cache = new NodeCache({
  stdTTL: 300,           // 5 minutes default TTL
  checkperiod: 60,       // Check for expired keys every 60 seconds
  useClones: true,       // Clone objects to prevent external mutations
  deleteOnExpire: true,  // Automatically delete expired keys
});

// Cache key constants
export const CacheKeys = {
  ALL_CLIENTS: 'all_clients',
  CLIENT_BY_ID: (id) => `client_${id}`,
  ALL_CONTACTS: 'all_contacts',
  CONTACTS_BY_CLIENT: (clientId) => `contacts_client_${clientId}`,
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any|undefined} - Cached value or undefined if not found
 */
export function getCache(key) {
  const value = cache.get(key);
  if (value !== undefined) {
    console.log(`[Cache HIT] ${key}`);
  }
  return value;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Optional TTL in seconds (overrides default)
 */
export function setCache(key, value, ttl = undefined) {
  const success = cache.set(key, value, ttl);
  if (success) {
    console.log(`[Cache SET] ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
  }
  return success;
}

/**
 * Delete specific key from cache
 * @param {string} key - Cache key to delete
 */
export function deleteCache(key) {
  const count = cache.del(key);
  if (count > 0) {
    console.log(`[Cache DELETE] ${key}`);
  }
  return count;
}

/**
 * Invalidate all client-related cache entries
 * Call after any client mutation (create, update, delete)
 */
export function invalidateClientCache() {
  const keys = [
    CacheKeys.ALL_CLIENTS,
    // Could also invalidate specific client by ID if needed
  ];
  const deleted = cache.del(keys);
  console.log(`[Cache INVALIDATE] Cleared ${deleted} client cache entries`);
  return deleted;
}

/**
 * Invalidate all contact-related cache entries
 * Call after any contact mutation
 */
export function invalidateContactCache() {
  // Get all keys matching pattern 'contacts_*'
  const allKeys = cache.keys();
  const contactKeys = allKeys.filter(key => key.startsWith('contacts_'));
  const deleted = cache.del(contactKeys);
  console.log(`[Cache INVALIDATE] Cleared ${deleted} contact cache entries`);
  return deleted;
}

/**
 * Clear entire cache (use for testing/debugging)
 */
export function flushCache() {
  cache.flushAll();
  console.log('[Cache FLUSH] All cache cleared');
}

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 */
export function getCacheStats() {
  return cache.getStats();
}

export default cache;
