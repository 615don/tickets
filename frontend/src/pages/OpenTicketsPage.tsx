/**
 * Open Tickets Page - Displays all currently open tickets
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpenTickets } from '@/hooks/useTickets';
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, ArrowUpDown, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Ticket as TicketType } from '@/types';
import { ApiError } from '@/lib/api-client';

const OpenTicketsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const { data: tickets = [], isLoading, error } = useOpenTickets();

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

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatUpdatedAt = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader title="Open Tickets" />
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
        title="Open Tickets"
        count={tickets.length}
        primaryAction={{
          label: 'Create Ticket',
          onClick: () => navigate('/tickets/create'),
        }}
      />

      <div className="mb-6">
        <SearchBar
          placeholder="Search by client, contact, or ticket ID..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
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
          message="No open tickets. All work is complete!"
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

export default OpenTicketsPage;
