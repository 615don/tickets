# Epic 8: Technical Discovery & Office Add-in Foundation

**Epic Goal:** Validate the technical feasibility of Office Add-in development by researching Office.js Mail API capabilities, authentication strategies, and manifest requirements. Establish a working development environment and deploy a minimal "hello world" add-in to Outlook Web Access, proving the foundation before building features.

## Story 8.1: Office.js API Research & Capability Validation

As a **developer**,
I want **to research and document Office.js Mail API capabilities**,
so that **I can confirm the API provides sufficient email metadata for contact/client matching**.

### Acceptance Criteria

1. Office.js Mail API documentation reviewed for Outlook Web Add-in task pane context
2. Confirmed Office.js provides access to: sender email address, sender display name, email subject
3. Validated task pane can persist across email selections (or documented reload behavior)
4. Documented any API limitations: rate limits, permissions required, unsupported scenarios
5. Tested Mail API in browser console or simple HTML page to verify basic functionality
6. Research findings documented in `/outlook-addin/docs/office-api-research.md`
7. Decision documented: task pane feasible for MVP requirements or show-stopper issues identified

## Story 8.2: Authentication Strategy Research & Decision

As a **developer**,
I want **to research authentication options for Office Add-in communicating with existing backend API**,
so that **I can choose the best approach for seamless user experience**.

### Acceptance Criteria

1. Researched session cookie sharing between web app and add-in task pane iframe
2. Tested if `SameSite=None; Secure` cookies accessible from Office Add-in context
3. Researched token-based authentication alternatives (JWT, OAuth implicit flow)
4. Documented pros/cons of each approach (UX friction, implementation complexity, security)
5. Decision made and documented: session sharing OR token-based auth
6. If session sharing: confirmed backend CORS configuration required
7. If token-based: defined token generation/storage mechanism
8. Authentication strategy documented in `/outlook-addin/docs/auth-strategy.md`

## Story 8.3: Add-in Project Setup & Development Environment

As a **developer**,
I want **to scaffold the Outlook Add-in project with React and TypeScript**,
so that **I have a proper development environment for building the sidebar UI**.

### Acceptance Criteria

1. Created `/outlook-addin` directory in monorepo root
2. Initialized React + TypeScript project using Vite
3. Configured Vite dev server to run with HTTPS (self-signed certificate for local development)
4. Added Office.js CDN script to HTML template
5. Created basic project structure: `/src/components`, `/src/utils`, `/src/types`
6. Installed dependencies: React, TypeScript, Office.js type definitions (@types/office-js)
7. Created npm scripts: `npm run dev` (HTTPS dev server), `npm run build` (production bundle)
8. Verified dev server accessible at `https://localhost:3000` (or configured port)
9. Updated root `.gitignore` to exclude add-in build artifacts
10. README.md created with setup instructions for add-in development

## Story 8.4: Office Add-in Manifest Creation

As a **developer**,
I want **to create an Office Add-in manifest XML file**,
so that **the add-in can be sideloaded into Outlook Web Access**.

### Acceptance Criteria

1. Created manifest XML file at `/outlook-addin/manifest/outlook-addin-manifest.xml`
2. Manifest includes required fields: ID (UUID), version, provider name, display name, description
3. Manifest specifies task pane source URL pointing to localhost HTTPS dev server
4. Manifest requests Mail.Read permission for accessing email metadata
5. Manifest specifies supported Outlook hosts: Outlook Web Access (desktop)
6. Manifest includes icon URLs (placeholder icons acceptable for MVP)
7. Manifest validates against Office Add-in schema (use Office Add-in Validator tool)
8. Created npm script to generate production manifest with Railway hosted URL
9. Documentation added: how to sideload manifest in Outlook Web for testing

## Story 8.5: Hello World Add-in Implementation & Sideloading

As a **developer**,
I want **to build a minimal "hello world" add-in that displays in Outlook Web**,
so that **I can validate the entire development-to-deployment pipeline**.

### Acceptance Criteria

1. React component created displaying "Hello from Outlook Add-in" in sidebar
2. Office.js initialization code implemented: `Office.onReady()` callback
3. Add-in detects Outlook host and displays host information (Outlook Web, version)
4. Sidebar renders successfully when add-in loaded in Outlook Web
5. Add-in sideloaded successfully in Outlook Web Access using manifest file
6. Task pane opens and displays hello world UI
7. Verified task pane persists when navigating between emails (or documented reload behavior)
8. No console errors or Office.js API errors during load
9. Screenshot captured of working add-in in Outlook Web for documentation

## Story 8.6: Production Deployment & Manifest Hosting

As a **developer**,
I want **to deploy the add-in to production hosting and publish the manifest**,
so that **the add-in can be installed from a public URL**.

### Acceptance Criteria

1. Add-in production build created using `npm run build`
2. Static files deployed to Railway (alongside existing backend) or separate static host (Netlify/GitHub Pages)
3. Production manifest XML updated with public HTTPS URL
4. Manifest hosted at publicly accessible URL (e.g., `https://tickets.railway.app/outlook-addin/manifest.xml`)
5. Sideloaded add-in from production manifest successfully in Outlook Web
6. Task pane loads from production URL (not localhost)
7. Verified HTTPS certificate valid (no browser security warnings)
8. Updated documentation with production installation instructions
9. Production URL returns correct MIME type for manifest (application/xml or text/xml)

---
