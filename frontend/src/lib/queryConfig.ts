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
