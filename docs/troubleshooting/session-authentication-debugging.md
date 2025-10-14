# Session Authentication Debugging Guide

## Problem Symptom

**Issue:** Intermittent authentication failures between main website and Outlook add-in

**Typical Pattern:**
1. User logs into main website (`tickets.zollc.com`) successfully
2. User opens Outlook add-in (`outlook-addin.zollc.com`)
3. Add-in API call fails with 401 Unauthorized error
4. User switches back to website tab and discovers they are now logged out
5. Issue is intermittent and difficult to reproduce consistently

---

## Quick Diagnostic Checklist

Before diving into detailed debugging, quickly check these common issues:

- [ ] **Cookie Domain**: Check if `COOKIE_DOMAIN` environment variable is set to `.zollc.com` in production
- [ ] **Session Cookie Presence**: Open browser DevTools → Application → Cookies, verify `connect.sid` cookie exists
- [ ] **Cookie Attributes**: Verify cookie has `domain=.zollc.com`, `sameSite=None`, `secure=true` in production
- [ ] **Debug Mode Enabled**: Set `DEBUG_SESSIONS=true` in backend and `VITE_DEBUG_API=true` in add-in
- [ ] **Both Apps Same Browser**: Ensure website and add-in are in the same browser session (not different browsers)
- [ ] **HTTPS in Production**: Verify both apps use HTTPS (required for `sameSite=None` cookies)

---

## Section 1: Browser DevTools Data Capture

### 1.1 Network Tab - Cookie Headers

**When to capture:** During the authentication failure

**Steps:**
1. Open DevTools (F12) in **both** the website tab and Outlook add-in tab
2. Go to **Network** tab
3. Filter by **Fetch/XHR**
4. Trigger the authentication failure (try using add-in feature)
5. Click on the failed request

**Data to capture:**

#### In the Failed Request:
```
Request Headers:
- Cookie: connect.sid=s%3A... (check if present)
- Origin: https://outlook-addin.zollc.com

Response Headers:
- Set-Cookie: (check if cookie is being set/modified)
```

#### Compare with Successful Website Request:
```
Request Headers:
- Cookie: connect.sid=s%3A... (same value as add-in?)
- Origin: https://tickets.zollc.com
```

**What to look for:**
- ⚠ **Cookie missing in request** → Cookie not being sent (domain/sameSite issue)
- ⚠ **Different cookie values** → Website and add-in have separate sessions
- ⚠ **Set-Cookie in response** → Server is regenerating session (might invalidate other session)

---

### 1.2 Application Tab - Cookie Inspection

**Steps:**
1. Open DevTools → **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Expand **Cookies** → Your domain
3. Find `connect.sid` cookie

**Data to capture:**

| Attribute | Expected Value (Production) | Your Value |
|-----------|----------------------------|------------|
| **Domain** | `.zollc.com` | _________ |
| **Path** | `/` | _________ |
| **Expires** | ~30 days from now | _________ |
| **HttpOnly** | ✓ (checked) | _________ |
| **Secure** | ✓ (checked) | _________ |
| **SameSite** | `None` | _________ |

**What to look for:**
- ⚠ **Domain** is specific (e.g., `tickets.zollc.com`) → Cookie not shared across subdomains
- ⚠ **SameSite** is `Lax` or `Strict` → Cookie blocked on cross-origin requests
- ⚠ **Expires** in the past → Cookie expired (should be ~30 days)
- ⚠ **Cookie missing entirely** → Session was never created or already expired

---

### 1.3 Console - Session Cookie Check

**Quick cookie presence check:**

Run this in **both** website and add-in browser consoles:

```javascript
// Check if session cookie is present
console.log('Session cookie present:', document.cookie.includes('connect.sid'));

// Show first 50 chars of cookie (don't log full value for security)
console.log('Cookie preview:', document.cookie.substring(0, 50) + '...');
```

**Expected output:**
- Website: `Session cookie present: true`
- Add-in: `Session cookie present: true` (should be same as website)

**What to look for:**
- ⚠ Add-in shows `false` → Cookie not shared (check domain attribute)
- ⚠ Both show `false` → User not logged in or session expired

---

## Section 2: Backend Server Logs (Session Debug Middleware)

### 2.1 Enable Debug Mode

Add to backend `.env` file:
```bash
DEBUG_SESSIONS=true
```

Restart the backend server.

---

### 2.2 Log Output Format

When debug mode is enabled, you'll see logs like this:

```json
[SESSION DEBUG] {
  "timestamp": "2025-10-14T12:34:56.789Z",
  "method": "GET",
  "path": "/api/tickets",
  "origin": "https://outlook-addin.zollc.com",
  "sessionID": "abc123def456...",
  "userId": "1",
  "userEmail": "user@example.com",
  "hasSession": true,
  "cookieHeaderPresent": true,
  "cookieHeaderPreview": "connect.sid=s%3Aabc123def456...",
  "sessionAge": 2592000000,
  "sessionExpires": "2025-11-13T12:34:56.789Z"
}
```

