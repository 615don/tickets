/**
 * Tickets Page - Displays tickets with filtering by state
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/tickets';
import { ticketKeys } from '@/hooks/useTickets';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, ArrowUpDown, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Ticket as TicketType } from '@/types';
import { ApiError } from '@/lib/api-client';

type FilterState = 'open' | 'recently-closed' | 'closed';

const TicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  // Get filter from URL query param, default to 'open'
  const urlFilter = searchParams.get('state') as FilterState | null;
  const [filterState, setFilterState] = useState<FilterState>(urlFilter || 'open');

  // Update filter when URL changes
  useEffect(() => {
    const urlState = searchParams.get('state') as FilterState | null;
    if (urlState && ['open', 'recently-closed', 'closed'].includes(urlState)) {
      setFilterState(urlState);
    }
  }, [searchParams]);

  // Fetch tickets based on filter
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: filterState === 'recently-closed'
      ? ticketKeys.recentlyClosed()
      : ticketKeys.list(`state=${filterState === 'open' ? 'open' : 'closed'}`),
    queryFn: () => {
      if (filterState === 'recently-closed') {
        return ticketsApi.getRecentlyClosed();
      }
      return ticketsApi.getAll({ state: filterState === 'open' ? 'open' : 'closed' });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((ticket) =>
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toString().includes(searchQuery)
    );

    filtered.sort((a, b) => {
      const comparison = a.id - b.id;
      return sortAsc ? comparison : -comparison;
    });

    return filtered;
  }, [tickets, searchQuery, sortAsc]);

  const handleTicketClick = (id: number) => {
    navigate(`/tickets/${id}`);
  };

  const handleFilterChange = (value: FilterState) => {
    setFilterState(value);
    // Update URL to reflect filter state
    if (value === 'open') {
      setSearchParams({}); // Remove query param for default state
    } else {
      setSearchParams({ state: value });
    }
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatUpdatedAt = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getEmptyMessage = () => {
    switch (filterState) {
      case 'open':
        return 'No open tickets. All work is complete!';
      case 'recently-closed':
        return 'No tickets closed in the last 7 days.';
      case 'closed':
        return 'No closed tickets found.';
      default:
        return 'No tickets found.';
    }
  };

  const getPageTitle = () => {
    switch (filterState) {
      case 'recently-closed':
        return 'Recently Closed Tickets';
      case 'closed':
        return 'Closed Tickets';
      default:
        return 'Tickets';
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader title="Tickets" />
        <EmptyState
          icon={Ticket}
          message={`Failed to load tickets: ${(error as ApiError).message}`}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title={getPageTitle()}
        count={tickets.length}
        primaryAction={{
          label: 'Create Ticket',
          onClick: () => navigate('/tickets/create'),
        }}
      />

      <div className="mb-6 space-y-4">
        {/* Filter dropdown */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={filterState} onValueChange={handleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open Tickets</SelectItem>
                <SelectItem value="recently-closed">Recently Closed (7 days)</SelectItem>
                <SelectItem value="closed">All Closed Tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <SearchBar
              placeholder="Search by client, contact, or ticket ID..."
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTickets.length === 0 && !searchQuery ? (
        <EmptyState
          icon={Ticket}
          message={getEmptyMessage()}
          actionLabel="Create Ticket"
          onAction={() => navigate('/tickets/create')}
        />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          message="No tickets match your search."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => setSortAsc(!sortAsc)}
                      className="flex items-center gap-1"
                    >
                      ID
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTicketClick(ticket.id)}
                  >
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell>{ticket.clientName}</TableCell>
                    <TableCell>{ticket.contactName}</TableCell>
                    <TableCell>{formatHours(ticket.totalHours)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatUpdatedAt(ticket.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTicketClick(ticket.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">#{ticket.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatHours(ticket.totalHours)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{ticket.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">{ticket.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="text-muted-foreground">{formatUpdatedAt(ticket.updatedAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TicketsPage;
