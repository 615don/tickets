# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing both frontend and backend code. This simplifies development, deployment, and dependency management for the MVP. The structure can be separated into polyrepo later if the project scales beyond single-user scope.

**Rationale:** Solo development with tight timeline (4-6 weeks) benefits from unified codebase. No team coordination overhead, simpler CI/CD pipeline, and easier context switching during rapid iteration.

## Service Architecture

**Monolithic web application** with clear separation between frontend (SPA), backend API layer, and data layer.

- **Frontend:** Single-page application (SPA) served as static assets
- **Backend:** RESTful API server handling business logic, Xero integration, and database operations
- **Database:** PostgreSQL for relational data (clients, contacts, tickets, time entries)

**Not using microservices or serverless** - unnecessary complexity for single-user system with straightforward workflows. All functionality deployed as single application unit.

**Rationale:** Brief emphasizes speed of development and minimal hosting costs. Monolith is fastest to build, easiest to deploy, and most cost-effective for expected load (one active user). Future Phase 2 features (Outlook extension, daily emails) can integrate with monolith via API endpoints.

## Testing Requirements

**Unit tests for critical business logic** - Focus testing effort on:
- Time entry parsing and validation (flexible format handling)
- Invoice calculation and line item formatting
- Xero API integration layer (with mocked API responses)
- Date-based filtering and time entry locking logic

**Manual testing for UI workflows** - Given tight MVP timeline and single user:
- Manual QA of ticket creation, editing, and invoice generation workflows
- Browser compatibility spot-checking on Chrome, Edge, Safari
- Responsive design manual testing on common mobile viewports

**No automated E2E or integration tests for MVP** - Trade-off accepting some risk to meet 4-6 week timeline. User will effectively perform UAT during real-world usage.

**Convenience methods for manual testing:**
- Seed script to populate test data (sample clients, contacts, tickets)
- Admin endpoint to reset Xero invoice locks for testing month-end workflow
- Database snapshot/restore utilities for safe testing

**Rationale:** YAGNI applied to testing pyramid. Critical financial calculations (time totals, invoice amounts) warrant unit tests. Complex E2E test infrastructure would consume significant timeline with marginal benefit for single-user MVP.

## Additional Technical Assumptions and Requests

**Frontend Framework:** Modern JavaScript framework recommended - **React** or **Vue.js** preferred for:
- Large ecosystem and component libraries (faster development)
- Strong TypeScript support (type safety for time calculations)
- Lightweight build output to meet <2 second page load NFR

**Backend Language/Framework:** **Node.js with Express** or **Python with FastAPI** recommended for:
- Excellent Xero API SDK availability (both have official/community libraries)
- Rapid development capability for REST APIs
- Shared language with frontend (Node.js) or clarity/simplicity (Python)

**Database:** **PostgreSQL** for:
- Robust relational data model (clients → contacts, tickets → time entries)
- JSON column support for flexible metadata storage if needed
- Reliable ACID transactions for invoice locking operations
- Free tier availability on most cloud hosting platforms

**Hosting/Deployment:** Cloud hosting with minimal DevOps overhead:
- **Heroku**, **Railway**, **Render**, or **DigitalOcean App Platform** recommended
- Single-click deployment from Git repository
- Managed PostgreSQL database (no manual DB administration)
- Automatic HTTPS and daily backups included
- Cost target: Under $20/month for MVP (hobby tier acceptable)

**Authentication:** Simple username/password with **bcrypt password hashing** for MVP. Session-based authentication with HTTP-only cookies. OAuth/SSO (Microsoft 365) deferred to post-MVP.

**Xero Integration:** Official Xero API SDK (Node.js or Python) with OAuth 2.0 flow. Store refresh tokens securely (encrypted at rest). Handle token refresh automatically. Research invoice line item limits during technical spike (identified risk in brief).

**Version Control & CI/CD:** Git repository (GitHub/GitLab), automated deployment on merge to main branch, database migrations handled via framework tooling (e.g., Alembic for Python, Sequelize/TypeORM for Node.js).

**Time Entry Storage:** Store time as decimal hours in database for calculation simplicity. Accept flexible input formats in UI, normalize to decimal on save.

**Timezone Handling:**
- All users and clients operate in Central Standard Time (CST/CDT)
- Server should be configured to CST timezone or convert all timestamps to CST for storage
- Work dates (`time_entries.work_date`) stored as DATE type (no time component, eliminates timezone confusion)
- Timestamps (`created_at`, `updated_at`, `closed_at`) stored in CST
- Date pickers in UI default to CST, no timezone conversion needed
- Month boundaries for invoice generation calculated in CST (e.g., "January 2025" = 2025-01-01 to 2025-01-31 CST)

**Rationale:** Single-timezone operation eliminates complexity. All users in same timezone means no conversion logic needed, reducing edge case bugs.

---