---

### 2.3 What to Look For

**Scenario 1: Add-in request shows no session**
```json
{
  "origin": "https://outlook-addin.zollc.com",
  "sessionID": "none",
  "userId": "none",
  "hasSession": false,
  "cookieHeaderPresent": false
}
```
**Diagnosis:** Cookie not being sent from add-in
**Likely cause:** Cookie domain mismatch or sameSite policy blocking

---

**Scenario 2: Different session IDs between website and add-in**
```json
// Website request
{ "sessionID": "abc123...", "userId": "1" }

// Add-in request (moments later)
{ "sessionID": "xyz789...", "userId": "1" }
```
**Diagnosis:** Two separate sessions for same user
**Likely cause:** Cookie not properly shared, each app created its own session

---

**Scenario 3: SessionID changes mid-request**
```json
// Request 1 from add-in
{ "sessionID": "abc123...", "userId": "1" }

// Request 2 from website (triggers regeneration)
{ "sessionID": "def456...", "userId": "1" }

// Request 3 from add-in (old session invalid)
{ "sessionID": "abc123...", "userId": "none", "hasSession": false }
```
**Diagnosis:** Session regeneration invalidated the other session
**Likely cause:** Login or CSRF token fetch regenerated session while add-in held old session

---

## Section 3: PostgreSQL Session Table Queries

### 3.1 Run Diagnostic Queries

Location: `backend/src/utils/debug/inspectSessions.sql`

**Connect to database:**
```bash
# Local development
psql -h localhost -U your_user -d ticketing_system

# Railway production (get connection string from Railway dashboard)
psql "postgresql://user:pass@host:port/database"
```

---

### 3.2 Most Useful Queries

#### Query 1: Check for Multiple Sessions
```sql
SELECT
  sess->>'userId' AS user_id,
  COUNT(*) AS session_count,
  STRING_AGG(sid, ', ') AS session_ids
FROM session
WHERE sess->>'userId' IS NOT NULL AND expire > NOW()
GROUP BY sess->>'userId'
HAVING COUNT(*) > 1;
```

**Expected output:** No rows (each user should have 1 session)
**If rows returned:** User has multiple active sessions (conflict!)

---

#### Query 2: Verify Session Matches Browser Cookie
```sql
-- Replace YOUR-SESSION-ID with value from browser cookie
SELECT
  sid AS session_id,
  sess->>'userId' AS user_id,
  expire AS expires_at,
  EXTRACT(EPOCH FROM (expire - NOW())) AS seconds_until_expire
FROM session
WHERE sid = 'YOUR-SESSION-ID-HERE';
```

**Expected output:** 1 row showing session details
**If no rows:** Cookie/session mismatch (session was deleted or expired)

---

### 3.3 Interpreting Results

| Finding | Diagnosis | Next Steps |
|---------|-----------|------------|
| **Multiple sessions for same user** | Website and add-in created separate sessions | Check cookie domain configuration |
| **Session not found** | Session expired or was deleted | Check session expiration settings |
| **userId is null** | Session exists but user not authenticated | Check authentication flow |
| **Negative seconds_until_expire** | Session already expired | Check session maxAge configuration |

---

## Section 4: Frontend CSRF Token Lifecycle (Add-in Console Logs)

### 4.1 Enable Debug Mode

Add to `outlook-addin/.env` file:
```bash
VITE_DEBUG_API=true
```

Rebuild the add-in:
```bash
cd outlook-addin
npm run build
```

---

### 4.2 Log Output Format

When debug mode is enabled in add-in, you'll see logs like:

```json
[API DEBUG - CSRF Token] {
  "timestamp": "2025-10-14T12:34:56.789Z",
  "cached": false,
  "hasSessionCookie": true
}

[API DEBUG - CSRF Token] {
  "timestamp": "2025-10-14T12:34:56.890Z",
  "action": "fetching new token"
}

[API DEBUG - CSRF Token] {
  "timestamp": "2025-10-14T12:34:57.012Z",
  "action": "token fetched successfully",
  "hasSessionCookie": true
}

[API DEBUG - API Request] {
  "timestamp": "2025-10-14T12:35:00.123Z",
  "endpoint": "/api/tickets",
  "method": "GET",
  "hasCsrfToken": false,
  "hasSessionCookie": true
}

[API DEBUG - API Response] {
  "timestamp": "2025-10-14T12:35:00.234Z",
  "endpoint": "/api/tickets",
  "method": "GET",
  "status": 200,
  "ok": true,
  "hasSessionCookie": true
}
```

---

### 4.3 What to Look For

