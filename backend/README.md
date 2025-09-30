# Ticketing System Backend

Node.js/Express backend API for the lean IT consulting ticketing system.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: Session-based with bcrypt
- **Xero Integration**: xero-node SDK

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Xero developer account (for OAuth integration)

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Create PostgreSQL database:
```bash
createdb ticketing_system
# Or using psql:
# psql -U postgres -c "CREATE DATABASE ticketing_system;"
```

4. Run database migrations:
```bash
npm run migrate
```

5. (Optional) Seed test data:
```bash
npm run seed
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

Server will run on http://localhost:3001

### Testing

Health check endpoint:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T10:30:00.000Z",
  "database": "connected"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Request handlers (Epic implementations)
│   ├── middleware/     # Express middleware (auth, validation)
│   ├── models/         # Database models and queries
│   ├── routes/         # API route definitions
│   ├── utils/          # Utilities (migrations, time parsing, etc.)
│   └── index.js        # Express app entry point
├── .env.example        # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Epic 1: Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Epic 2: Clients & Contacts
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/:id` - Get contact by ID
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact (soft delete)

### Epic 3: Tickets & Time Entries
- `GET /api/tickets` - List tickets (with filters)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/time-entries` - Add time entry
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry (soft delete)

### Epic 4: Xero & Invoices
- `GET /api/xero/connect` - Initiate OAuth flow
- `GET /api/xero/callback` - OAuth callback handler
- `GET /api/xero/status` - Check connection status
- `POST /api/xero/test` - Test connection
- `POST /api/xero/disconnect` - Disconnect from Xero
- `GET /api/invoices/preview` - Preview invoice for month
- `POST /api/invoices/generate` - Generate and push invoices to Xero

### Epic 5: Search & History
- `GET /api/tickets/search` - Search historical tickets

## Environment Variables

See `.env.example` for all required environment variables.

### Critical Variables
- `DB_*` - PostgreSQL connection details
- `SESSION_SECRET` - Secure session encryption key (change in production!)
- `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` - From Xero developer portal
- `FRONTEND_URL` - For CORS (default: http://localhost:5173)

## Database Migrations

Migrations are run automatically via `npm run migrate`. They are idempotent (safe to run multiple times).

### Migration Files
Located in `src/utils/migrate.js`:
- 001: Users table
- 002: Clients table
- 003: Client domains table
- 004: Contacts table
- 005: Tickets table
- 006: Time entries table
- 007: Invoice locks table
- 008: Xero connections table

## Development Workflow

1. **Epic-by-epic development**: Implement each Epic's API endpoints in order
2. **Test with cURL/Postman**: Verify endpoints work before connecting frontend
3. **Update frontend**: Replace mock data with real API calls
4. **Deploy**: Push to production hosting (Railway, Render, Heroku)

## Next Steps

- [ ] Implement Epic 1: Authentication (Story 1.3)
- [ ] Implement Epic 2: Client & Contact APIs (Stories 2.3-2.4)
- [ ] Implement Epic 3: Ticket & Time Entry APIs (Stories 3.3-3.5)
- [ ] Implement Epic 4: Xero OAuth & Invoice Generation (Stories 4.1-4.4)
- [ ] Implement Epic 5: Search endpoints (Story 5.4)
- [ ] Connect frontend to backend APIs
- [ ] Deploy to production

## Deployment

### Railway / Render / Heroku

1. Set environment variables in hosting platform
2. Add PostgreSQL addon/service
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Migrations run automatically on deployment

## Support

For issues or questions, refer to the main project PRD in `/docs/prd.md`
