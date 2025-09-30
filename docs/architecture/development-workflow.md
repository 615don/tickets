# Development Workflow

## Local Setup

```bash
# Install dependencies
npm install

# Create database
createdb ticketing_system

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env with DB credentials

# Run migrations
npm run migrate

# Start development servers
npm run dev  # Starts backend + frontend concurrently
```

## Development Commands

```bash
npm run dev              # Start all services
npm run dev:backend      # Backend only (port 3001)
npm run dev:frontend     # Frontend only (port 8080)
npm run migrate          # Run database migrations
npm run seed             # Seed test data
npm run build            # Build for production
```

## Environment Variables

**Backend (.env):**
```bash
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticketing_system
DB_USER=postgres
DB_PASSWORD=your_password
SESSION_SECRET=<generate-strong-secret>
FRONTEND_URL=http://localhost:8080
TZ=America/Chicago
```

**Frontend (.env.local):**
```bash
VITE_API_URL=http://localhost:3001
```

---
