# Unified Project Structure

```
tickets/
├── backend/                          # Backend application
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # PostgreSQL pool
│   │   ├── controllers/              # Request handlers
│   │   ├── middleware/               # Auth, validation
│   │   ├── models/                   # Repository pattern
│   │   ├── routes/                   # Express routes
│   │   ├── utils/                    # Migrations, seed, helpers
│   │   └── index.js                  # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/                         # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   └── ...                   # Business components
│   │   ├── hooks/                    # React Query hooks
│   │   ├── lib/
│   │   │   ├── api-client.ts         # HTTP client
│   │   │   └── api/                  # API service modules
│   │   ├── pages/                    # Route components
│   │   ├── types/                    # TypeScript types
│   │   ├── App.tsx                   # Routing
│   │   └── main.tsx                  # Entry point
│   ├── .env.example
│   └── package.json
├── packages/                         # Shared packages (future)
│   └── shared/                       # Shared types (Epic 3+)
├── docs/                             # Documentation
│   ├── architecture.md               # This document
│   ├── prd.md                        # Requirements
│   └── stories/                      # Story files
├── .github/workflows/                # CI/CD
├── package.json                      # Root (workspaces)
└── README.md
```

**NPM Workspaces:** Root package.json defines workspaces for backend, frontend, and packages/*

---
