# Source Tree Organization

## Existing Project Structure (Relevant Parts)

```
tickets/                              # Monorepo root
├── backend/                          # Backend Express API
│   ├── src/
│   │   ├── controllers/              # Request handlers
│   │   ├── routes/                   # Express routes
│   │   │   ├── clients.js            # Existing: GET /api/clients
│   │   │   ├── contacts.js           # Existing: GET /api/contacts
│   │   │   └── tickets.js            # Existing: POST /api/tickets
│   │   └── middleware/               # auth.js, validation.js
│   └── package.json
├── frontend/                         # React web app
│   ├── src/
│   │   ├── components/               # React components
│   │   └── lib/api/                  # API service modules
│   └── package.json
├── outlook-addin/                    # Add-in (existing mockup)
│   ├── src/
│   │   ├── components/               # React components (8 exist)
│   │   ├── types.ts                  # TypeScript types
│   │   ├── mocks.ts                  # Mock API (to be removed)
│   │   └── App.tsx                   # Main component
│   ├── manifest/                     # (TO CREATE) Office manifest
│   └── package.json                  # Standalone (convert to workspace)
├── packages/                         # (TO CREATE) Shared packages
│   └── shared/                       # (TO CREATE) Shared types/utils
│       ├── src/
│       │   ├── types/                # Shared TypeScript types
│       │   └── utils/                # Shared utilities (timeParser)
│       └── package.json              # @tickets/shared
├── docs/
│   ├── architecture/                 # Existing architecture docs
│   ├── prd-outlook-addin.md          # PRD
│   └── front-end-spec-outlook-addin.md
└── package.json                      # Root (workspaces)
```

## New File Organization (Add-in Specific)

```
outlook-addin/
├── src/
│   ├── components/                   # (EXISTING) UI components
│   ├── lib/                          # (TO CREATE) Utilities and API
│   │   ├── api-client.ts             # HTTP client wrapper (fetch + auth)
│   │   ├── api/                      # API service modules
│   │   │   ├── clients.ts            # GET /api/clients
│   │   │   ├── contacts.ts           # GET /api/contacts, match-email
│   │   │   ├── tickets.ts            # POST /api/tickets
│   │   │   └── matching.ts           # match-email, match-domain
│   │   └── office.ts                 # Office.js wrapper utilities
│   ├── hooks/                        # (TO CREATE) Custom React hooks
│   │   ├── useEmailContext.ts        # Office.js email detection
│   │   ├── useMatching.ts            # Email/domain matching
│   │   └── useTicketSubmission.ts    # Ticket creation
│   └── types.ts                      # (EXISTING) Add-in-specific types
├── manifest/                         # (TO CREATE) Office manifest
│   ├── outlook-addin-manifest.xml    # Dev manifest (localhost)
│   └── outlook-addin-manifest.prod.xml # Prod manifest (Railway)
└── package.json                      # Dependencies
```

## Integration Guidelines

**File Naming:**
- Add-in components: PascalCase (e.g., `EmailContext.tsx`)
- API service modules: camelCase (e.g., `api-client.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useEmailContext.ts`)
- Backend routes: kebab-case (e.g., `match-email`)

**Import/Export Patterns:**
- Shared types: `import { Client } from '@tickets/shared'`
- Add-in components: `import { Sidebar } from './components/Sidebar'`

---
