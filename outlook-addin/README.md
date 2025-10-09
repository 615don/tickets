# Outlook Add-in for Ticketing System

This is the Outlook Add-in component of the Ticketing System, providing email-to-ticket conversion functionality directly within Microsoft Outlook.

## Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Microsoft Outlook**: Desktop, Web, or Mobile (Office 365 subscription recommended)

## Technology Stack

- **React**: 18.3.1
- **TypeScript**: 5.8.3
- **Vite**: 5.4.19
- **Tailwind CSS**: 3.4.17
- **Office.js**: Loaded from Microsoft CDN

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate HTTPS Certificate (First-time setup only)

Office Add-ins **require HTTPS** even in local development. The project includes a self-signed SSL certificate for localhost.

**If you need to regenerate the certificate:**

Using `mkcert` (recommended):
```bash
# Install mkcert (macOS)
brew install mkcert

# Generate certificate
mkcert -install
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost
```

Using `openssl` (alternative):
```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' \
  -keyout certs/localhost-key.pem \
  -out certs/localhost.pem \
  -days 365
```

**Note:** Certificate files (`*.pem`) are excluded from git tracking for security.

### 3. Start Development Server

```bash
npm run dev
```

The add-in will be available at: **`https://localhost:5173`**

**First-time HTTPS warning:** Your browser will show a security warning because the certificate is self-signed. This is expected for local development:
- **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "visit this website"

### 4. Access the Add-in

Open your browser and navigate to `https://localhost:5173` to verify the dev server is running.

## Available Scripts

- **`npm run dev`**: Start HTTPS development server on port 5173
- **`npm run build`**: Create production build in `/dist` directory
- **`npm run lint`**: Run ESLint code quality checks
- **`npm run preview`**: Preview production build locally

## Project Structure

```
outlook-addin/
├── src/
│   ├── components/          # React UI components (PascalCase)
│   ├── lib/                 # Utilities and API clients
│   │   ├── api/             # API service modules (camelCase)
│   │   └── office.ts        # Office.js wrapper utilities
│   ├── hooks/               # Custom React hooks (useHookName)
│   └── types.ts             # TypeScript type definitions
├── manifest/                # Office Add-in manifest files
├── certs/                   # SSL certificates (gitignored)
├── public/                  # Static assets
└── index.html               # HTML template with Office.js CDN
```

## Authentication

The add-in uses **session cookie sharing** with the main application backend:
- All API requests must include `credentials: 'include'`
- Backend is configured with `sameSite: 'none'` for cross-origin cookies
- User must be logged into the main application first

## Troubleshooting

### Certificate Issues

**Problem:** "Your connection is not private" or "NET::ERR_CERT_AUTHORITY_INVALID"

**Solution:**
1. Verify certificate files exist in `certs/` directory
2. Regenerate certificates using instructions above
3. Clear browser SSL cache and restart dev server
4. On macOS, add certificate to Keychain Access and mark as trusted

### Dev Server Won't Start

**Problem:** Port 5173 already in use

**Solution:**
```bash
# Find process using port 5173
lsof -i :5173

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or change port in vite.config.ts
```

### Office.js Not Loading

**Problem:** Office.js script fails to load in browser

**Solution:**
1. Check browser DevTools Network tab for CDN request
2. Verify `index.html` includes Office.js script in `<head>`
3. Check internet connection (Office.js loads from Microsoft CDN)
4. Try different network (some corporate firewalls block CDN)

### Build Errors After Version Changes

**Problem:** TypeScript or dependency errors after switching branches

**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

## Development Guidelines

- **File Naming**:
  - Components: `PascalCase.tsx`
  - API modules: `camelCase.ts`
  - Hooks: `useHookName.ts`

- **Office.js Usage**:
  - Always call `Office.onReady()` before accessing Office APIs
  - Wrap Office.js calls in try-catch error handlers
  - Reference: [Office.js Documentation](https://learn.microsoft.com/en-us/office/dev/add-ins/)

- **API Calls**:
  - Use `credentials: 'include'` in fetch requests
  - Base URL: `http://localhost:3001/api` (dev) or production backend URL

## Resources

- [Office Add-ins Documentation](https://learn.microsoft.com/en-us/office/dev/add-ins/)
- [Office.js API Reference](https://learn.microsoft.com/en-us/javascript/api/office)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## License

Internal use only - Part of the Ticketing System monorepo.
