# Story: React Query Caching Optimization

**Epic:** Performance Optimization Phase 1
**Story ID:** PERF-2
**Estimated Effort:** 2 hours
**Priority:** P0 (High Impact, Low Effort)

---

## User Story

As a **user**,
I want **instant navigation between pages with no loading spinners**,
So that **the application feels fast and responsive during my workflow**.

---

## Story Context

### Existing System Integration

- **Integrates with:** React Query setup in `frontend/src/App.tsx`
- **Technology:** @tanstack/react-query ^5.83.0, React 18.3.1
- **Follows pattern:** Current QueryClient configuration uses default cache settings
- **Touch points:**
  - All API hooks: `useAuth`, `useClients`, `useContacts`, `useTickets`
  - QueryClient in `frontend/src/App.tsx` line 20

### Performance Problem

**Current Behavior:**
- Default React Query settings treat all data equally (5-minute default staleTime)
- Client/contact data rarely changes but is refetched frequently
- Navigation shows loading spinners unnecessarily when cached data is still fresh
- Every page mount triggers refetch even if data was just loaded

**User Experience Impact:**
- Navigating from Dashboard → Clients → Dashboard shows loading spinner twice
- Clicking into ticket detail and back to list refetches the entire list
- Creates perception of slow application despite fast API responses

---

## Acceptance Criteria

### Functional Requirements

1. ✅ Configure differentiated `staleTime` per query type: Clients (15 min), Contacts (10 min), Tickets (2 min)
2. ✅ Implement prefetch on hover for ticket rows (instant perceived navigation)
3. ✅ Disable `refetchOnMount` globally to prevent unnecessary refetches
4. ✅ Keep `refetchOnWindowFocus` enabled only for dynamic data (tickets, dashboard stats)

### Integration Requirements

5. ✅ Existing API hooks continue to work unchanged (configuration is backward compatible)
6. ✅ New configuration follows React Query best practices
7. ✅ Cache invalidation on mutations remains functional (optimistic updates preserved)

### Quality Requirements

8. ✅ Navigation to frequently-visited pages (Clients, Tickets) shows <100ms perceived load time
9. ✅ No stale data bugs introduced (mutations still invalidate correctly)
10. ✅ Bundle size unchanged (configuration only, no new dependencies)

---

## Technical Implementation

### 1. Create Query Configuration File

Create new file `frontend/src/lib/queryConfig.ts`:

```typescript
/**
 * Centralized React Query configuration
 * Defines caching strategies per entity type
 */

export const queryConfig = {
  // Client data changes rarely (only when user explicitly edits)
  clients: {
    all: ['clients'] as const,
    detail: (id: number) => ['clients', id] as const,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  },

  // Contact data changes rarely
  contacts: {
    all: ['contacts'] as const,
    byClient: (clientId: number) => ['contacts', 'client', clientId] as const,
    detail: (id: number) => ['contacts', id] as const,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  },

  // Ticket data is more dynamic (user actively working with tickets)
  tickets: {
    all: ['tickets'] as const,
    detail: (id: number) => ['tickets', id] as const,
    byState: (state: 'open' | 'closed') => ['tickets', 'state', state] as const,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refresh stale data on tab focus
  },

  // Dashboard stats should refresh when user returns
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  },

  // Invoice data is relatively static (only changes during generation)
  invoices: {
    preview: (month: string) => ['invoices', 'preview', month] as const,
    history: ['invoices', 'history'] as const,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  },
};

// Type helpers for type-safe query keys
export type QueryKey = typeof queryConfig[keyof typeof queryConfig];
```

### 2. Update QueryClient Configuration

Update `frontend/src/App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Default 5 min for backward compatibility
      refetchOnMount: false,    // Don't refetch if data is fresh
      refetchOnWindowFocus: false, // Override per-query where needed
      refetchOnReconnect: true, // Refresh after network reconnection
      retry: 1,                 // Reduce retry attempts for faster failures
    },
    mutations: {
      // Mutations should still invalidate queries immediately
      retry: 1,
    },
  },
});
```

### 3. Update Existing Hooks to Use New Config

Example update for `frontend/src/hooks/useClients.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from '@/lib/queryConfig';
import { fetchClients, createClient, updateClient, deleteClient } from '@/lib/api/clients';

export function useClients() {
  return useQuery({
    queryKey: queryConfig.clients.all,
    queryFn: fetchClients,
    staleTime: queryConfig.clients.staleTime,
    refetchOnWindowFocus: queryConfig.clients.refetchOnWindowFocus,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      // Invalidate clients cache immediately after mutation
      queryClient.invalidateQueries({ queryKey: queryConfig.clients.all });
    },
  });
}

// Similar updates for useContacts, useTickets, etc.
```

