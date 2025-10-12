# Technical Assumptions

## Repository Structure: Monorepo

Add-in code will live in `/outlook-addin` directory within the existing monorepo alongside `/frontend` and `/backend`.

**Structure:**
```
/frontend       (existing React web app)
/backend        (existing Express API)
/outlook-addin  (new Office Add-in)
  /src          (add-in sidebar UI code)
  /manifest     (Office Add-in manifest XML)
```

**Rationale:** Keeps all related code together, simplifies cross-cutting changes (e.g., contact matching logic updates affect both web app and add-in), enables code sharing via shared utilities, and maintains single deployment pipeline. The add-in will be a separate build target but lives in the same repository for easier maintenance.

## Service Architecture

**Office Add-in Task Pane Architecture** communicating with existing backend API:

- **Add-in Frontend:** Standalone HTML/CSS/JS bundle served from `/outlook-addin` build output, loaded within Outlook Web's iframe sandbox
- **Backend API:** Existing Express REST API extended with add-in-specific endpoints (`/api/contacts/match-email`, `/api/clients/match-domain`)
- **Authentication:** Shared session/token-based auth between web app and add-in (research required - may need CORS configuration or token-based approach if session cookies don't cross iframe boundary)
- **Manifest Hosting:** Manifest XML file hosted at public URL for Office Add-in registration

**Not using separate microservice** - add-in integrates with existing monolith. All ticket creation uses same backend logic as web app.

**Rationale:** Reusing existing infrastructure minimizes development time. The add-in is simply another client of the existing API, similar to how a mobile app would consume the same endpoints. No new business logic needed - only new matching endpoints for email/domain lookup.

## Testing Requirements

**Manual testing for MVP:**
- Manual QA of add-in installation/sideloading in Outlook Web
- Manual testing of email selection and auto-matching workflows
- Browser compatibility spot-checking (Chrome, Safari on macOS)
- Edge case testing: disambiguation, new contact creation, no match scenarios

**Unit tests for matching logic:**
- Email-to-contact lookup function
- Domain-to-client matching algorithm
- Disambiguation logic (contact exists at multiple clients)

**No E2E tests for MVP** - Office Add-in E2E testing requires complex Outlook automation, not justified for 3-4 week timeline.

**Rationale:** Testing strategy mirrors main ticketing system's pragmatic approach (unit tests for critical logic, manual testing for UI). Add-in is read-heavy (matching lookups) with single write operation (ticket creation via existing tested endpoint).

## Additional Technical Assumptions and Requests

**Add-in Frontend Framework:** **React** (matching existing frontend stack)
- Reuse React expertise and potentially share components with web app
- TypeScript for type safety (matching existing frontend)
- Vite for bundling (consistent with web app build tooling)
- **Lightweight bundle requirement:** Add-in must load quickly (<2 seconds per NFR1), requiring aggressive tree-shaking and code splitting

**Office.js Integration:**
- Office.js library loaded from Microsoft CDN (required for all Office Add-ins)
- Add-in uses Office.js Mail API to access email metadata (sender, display name, subject)
- Task pane context (persistent sidebar) vs. message compose context
- **Research spike required:** Validate Office.js provides access to sender email and display name; confirm task pane can stay open across email selections

**New Backend API Endpoints:**
- `GET /api/contacts/match-email?email={email}` - Returns contact(s) matching email address with associated client(s)
- `GET /api/clients/match-domain?domain={domain}` - Returns client(s) matching email domain
- `POST /api/contacts/create-from-email` - Creates new contact with email/name from add-in (may extend existing `/api/contacts` endpoint)

**Authentication Strategy (requires research):**
- **Option 1:** Session cookie sharing - if Office Add-in iframe can access same session cookies as web app (requires SameSite=None, Secure)
- **Option 2:** Token-based auth - web app issues JWT/token, add-in passes in Authorization header
- **Preferred approach:** Attempt session sharing first (simpler UX), fall back to token-based if iframe sandboxing prevents cookie access

**CORS Configuration:**
- Backend must allow CORS requests from add-in's hosted domain
- Add-in manifest specifies allowed domains for Office.js communication

**Add-in Manifest Requirements:**
- XML manifest file defining add-in metadata, permissions, task pane URL
- Hosted at publicly accessible HTTPS URL for sideloading
- Requests Mail.Read permission for accessing email content
- Specifies minimum Office.js API version required

**Deployment:**
- Add-in static files (HTML/JS/CSS) hosted on existing Railway deployment or separate static hosting (GitHub Pages, Netlify)
- Manifest XML file must be publicly accessible for installation
- Backend API already hosted on Railway, no changes to hosting infrastructure

**Domain-to-Client Matching Logic:**
- Leverage existing `client_domains` table from main ticketing system (Epic 2, Story 2.1 from main PRD)
- Matching extracts domain from email address (`user@example.com` → `example.com`) and queries `client_domains` table
- **Assumption:** Domain matching infrastructure already exists in database schema; if not, requires backend implementation before add-in development

**Contact Schema:**
- Assumes `contacts.email` is unique within a client, but same email can exist across multiple clients
- Disambiguation UI needed when email matches contacts at 2+ clients

**Development Workflow:**
- Local development: Add-in served via `npm run dev` (Vite dev server with HTTPS using self-signed cert - Office Add-ins require HTTPS)
- Manifest points to localhost during development for fast iteration
- Production: Manifest points to Railway-hosted add-in URL

**Browser Compatibility:**
- Target: Modern browsers supporting ES6+, Fetch API, async/await
- Office.js handles some polyfilling, but add-in should use modern JavaScript features
- No IE11 support required (matches main app's NFR6)

**Critical Technical Unknowns (require research spike):**
1. Can Office Add-in task pane share session cookies with main web app for seamless auth?
2. Does Office.js Mail API provide sufficient email metadata (sender, display name) in Outlook Web?
3. Can task pane persist across email selections, or does it reload/reset?
4. Are there Office.js API rate limits or quota restrictions for email access?

---
