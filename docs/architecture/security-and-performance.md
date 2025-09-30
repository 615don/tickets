# Security and Performance

## Security Requirements

**Frontend Security:**

*Content Security Policy (CSP):*
- **Implementation:** helmet middleware in production mode
- **Policy:** Restrict inline scripts, allow only same-origin resources and whitelisted CDNs
- **Headers Set:**
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.xero.com`
  - `X-Frame-Options: DENY` (prevent clickjacking)
  - `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enforce HTTPS)

*XSS Prevention:*
- **React Auto-Escaping:** All user input automatically escaped in JSX (default React behavior)
- **DOMPurify:** Use for any raw HTML rendering (e.g., rich text notes - future feature)
- **Input Sanitization:** Backend express-validator sanitizes all inputs before processing
- **Code Review Rule:** Never use `dangerouslySetInnerHTML` without explicit sanitization

*Secure Storage:*
- **Session Cookies Only:** No JWT or sensitive data in localStorage/sessionStorage
- **Cookie Flags:** `httpOnly=true`, `secure=true` (production), `sameSite=lax`
- **No Client-Side Secrets:** Xero tokens and API keys never sent to frontend
- **Sensitive Data Handling:** Password hashes, Xero tokens encrypted at rest in PostgreSQL

**Backend Security:**

*Input Validation:*
- **Library:** express-validator on all API endpoints
- **Validation Strategy:**
  - Whitelist approach (explicitly allow expected fields)
  - Type checking (email, URL, numeric, date formats)
  - Length limits (prevent buffer overflow attacks)
  - Sanitization (trim, escape SQL chars via parameterized queries)
- **Example Validation Chain:**
  ```javascript
  body('email').isEmail().normalizeEmail(),
  body('companyName').trim().isLength({ min: 1, max: 255 }),
  body('domains').isArray({ max: 50 }),
  body('domains.*').isString().matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  ```

*SQL Injection Prevention:*
- **Parameterized Queries:** All database queries use `$1, $2` placeholders (never string concatenation)
- **ORM Pattern:** Model layer abstracts raw SQL, enforces parameterization
- **Code Review Rule:** Never use template literals for SQL queries

*Rate Limiting:*
- **Library:** express-rate-limit (planned for production)
- **Configuration:**
  - Global: 100 requests/15 minutes per IP
  - Auth endpoints: 5 login attempts/15 minutes per IP
  - Invoice generation: 10 requests/hour per session
- **Response:** HTTP 429 Too Many Requests with `Retry-After` header

*CORS Policy:*
- **Library:** cors middleware
- **Configuration:**
  - Development: Allow `http://localhost:8080`
  - Production: Allow `https://tickets.zollc.com` only
  - Credentials: `credentials: true` (required for session cookies)
  - Methods: `GET, POST, PUT, DELETE`
  - Headers: `Content-Type, Authorization`

**Authentication Security:**

*Token/Session Storage:*
- **Session-Based Auth:** PostgreSQL session store via connect-pg-simple
- **Session ID Generation:** Crypto-strong random (express-session default)
- **Session Table Schema:**
  - `sid` (primary key, indexed)
  - `sess` (JSONB, encrypted session data)
  - `expire` (timestamp, auto-cleanup via cron)

*Session Management:*
- **Session Lifetime:** 30 days (configurable via `SESSION_MAX_AGE`)
- **Idle Timeout:** None (MVP), consider 2-hour idle timeout post-MVP
- **Session Regeneration:** On login success (prevents session fixation)
- **Logout:** Destroys session server-side immediately
- **Concurrent Sessions:** Allowed (single user, multiple devices)

*Password Policy:*
- **Hashing Algorithm:** bcrypt with 10 rounds (balance security vs performance)
- **Password Requirements (MVP):** Minimum 8 characters (enforced client-side and backend)
- **Password Requirements (Future):**
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Check against common password lists (e.g., Have I Been Pwned API)
- **Password Reset:** Email-based token (future feature, not in MVP)

*Additional Security Measures:*
- **CSRF Protection:** SameSite cookie attribute provides sufficient protection for session-based auth
- **Brute Force Protection:** Rate limiting on `/api/auth/login` (5 attempts/15 min)
- **Audit Logging:** Track login attempts, failed auth, and sensitive operations (future enhancement)

## Performance Optimization

**Frontend Performance:**

