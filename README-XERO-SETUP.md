# Xero OAuth Setup Guide

This guide walks you through configuring Xero OAuth 2.0 integration for the ticketing system.

## Prerequisites

- Xero account with organization access
- Xero Developer account (free to create)

## Step 1: Create Xero Developer App

1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Sign in with your Xero credentials
3. Click **"My Apps"** → **"New App"**
4. Fill in app details:
   - **App Name**: `IT Ticketing System` (or your preferred name)
   - **Integration Type**: Choose **"Web App"**
   - **Company/Application URL**: `https://localhost:8080` (placeholder - Xero requires HTTPS)
   - **Redirect URI**: See "Local Development Testing" section below for setup

5. Click **"Create App"**

**Note:** Xero requires HTTPS for all URLs. For local development OAuth testing, you'll need to use ngrok (see below).

## Step 2: Get OAuth Credentials

1. After creating the app, navigate to the **"Configuration"** tab
2. Copy the following values:
   - **Client ID**
   - **Client Secret** (click "Generate a secret" if not shown)

## Step 3: Local Development Testing with ngrok

Since Xero requires HTTPS for OAuth, you need to use **ngrok** to create a secure tunnel to your local server.

### Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### Start Development Environment

```bash
# Terminal 1: Start backend server
cd backend && npm run dev
# Server runs on http://localhost:3001

# Terminal 2: Create ngrok tunnel
ngrok http 3001
# You'll see output like:
# Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Copy the HTTPS URL from ngrok** (e.g., `https://abc123.ngrok.io`)

### Configure Environment Variables

1. Open `backend/.env` file
2. Update the following variables:

```bash
XERO_CLIENT_ID=your_xero_client_id_here
XERO_CLIENT_SECRET=your_xero_client_secret_here
XERO_REDIRECT_URI=https://YOUR-NGROK-URL.ngrok.io/api/xero/callback
XERO_SCOPES=accounting.transactions accounting.contacts
FRONTEND_URL=http://localhost:8080
```

3. Ensure `ENCRYPTION_KEY` is set (already generated during setup)

### Update Xero Developer Portal

1. Go back to [Xero Developer Portal](https://developer.xero.com/)
2. Edit your app configuration
3. Update **Redirect URI** to: `https://YOUR-NGROK-URL.ngrok.io/api/xero/callback`
4. Save changes

**Important:** The ngrok URL changes each time you restart ngrok (unless you have a paid account). You'll need to update both `.env` and Xero Developer Portal whenever you restart ngrok.

## Step 4: Create "Consulting Services" Item in Xero

The system requires a product/service item named **"Consulting Services"** for invoice generation.

1. Log in to your Xero organization
2. Go to **Business** → **Products and Services**
3. Click **"New Item"**
4. Fill in details:
   - **Item Name**: `Consulting Services`
   - **Item Code**: `CONSULT` (or your preferred code)
   - **Description**: `IT consulting and support services`
   - **Sales Account**: Choose appropriate income account (e.g., "Sales")
   - **Sales Price**: Set your hourly rate or leave blank (can be overridden per invoice)
5. Click **"Save"**

## Step 5: Connect Xero in Application

**Make sure ngrok is running and configured** (see Step 3 above)

1. Verify backend server is running: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:8080`
4. Log in to the application
5. Navigate to **Settings** page
6. In the "Xero Integration" section, click **"Connect to Xero"**
7. You'll be redirected to Xero's login page
8. Authorize the application
9. Xero will redirect to your ngrok URL, which tunnels back to localhost
10. You'll be redirected back to the Settings page with a success message

## Troubleshooting

### "No authorization code received from Xero"
- Verify `XERO_REDIRECT_URI` matches exactly what you configured in Xero Developer Portal
- Check for typos in the redirect URI
- **For local dev:** Ensure ngrok is running and the URL matches in both `.env` and Xero Developer Portal
- Check that ngrok tunnel hasn't expired (free tier has session limits)

### "OAuth state mismatch" error
- This is CSRF protection - ensure you're using the same browser session
- Clear cookies and try again
- Make sure you're accessing via `http://localhost:8080` (not the ngrok URL)

### "No Xero organization found"
- Ensure you're logged in to a Xero organization
- Check that your Xero account has access to at least one organization

### "Consulting Services not found" warning
- Create the item in Xero as described in Step 4
- Item name must be exactly "Consulting Services" (case-sensitive)

### "Failed to complete Xero authorization"
- Check backend logs for detailed error messages
- Verify `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` are correct
- Ensure `ENCRYPTION_KEY` is a valid 32-byte hex string

### ngrok URL changed / OAuth stopped working
- Restart ngrok to get a new URL
- Update `XERO_REDIRECT_URI` in `backend/.env`
- Update Redirect URI in Xero Developer Portal
- Restart backend server to pick up new env vars

## Security Notes

- Never commit `.env` file to version control
- Keep `XERO_CLIENT_SECRET` and `ENCRYPTION_KEY` secure
- Tokens are encrypted at rest using AES-256-CBC
- Access tokens auto-refresh every 30 minutes
- OAuth flow includes CSRF protection via state parameter
- Rate limiting: 5 OAuth attempts per 15 minutes per IP

## Production Deployment

When deploying to production:

1. Update `XERO_REDIRECT_URI` in both:
   - `.env` file
   - Xero Developer Portal app configuration
2. Use HTTPS for redirect URI (e.g., `https://yourdomain.com/api/xero/callback`)
3. Update `FRONTEND_URL` in `.env` to production domain
4. Regenerate `ENCRYPTION_KEY` for production environment

