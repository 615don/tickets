# Security Integration

## Existing Security Measures

**Authentication:** express-session + bcrypt (session-based with HTTP-only cookies)
**Security Tools:** helmet, express-validator, express-rate-limit, cors, csurf

## Enhancement Security Requirements

**Cross-Origin Session Cookie Configuration:**
```javascript
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
}
```

**CORS Configuration Update:**
```javascript
const allowedOrigins = [
  'https://tickets.zollc.com',
  'https://outlook-addin.zollc.com',
  process.env.FRONTEND_URL || 'http://localhost:8080',
  process.env.ADDIN_URL || 'http://localhost:5173',
];
```

**CSP Adjustments for Office.js:**
```javascript
contentSecurityPolicy: {
  directives: {
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Office.js
      "https://appsforoffice.microsoft.com",
    ],
  },
}
```

**Input Validation for New Endpoints:**
```javascript
router.get('/match-email', [
  query('email').isEmail().normalizeEmail(),
  validate,
], matchEmailController);
```

**Rate Limiting:**
```javascript
const matchingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

## Security Trade-offs

- ⚠️ **SameSite=None:** Increases CSRF risk (mitigated by existing csurf middleware)
- ⚠️ **CSP unsafe-inline:** Required for Office.js (limited to Microsoft CDN)
- ✅ **CORS whitelist:** Only specified origins allowed

---
