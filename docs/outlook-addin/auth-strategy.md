# Outlook Add-in Authentication Strategy

**Research Date:** October 9, 2025
**Story:** 1.2 - Authentication Strategy Research & Decision
**Author:** James (Dev Agent)

---

## Executive Summary

✅ **DECISION: Session Cookie Sharing** - The Outlook Add-in will leverage existing backend session-based authentication using cross-origin cookie sharing with `SameSite=None; Secure`.

This approach provides the **most seamless user experience** (transparent authentication if user already logged into main web app), requires **minimal backend changes** (backend already configured with `sameSite: 'none'` in production), and **reuses existing authentication infrastructure** (express-session + PostgreSQL session store + CSRF protection).

---

## Table of Contents

1. [Authentication Options Evaluated](#authentication-options-evaluated)
2. [Option 1: Session Cookie Sharing (CHOSEN)](#option-1-session-cookie-sharing-chosen)
3. [Option 2: JWT Token-Based Authentication](#option-2-jwt-token-based-authentication)
4. [Option 3: Nested App Authentication (NAA)](#option-3-nested-app-authentication-naa)
5. [Comparison Matrix](#comparison-matrix)
6. [Final Decision & Justification](#final-decision--justification)
7. [Implementation Requirements](#implementation-requirements)
8. [Testing Approach](#testing-approach)
9. [Risks & Mitigation](#risks--mitigation)
10. [Future Improvements](#future-improvements)

---

## Authentication Options Evaluated

Three authentication approaches were researched for the Outlook Add-in MVP:

1. **Session Cookie Sharing** - Leverage existing express-session authentication with cross-origin cookies
2. **JWT Token-Based Authentication** - Implement JWT tokens with custom token generation endpoint
3. **Nested App Authentication (NAA)** - Microsoft's modern SSO solution using MSAL.js + Microsoft Entra ID

---

## Option 1: Session Cookie Sharing (CHOSEN)

### Overview

The add-in task pane iframe makes API requests to the backend with `credentials: 'include'`, sending existing session cookies established when the user logged into the main web app. Backend CORS configuration allows add-in origin with `credentials: true`, and session cookies are set with `SameSite=None; Secure` to enable cross-origin sharing.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Workflow                          │
└─────────────────────────────────────────────────────────────────┘

1. User logs into main web app (tickets.zollc.com)
   ↓
2. Backend sets session cookie with SameSite=None; Secure
   ↓
3. User opens Outlook Add-in in Outlook Web (outlook-addin.zollc.com)
   ↓
4. Add-in makes API request with credentials: 'include'
   ↓
5. Browser sends existing session cookie to backend (ticketapi.zollc.com)
   ↓
6. Backend validates session → User authenticated ✓

┌─────────────────────────────────────────────────────────────────┐
│                      Technical Architecture                     │
└─────────────────────────────────────────────────────────────────┘

Main Web App (tickets.zollc.com)
        ↓ [User login → Session cookie set]
Backend API (ticketapi.zollc.com)
        ↓ [Set-Cookie: connect.sid; SameSite=None; Secure; HttpOnly]
Add-in Task Pane (outlook-addin.zollc.com)
        ↓ [fetch(api_url, { credentials: 'include' })]
Backend API validates session → Authenticated
```

### Advantages

| **Category** | **Advantage** | **Details** |
|-------------|--------------|-------------|
| **UX** | ✅ Transparent authentication | If user logged into main app, add-in works immediately (no extra login step) |
| **UX** | ✅ Unified session | Logout from main app automatically logs out add-in (shared session) |
| **Implementation** | ✅ Minimal backend changes | Backend already configured with `sameSite: 'none'` in production (line 58, `backend/src/index.js`) |
| **Implementation** | ✅ Reuses existing auth | No new authentication endpoints, token generation, or validation middleware needed |
| **Security** | ✅ HttpOnly cookies | Session cookies protected from XSS (not accessible via JavaScript) |
| **Security** | ✅ CSRF protection | Existing `csurf` middleware protects against CSRF attacks |
| **Timeline** | ✅ Fastest to implement | Only requires adding add-in origin to CORS whitelist + ADDIN_URL env var |

### Disadvantages

| **Category** | **Disadvantage** | **Details** | **Mitigation** |
|-------------|-----------------|-------------|----------------|
| **Security** | ⚠️ SameSite=None increases CSRF risk | `SameSite=None` allows cross-site cookie sending | **Mitigated:** Existing `csurf` middleware provides CSRF protection |
| **Compatibility** | ⚠️ Relies on browser cookie behavior | Some browsers (Safari ITP) may block third-party cookies | **Mitigated:** Use Storage Access API as fallback (supported in Safari 12.1+) |
| **UX** | ⚠️ Requires user logged into main app first | If user never logged into web app, add-in can't authenticate | **Mitigated:** Add-in redirects to web app login (better UX with password manager support) |
| **Deployment** | ⚠️ Requires HTTPS in production | `Secure` flag requires HTTPS for all services | **Already met:** Railway provides Let's Encrypt certificates |

### Browser Compatibility

| **Browser** | **Support Status** | **Notes** |
|------------|-------------------|----------|
| Chrome | ✅ Supported | Requires `SameSite=None; Secure` |
| Edge | ✅ Supported | Requires `SameSite=None; Secure` |
| Firefox | ✅ Supported | Requires `SameSite=None; Secure` |
| Safari (Mac) | ⚠️ Limited | May require Storage Access API (see below) |

**Storage Access API Fallback (Safari):**
```javascript
// Request storage access for Safari ITP
if (document.hasStorageAccess) {
  const hasAccess = await document.hasStorageAccess();
  if (!hasAccess) {
    await document.requestStorageAccess();
  }
}
```

### Code Example

**Add-in API Client:**
```typescript
// outlook-addin/src/lib/api-client.ts

const API_URL = import.meta.env.VITE_API_URL || 'https://ticketapi.zollc.com';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // CRITICAL: Include session cookies
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(), // Include CSRF token
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Session expired or user not logged in
    handleUnauthorized();
  }

  return response.json();
}

export async function getClients() {
  return apiRequest('/api/clients');
}
```

**Backend CORS Configuration (ALREADY IMPLEMENTED):**
```javascript
// backend/src/index.js (lines 33-36)

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true, // ✓ Already allows credentials
}));
```

**Backend Session Configuration (ALREADY IMPLEMENTED):**
```javascript
// backend/src/index.js (lines 42-61)

app.use(session({
  // ... other config
  cookie: {
    secure: process.env.NODE_ENV === 'production', // ✓ HTTPS only in production
    httpOnly: true, // ✓ Protected from XSS
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✓ Already set to 'none' in production
    domain: process.env.COOKIE_DOMAIN || undefined, // ✓ Supports subdomain sharing
  },
}));
```

---

## Option 2: JWT Token-Based Authentication

### Overview

Backend generates JWT tokens via a new `/api/auth/token` endpoint. Add-in stores tokens in `sessionStorage` and includes them in `Authorization: Bearer <token>` headers. Tokens are validated by new backend middleware.

### How It Works

```
1. User opens add-in → Add-in shows login form
   ↓
2. User enters credentials → Add-in sends POST /api/auth/login
   ↓
3. Backend validates credentials → Returns JWT token
   ↓
4. Add-in stores token in sessionStorage
   ↓
5. Add-in makes API requests with Authorization: Bearer <token>
   ↓
6. Backend validates JWT → User authenticated ✓
```

### Advantages

| **Category** | **Advantage** | **Details** |
|-------------|--------------|-------------|
| **Compatibility** | ✅ No cookie dependency | Works regardless of browser third-party cookie policies |
| **Control** | ✅ Token expiration control | Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) |
| **Independence** | ✅ Decoupled from web app | Add-in can authenticate independently (doesn't require user logged into web app) |
| **Scalability** | ✅ Stateless | No server-side session storage required (can scale horizontally) |

### Disadvantages

| **Category** | **Disadvantage** | **Details** | **Impact** |
|-------------|-----------------|-------------|------------|
| **UX** | ❌ Extra login step | User must log in separately in add-in (even if already logged into web app) | **Major UX friction** |
| **UX** | ❌ Separate sessions | Logging out of web app doesn't log out add-in (confusing UX) | **UX inconsistency** |
| **Implementation** | ❌ New backend endpoints | Requires `/api/auth/token`, `/api/auth/refresh`, JWT validation middleware | **High implementation cost** |
| **Implementation** | ❌ Token management complexity | Add-in must handle token storage, expiration, refresh logic | **Increased code complexity** |
| **Security** | ⚠️ XSS risk | Tokens in `localStorage`/`sessionStorage` vulnerable to XSS attacks | **Security concern** |
| **Security** | ⚠️ Token theft risk | If token stolen, attacker has access until token expires | **Security risk** |
| **Timeline** | ❌ Slower to implement | Requires backend + frontend token infrastructure (2-3 additional stories) | **MVP timeline risk** |

### Implementation Requirements (If Chosen)

**Backend Changes:**
1. New endpoint: `POST /api/auth/token` (generates JWT token)
2. New endpoint: `POST /api/auth/refresh` (refreshes access token)
3. New middleware: `jwtValidation.js` (validates JWT tokens)
4. New dependency: `jsonwebtoken` package

**Add-in Changes:**
1. Login form component
2. Token storage service (`sessionStorage`)
3. Token refresh logic (automatic refresh before expiration)
4. API client with `Authorization: Bearer` header

**Estimated Effort:** 2-3 additional stories (~1 week development time)

---

## Option 3: Nested App Authentication (NAA)

### Overview

Microsoft's modern SSO solution using MSAL.js library + Microsoft Entra ID (formerly Azure AD). Add-in authenticates users with their Microsoft 365 accounts and receives identity tokens to access Microsoft Graph API or custom backend APIs.

### How It Works

```
1. User opens add-in → Add-in initializes MSAL.js
   ↓
2. MSAL.js requests SSO via Microsoft Entra ID (no user interaction if already signed into Outlook)
   ↓
3. Microsoft Entra ID returns ID token + access token
   ↓
4. Add-in sends access token to backend
   ↓
5. Backend validates token with Microsoft identity platform → User authenticated ✓
```

### Advantages

| **Category** | **Advantage** | **Details** |
|-------------|--------------|-------------|
| **UX** | ✅ True SSO | User automatically signed in (leverages Outlook Web login) |
| **Modern** | ✅ Microsoft-recommended | Official authentication approach for Office Add-ins in 2025 |
| **Future-proof** | ✅ Replaces deprecated tokens | Exchange legacy tokens deprecated October 2025 |
| **Security** | ✅ Enterprise-grade | Leverages Microsoft Entra ID security features |

### Disadvantages

| **Category** | **Disadvantage** | **Details** | **Impact** |
|-------------|-----------------|-------------|------------|
| **Implementation** | ❌ High complexity | Requires Microsoft Entra ID app registration, MSAL.js integration, token validation | **Very high implementation cost** |
| **Compatibility** | ❌ Microsoft accounts only | Only works for users with Microsoft 365 / Entra ID accounts | **❌ Blocks MVP - existing users may not have Microsoft accounts** |
| **Architecture** | ❌ Requires identity platform changes | Backend must validate Microsoft-issued tokens (new validation logic) | **Major backend changes** |
| **Scope** | ❌ Out of MVP scope | NAA is for accessing Microsoft Graph API, not custom backend APIs | **Not applicable to MVP use case** |
| **Timeline** | ❌ Very slow to implement | Requires Azure app registration, testing, deployment (4-6 weeks minimum) | **❌ MVP timeline blocker** |

### Show-Stopper Issues for MVP

1. **Not All Users Have Microsoft Accounts:** Existing ticketing system users may not have Microsoft 365 / Entra ID accounts
2. **Out of Scope:** NAA is designed for accessing Microsoft Graph API, not authenticating against custom backend APIs
3. **Timeline:** NAA implementation would delay MVP by 4-6 weeks minimum

**Recommendation:** Consider NAA for **future enhancement** (e.g., integrating Microsoft Graph calendar events with ticketing system), but **not for MVP authentication**.

---

## Comparison Matrix

| **Criteria** | **Session Cookie Sharing ✅** | **JWT Tokens** | **NAA (SSO)** |
|-------------|------------------------------|----------------|---------------|
| **UX Friction** | ⭐⭐⭐⭐⭐ Transparent | ⭐⭐ Extra login | ⭐⭐⭐⭐⭐ True SSO |
| **Implementation Complexity** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐ High | ⭐ Very high |
| **Backend Changes Required** | ⭐⭐⭐⭐⭐ 1 env var | ⭐⭐ Multiple endpoints | ⭐ Major changes |
| **Timeline to MVP** | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐ Slow | ⭐ Very slow |
| **Security** | ⭐⭐⭐⭐ Good (CSRF protected) | ⭐⭐⭐ Moderate (XSS risk) | ⭐⭐⭐⭐⭐ Excellent |
| **Browser Compatibility** | ⭐⭐⭐⭐ Good (Safari needs fallback) | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Reuses Existing Auth** | ⭐⭐⭐⭐⭐ Yes | ❌ No | ❌ No |
| **Works Without Microsoft Account** | ✅ Yes | ✅ Yes | ❌ No |
| **MVP Feasibility** | ✅ **RECOMMENDED** | ⚠️ Possible but slower | ❌ Not feasible |

**Legend:**
- ⭐⭐⭐⭐⭐ = Excellent
- ⭐⭐⭐⭐ = Good
- ⭐⭐⭐ = Moderate
- ⭐⭐ = Poor
- ⭐ = Very poor

---

## Final Decision & Justification

### ✅ CHOSEN APPROACH: Session Cookie Sharing

**Decision:** The Outlook Add-in MVP will use **session cookie sharing** with existing backend authentication infrastructure.

### Justification

#### 1. Best User Experience
- **Transparent Authentication:** If user is logged into main web app, add-in works immediately (no extra login step)
- **Unified Session:** Logout from main app automatically logs out add-in (consistent UX)
- **No Credential Re-entry:** User never has to enter credentials in add-in

#### 2. Fastest to Implement
- **Backend Already Configured:** `sameSite: 'none'` already set in production (line 58, `backend/src/index.js`)
- **Minimal Code Changes:** Only requires adding add-in origin to CORS whitelist + 1 environment variable
- **Reuses Existing Auth:** No new endpoints, token generation, or validation middleware needed
- **Timeline:** Can be implemented in Story 1.3 (< 1 day)

#### 3. Secure by Default
- **HttpOnly Cookies:** Session cookies protected from XSS (not accessible via JavaScript)
- **CSRF Protection:** Existing `csurf` middleware protects against CSRF attacks
- **HTTPS Required:** `Secure` flag ensures cookies only sent over HTTPS

#### 4. Low Risk
- **Proven Technology:** express-session is battle-tested, widely used
- **No New Dependencies:** No additional packages needed
- **Minimal Testing Surface:** Only need to test CORS + cookie sharing

#### 5. MVP Alignment
- **Simplicity:** Aligns with MVP principle of "simplest solution that works"
- **Timeline:** Doesn't delay MVP (fastest option)
- **Scope:** Meets all MVP authentication requirements

### Why Not JWT?

- ❌ **Extra login step** creates UX friction (user must log in separately in add-in)
- ❌ **High implementation cost** (2-3 additional stories, ~1 week development)
- ❌ **XSS risk** (tokens in localStorage/sessionStorage vulnerable to XSS)
- ❌ **Separate sessions** (logging out of web app doesn't log out add-in)

### Why Not NAA?

- ❌ **Not all users have Microsoft accounts** (existing users may use custom credentials)
- ❌ **Out of scope** (NAA designed for Microsoft Graph API, not custom backend APIs)
- ❌ **Very high implementation cost** (4-6 weeks minimum, requires Azure app registration)
- ❌ **MVP timeline blocker**

### Future Consideration

NAA (Nested App Authentication) should be considered for **future enhancement** when:
1. Integrating with Microsoft Graph API (e.g., calendar events, email metadata)
2. Targeting enterprise users with Microsoft 365 accounts
3. Adding advanced SSO features

For MVP, **session cookie sharing is the clear winner**.

---

## Implementation Requirements

### Backend Changes

#### 1. Update CORS Configuration

**File:** `backend/src/index.js` (lines 33-36)

**Change:**
```javascript
// BEFORE (existing)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

// AFTER (updated)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  process.env.ADDIN_URL || 'http://localhost:5173', // Add-in origin
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

#### 2. Add Environment Variable

**File:** Backend Railway service environment variables

**New Variable:**
- **Development:** `ADDIN_URL=http://localhost:5173`
- **Production:** `ADDIN_URL=https://outlook-addin.zollc.com`

#### 3. Session Cookie Configuration

**No changes needed** - Backend already configured correctly:
- ✅ `sameSite: 'none'` in production (line 58)
- ✅ `secure: true` in production (line 53)
- ✅ `httpOnly: true` (line 54)
- ✅ `credentials: true` in CORS (line 35)

### Add-in Changes

#### 1. API Client Configuration

**File:** `outlook-addin/src/lib/api-client.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // CRITICAL: Include session cookies
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Session expired or user not logged in
      handleUnauthorized();
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      // CSRF validation failed
      await refreshCsrfToken();
      throw new Error('CSRF token invalid, please retry');
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

#### 2. CSRF Token Management

**File:** `outlook-addin/src/lib/csrf.ts`

```typescript
let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_URL}/api/csrf-token`, {
    credentials: 'include',
  });

  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function refreshCsrfToken(): Promise<void> {
  csrfToken = null;
  await getCsrfToken();
}
```

#### 3. Unauthorized Handler

**File:** `outlook-addin/src/lib/auth.ts`

```typescript
export function handleUnauthorized() {
  // Redirect to main web app login (better UX with password manager support)
  window.open('https://tickets.zollc.com/login', '_blank');
}
```

#### 4. Storage Access API Fallback (Safari Support)

**File:** `outlook-addin/src/lib/storage-access.ts`

```typescript
export async function requestStorageAccess(): Promise<boolean> {
  // Check if Storage Access API is available (Safari)
  if (!document.hasStorageAccess || !document.requestStorageAccess) {
    console.log('Storage Access API not available');
    return true; // Assume access (other browsers don't need it)
  }

  try {
    const hasAccess = await document.hasStorageAccess();
    if (hasAccess) {
      console.log('Storage access already granted');
      return true;
    }

    // Request storage access (requires user gesture)
    await document.requestStorageAccess();
    console.log('Storage access granted');
    return true;
  } catch (error) {
    console.error('Storage access denied:', error);
    return false;
  }
}
```

**Usage in Add-in Initialization:**
```typescript
Office.onReady(async () => {
  // Request storage access for Safari
  const hasAccess = await requestStorageAccess();
  if (!hasAccess) {
    showStorageAccessWarning();
  }

  // Continue add-in initialization
  initializeApp();
});
```

### Deployment Changes

#### Railway Environment Variables

**Backend Service:**
- `ADDIN_URL=https://outlook-addin.zollc.com`
- `COOKIE_DOMAIN=.zollc.com` (already set for subdomain sharing)
- `NODE_ENV=production` (already set)

**Add-in Service:**
- `VITE_API_URL=https://ticketapi.zollc.com`

### No Database Changes Required

Session storage already uses PostgreSQL via `connect-pg-simple` - no schema changes needed.

---

## Testing Approach

### Manual Testing Checklist

#### Local Development Testing

1. **Backend Setup:**
   ```bash
   cd backend
   export ADDIN_URL=http://localhost:5173
   npm start
   ```

2. **Add-in Setup:**
   ```bash
   cd outlook-addin
   export VITE_API_URL=http://localhost:3001
   npm run dev
   ```

3. **Test Scenario 1: Health Check**
   - Open `http://localhost:5173/auth-test.html`
   - Click "Test 1: Health Check"
   - ✅ Verify backend is accessible

4. **Test Scenario 2: CSRF Token**
   - Click "Test 2: Get CSRF Token"
   - ✅ Verify CSRF token received
   - ✅ Check browser DevTools → Application → Cookies
   - ✅ Verify `connect.sid` cookie present

5. **Test Scenario 3: Authenticated Request**
   - Click "Test 3: Authenticated Request"
   - ✅ Verify 401 Unauthorized (expected - no session yet)

6. **Test Scenario 4: With Active Session**
   - Open `http://localhost:8080` (main web app)
   - Log in with test credentials
   - Return to `http://localhost:5173/auth-test.html`
   - Click "Test 2: Get CSRF Token"
   - Click "Test 3: Authenticated Request"
   - ✅ Verify 200 OK (session shared successfully)
   - ✅ Verify API response data returned

#### Production Testing

1. **Deploy all services to Railway**
2. **Log into main web app:** `https://tickets.zollc.com`
3. **Open Outlook Web:** `https://outlook.office.com`
4. **Sideload add-in manifest** (Story 1.4)
5. **Open add-in task pane**
6. **Verify add-in makes successful authenticated API requests**

#### Browser Compatibility Testing

| **Browser** | **Test Cases** | **Expected Result** |
|------------|---------------|---------------------|
| Chrome | Session sharing with `credentials: 'include'` | ✅ Works |
| Edge | Session sharing with `credentials: 'include'` | ✅ Works |
| Firefox | Session sharing with `credentials: 'include'` | ✅ Works |
| Safari (Mac) | Session sharing + Storage Access API fallback | ✅ Works with Storage Access API |

#### Error Scenarios

1. **User Not Logged In:**
   - Add-in shows 401 Unauthorized
   - Add-in redirects to web app login

2. **Session Expired:**
   - Add-in receives 401 Unauthorized
   - Add-in prompts user to re-login

3. **CSRF Token Invalid:**
   - Add-in receives 403 Forbidden
   - Add-in refreshes CSRF token automatically
   - Add-in retries request

4. **CORS Blocked:**
   - Add-in receives CORS error in console
   - Verify `ADDIN_URL` environment variable is set correctly

---

## Risks & Mitigation

### Risk 1: Safari Blocks Third-Party Cookies

**Risk:** Safari Intelligent Tracking Prevention (ITP) may block session cookies from add-in iframe.

**Likelihood:** Medium
**Impact:** High (add-in won't work for Safari users)

**Mitigation:**
1. ✅ Implement Storage Access API fallback (already documented above)
2. ✅ Show user-friendly prompt to grant storage access
3. ✅ Fallback: Redirect to web app login if storage access denied

**Testing:** Test add-in in Safari on macOS with ITP enabled.

### Risk 2: CSRF Attack Surface Increased

**Risk:** `SameSite=None` allows cross-site cookie sending, increasing CSRF attack surface.

**Likelihood:** Low
**Impact:** Medium (attacker could forge requests)

**Mitigation:**
1. ✅ Existing `csurf` middleware provides CSRF protection (already implemented)
2. ✅ All state-changing requests require CSRF token
3. ✅ Rate limiting on authentication endpoints (existing `express-rate-limit`)

**Testing:** Attempt CSRF attack from malicious site (should be blocked by CSRF token validation).

### Risk 3: Cookie Not Sent Due to CORS Misconfiguration

**Risk:** Backend CORS misconfiguration prevents cookies from being sent.

**Likelihood:** Low
**Impact:** High (add-in completely broken)

**Mitigation:**
1. ✅ Verify `ADDIN_URL` environment variable set correctly
2. ✅ Verify `credentials: true` in CORS config
3. ✅ Test in development before production deployment

**Testing:** Use `auth-test.html` to verify cookie sharing works.

### Risk 4: User Never Logged Into Main Web App

**Risk:** If user only uses Outlook Add-in and never logged into web app, session won't exist.

**Likelihood:** Low (most users will use web app first)
**Impact:** Medium (add-in can't authenticate)

**Mitigation:**
1. ✅ Add-in detects 401 Unauthorized
2. ✅ Add-in redirects user to web app login (better UX with password manager support)

**Testing:** Test add-in with fresh browser session (no cookies).

---

## Future Improvements

### Phase 1: MVP (Current Scope)
- ✅ Session cookie sharing with `credentials: 'include'`
- ✅ CSRF token management
- ✅ Storage Access API fallback for Safari
- ✅ Redirect to web app login on 401

### Phase 2: Enhanced UX (Post-MVP)
1. **Remember Me (Persistent Sessions)**
   - Extend session cookie `maxAge` to 90 days
   - Implement "Remember Me" checkbox on login

2. **Session Heartbeat**
   - Periodic ping to backend to keep session alive
   - Prevents session expiration during long Outlook sessions

### Phase 3: Advanced Authentication (Future)
1. **Nested App Authentication (NAA)**
   - Implement Microsoft Entra ID SSO for enterprise users
   - True single sign-on leveraging Outlook Web login
   - Access Microsoft Graph API for calendar integration

2. **Multi-Factor Authentication (MFA)**
   - Add MFA support for high-security environments
   - Integrate with Microsoft Authenticator or TOTP

3. **OAuth 2.0 for Third-Party Integrations**
   - Allow users to connect third-party services
   - Use OAuth 2.0 authorization code flow with PKCE

---

## References

### Microsoft Documentation

- [Develop Your Office Add-in to Work with ITP When Using Third-Party Cookies](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/itp-and-third-party-cookies)
- [Authentication Options in Outlook Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/authentication)
- [Enable Single Sign-On in an Office Add-in with Nested App Authentication](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in)
- [Storage Access API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API)

### Internal Project Files

- [Existing Project Analysis](../architecture/existing-project-analysis.md)
- [Security Integration](../architecture/security-integration.md)
- [API Design and Integration](../architecture/api-design-and-integration.md)
- [Infrastructure and Deployment Integration](../architecture/infrastructure-and-deployment-integration.md)

---

## Appendix

### A. Backend Session Configuration (Current State)

**File:** `backend/src/index.js`

```javascript
// Lines 42-61
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Already 'none' in production
    domain: process.env.COOKIE_DOMAIN || undefined, // ✅ Supports subdomain sharing
  },
}));
```

**Analysis:**
- ✅ `sameSite: 'none'` already configured for production
- ✅ `secure: true` ensures HTTPS-only cookies
- ✅ `httpOnly: true` protects against XSS
- ✅ `domain: .zollc.com` enables subdomain cookie sharing
- ✅ PostgreSQL session store via `connect-pg-simple`

**Conclusion:** Backend session configuration is **already optimal** for cross-origin cookie sharing. No changes needed.

### B. CORS Configuration (Current State)

**File:** `backend/src/index.js`

```javascript
// Lines 33-36
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true, // ✅ Already allows credentials
}));
```

**Required Change:**
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  process.env.ADDIN_URL || 'http://localhost:5173', // Add this line
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### C. Test HTML Page Usage

**File:** `outlook-addin/auth-test.html`

**Purpose:** Manual testing tool to validate session cookie sharing before deploying to production.

**Usage:**
1. Start backend: `cd backend && npm start`
2. Open test page: `http://localhost:5173/auth-test.html`
3. Run tests sequentially: Test 1 → Test 2 → Test 3
4. Check browser DevTools → Application → Cookies to verify `connect.sid` cookie

**Expected Results:**
- Test 1: Health check succeeds (200 OK)
- Test 2: CSRF token received + `connect.sid` cookie set
- Test 3: Without session: 401 Unauthorized (expected)
- Test 3: With session: 200 OK + API data returned (success)

---

**Document Version:** 1.0
**Last Updated:** October 9, 2025
**Status:** ✅ Authentication Strategy Finalized - Ready for Implementation
