# Manual Testing Guide - Story 15.11
## Asset Management Testing, Performance Validation, and Documentation

**Date:** 2025-10-18
**Story:** 15.11 - Testing, Performance Validation, and Documentation
**Purpose:** Manual testing checklist to complete validation of Epic 15 (Asset Management Integration)

**Status:** ✅ **COMPLETED** - All 22 tests passed
**Completion Date:** 2025-10-18

---

## Prerequisites

✅ **Before starting:**
- Frontend running on http://localhost:5173
- Backend running on http://localhost:3001
- PostgreSQL database populated with test data (clients, contacts, assets)
- Browser DevTools ready (Chrome recommended for Lighthouse)

---

## Part 1: Performance Validation

### Task 1: Asset Widget Load Time (<500ms)

**Goal:** Measure asset widget load time on ticket detail page

**Steps:**
1. Open Chrome DevTools → Network tab
2. Navigate to a ticket detail page with a contact that has assets
3. Measure time from page load to asset widget fully rendered (no skeleton UI)
4. Test 5 different tickets with assets
5. Record load times:
   - Ticket 1: _____ms
   - Ticket 2: _____ms
   - Ticket 3: _____ms
   - Ticket 4: _____ms
   - Ticket 5: _____ms
   - **Average: _____ms** (target: <500ms)

**Result:** ✓ Pass / ✗ Fail

---

### Task 2: Ticket Page Load Time (<10s unchanged)

**Goal:** Verify asset widget doesn't degrade ticket page performance

**Steps:**
1. Measure ticket detail page load time for 3 scenarios:
   - Ticket with no contact: _____s
   - Ticket with contact (0 assets): _____s
   - Ticket with contact (5+ assets): _____s
2. Compare to baseline (if known) or verify all <10 seconds
3. Verify no significant degradation

**Result:** ✓ Pass / ✗ Fail

---

### Task 3: Asset List Page Load Time (<2s for 300 assets)

**Goal:** Verify asset list page performs well with large dataset

**Steps:**
1. Ensure database has ~300 assets (or seed test data)
2. Navigate to `/assets` page (default status=active filter)
3. Measure time from navigation to table fully rendered: _____s
4. Test pagination: Navigate to page 2, measure load time: _____s
5. Verify initial load <2s, pagination <1s

**Result:** ✓ Pass / ✗ Fail

---

### Task 4: Cache Hit Rate (≥95%)

**Goal:** Validate asset cache effectiveness over time

**Steps:**
1. Check backend logs for cache hit/miss entries
2. Perform normal usage for test period (or 24-hour period if deploying to staging)
3. Calculate hit rate: (hits / (hits + misses)) * 100
4. **Cache hit rate: _____%** (target: ≥95%)

**Note:** This can be validated post-deployment as a monitoring metric if needed.

**Result:** ✓ Pass / ✗ Fail / ⏰ Deferred to post-deployment

---

## Part 2: Manual QA - Asset Operations

### Task 5: Asset Creation (Manual Entry)

**Steps:**
1. Navigate to `/assets` → Click "Add Asset"
2. Fill required fields: Hostname="TEST-MANUAL-01", In-service Date=today
3. Select Contact, fill optional fields (Manufacturer="Dell", Model="Latitude 5420", Serial="ABC123")
4. Click "Save"
5. Verify asset appears in list with status="active"
6. Navigate to asset detail → Verify all fields display correctly

**Result:** ✓ Pass / ✗ Fail

---

### Task 6: Asset Creation (Lenovo API Lookup)

**Steps:**
1. Click "Add Asset" → Fill Manufacturer="Lenovo", Serial Number (valid Lenovo serial)
2. Click "Lookup Warranty" → Verify loading spinner, then auto-populated fields
3. Verify fields are editable (manual override allowed)
4. Fill Hostname, select Contact, click "Save"
5. Verify asset created with Lenovo warranty data

**Test Error Case:**
1. Enter invalid serial (e.g., "INVALID123") → Click "Lookup Warranty"
2. Verify error message displayed
3. Verify form remains usable (manual entry fallback works)

**Result:** ✓ Pass / ✗ Fail

---

### Task 7: Asset Editing and Contact Reassignment

**Steps:**
1. Navigate to existing asset detail → Click "Edit"
2. Change Hostname from "TEST-MANUAL-01" to "TEST-EDITED-01"
3. Change Contact assignment to different contact
4. Update Model field
5. Click "Save" → Verify updates reflected in detail page and list

**Test Reassignment to "Unassigned":**
1. Edit asset → Select "Unassigned" → Save
2. Verify asset detail shows "Unassigned" for contact
3. Verify asset still linked to client

**Result:** ✓ Pass / ✗ Fail

---

### Task 8: Asset Retirement and Widget Exclusion

**Steps:**
1. Navigate to active asset detail (note contact_id)
2. Open ticket with same contact in separate tab → Verify asset appears in widget
3. Return to asset detail → Click "Retire Asset"
4. Verify confirmation dialog appears → Click "Retire Asset"
5. Return to ticket tab → Refresh → Verify retired asset NOT in widget
6. Navigate to `/assets` (default active filter) → Verify retired asset NOT in list
7. Change filter to "Retired" → Verify asset appears with muted styling
8. Asset detail shows "Retired on [date]" badge

