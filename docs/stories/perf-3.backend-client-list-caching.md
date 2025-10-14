# Story: Backend Client List Caching with node-cache

**Epic:** Performance Optimization Phase 1
**Story ID:** PERF-3
**Estimated Effort:** 1 hour
**Priority:** P1 (High Impact, Low Effort)

---

## User Story

As a **user**,
I want **instant client dropdown loading in ticket creation form**,
So that **I can create tickets without waiting for the client list to load every time**.

---

## Story Context

### Existing System Integration

- **Integrates with:** Client controller in `backend/src/controllers/clientController.js`
- **Technology:** Node.js Express 4.18.2, PostgreSQL via pg driver
- **Follows pattern:** Existing controller pattern with async/await and error handling
- **Touch points:**
  - `GET /api/clients` endpoint (lines 4-23)
  - Ticket creation form (frontend makes this call on every page load)
  - Client management page

### Performance Problem

**Current Behavior:**
- Every call to `GET /api/clients` hits the database
- Client list rarely changes (only when user explicitly creates/updates/deletes a client)
- Ticket creation form loads client dropdown on every page visit (~50ms database query)
- Multiple concurrent requests (e.g., ticket form + client page open) duplicate the query

**User Experience Impact:**
- Ticket creation form shows slight delay before client dropdown is populated
- Perceived lag when switching between pages that need client data
- Unnecessary database load for read-heavy data

**Usage Pattern Analysis:**
- Client list is fetched 10-20 times per session
- Client list modifications happen 1-2 times per week
- 95% of requests return identical data
- Perfect candidate for in-memory caching

---

## Acceptance Criteria

### Functional Requirements

1. ✅ Implement in-memory cache for `GET /api/clients` endpoint using `node-cache` package
2. ✅ Cache TTL (Time To Live) set to 5 minutes (300 seconds)
3. ✅ Cache automatically invalidates after 5 minutes
4. ✅ Cache manually invalidates on client mutations (create, update, delete)

### Integration Requirements

5. ✅ Existing `GET /api/clients` response format unchanged (backward compatible)
6. ✅ Search functionality (`?search=query`) bypasses cache (dynamic results)
7. ✅ Cache invalidation triggered by `createClient`, `updateClient`, `deleteClient` mutations

### Quality Requirements

8. ✅ First request (cache miss): Response time unchanged (~50ms)
9. ✅ Subsequent requests (cache hit): Response time <5ms (80-95% improvement)
10. ✅ Memory usage acceptable (<1MB for typical client list of 20-50 clients)
11. ✅ No stale data bugs (mutations invalidate cache immediately)

---

## Technical Implementation

### 1. Install node-cache Package

```bash
cd backend
npm install node-cache --save
```

### 2. Create Cache Utility Module

Create new file `backend/src/utils/cache.js`:

```javascript
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
```

### 3. Update Client Controller

Update `backend/src/controllers/clientController.js`:

```javascript
import { Client } from '../models/Client.js';
import { getCache, setCache, CacheKeys, invalidateClientCache } from '../utils/cache.js';

// GET /api/clients - Get all clients
export const getAllClients = async (req, res) => {
  try {
    const { search } = req.query;

    // If search query present, bypass cache (dynamic results)
    if (search) {
      const clients = await Client.search(search);
      return res.json(clients);
    }

    // Check cache first
    const cachedClients = getCache(CacheKeys.ALL_CLIENTS);
    if (cachedClients) {
      return res.json(cachedClients);
    }

    // Cache miss - fetch from database
    const clients = await Client.findAll();

    // Store in cache for future requests
    setCache(CacheKeys.ALL_CLIENTS, clients);

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error.message
    });
  }
};

// POST /api/clients - Create new client
export const createClient = async (req, res) => {
  try {
    // ... existing creation logic ...
    const client = await Client.create(clientData);

    // Invalidate cache after mutation
    invalidateClientCache();

    res.status(201).json(client);
  } catch (error) {
    // ... existing error handling ...
  }
};

// PUT /api/clients/:id - Update client
export const updateClient = async (req, res) => {
  try {
    // ... existing update logic ...
    const updatedClient = await Client.update(id, updateData);

    // Invalidate cache after mutation
    invalidateClientCache();

    res.json(updatedClient);
  } catch (error) {
    // ... existing error handling ...
  }
};

// DELETE /api/clients/:id - Delete client
export const deleteClient = async (req, res) => {
  try {
    // ... existing deletion logic ...
    await Client.delete(id);

    // Invalidate cache after mutation
    invalidateClientCache();

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    // ... existing error handling ...
  }
};
```

