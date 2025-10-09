# Tech Stack

## Existing Technology Stack

The add-in must align with the existing project's technology decisions while accommodating Office.js requirements.

| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|---------------------|-------|
| Frontend Framework | React | 18.3.1 | **Downgrade from 19.1.1** in mockup | Align with main frontend; React 19 bleeding edge, Office.js compatibility unproven |
| Frontend Language | TypeScript | 5.8.3 | **Downgrade from ~5.9.3** in mockup | Match main frontend version for consistency |
| Build Tool | Vite | 5.4.19 | **Downgrade from 7.1.7** in mockup | Align with main frontend; Vite 7 too new |
| CSS Framework | Tailwind CSS | 3.4.17 | **Downgrade from 4.1.14** in mockup | Tailwind 4 has breaking changes; reuse main frontend config |
| UI Component Library | shadcn/ui (Radix UI) | 1.x | Existing mockup components compatible | Add-in already uses shadcn/ui pattern (custom components) |
| State Management | React State + Hooks | N/A | Existing mockup pattern (useState, useEffect) | No React Query needed for add-in (simple state, not data-heavy) |
| HTTP Client | Fetch API (native) | Native | Replace mock functions with real fetch calls | Consistent with main frontend approach |
| Authentication | express-session cookies | N/A | Cross-origin session cookies from backend | Requires `SameSite=None; Secure` configuration |
| Session Store | connect-pg-simple (backend) | 9.0.1 | No add-in changes needed | Backend manages sessions |
| Package Manager | npm | 9+ | Convert add-in to NPM workspace | Enable shared types via `/packages/shared` |

## New Technology Additions

| Technology | Version | Purpose | Rationale | Integration Method |
|------------|---------|---------|-----------|-------------------|
| Office.js | Latest (CDN) | Outlook Web Add-in API | Required for email metadata access, task pane integration | Loaded from Microsoft CDN in HTML head |
| @types/office-js | Latest | TypeScript type definitions | Type safety for Office.js API calls | DevDependency, installed via npm |
| Office Add-in Manifest | 1.1 (XML) | Add-in registration and permissions | Required by Office platform for sideloading | XML file hosted at public URL |

---
