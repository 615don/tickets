# Epic 5: Views, Search & Historical Access

**Epic Goal:** Implement comprehensive navigation and discovery features including a unified dashboard displaying open and recently closed tickets, historical ticket search functionality, and complete navigation workflows. This epic enhances usability and provides easy access to all ticket data for billing disputes, reference, and workflow management.

## Story 5.1: Dashboard Layout & Navigation Structure

As a **user**,
I want **a central dashboard as my landing page after login**,
so that **I can quickly access all key areas of the application**.

### Acceptance Criteria

1. Dashboard page serves as default landing page after successful login
2. Primary navigation menu/header visible on all pages with links to: Dashboard, Create Ticket, Clients, Contacts, Invoices, Settings
3. Dashboard displays current month billable hours total prominently (real-time calculation)
4. Visual indicator shows if current month hours within expected range (85-100 hours)
5. Quick action buttons prominently placed: "Create Ticket", "Review Invoices"
6. Dashboard responsive on mobile viewports with collapsible navigation
7. Active nav item highlighted to show current location
8. Page loads in <2 seconds per NFR2
9. Clean, professional design per UI Design Goals (minimal aesthetic)

## Story 5.2: Recently Closed Tickets View

As a **user**,
I want **to see tickets I've closed in the last 7 days**,
so that **I can quickly re-open them if needed** (FR4, FR11).

### Acceptance Criteria

1. Dashboard includes "Recently Closed Tickets" section showing tickets closed within last 7 days
2. Section displays ticket ID, client name, description, closed date, total hours
3. Each ticket row shows "Re-open" button (Story 3.6 re-open logic)
4. Re-open button triggers re-open action with confirmation
5. Section shows empty state message if no recently closed tickets
6. Section limited to 10 most recent closed tickets with "View All" link if more exist
7. Clicking ticket row navigates to ticket detail page
8. Closed tickets older than 7 days do not show re-open button
9. Section updates in real-time when tickets closed or re-opened

## Story 5.3: Open Tickets Dashboard Integration

As a **user**,
I want **to see my open tickets on the dashboard**,
so that **I have visibility of current work** (FR10).

### Acceptance Criteria

1. Dashboard includes "Open Tickets" section showing all currently open tickets
2. Section displays ticket ID, client name, contact name, total hours, last updated date
3. Tickets sorted by most recently updated first
4. Each ticket row clickable to navigate to ticket detail
5. Section shows empty state message if no open tickets
6. Total count of open tickets displayed in section header
7. Section includes "View All" link to dedicated open tickets page if list is long (>20 items)
8. Pagination or "show more" functionality if open ticket count exceeds 20
9. Quick actions available: "Edit" icon/button for inline navigation to ticket detail

## Story 5.4: Historical Ticket Search API

As a **developer**,
I want **backend API endpoints for searching historical closed tickets**,
so that **users can find past tickets for reference** (FR12).

### Acceptance Criteria

1. `GET /api/tickets/search` endpoint accepts query parameters: `keyword`, `client_id`, `date_from`, `date_to`, `state`
2. Keyword search matches against ticket description, notes, and client/contact names (case-insensitive)
3. Client filter restricts results to specific client
4. Date range filter searches by ticket `created_at` or time entry `work_date` (configurable)
5. State filter allows searching open, closed, or all tickets
6. Results return ticket summary: ID, client, contact, description, state, created date, total hours
7. Results sorted by relevance (keyword match) or date (most recent first) depending on query type
8. Pagination support: `limit` and `offset` parameters for large result sets
9. Endpoint requires authentication
10. Empty search (no parameters) returns recent tickets (last 30 days, max 100 results)

## Story 5.5: Historical Ticket Search UI

As a **user**,
I want **to search for past tickets by keyword, client, or date range**,
so that **I can find historical work for billing disputes or reference** (FR12).

### Acceptance Criteria

1. Search page accessible from main navigation ("Search" or "History")
2. Search form includes fields: keyword (text input), client filter (dropdown), date range (from/to date pickers), state filter (open/closed/all)
3. Search executes on button click or form submission
4. Results displayed in table with columns: ticket ID, client, description, date, total hours, state
5. Each result row clickable to navigate to ticket detail
6. Empty state message shown when no results found
7. Loading indicator shown during search execution
8. Results paginated if more than 50 matches
9. "Clear Filters" button resets search form
10. Search preserves filters in URL query params for bookmarking/sharing
11. Advanced search option: billable/non-billable filter
12. Page loads and search executes in <1 second per NFR3

## Story 5.6: Dashboard Quick Stats Widget

As a **user**,
I want **to see at-a-glance statistics on my dashboard**,
so that **I can quickly understand my current workload and billing status**.

### Acceptance Criteria

1. Dashboard displays summary statistics widget with: current month billable hours, open ticket count, recently closed ticket count (last 7 days)
2. Current month hours display with visual indicator: green if within 85-100 hour range, yellow if below 85, red if above 100
3. Widget shows comparison to previous month: "92 hours (↑8 from last month)"
4. Widget displays last invoice generation date and month invoiced
5. Quick link to pre-invoice review from widget if current month not yet invoiced
6. Widget updates in real-time when tickets created/closed or time entries added
7. Widget collapsible/expandable on mobile viewports
8. All calculations perform efficiently (<500ms) per NFR1

## Story 5.7: Enhanced Navigation & Breadcrumbs

As a **user**,
I want **clear navigation context throughout the application**,
so that **I always know where I am and can easily navigate back**.

### Acceptance Criteria

1. Breadcrumb navigation displayed on all pages below header: "Dashboard > Clients > Edit Client"
2. Each breadcrumb segment clickable to navigate to parent pages
3. Current page title displayed prominently on every page
4. Back button behavior respects navigation history (browser back works correctly)
5. Mobile navigation uses hamburger menu pattern for space efficiency
6. Keyboard navigation support: Tab through nav items, Enter to activate
7. "Skip to main content" link for accessibility (hidden but keyboard accessible)
8. Logout link visible in header/nav menu on all pages

---
