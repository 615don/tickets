# Deployment Architecture

## Production Deployment

**Platform:** Railway
**Custom Domain:** `tickets.zollc.com` (CNAME to Railway)

**Unified Deployment:** Backend serves frontend static files in production (single web service)

**Build Process:**
1. Frontend builds to `frontend/dist`
2. Backend serves static files from `dist/`
3. API routes at `/api/*`, frontend routes handled by React Router

**Database:** Railway PostgreSQL (managed, automatic backups)

**SSL/HTTPS:** Railway auto-provisions Let's Encrypt certificates

## Environments

| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| Development | http://localhost:8080 | Local PostgreSQL | Local dev |
| Staging | https://tickets-staging.railway.app | Railway PG (staging) | Pre-prod testing |
| Production | https://tickets.zollc.com | Railway PG (prod) | Live environment |

## Deployment Process

```bash
# Connect to Railway
railway link

# Run migrations on production
railway run npm run migrate

# Deploy (auto-deploys on push to main)
git push origin main

# Manual deploy
railway up
```

## CI/CD Pipeline

**GitHub Actions:** Auto-deploy on merge to `main` branch
- Install dependencies
- Build frontend
- Run tests (when implemented)
- Deploy to Railway

**Railway Configuration:**
- Build: `npm install && npm run build --workspace=frontend`
- Start: `npm start --workspace=backend`
- Auto-scaling: Railway handles (single instance sufficient for MVP)

## Custom Domain Setup

1. Add CNAME record: `tickets.zollc.com` → `<railway-app>.railway.app`
2. Configure custom domain in Railway dashboard
3. Update environment variables: `FRONTEND_URL=https://tickets.zollc.com`
4. Update Xero redirect URI: `https://tickets.zollc.com/api/xero/callback`

## Monitoring

- Railway built-in logs and metrics
- Health check: `https://tickets.zollc.com/api/health`
- Future: Sentry for error tracking (post-MVP)

---
