import { query } from '../config/database.js';

// In-memory cache data structures
const contactAssetCache = new Map(); // Map<contactId, Asset[]>
const clientAssetCache = new Map(); // Map<clientId, Asset[]> - optional secondary index

// Cache statistics
let cacheHits = 0;
let cacheMisses = 0;
let lastWarmupTime = null;

// TTL configuration (optional)
const CACHE_TTL = process.env.ASSET_CACHE_TTL ? parseInt(process.env.ASSET_CACHE_TTL, 10) : 0;

/**
 * Warm cache by loading all active assets from database
 * Builds contact-based and client-based indexes for fast lookups
 */
async function warmCache() {
  try {
    const startTime = Date.now();

    // Query all active assets
    const result = await query(
      'SELECT * FROM assets WHERE status = $1 ORDER BY created_at DESC',
      ['active']
    );

    // Clear existing cache
    contactAssetCache.clear();
    clientAssetCache.clear();

    // Build contact-based index
    result.rows.forEach(asset => {
      const contactId = asset.contact_id || -1; // -1 for unassigned assets
      if (!contactAssetCache.has(contactId)) {
        contactAssetCache.set(contactId, []);
      }
      contactAssetCache.get(contactId).push(asset);
    });

    // Build client-based index (optional - for future use)
    result.rows.forEach(asset => {
      if (!clientAssetCache.has(asset.client_id)) {
        clientAssetCache.set(asset.client_id, []);
      }
      clientAssetCache.get(asset.client_id).push(asset);
    });

    const duration = Date.now() - startTime;
    lastWarmupTime = new Date();

    console.log(
      `[ASSET CACHE] Warmed with ${result.rows.length} assets for ${contactAssetCache.size} contacts in ${duration}ms`
    );
  } catch (error) {
    console.error('[ASSET CACHE] Warmup failed:', error);
    // Don't throw - allow server to start without cache
  }
}

/**
 * Get assets for a specific contact from cache
 * @param {number} contactId - Contact ID to lookup
 * @returns {Array} Array of assets (empty if not found)
 */
function getAssetsByContactId(contactId) {
  const startTime = Date.now();

  // Check TTL expiration (if configured)
  if (CACHE_TTL > 0 && lastWarmupTime) {
    const cacheAge = (Date.now() - lastWarmupTime.getTime()) / 1000;
    if (cacheAge > CACHE_TTL) {
      console.log('[ASSET CACHE] TTL expired, re-warming cache');
      warmCache().catch(err => console.error('[ASSET CACHE] Auto-warmup failed:', err));
    }
  }

  const assets = contactAssetCache.get(contactId) || [];

  // Track cache hit/miss
  if (assets.length > 0 || contactAssetCache.has(contactId)) {
    cacheHits++;
  } else {
    cacheMisses++;
  }

  // Clone to prevent external mutation
  const result = [...assets];

  const duration = Date.now() - startTime;

  // Performance logging
  if (duration > 10) {
    console.warn(`[ASSET CACHE] Slow lookup: ${duration}ms for contact_id=${contactId}`);
  }

  return result;
}

/**
 * Get assets for a specific client from cache (optional secondary index)
 * @param {number} clientId - Client ID to lookup
 * @returns {Array} Array of assets (empty if not found)
 */
function getAssetsByClientId(clientId) {
  const assets = clientAssetCache.get(clientId) || [];

  // Track cache hit/miss
  if (assets.length > 0 || clientAssetCache.has(clientId)) {
    cacheHits++;
  } else {
    cacheMisses++;
  }

  // Clone to prevent external mutation
  return [...assets];
}

/**
 * Invalidate cache and trigger re-warm
 */
async function invalidateCache() {
  console.log('[ASSET CACHE] Invalidating and re-warming cache');
  await warmCache();
}

/**
 * Get cache statistics for monitoring
 * @returns {Object} Cache stats including hits, misses, hit rate, and size
 */
function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(2) : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    hit_rate: parseFloat(hitRate),
    size: contactAssetCache.size,
    total_assets: Array.from(contactAssetCache.values()).reduce((sum, arr) => sum + arr.length, 0),
    last_warmup: lastWarmupTime ? lastWarmupTime.toISOString() : null,
    ttl_seconds: CACHE_TTL
  };
}

export {
  warmCache,
  getAssetsByContactId,
  getAssetsByClientId,
  invalidateCache,
  getCacheStats
};