### 4. Implement Prefetch on Hover

Add prefetch to `frontend/src/components/OpenTicketsList.tsx`:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryConfig } from '@/lib/queryConfig';
import { fetchTicket } from '@/lib/api/tickets';

function TicketRow({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Prefetch ticket details on hover for instant navigation
  const prefetchTicket = () => {
    queryClient.prefetchQuery({
      queryKey: queryConfig.tickets.detail(ticket.id),
      queryFn: () => fetchTicket(ticket.id),
      staleTime: queryConfig.tickets.staleTime,
    });
  };

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50"
      onMouseEnter={prefetchTicket}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <td>{ticket.id}</td>
      <td>{ticket.clientName}</td>
      <td>{ticket.description}</td>
      <td>{ticket.totalHours}h</td>
    </tr>
  );
}
```

### Existing Pattern Reference

- **Current QueryClient:** [frontend/src/App.tsx:20](../../../frontend/src/App.tsx#L20)
- **Existing hooks:** `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useContacts.ts`
- **API client pattern:** `frontend/src/lib/api/contacts.ts`

### Key Constraints

- Must not break existing optimistic updates in mutation hooks
- Cache invalidation must still work (`queryClient.invalidateQueries`)
- Prefetching should be non-blocking (fire-and-forget)
- Type safety maintained with TypeScript

---

## Definition of Done

- [x] `frontend/src/lib/queryConfig.ts` created with entity-specific cache config
- [x] `frontend/src/App.tsx` QueryClient updated with optimized default options
- [x] All existing hooks updated to use `queryConfig` for query keys and staleTime
- [x] Prefetch on hover implemented in `OpenTicketsList` component
- [x] Prefetch on hover implemented in `RecentlyClosedTicketsList` component (via TicketRow)
- [ ] Navigation to Clients page shows instant render (no spinner) on second visit
- [ ] Navigation to Ticket detail after hover shows <100ms load time
- [ ] All existing functionality verified:
  - [ ] Create ticket (mutation invalidates cache)
  - [ ] Update client (mutation invalidates cache)
  - [ ] Add time entry (ticket detail refreshes)
- [ ] No stale data bugs (mutations still invalidate cache correctly)
- [ ] DevTools React Query extension shows correct staleTime per query type

---

## Risk Assessment

### Primary Risk
Longer staleTime may show stale data if external changes occur (e.g., another user modifies data).

### Mitigation
- **Single-user system:** No concurrent modification risk
- **User-initiated mutations still invalidate cache immediately:** Changes the user makes are reflected instantly
- **refetchOnWindowFocus enabled for dynamic data:** Tickets and dashboard refresh when user returns to tab
- **Worst case:** User sees data that's 2-15 minutes old (depending on entity type), which is acceptable for single-user billing workflow

### Rollback
Revert `App.tsx` changes, remove `queryConfig.ts`, and restart frontend. No data loss risk.

---

## Compatibility Verification

- ✅ **No breaking changes** to existing APIs
- ✅ **Database changes:** None
- ✅ **UI changes:** No visual changes, only performance improvements (loading spinners appear less frequently)
- ✅ **Performance impact:** Positive (eliminates loading spinners, instant navigation)

---

## Expected Performance Improvements

| Navigation Path | Before | After | Improvement |
|----------------|--------|-------|-------------|
| Dashboard → Clients → Dashboard | 2 loading spinners | 0 loading spinners | Instant |
| Ticket List → Detail → List | 2 loading spinners | 0 loading spinners (with prefetch) | <100ms perceived |
| Clients page (second visit) | 300ms with spinner | Instant render | 300ms saved |
| Hover ticket → Click detail | 400ms load | <100ms perceived | 75% faster |

**Overall Impact:**
- **Perceived performance:** 2-5x faster due to eliminated loading states
- **Actual API calls reduced:** 50-70% fewer redundant fetches
- **User experience:** Application feels instant and responsive

---

## Testing Checklist

### Manual Testing

- [ ] **Clients Page:**
  - [ ] First visit: Loads normally with spinner
  - [ ] Navigate away and back within 15 min: Instant render, no spinner
  - [ ] Create new client: List updates immediately (cache invalidated)

- [ ] **Contacts Page:**
  - [ ] First visit: Loads normally
  - [ ] Revisit within 10 min: Instant render
  - [ ] Update contact: Changes appear immediately

- [ ] **Tickets Page:**
  - [ ] Hover over ticket row: Check Network tab for prefetch request
  - [ ] Click hovered ticket: Detail page renders instantly (<100ms)
  - [ ] Create new ticket: List updates immediately

- [ ] **Dashboard:**
  - [ ] Open dashboard, switch tabs, return: Stats refresh (refetchOnWindowFocus)
  - [ ] Leave dashboard idle for 2 min, return: Open tickets refresh

### DevTools Verification

- [ ] Open React Query DevTools (should appear in bottom-right corner)
- [ ] Verify query staleTime per entity type:
  - Clients: 900000ms (15 min)
  - Contacts: 600000ms (10 min)
  - Tickets: 120000ms (2 min)
- [ ] Check "Queries" tab shows cached data with correct staleness indicators
- [ ] Verify mutations trigger invalidation (watch cache update in DevTools)

### Regression Testing

- [ ] All CRUD operations work:
  - [ ] Create client/contact/ticket
  - [ ] Update client/contact/ticket
  - [ ] Delete client/contact (with confirmation)
- [ ] Invoice generation flow:
  - [ ] Preview invoice (should cache for 5 min)
  - [ ] Generate invoices (should invalidate preview cache)
- [ ] Authentication:
  - [ ] Login/logout still works
  - [ ] Session expiry redirects to login

---

## Performance Measurement

### Before Implementation

Measure baseline performance:

```bash
# Open browser DevTools → Network tab
# Clear cache (Cmd+Shift+R)
# Navigate: Dashboard → Clients → Dashboard
# Record:
# - Number of API requests
# - Total time with loading spinner visible
# - Network transfer size
```

Expected baseline:
- API requests: 6 (3 per dashboard visit)
- Spinner time: ~600ms total
- Transfer size: ~150KB

### After Implementation

Measure optimized performance:

```bash
# Same navigation path: Dashboard → Clients → Dashboard
# Record same metrics
```

Expected results:
- API requests: 3 (first visit only)
- Spinner time: ~300ms (first visit only)
- Transfer size: ~75KB (50% reduction)

---

## Future Enhancements (Post-Story)

Consider these improvements in future stories:

1. **Persistent Cache:** Use `@tanstack/react-query-persist-client` to cache data in localStorage (survive page refreshes)
2. **Background Refetch:** Implement `refetchInterval` for dashboard stats (auto-refresh every 5 minutes)
3. **Optimistic Updates:** Add optimistic updates to mutations for instant UI feedback
4. **Cache Warm-up:** Prefetch frequently-used data on login (clients, contacts)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### File List
- `frontend/src/lib/queryConfig.ts` (created)
- `frontend/src/App.tsx` (modified)
- `frontend/src/hooks/useClients.ts` (modified)
- `frontend/src/hooks/useContacts.ts` (modified)
- `frontend/src/hooks/useTickets.ts` (modified)
- `frontend/src/components/OpenTicketsList.tsx` (modified)
- `frontend/src/components/TicketRow.tsx` (modified)

### Implementation Notes
- Created centralized queryConfig with entity-specific stale times (clients: 15min, contacts: 10min, tickets: 2min, dashboard: 1min, invoices: 5min)
- Updated QueryClient with optimized defaults: `refetchOnMount: false`, `retry: 1`
- All hooks now use queryConfig for consistent cache behavior
- Prefetch on hover implemented in both OpenTicketsList and TicketRow components (covers all ticket displays including recently closed)
- Maintained backward compatibility with existing query keys structure
- Build successful with no type errors

### Completion Notes
- ✅ Core implementation complete
- ⚠️ Manual testing required: Navigation UX, cache invalidation behavior, DevTools verification
- ⚠️ Backend not running during testing, manual verification needed with full system

### Change Log
- 2025-10-14: Initial implementation of React Query caching optimization

### Status
Ready for QA Testing

---

## References

- **React Query Docs:** https://tanstack.com/query/latest/docs/react/guides/caching
- **Stale Time vs Cache Time:** https://tanstack.com/query/latest/docs/react/guides/important-defaults
- **Prefetching Guide:** https://tanstack.com/query/latest/docs/react/guides/prefetching
- **Architecture Doc:** [Performance Optimization](../architecture/security-and-performance.md#frontend-performance)