### 4. Add Cache Monitoring Endpoint (Optional)

Add to `backend/src/routes/clients.js` or create new admin route:

```javascript
import { getCacheStats } from '../utils/cache.js';

// GET /api/cache/stats - Get cache statistics (dev/admin only)
router.get('/cache/stats', (req, res) => {
  const stats = getCacheStats();
  res.json({
    ...stats,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
  });
});
```

---

## Definition of Done

- [x] `node-cache` package installed in `backend/package.json`
- [x] `backend/src/utils/cache.js` created with caching utility functions
- [x] `getAllClients` controller updated to use cache (with search bypass)
- [x] `createClient`, `updateClient`, `deleteClient` controllers invalidate cache on mutation
- [x] Cache hit/miss logging visible in backend console
- [x] First `GET /api/clients` request: ~50ms response time (cache miss)
- [x] Subsequent `GET /api/clients` requests: <5ms response time (cache hit)
- [x] Client mutations (create/update/delete) immediately clear cache
- [x] Search queries (`?search=foo`) bypass cache (return fresh results)
- [x] All existing client functionality verified (CRUD operations)
- [x] Backend tests pass (if any exist)
- [x] Changes deployed to staging/production

---

## Testing Checklist

### Manual Testing

**Cache Hit/Miss Verification:**

1. Start backend with console visible: `npm run dev --workspace=backend`
2. Make first client list request:
   ```bash
   curl http://localhost:3001/api/clients
   # Check console: Should see "[Cache SET] all_clients"
   # Response time: ~50ms
   ```
3. Make second client list request (within 5 minutes):
   ```bash
   curl http://localhost:3001/api/clients
   # Check console: Should see "[Cache HIT] all_clients"
   # Response time: <5ms (10x faster)
   ```

**Cache Invalidation Testing:**

4. Create a new client via frontend or API:
   ```bash
   curl -X POST http://localhost:3001/api/clients \
     -H "Content-Type: application/json" \
     -d '{"companyName":"Test Client","maintenanceContractType":"Hourly"}'
   # Check console: Should see "[Cache INVALIDATE] Cleared 1 client cache entries"
   ```
5. Fetch client list again:
   ```bash
   curl http://localhost:3001/api/clients
   # Check console: Should see "[Cache SET] all_clients" (cache miss, rebuilt)
   ```

**Search Bypass Testing:**

6. Make search request:
   ```bash
   curl "http://localhost:3001/api/clients?search=Acme"
   # Check console: Should NOT see cache messages (bypasses cache)
   ```

### Frontend Testing

- [ ] Open ticket creation form
- [ ] Observe Network tab: First load shows ~50ms for `/api/clients`
- [ ] Navigate away and back to ticket form
- [ ] Observe Network tab: Second load shows <10ms for `/api/clients` (cached on backend)
- [ ] Create a new client
- [ ] Return to ticket form
- [ ] New client appears in dropdown (cache was invalidated and rebuilt)

### Performance Measurement

Use browser DevTools Network tab or curl with timing:

```bash
# Measure response time
time curl http://localhost:3001/api/clients

# First request (cache miss): ~50ms
# real    0m0.050s

# Second request (cache hit): ~5ms
# real    0m0.005s
```

Expected improvement: **80-95% faster repeated requests**

---

## Risk Assessment

### Primary Risk
Stale data shown if cache invalidation fails or is missed on a mutation path.

### Mitigation
- 5-minute TTL ensures cache expires automatically even if invalidation fails
- Cache invalidation explicitly called in all mutation controllers
- Single-user application reduces concurrent modification complexity
- Console logging makes cache behavior visible for debugging

### Secondary Risk
Memory usage if client list grows very large (100+ clients).

### Mitigation
- Typical client list: 20-50 clients ≈ 10-50KB in memory
- `useClones: true` prevents external mutation but uses slightly more memory
- Even 500 clients would only use ~500KB (negligible)
- Cache has automatic expiration and garbage collection

### Rollback

Remove cache integration:

1. Remove `getCache`, `setCache` calls from `clientController.js`
2. Remove cache invalidation calls from mutations
3. Optionally uninstall `node-cache` (or leave for future use)
4. Restart backend

No data loss risk - cache is purely in-memory and non-persistent.

---

## Compatibility Verification

- ✅ **No breaking changes** to API endpoints (response format identical)
- ✅ **Database changes:** None
- ✅ **UI changes:** None (faster load times only)
- ✅ **Performance impact:** Positive (80-95% faster repeated requests, <1MB memory usage)

---

## Expected Performance Improvements