*Bundle Size Target:*
- **Goal:** <500KB total JavaScript (uncompressed)
- **Current Estimate:** ~350KB (React 18 + React Router + React Query + shadcn/ui)
- **Monitoring:** Vite build analyzer, track bundle size in CI/CD
- **Optimization Techniques:**
  - Tree-shaking via Vite (eliminates unused code)
  - Code splitting by route (React.lazy + Suspense for page components)
  - Dependency auditing (avoid heavy libraries, prefer lightweight alternatives)

*Loading Strategy:*
- **Initial Load:**
  - Critical CSS inlined in HTML head (Tailwind base styles)
  - Preload fonts (Inter from Google Fonts or self-hosted)
  - Lazy load route components (reduce initial bundle)
- **Route-Based Code Splitting:**
  ```typescript
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const Clients = lazy(() => import('./pages/Clients'));
  const Tickets = lazy(() => import('./pages/Tickets'));
  ```
- **Image Optimization:** Use WebP format, lazy load images below fold
- **Font Loading:** `font-display: swap` to prevent FOIT (Flash of Invisible Text)

*Caching Strategy:*
- **React Query Configuration:**
  - `staleTime: 5 minutes` (data considered fresh for 5 min)
  - `cacheTime: 10 minutes` (cache retained for 10 min after last use)
  - `refetchOnWindowFocus: true` (refresh stale data on tab focus)
  - `refetchOnReconnect: true` (refresh after network reconnection)
- **Cache Invalidation:**
  - Automatic: After mutations (create, update, delete)
  - Manual: User-triggered refresh button
  - Background: React Query auto-refetches stale data
- **Service Worker (Future):** Precache shell, offline support

**Backend Performance:**

*Response Time Target:*
- **Goal:** <500ms for 95th percentile (PRD NFR1)
- **Current Performance (local):** ~50-150ms for simple queries
- **Monitoring:** Add response time logging via middleware
- **Critical Endpoints:**
  - `GET /api/tickets` - Target <300ms (most common, list view)
  - `POST /api/tickets` - Target <500ms (includes time entry creation)
  - `GET /api/invoices/preview` - Target <1000ms (complex aggregation acceptable)

*Database Optimization:*
- **Indexes:** All foreign keys indexed automatically
- **Additional Indexes:**
  - `idx_time_entries_work_date` (for monthly invoice aggregation)
  - `idx_tickets_state` (for open/closed filtering)
  - `idx_invoice_locks_month` (for lock validation queries)
  - `idx_contacts_email` (partial index excluding deleted_at IS NOT NULL)
- **Query Optimization:**
  - Use JOINs to reduce round trips (e.g., fetch ticket with client/contact names in single query)
  - `LIMIT` and `OFFSET` for pagination (future: cursor-based pagination for scale)
  - Avoid `SELECT *` - specify only needed columns
  - Use `EXPLAIN ANALYZE` to identify slow queries
- **Connection Pooling:**
  - Max connections: 20 (sufficient for single-user load)
  - Idle timeout: 10 seconds
  - Connection reuse: Yes (pg pool)

*Caching Strategy:*
- **MVP:** No application-level caching (PostgreSQL query cache sufficient)
- **Future (if needed):**
  - Redis cache for frequently accessed data (client list, Xero connection status)
  - HTTP caching headers (`Cache-Control`, `ETag`) for static API responses
  - Memoization for expensive calculations (e.g., invoice preview aggregations)

*Database Connection Management:*
- **Library:** pg (node-postgres) with connection pooling
- **Configuration:**
  ```javascript
  const pool = new Pool({
    max: 20,                    // Max connections
    idleTimeoutMillis: 10000,   // Close idle connections after 10s
    connectionTimeoutMillis: 2000, // Timeout if no connection available
  });
  ```
- **Error Handling:** Graceful connection failure with retry logic

**Infrastructure Performance:**

*Railway Optimization:*
- **Region Selection:** US-East (closest to Nashville, Central timezone)
- **Instance Size:** Starter plan (512MB RAM sufficient for MVP)
- **Auto-Scaling:** Not needed for single-user (Railway vertical scaling if required)
- **Database:** Railway PostgreSQL managed service (SSD-backed, optimized for performance)

*CDN Strategy (Future):*
- **Static Assets:** Serve via Railway CDN or Cloudflare (for global edge caching)
- **API Responses:** No CDN (dynamic, session-based auth incompatible)

---
