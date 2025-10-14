/**
 * Open Tickets List - Responsive table/card list of tickets
 * Desktop: Table view
 * Mobile: Card view
 */

import { Ticket } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ticketKeys } from '@/hooks/useTickets';
import { ticketsApi } from '@/lib/api/tickets';
import { queryConfig } from '@/lib/queryConfig';

interface OpenTicketsListProps {
  tickets: Ticket[];
}

export const OpenTicketsList = ({ tickets }: OpenTicketsListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleTicketClick = (id: number) => {
    navigate(`/tickets/${id}`);
  };

  // Prefetch ticket details on hover for instant navigation
  const prefetchTicket = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ticketKeys.detail(id),
      queryFn: () => ticketsApi.getById(id),
      staleTime: queryConfig.tickets.staleTime,
    });
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatUpdatedAt = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <>
      {/* Desktop/Tablet: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleTicketClick(ticket.id)}
                onMouseEnter={() => prefetchTicket(ticket.id)}
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

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-4">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTicketClick(ticket.id)}
            onMouseEnter={() => prefetchTicket(ticket.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">#{ticket.id}</span>
                <span className="text-sm text-muted-foreground">
                  {formatHours(ticket.totalHours)}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-medium">{ticket.clientName}</p>
                <p className="text-muted-foreground">{ticket.contactName}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatUpdatedAt(ticket.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};
