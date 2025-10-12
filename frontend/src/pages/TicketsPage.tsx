/**
 * Tickets Page - Displays tickets with filtering by state
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/tickets';
import { ticketKeys, useDeleteTicket } from '@/hooks/useTickets';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
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
import { Ticket, ArrowUpDown, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Ticket as TicketType } from '@/types';
import { ApiError } from '@/lib/api-client';

type FilterState = 'open' | 'recently-closed' | 'closed';

const TicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteDialogTicket, setDeleteDialogTicket] = useState<TicketType | null>(null);
  const { toast } = useToast();
  const deleteTicket = useDeleteTicket();

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

  const handleDeleteTicket = () => {
    if (!deleteDialogTicket) return;

    deleteTicket.mutate(deleteDialogTicket.id, {
      onSuccess: () => {
        toast({ title: 'Ticket deleted' });
        setDeleteDialogTicket(null);
      },
      onError: (error) => {
        toast({
          title: 'Error deleting ticket',
          description: error.message,
          variant: 'destructive'
        });
        setDeleteDialogTicket(null);
      },
    });
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
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium cursor-pointer" onClick={() => handleTicketClick(ticket.id)}>#{ticket.id}</TableCell>
                    <TableCell className="cursor-pointer" onClick={() => handleTicketClick(ticket.id)}>{ticket.clientName}</TableCell>
                    <TableCell className="cursor-pointer" onClick={() => handleTicketClick(ticket.id)}>{ticket.contactName}</TableCell>
                    <TableCell className="cursor-pointer" onClick={() => handleTicketClick(ticket.id)}>{formatHours(ticket.totalHours)}</TableCell>
                    <TableCell className="text-muted-foreground cursor-pointer" onClick={() => handleTicketClick(ticket.id)}>
                      {formatUpdatedAt(ticket.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialogTicket(ticket);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3" onClick={() => handleTicketClick(ticket.id)}>
                  <div className="cursor-pointer flex-1">
                    <h3 className="font-semibold text-foreground">#{ticket.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatHours(ticket.totalHours)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogTicket(ticket);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm cursor-pointer" onClick={() => handleTicketClick(ticket.id)}>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogTicket !== null}
        title="Delete this ticket?"
        message={
          deleteDialogTicket
            ? `This will permanently delete ticket #${deleteDialogTicket.id}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Ticket"
        confirmStyle="danger"
        onConfirm={handleDeleteTicket}
        onCancel={() => setDeleteDialogTicket(null)}
      />
    </div>
  );
};

export default TicketsPage;