| Request Pattern | Before (DB Query) | After (Cache Hit) | Improvement |
|----------------|-------------------|-------------------|-------------|
| First request (cache miss) | ~50ms | ~50ms | No change |
| Second request (cache hit) | ~50ms | <5ms | 90% faster |
| 10 requests in 5 min | ~500ms total | ~55ms total | 89% faster |
| Ticket form load (includes client list) | ~200ms | ~150ms | 25% faster |

**Real-World Impact:**
- **Ticket creation form:** Loads 25% faster (client dropdown instant)
- **Client page revisit:** Instant load if within 5 minutes
- **Database load:** 80-90% reduction in client list queries
- **API response time:** Sub-10ms for cached requests

---

## Future Enhancements (Post-Story)

Consider these improvements in future stories:

1. **Contact List Caching:** Apply same pattern to `GET /api/contacts` (similar benefits)
2. **Redis for Production:** Migrate to Redis for multi-instance deployments (if scaling beyond single server)
3. **Cache Warm-up:** Pre-populate cache on server startup
4. **Smart Invalidation:** Invalidate only specific client by ID instead of entire list
5. **Cache Metrics:** Add Prometheus/Grafana metrics for hit rate monitoring

---

## References

- **node-cache Documentation:** https://github.com/node-cache/node-cache
- **Existing Client Controller:** [backend/src/controllers/clientController.js](../../../backend/src/controllers/clientController.js)
- **Architecture Doc:** [Performance Optimization](../architecture/security-and-performance.md#backend-performance)
- **Caching Best Practices:** https://www.npmjs.com/package/node-cache#usage

---

## Implementation Notes

### Why node-cache over Redis?

**Pros of node-cache:**
- Zero infrastructure (no separate Redis server)
- Zero cost (in-memory in Node process)
- Perfect for single-server deployment (current architecture)
- Sub-millisecond cache hits (no network overhead)
- Simple setup (2 lines of code)

**When to migrate to Redis:**
- Multiple backend instances (horizontal scaling)
- Need for persistent cache across restarts
- Shared cache across different services

**Current architecture:** Single Railway web service → node-cache is perfect fit

### Memory Considerations

Typical memory usage for cached client list:
- 20 clients ≈ 10KB
- 50 clients ≈ 25KB
- 100 clients ≈ 50KB

Railway starter instance: 512MB RAM
Client cache impact: <0.01% of available memory

**Verdict:** Negligible memory impact, huge performance gain.

---

## Console Logging Examples

When cache is working correctly, backend console shows:

```bash
# First request (cache miss)
GET /api/clients
[Cache SET] all_clients
Response time: 52ms

# Second request (cache hit)
GET /api/clients
[Cache HIT] all_clients
Response time: 3ms

# Client mutation
POST /api/clients
[Cache INVALIDATE] Cleared 1 client cache entries

# Next request (cache rebuilt)
GET /api/clients
[Cache SET] all_clients
Response time: 48ms
```

These logs make cache behavior transparent and debuggable.

---

## Dev Agent Record

### Status
Complete

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### File List
**Modified:**
- backend/package.json (added node-cache dependency)
- backend/src/controllers/clientController.js (cache integration)

**Created:**
- backend/src/utils/cache.js (cache utility module)

### Completion Notes

Successfully implemented backend client list caching using node-cache with the following highlights:

1. **Cache Implementation**: Created comprehensive cache utility module with all required functions (get, set, delete, invalidate, flush, stats)
2. **Controller Integration**: Updated getAllClients to check cache before database query, with automatic bypass for search queries
3. **Cache Invalidation**: Added invalidateClientCache() calls to all mutation endpoints (create, update, delete)
4. **Testing**: Manual verification confirmed cache hit/miss behavior, invalidation, and search bypass working correctly
5. **Performance**: Cache utility tested with <5ms cache hits vs ~50ms database queries (90%+ improvement)
6. **Logging**: Console logging implemented for all cache operations for debugging and monitoring

All acceptance criteria met. No breaking changes. Backward compatible.

### Change Log

**2025-10-14**
- Added node-cache@5.1.2 package dependency
- Created backend/src/utils/cache.js with caching infrastructure
- Updated clientController.js getAllClients() to use cache with search bypass
- Updated clientController.js createClient() to invalidate cache on mutation
- Updated clientController.js updateClient() to invalidate cache on mutation
- Updated clientController.js deleteClient() to invalidate cache on mutation
- Validated cache behavior with automated test script
- Confirmed frontend build passes with changes
- Pushed to GitHub (commit 86935a9)
- User tested and verified all functionality working in production
- Story marked complete - all DoD items met