**Scenario 1: CSRF token fetch fails**
```json
[API DEBUG - CSRF Token] {
  "action": "fetch failed",
  "status": 401,
  "hasSessionCookie": false
}
```
**Diagnosis:** User not authenticated, session cookie missing
**Likely cause:** Session expired or cookie not shared

---

**Scenario 2: Session cookie disappears mid-request**
```json
// Token fetch shows cookie present
{ "action": "token fetched successfully", "hasSessionCookie": true }

// API request moments later shows no cookie
{ "endpoint": "/api/tickets", "hasSessionCookie": false }
```
**Diagnosis:** Cookie was deleted between requests
**Likely cause:** Session expired, or browser cleared cookies

---

**Scenario 3: API request fails with 401 despite having session cookie**
```json
[API DEBUG - API Request] {
  "endpoint": "/api/tickets",
  "hasSessionCookie": true
}

[API DEBUG - API Error] {
  "status": 401,
  "error": "Authentication required",
  "hasSessionCookie": true
}
```
**Diagnosis:** Session exists in browser but backend doesn't recognize it
**Likely cause:** Session was invalidated on backend (regenerated by website)

---

## Section 5: Quick Testing Checklist

### 5.1 Test Cookie Sharing Across Subdomains

1. Log into website (`tickets.zollc.com`)
2. Open browser DevTools → Application → Cookies
3. Check `connect.sid` cookie domain
4. Open add-in in **same browser**
5. Check if add-in also sees the cookie

**Pass criteria:** Both website and add-in see the same cookie value

---

### 5.2 Test CSRF Token Lifecycle

1. Clear browser cache and cookies
2. Log into website
3. Open add-in
4. Make one API call from add-in (should work)
5. Wait 5 minutes
6. Make another API call

**Pass criteria:** Both API calls succeed

**If second call fails:**
- CSRF token may have expired
- Session may have timed out
- Check backend logs for session expiration

---

### 5.3 Test Cross-Origin Isolation

1. Log into website
2. Open add-in in **Outlook Desktop** (not web browser)
3. Try using add-in features

**If it fails:** Outlook desktop may have different cookie handling
**Solution:** Check if Outlook desktop supports `sameSite=None` cookies

---

## Section 6: Debug Endpoint Usage

### 6.1 Call Debug Endpoint

**Endpoint:** `GET /api/debug/session`
**Only available when:** `DEBUG_SESSIONS=true`

Run this in **both** website and add-in browser consoles:

```javascript
fetch('https://ticketapi.zollc.com/api/debug/session', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.table(data))
  .catch(err => console.error('Debug endpoint error:', err));
```

---

### 6.2 Expected Output

