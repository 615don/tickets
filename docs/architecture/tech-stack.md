# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions and tools.

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | ^5.8.3 | Type-safe frontend development | Catch errors at compile time, better IDE support, self-documenting code, required for shadcn/ui components |
| Frontend Framework | React | ^18.3.1 | UI component library | Industry standard, excellent ecosystem, component reusability, fast rendering with virtual DOM |
| UI Component Library | shadcn/ui | Latest (Radix UI ^1.x) | Accessible, customizable components | Copy-paste components (no runtime dependency), built on Radix UI primitives, Tailwind-based styling, excellent accessibility |
| State Management | React Query (TanStack Query) | ^5.83.0 | Server state management | Automatic caching, background refetching, optimistic updates, eliminates boilerplate for API calls |
| Backend Language | JavaScript (Node.js) | Node 18+ LTS | Server-side runtime | Shared language with frontend, excellent async I/O, large ecosystem, ES modules support |
| Backend Framework | Express | ^4.18.2 | HTTP server and routing | Minimal, flexible, well-documented, huge middleware ecosystem, perfect for REST APIs |
| API Style | REST | N/A | Client-server communication | Simple, well-understood, excellent HTTP tooling, sufficient for CRUD operations, easier debugging than GraphQL |
| Database | PostgreSQL | 14+ | Primary data store | ACID transactions, robust relational model, JSON support for flexibility, excellent performance, free on Railway |
| Cache | PostgreSQL (sessions only) | 14+ | Session storage | Reuses existing database, zero additional infrastructure, sufficient performance for 1-2 users |
| File Storage | Local filesystem (future: S3) | N/A | File attachments (future epic) | MVP uses local storage, S3 migration path for production scaling |
| Authentication | express-session + bcrypt | express-session ^1.17.3, bcrypt ^5.1.1 | Session-based auth with password hashing | HTTP-only cookies, server-side session control, industry-standard password hashing, simple to implement |
| Frontend Testing | Vitest (planned) | ^1.x | Unit and component tests | Fast, Vite-native, Jest-compatible API, built-in TypeScript support |
| Backend Testing | Jest or Node test runner (planned) | Latest | API and integration tests | Comprehensive testing framework, good mocking support, well-documented |
| E2E Testing | Manual (MVP), Playwright (future) | N/A | End-to-end workflow testing | Manual testing sufficient for MVP and single user, Playwright for automated E2E in future |
| Build Tool | npm | 9+ | Package management and scripts | Standard Node.js tooling, workspaces support for monorepo, no additional learning curve |
| Bundler | Vite | ^5.4.19 | Frontend build and dev server | Extremely fast HMR, native ES modules, optimized production builds, modern architecture |
| IaC Tool | None (Railway UI) | N/A | Infrastructure provisioning | Railway provides UI-based infrastructure management, no IaC needed for single-service deployment |
| CI/CD | GitHub Actions (planned) | N/A | Automated testing and deployment | Free for public repos, Railway GitHub integration for auto-deploy, simple YAML configuration |
| Monitoring | Railway built-in logs (MVP) | N/A | Application monitoring | Sufficient for MVP, upgrade to Sentry or LogRocket for production error tracking |
| Logging | Console + Railway logs | N/A | Application logging | Built-in console logging captured by Railway, structured logging via Winston/Pino for future |
| CSS Framework | Tailwind CSS | ^3.4.17 | Utility-first styling | Rapid UI development, excellent with shadcn/ui, small production bundle, highly customizable |
| Additional Libraries | react-hook-form + zod | ^7.61.1, ^3.25.76 | Form handling and validation | Type-safe form validation, excellent DX, integrates with shadcn/ui form components |
| HTTP Client | Fetch API (native) | Native | API requests from frontend | No additional dependencies, modern browsers support, sufficient for simple REST calls |
| Xero Integration | xero-node | ^6.0.0 | Xero API OAuth and invoicing | Official Xero SDK, handles OAuth 2.0 flow, invoice generation, token refresh |
| Session Store | connect-pg-simple | ^9.0.1 | PostgreSQL session storage | Integrates express-session with PostgreSQL, auto-creates session table, battle-tested |
| Security Headers | helmet | ^7.1.0 | HTTP security headers | Sets secure HTTP headers (CSP, HSTS, etc.), protects against common vulnerabilities |
| CORS | cors | ^2.8.5 | Cross-origin resource sharing | Enables frontend to call backend from different port/domain during development |
| Validation | express-validator | ^7.0.1 | Request validation | Sanitizes and validates API inputs, prevents injection attacks, middleware-based |

---
