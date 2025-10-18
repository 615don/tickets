# Ticketing System - Lean IT Consulting

A complete ticketing and billing system designed for solo IT consultants and small consulting firms. Built to eliminate revenue leakage from forgotten billable hours with ultra-fast ticket creation and seamless Xero invoice integration.

## Project Structure (Monorepo)

```
tickets/
├── frontend/          # React + Vite + TypeScript (Lovable-generated)
├── backend/           # Node.js + Express + PostgreSQL API
├── docs/              # PRD, architecture, and documentation
├── .bmad-core/        # BMAD agent configuration
└── README.md          # This file
```

## Quick Start

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 14+**
- **Xero Developer Account** (for OAuth - optional for initial testing)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your PostgreSQL credentials
nano .env  # or use your preferred editor

# Install dependencies (already done)
npm install

# Create database
createdb ticketing_system

# Run migrations
npm run migrate

# Start backend server
npm run dev
```

Backend runs on: **http://localhost:3001**

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

### 3. Test the Connection

1. **Backend health check**: Visit http://localhost:3001/api/health
2. **Frontend**: Visit http://localhost:5173
3. Both should be running simultaneously

## Development Workflow

### Current Status: ✅ Frontend Complete, 🚧 Backend In Progress

**Completed:**
- ✅ Frontend UI (all screens built in Lovable)
- ✅ Backend project structure and database migrations
- ✅ Development environment setup

**Next Steps:**
1. Configure your PostgreSQL database credentials in `backend/.env`
2. Run backend migrations to create database schema
3. Implement API endpoints (Epic by Epic)
4. Connect frontend to backend APIs
5. Set up Xero OAuth integration
6. Deploy to production

### Epic Implementation Order

Following the PRD epic structure:

1. **Epic 1: Foundation & Authentication** (Stories 1.1-1.4)
   - Basic auth system (register, login, logout)
   - Session management

2. **Epic 2: Client & Contact Management** (Stories 2.1-2.7)
   - Client CRUD API endpoints
   - Contact CRUD API endpoints
   - System contact handling

3. **Epic 3: Core Ticket & Time Entry System** (Stories 3.1-3.9)
   - Ticket CRUD endpoints
   - Time entry management
   - Flexible time parsing
   - Open/closed ticket states

4. **Epic 4: Xero Integration & Invoice Generation** (Stories 4.1-4.7)
   - Xero OAuth flow
   - Invoice preview endpoint
   - Invoice generation and push to Xero
   - Invoice locking mechanism

5. **Epic 5: Views, Search & Historical Access** (Stories 5.1-5.7)
   - Dashboard data aggregation
   - Ticket search functionality
   - Historical ticket access

## Asset Management

Track hardware assets linked to clients and contacts with integrated warranty monitoring and remote access tools.

### Features
- **Asset Tracking**: Link assets to clients and contacts with comprehensive device information
- **One-Click Remote Access**: Direct integration with ScreenConnect and PDQ Connect
- **Lenovo Warranty API Integration**: Automatic warranty lookup and expiration tracking
- **Color-Coded Warranty Status**:
  - 🔴 Red: Expired
  - 🟡 Yellow: Expiring soon (within 30 days)
  - 🟢 Green: Active warranty
  - ⚪ Gray: Unknown/Not set
- **Asset Lifecycle Management**:
  - Active assets appear in ticket widgets
  - Retired assets hidden from active lists but preserved
  - Permanent delete after 2+ years retired
- **Client Documentation Links**: Notion URL field for quick access to client documentation

### Navigation
Access asset management via **Manage → Assets** in the navigation menu.

### Asset Widget
Assets appear automatically on ticket detail pages below contact information, showing:
- Up to 2 assets with hostname, warranty status, and remote tool access buttons
- "View all X assets" link when contact has more than 2 assets
- Empty state with "Add Asset" button when no assets exist
- Mobile responsive: Hidden by default with "View Assets" toggle button

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **State**: React Context / TanStack Query

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Session Store**: connect-pg-simple
- **Authentication**: bcrypt + express-session
- **Xero Integration**: xero-node SDK
- **Validation**: express-validator

## Environment Configuration

### Backend `.env` Required Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database (UPDATE THESE)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticketing_system
DB_USER=postgres
DB_PASSWORD=your_password_here

# Session (CHANGE THIS SECRET)
SESSION_SECRET=generate_a_long_random_string_here

# Xero OAuth (get from Xero developer portal)
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_REDIRECT_URI=http://localhost:3001/api/xero/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Timezone
TZ=America/Chicago

# Asset Management (Optional)
LENOVO_API_KEY=your_lenovo_api_key_here  # Optional: For automatic warranty lookups
ASSET_CACHE_TTL=                          # Optional: Cache TTL in seconds (default: indefinite)
```