```json
{
  "hasSession": true,
  "sessionID": "abc123def456...",
  "userId": 1,
  "userEmail": "user@example.com",
  "authenticated": true,
  "cookieConfig": {
    "maxAge": 2592000000,
    "expires": "2025-11-13T12:34:56.789Z",
    "domain": ".zollc.com",
    "sameSite": "none",
    "secure": true,
    "httpOnly": true
  },
  "request": {
    "origin": "https://outlook-addin.zollc.com",
    "referer": "https://outlook-addin.zollc.com/",
    "ipAddress": "123.45.67.89",
    "userAgent": "Mozilla/5.0...",
    "hasCookieHeader": true
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 6.3 Compare Website vs. Add-in

**Run the fetch in BOTH tabs and compare:**

| Field | Website Value | Add-in Value | Match? |
|-------|---------------|--------------|--------|
| `sessionID` | abc123... | abc123... | ✓ Should match |
| `userId` | 1 | 1 | ✓ Should match |
| `hasCookieHeader` | true | true | ✓ Should both be true |
| `origin` | tickets.zollc.com | outlook-addin.zollc.com | Different (OK) |

**What to look for:**
- ⚠ **Different sessionID** → Separate sessions (cookie not shared)
- ⚠ **Add-in shows userId=null** → Add-in not authenticated
- ⚠ **Add-in shows hasCookieHeader=false** → Cookie not being sent

---

## Root Cause Hypotheses

Based on the session configuration in `backend/src/index.js`:

### Hypothesis 1: Cookie Domain Mismatch ⭐ MOST LIKELY

**Evidence to look for:**
- Browser DevTools shows cookie domain is specific (e.g., `tickets.zollc.com` not `.zollc.com`)
- Add-in debug logs show `hasSessionCookie: false`
- SQL queries show multiple sessions for same user

**Root cause:**
- Manual cookie setting in CSRF endpoint (line 100-107) uses hardcoded `domain: '.zollc.com'`
- Main session config uses `domain: process.env.COOKIE_DOMAIN || undefined`
- If `COOKIE_DOMAIN` env var is not set, cookies won't be shared

**Solution:**
```bash
# Add to backend .env
COOKIE_DOMAIN=.zollc.com
```

---

### Hypothesis 2: SameSite Policy Conflict

**Evidence to look for:**
- Browser DevTools shows cookie `sameSite: Lax` instead of `None`
- Browser console warnings about cookies being blocked
- Add-in requests show cookie header missing

**Root cause:**
- Main session config uses `sameSite: 'none'` in production (line 75)
- Manual CSRF cookie uses `sameSite: 'lax'` (line 104)
- Conflicting settings cause browser to reject cookies

**Solution:**
- Ensure consistent `sameSite: 'none'` across all cookie settings
- Verify HTTPS is enabled (required for `sameSite: None`)

---

### Hypothesis 3: Session Regeneration Race Condition

**Evidence to look for:**
- Backend logs show rapid sessionID changes
- SQL Query 6 shows sessions created <1 second apart
- Website works, then add-in fails, then website fails

**Root cause:**
- Login/register calls `req.session.regenerate()` (authController.js:23, 77)
- CSRF endpoint calls `req.session.save()` (index.js:93)
- If website regenerates session while add-in holds old session, add-in becomes invalid

**Solution:**
- Avoid session regeneration after initial login
- Use session `touch()` instead of `regenerate()` for CSRF token

---

### Hypothesis 4: CSRF Token Cache Staleness

**Evidence to look for:**
- Add-in logs show "using cached token"
- API fails with 403 (CSRF invalid), then clears cache
- Subsequent retry works after fetching fresh token

**Root cause:**
- Add-in caches CSRF token globally (api-client.ts:4)
- If session regenerates, cached token becomes invalid
- 403 response clears cache, but session is already broken

**Solution:**
- Don't cache CSRF token indefinitely
- Add token expiration or validate on each request

---

## Troubleshooting Workflow

**Step-by-step diagnostic process:**

1. **Quick check** (Section 1.3): Verify session cookie present in both tabs
2. **If cookie missing:** Check cookie domain attributes (Section 1.2)
3. **If cookie present:** Enable debug mode and reproduce issue
4. **Check backend logs** (Section 2): Look for session state differences
5. **Check SQL queries** (Section 3): Verify single session per user
6. **Check add-in logs** (Section 4): Track CSRF token lifecycle
7. **Call debug endpoint** (Section 6): Compare session state between tabs
8. **Match findings to hypotheses** above

---

## Expected vs. Actual Output Examples

### Example 1: Normal Operation ✓

**Browser cookie:**
- Domain: `.zollc.com`
- SameSite: `None`
- Secure: `true`

**Backend logs (both website and add-in):**
```json
{ "sessionID": "abc123", "userId": "1", "hasSession": true }
```

**SQL query (active sessions):**
```
user_id | session_count | session_ids
--------|--------------+-------------
   1    |      1       | abc123
```

**Debug endpoint (both tabs):**
```json
{ "sessionID": "abc123", "userId": 1, "authenticated": true }
```

---

### Example 2: Cookie Not Shared ⚠

**Browser cookie:**
- Website: Domain `tickets.zollc.com` (wrong!)
- Add-in: No cookie

**Backend logs:**
```json
// Website
{ "sessionID": "abc123", "userId": "1", "hasSession": true }

// Add-in
{ "sessionID": "none", "userId": "none", "hasSession": false }
```

**SQL query (active sessions):**
```
user_id | session_count | session_ids
--------|--------------+-------------
   1    |      1       | abc123
```

**Diagnosis:** Cookie domain not configured properly
**Solution:** Set `COOKIE_DOMAIN=.zollc.com`

---

### Example 3: Multiple Sessions (Race Condition) ⚠

**Backend logs:**
```json
// Website request
{ "sessionID": "abc123", "userId": "1" }

// Add-in request (moments later)
{ "sessionID": "xyz789", "userId": "1" }
```

**SQL query (active sessions):**
```
user_id | session_count | session_ids
--------|--------------+-------------------
   1    |      2       | abc123, xyz789
```

**Diagnosis:** Two separate sessions created
**Solution:** Fix cookie sharing (see Hypothesis 1)

---

## Summary: Data to Gather When Issue Occurs

When you encounter the authentication failure, capture:

1. ✅ **Browser DevTools** (both tabs):
   - Network tab → Cookie headers in request/response
   - Application tab → Cookie attributes (domain, sameSite, secure)

2. ✅ **Backend server logs** (`DEBUG_SESSIONS=true`):
   - SessionID values from website vs. add-in
   - Timing of session changes

3. ✅ **PostgreSQL session queries**:
   - Active session count per user
   - Session ID verification

4. ✅ **Add-in console logs** (`VITE_DEBUG_API=true`):
   - CSRF token lifecycle
   - API request/response sequence

5. ✅ **Debug endpoint output** (both tabs):
   - `/api/debug/session` response comparison

With this data, you should be able to identify which hypothesis matches your issue and apply the appropriate solution.