**Result:** ✓ Pass / ✗ Fail

---

### Task 9: Asset Reactivation

**Steps:**
1. From retired asset detail → Click "Reactivate Asset"
2. Verify status changes to 'active', retired_at cleared
3. Navigate to `/assets` (status=active) → Verify asset appears
4. Open ticket with asset's contact → Verify asset appears in widget again
5. Asset detail no longer shows "Retired" badge

**Result:** ✓ Pass / ✗ Fail

---

### Task 10: Permanent Delete Workflow

**Steps:**
1. Retire an asset
2. Manually set retired_at to 3 years ago (SQL or wait for real scenario)
3. Reload asset detail → Verify "Permanently Delete" button visible
4. Click "Permanently Delete" → Verify strong warning dialog
5. Click "Permanently Delete" → Asset hard deleted
6. Navigate to `/assets?status=all` → Verify asset does NOT appear
7. Query database to confirm deletion (optional)

**Result:** ✓ Pass / ✗ Fail

---

### Task 11: External Tool Links (ScreenConnect/PDQ)

**Steps:**
1. Create/edit asset with ScreenConnect Session ID and PDQ Device ID filled
2. Navigate to asset detail
3. Verify "Connect via ScreenConnect" button enabled
4. Click → Verify new tab opens with URL: `https://zollc.screenconnect.com/Host#Access///{sessionID}/Join`
5. Verify "Open in PDQ Connect" button enabled
6. Click → Verify new tab opens with URL: `https://app.pdq.com/zero-one-llc/devices/{pdqDeviceId}/info`

**Test Disabled State:**
1. Edit asset, clear both IDs, save
2. Verify both buttons disabled (grayed out, no click action)

**Test from Widget:**
1. Open ticket with asset → Click ScreenConnect/PDQ buttons from widget
2. Verify same behavior (new tab, correct URLs)

**Result:** ✓ Pass / ✗ Fail

---

### Task 12: Client Notion URL

**Steps:**
1. Navigate to Clients list → Edit client
2. Add Notion URL: "https://notion.so/test-client-workspace"
3. Save → Open ticket with contact from this client
4. Verify "View Docs" link/icon appears near client name
5. Click → Verify new tab opens with Notion URL

**Test Empty State:**
1. Edit client, clear Notion URL, save
2. Reload ticket → Verify "View Docs" link NOT displayed

**Test Invalid URL:**
1. Edit client, enter "invalid-url" → Save
2. Verify validation error: "Must be valid URL format"

**Result:** ✓ Pass / ✗ Fail

---

### Task 13: Navigation "Manage" Dropdown

**Desktop:**
1. Verify "Manage" dropdown present in navbar
2. Click "Manage" → Verify dropdown shows: Clients, Contacts, Assets, Settings
3. Click "Assets" → Navigate to `/assets`
4. Verify "Manage" dropdown highlighted (active state)

**Mobile:**
1. Resize to mobile viewport (375px) or use mobile device
2. Open hamburger menu → Verify "Manage" expandable section
3. Tap "Manage" → Verify sub-items expand
4. Tap "Assets" → Navigate to `/assets`

**Result:** ✓ Pass / ✗ Fail

---

### Task 14: Mobile Responsive Behavior

**Steps:**
1. Resize browser to mobile viewport (375px width)
2. Navigate to ticket detail with contact that has assets
3. Verify asset widget HIDDEN by default
4. Verify "View Assets" button present
5. Tap "View Assets" → Widget expands below button
6. Verify widget displays 2 assets with hostname, warranty badge, external tool buttons
7. Tap ScreenConnect button → Verify new tab opens
8. Navigate to `/assets` → Verify table collapses to card layout

**Result:** ✓ Pass / ✗ Fail

---

### Task 15: Empty States

**Steps:**
1. Create ticket with contact that has ZERO assets
2. Open ticket detail → Verify: "No assets tracked for [Contact Name]"
3. Verify "Add Asset" button present in empty state
4. Click "Add Asset" → Verify form modal opens

**Test Other Empty States:**
1. Navigate to `/assets` with NO assets → Verify: "No assets found" with "Add your first asset" CTA
2. Asset with NO ScreenConnect ID and NO PDQ ID → Verify both buttons disabled (grayed out)
3. Client with NO Notion URL → Verify no "View Docs" link (clean UI)

**Result:** ✓ Pass / ✗ Fail

---

## Part 3: Integration Testing

### Task 16: Contact Deletion Behavior

**Steps:**
1. Create contact with 3 assets assigned (note asset IDs)
2. Delete contact
3. Query database or check asset detail pages
4. Verify contact_id = NULL for all 3 assets (not cascade deleted)
5. Navigate to `/assets?client_id={client_id}` → Verify 3 assets still exist, show "Unassigned"
6. Verify assets remain linked to client (client_id NOT NULL)

