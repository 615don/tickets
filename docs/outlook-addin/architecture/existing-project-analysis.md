# Existing Project Analysis

Based on analysis of the codebase, I've identified the following about your existing system:

## Current Project State

- **Primary Purpose:** Lean IT consulting ticketing and time-tracking system with Xero integration for invoice generation. Built for solo consultants to track billable hours and client work.
- **Current Tech Stack:**
  - Frontend: React 18.3.1 + TypeScript 5.8.3 + Vite 5.4.19 + shadcn/ui (Radix UI components) + Tailwind CSS 3.4.17
  - Backend: Node.js (ES modules) + Express 4.18.2 + PostgreSQL 14+
  - State Management: TanStack Query 5.83.0 for server state
  - Authentication: express-session 1.17.3 + bcrypt 5.1.1 (session-based with HTTP-only cookies)
  - Deployment: Railway (separate frontend and backend services)
- **Architecture Style:** Monorepo with NPM workspaces, REST API, Repository pattern on backend, component-based React frontend, session-based authentication
- **Deployment Method:** Railway platform with **separate services**:
  - **Frontend service:** Hosts built React application (static files) at `https://tickets.zollc.com`
  - **Backend service:** Express API server at `https://ticketapi.zollc.com`
  - **Database service:** Railway-managed PostgreSQL
  - **Custom domains:** tickets.zollc.com (frontend), ticketapi.zollc.com (backend)

## Available Documentation

- [/docs/architecture/tech-stack.md](docs/architecture/tech-stack.md:1) - Complete technology selection and rationale
- [/docs/architecture/database-schema.md](docs/architecture/database-schema.md:1) - ERD and schema details including `clients`, `contacts`, `client_domains` tables
- [/docs/architecture/deployment-architecture.md](docs/architecture/deployment-architecture.md:1) - Railway deployment process and environment configuration
- [/docs/architecture/coding-standards.md](docs/architecture/coding-standards.md:1) - Naming conventions and critical rules
- [/docs/architecture/unified-project-structure.md](docs/architecture/unified-project-structure.md:1) - Monorepo organization
- [/docs/prd-outlook-addin.md](docs/prd-outlook-addin.md:1) - Comprehensive PRD with 5 epics, 32 stories
- [/docs/front-end-spec-outlook-addin.md](docs/front-end-spec-outlook-addin.md:1) - Detailed UX/UI specification

## Identified Constraints

- **Single-user system:** No multi-tenancy, single admin user per deployment
- **Session-based auth:** Uses PostgreSQL-backed sessions via `connect-pg-simple`, HTTP-only cookies
- **CORS configured:** Backend allows frontend origin via `cors` middleware (currently `process.env.FRONTEND_URL` or `http://localhost:8080`)
- **Separate Railway services:** Frontend and backend deployed as independent services (impacts add-in deployment strategy)
- **Cross-origin session sharing required:** Frontend and backend on different Railway services means add-in (third origin) needs careful CORS + cookie configuration
- **Monorepo structure:** All code must fit within `backend/`, `frontend/`, or `packages/` workspaces
- **Domain matching infrastructure exists:** `client_domains` table already implemented (validated in schema)
- **Manual testing approach:** No automated E2E tests, unit tests for backend using Node test runner

---
