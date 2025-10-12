# Next Steps

## UX Expert Prompt

Review the PRD's User Interface Design Goals section and create wireframes/mockups for the following Outlook Add-in sidebar states:

1. **Default State** - No email selected, prompting user to select an email
2. **Matched Contact/Client State** - Auto-populated form showing matched client and contact with visual indicators (✓ green badge)
3. **Domain Match / New Contact State** - Form showing matched client with editable new contact fields (⚠ yellow badge)
4. **Disambiguation State** - Radio buttons or dropdown for selecting client when contact exists at multiple clients
5. **No Match / Manual Mode** - Empty dropdowns for manual client/contact selection (? gray badge)
6. **Form Submission Success** - Confirmation message with ticket ID created
7. **Error State** - Authentication required or validation error messaging

**Focus areas:**
- Sidebar width constraint (300-400px) requiring vertical layout optimization
- Progressive disclosure pattern - simple cases show minimal UI, complexity revealed only when needed
- Visual feedback for matching status (color-coded badges)
- "Invisible speed" UX vision - ensure form feels instant and automatic

Provide interaction specifications for:
- Form auto-clear behavior on email selection change
- Loading states during matching API calls (<500ms target)
- Keyboard navigation and tab order for power users

## Architect Prompt

Based on this PRD, create a detailed technical architecture document for the Outlook Web Add-in including:

**1. Office Add-in Architecture**
- Manifest structure and configuration requirements
- Task pane lifecycle and persistence behavior
- Office.js API integration approach (Mail API for sender metadata)
- Bundle optimization strategy for <2 second load time (NFR1)

**2. Backend API Extensions**
- `GET /api/contacts/match-email?email={email}` - Endpoint specification with request/response schema
- `GET /api/clients/match-domain?domain={domain}` - Endpoint specification
- Email domain extraction and matching algorithm
- Contact disambiguation logic when email exists at multiple clients

**3. Authentication Strategy** (CRITICAL DECISION)
- Research findings: Can task pane share session cookies with web app?
- Option 1: Session cookie sharing (SameSite=None, Secure) + CORS configuration
- Option 2: Token-based auth (JWT, token storage/refresh in add-in)
- Recommendation with UX/implementation trade-offs

**4. Frontend Architecture**
- React component structure for sidebar UI
- State management approach (React Context, Zustand, or React Query for API caching)
- Office.js event handling for email selection changes
- Form validation and time entry parsing logic

**5. Deployment Architecture**
- Static file hosting strategy (Railway alongside backend, or separate CDN)
- Manifest hosting and sideloading process
- CORS configuration for add-in domain
- Development vs. production manifest configuration

**6. Testing Strategy**
- Unit tests: Matching logic, domain extraction, time parsing
- Manual testing: Office Add-in sideloading, email selection workflows
- Edge case scenarios: Disambiguation, new contact, no match, inactive client

**Begin with Epic 1 research spike:**
1. Validate Office.js Mail API provides `item.from.emailAddress` and `item.from.displayName` in Outlook Web task pane context
2. Confirm task pane persists across email selections (or document reload behavior)
3. Test authentication options - can task pane iframe access web app session cookies?
4. Document any Office.js API limitations or constraints discovered

Provide architecture decision records (ADRs) for key choices: authentication strategy, state management approach, deployment hosting.
