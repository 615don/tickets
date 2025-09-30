# Coding Standards

## Critical Rules

- **Type Sharing:** Define types in `/packages/shared` (Epic 3+)
- **API Calls:** Always use service layer, never direct fetch in components
- **Environment Variables:** Access via config, never `process.env` directly
- **Error Handling:** All API routes use standard error format
- **State Updates:** Never mutate state directly

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `ClientList.tsx` |
| Hooks | camelCase with 'use' | - | `useClients.ts` |
| API Routes | - | kebab-case | `/api/client-domains` |
| Database Tables | - | snake_case | `client_domains` |

---
