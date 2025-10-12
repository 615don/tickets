# Epic 3: Add-in Sidebar UI & Email Context Detection

**Epic Goal:** Build the React-based sidebar user interface that initializes when Outlook loads, detects when the user selects an email, extracts sender metadata using Office.js Mail API, and displays the email context to provide visual feedback that matching is occurring.

## Story 3.1: Sidebar Layout & Basic UI Structure

As a **developer**,
I want **a responsive sidebar layout component**,
so that **the add-in has a clean UI foundation matching the design goals**.

### Acceptance Criteria

1. React component `Sidebar.tsx` created as main layout wrapper
2. Layout optimized for narrow width (300-400px typical task pane size)
3. Header section displays add-in branding/title
4. Main content area for dynamic content (email context, forms)
5. Footer section for status messages or help links (optional)
6. Styling uses Tailwind CSS (consistent with main app)
7. Responsive to task pane height changes (scrollable content)
8. Component renders without errors in Outlook Web task pane
9. Basic loading state UI created for asynchronous operations

## Story 3.2: Office.js Email Selection Event Listener

As a **developer**,
I want **to detect when the user selects a different email in Outlook**,
so that **the add-in can respond to email changes**.

### Acceptance Criteria

1. Office.js `Office.context.mailbox.addHandlerAsync` implemented for item selection event
2. Event listener registered on add-in initialization (in `Office.onReady()`)
3. Event handler function extracts current email item: `Office.context.mailbox.item`
4. React state updated when new email selected (triggers re-render)
5. Event listener handles edge case: no email selected (initial load state)
6. Event listener handles rapid email switching (debouncing if needed)
7. Console logging confirms event fires when emails selected during testing
8. Verified task pane updates when switching between received emails

## Story 3.3: Email Metadata Extraction

As a **developer**,
I want **to extract sender email and display name from selected email**,
so that **the add-in has data for contact/client matching**.

### Acceptance Criteria

1. Office.js API calls extract sender data: `item.from.emailAddress`, `item.from.displayName`
2. Email metadata stored in React state: `{ senderEmail: string, senderName: string }`
3. Handles asynchronous Office.js API calls (callbacks or Promises)
4. Handles edge cases: sender data missing/null, email without sender
5. Extracts email subject for future use (optional display): `item.subject`
6. TypeScript types defined for email metadata structure
7. Extraction logic abstracted into custom React hook: `useEmailContext()`
8. Unit tests (if possible) or manual testing confirms correct data extraction

## Story 3.4: Email Context Display Component

As a **user**,
I want **to see the sender's name and email displayed in the sidebar**,
so that **I know the add-in detected the email I'm viewing**.

### Acceptance Criteria

1. React component `EmailContext.tsx` displays sender information
2. Shows sender display name prominently
3. Shows sender email address (smaller text, secondary styling)
4. Shows email subject (optional, truncated if long)
5. Component updates automatically when different email selected
6. Loading state displayed while extracting metadata (spinner or skeleton)
7. Empty state displayed when no email selected: "Select an email to create a ticket"
8. Visual design aligns with UI Design Goals (clean, minimal, generous whitespace)
9. Component tested in Outlook Web with various email types

## Story 3.5: Sidebar State Management

As a **developer**,
I want **centralized state management for sidebar data**,
so that **components can share email context and matching results**.

### Acceptance Criteria

1. React Context or state management solution implemented (React Context, Zustand, or React Query)
2. Global state includes: email context (sender, subject), matching results, loading states
3. State accessible via hooks in any component
4. State updates trigger appropriate component re-renders
5. State persists during sidebar lifecycle (until email selection changes)
6. Clear state separation: email context vs. matching results vs. form data
7. TypeScript types for all state shapes
8. State management pattern documented for future development

---