**Asset Management Variables:**
- `LENOVO_API_KEY` (optional): API key from Lenovo Support API portal. If not set, warranty lookup button will be disabled with graceful degradation - manual warranty entry still available.
- `ASSET_CACHE_TTL` (optional): Time-to-live for asset cache in seconds. Default is indefinite (cache only cleared on asset updates).

### Setting up PostgreSQL

**Option 1: Using createdb**
```bash
createdb ticketing_system
```

**Option 2: Using psql**
```bash
psql -U postgres
CREATE DATABASE ticketing_system;
\q
```

**Option 3: Using Postgres.app (macOS)**
- Open Postgres.app
- Click "+" to create new database
- Name it "ticketing_system"

## Documentation

- **PRD**: [docs/prd.md](docs/prd.md) - Complete product requirements
- **Backend README**: [backend/README.md](backend/README.md) - API documentation
- **Frontend README**: [frontend/README.md](frontend/README.md) - UI documentation

## Architecture Overview

### Monolithic Architecture
- Single repository (monorepo)
- Frontend SPA + Backend API + PostgreSQL database
- Session-based authentication
- RESTful API design

### Database Schema
- **users**: Authentication
- **clients**: Companies being billed (includes notion_url for documentation links)
- **client_domains**: Email domains for client auto-detection
- **contacts**: People at client companies
- **tickets**: Billable work items
- **time_entries**: Time logged per ticket (with soft deletes)
- **invoice_locks**: Month locks after Xero push
- **xero_connections**: OAuth tokens (encrypted)
- **assets**: Hardware asset tracking with warranty and lifecycle management

### Database Migrations

**Asset Management Migrations (Epic 15):**

1. **Create Assets Table** - Adds the `assets` table with full asset lifecycle support:
   - Fields: hostname, manufacturer, model, serial_number, warranty dates, external tool IDs
   - Relationships: Links to clients (required) and contacts (optional)
   - Status tracking: active, retired, permanently deleted after 2+ years
   - Indexes for performance: client_id, contact_id, status

2. **Add Client Notion URL** - Adds `notion_url` column to `clients` table:
   - Stores Notion workspace URLs for quick documentation access
   - Optional field with URL validation

**Rollback Commands (if needed):**
```sql
-- Rollback assets table
DROP TABLE IF EXISTS assets CASCADE;

-- Rollback clients.notion_url column
ALTER TABLE clients DROP COLUMN IF EXISTS notion_url;
```

### Key Features
- **Ultra-fast ticket creation**: <10 second goal (3 required fields)
- **Flexible time input**: "2h", "45m", "1.5h" all work
- **Deferred detail capture**: Add descriptions later before invoicing
- **Pre-invoice review**: See all work before pushing to Xero
- **Invoice locking**: Prevent changes after invoicing
- **System contacts**: Preserve ticket history when contacts deleted

## Deployment

### Recommended Platforms
- **Railway** (easiest)
- **Render** (good free tier)
- **Heroku** (classic choice)
- **DigitalOcean App Platform**

### Pre-deployment Checklist
- [ ] Change SESSION_SECRET in production
- [ ] Set up managed PostgreSQL database
- [ ] Configure Xero OAuth redirect URI for production URL
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS for production frontend URL
- [ ] Set up automated database backups

## Testing

### Backend Testing
```bash
cd backend

# Health check
curl http://localhost:3001/api/health

# Once auth is implemented
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend Testing
- Navigate to http://localhost:5173
- All screens should render (currently with mock data)
- Navigation should work between all pages

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Verify `.env` file exists and has correct DB credentials
- Check if port 3001 is available

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check CORS settings in `backend/src/index.js`
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL

### Database connection errors
- Confirm database `ticketing_system` exists
- Check DB credentials in `.env`
- Ensure PostgreSQL is accepting connections on port 5432

## Contributing

This is an MVP project following the PRD. Epic-by-epic implementation recommended.

## License

ISC

## Support

Refer to PRD documentation in `/docs/` for detailed requirements and user stories.