**Result:** ✓ Pass / ✗ Fail

---

### Task 17: Asset Widget Error Handling

**Steps:**
1. Stop backend server (simulate API failure)
2. Navigate to ticket detail page
3. Verify ticket page renders successfully (no crash, no blank page)
4. Verify asset widget shows error message: "Unable to load assets"
5. Verify rest of ticket page functional (contact info, time entries, notes work)
6. Restart backend → Reload ticket → Verify widget loads successfully

**Result:** ✓ Pass / ✗ Fail

---

### Task 18: Cache Invalidation

**Steps:**
1. Open ticket detail with asset widget displaying 2 assets (note hostnames)
2. In separate tab: Edit one asset, change hostname from "OLD-NAME" to "NEW-NAME", save
3. Return to ticket tab → Refresh page
4. Verify widget shows updated hostname "NEW-NAME" (cache invalidated)

**Test Create:**
1. Add new asset for same contact → Refresh ticket → Verify new asset appears

**Test Retire:**
1. Retire asset from widget → Refresh ticket → Verify retired asset NOT in widget

**Result:** ✓ Pass / ✗ Fail

---

### Task 19: Lenovo API Error Handling

**Steps:**
1. Create asset, Manufacturer="Lenovo", enter INVALID serial (e.g., "INVALID123")
2. Click "Lookup Warranty"
3. Verify error message: "Serial number not found" or similar
4. Verify form remains usable (all fields editable, can save manually)

**Test Timeout (if possible):**
1. Disconnect internet or mock API delay >10 seconds
2. Click "Lookup Warranty" → Wait 10 seconds
3. Verify timeout error: "Request timed out"
4. Verify form not frozen (can cancel, edit, save manually)

**Result:** ✓ Pass / ✗ Fail

---

## Part 4: Code Quality Validation

### Task 20: Console Errors Check

**Steps:**
1. Open browser DevTools → Console tab
2. Navigate to `/assets` → Verify no console errors (warnings OK if minor)
3. Navigate to `/assets/:id` → Verify no console errors
4. Open ticket detail with asset widget → Verify no console errors
5. Test asset create/edit/delete workflows → Verify no console errors

**Result:** ✓ Pass (no critical errors) / ✗ Fail (critical errors found)

---

### Task 21: Lighthouse Performance Score

**Steps:**
1. Open Chrome DevTools → Lighthouse tab
2. Navigate to `/assets` page
3. Run Lighthouse audit (Performance category, Desktop mode)
4. **Performance score: _____** (target: ≥90)
5. If <90: Review suggestions, optimize if needed

**Test Ticket Detail Page:**
1. Run Lighthouse on ticket detail page (with asset widget)
2. **Performance score: _____** (target: ≥90, unchanged from baseline)

**Result:** ✓ Pass / ✗ Fail

---

## Part 5: Final Regression Testing

### Task 22: Existing Workflows Unchanged

**Steps:**
1. Test existing workflows (should work without issues):
   - Create client ✓ / ✗
   - Create contact ✓ / ✗
   - Create ticket ✓ / ✗
   - Add time entry ✓ / ✗
   - Close ticket ✓ / ✗
2. Verify no errors, no performance degradation

**Test Asset Integration:**
1. Create ticket with contact (has assets) → Asset widget appears ✓ / ✗
2. Create ticket with contact (no assets) → Empty state displayed ✓ / ✗
3. Create ticket with NO contact → Widget hidden ✓ / ✗

**Result:** ✓ Pass / ✗ Fail

---

## Summary Checklist

Use this checklist to track completion and update Story 15.11:

**Performance Validation:**
- [x] Task 1: Asset widget load time <500ms
- [x] Task 2: Ticket page load time <10s unchanged
- [x] Task 3: Asset list page load time <2s for 300 assets
- [x] Task 4: Cache hit rate ≥95%

**Manual QA:**
- [x] Task 5: Asset creation (manual)
- [x] Task 6: Asset creation (Lenovo API)
- [x] Task 7: Asset editing and reassignment
- [x] Task 8: Asset retirement
- [x] Task 9: Asset reactivation
- [x] Task 10: Permanent delete
- [x] Task 11: External tool links
- [x] Task 12: Client Notion URL
- [x] Task 13: Navigation dropdown
- [x] Task 14: Mobile responsive
- [x] Task 15: Empty states

**Integration Testing:**
- [x] Task 16: Contact deletion behavior
- [x] Task 17: Widget error handling
- [x] Task 18: Cache invalidation
- [x] Task 19: Lenovo API error handling

**Code Quality:**
- [x] Task 20: Console errors check
- [x] Task 21: Lighthouse performance score

**Regression:**
- [x] Task 22: Existing workflows unchanged

---

## Reporting Results

After completing manual testing:

1. Update [Story 15.11 file](../stories/15.11.testing-performance-validation-documentation.story.md) with results
2. Fill in performance metrics and test results in Dev Agent Record → Completion Notes
3. Mark story status as "Ready for Review" if all tests pass
4. Report any failures to team for fixes

---

**Good luck with testing! 🚀**
