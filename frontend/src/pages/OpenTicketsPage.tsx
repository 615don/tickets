/**
 * Open Tickets Page - Displays all currently open tickets
 */

import { useOpenTickets } from '@/hooks/useTickets';
import { OpenTicketsList } from '@/components/OpenTicketsList';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const OpenTicketsPage = () => {
  const navigate = useNavigate();
  const { data: tickets, isLoading, error } = useOpenTickets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-red-600">
          Error loading tickets. Please try again later.
        </div>
      </div>
    );
  }

  const openTicketCount = tickets?.length || 0;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Open Tickets</h1>
          <p className="text-muted-foreground mt-1">
            {openTicketCount} open {openTicketCount === 1 ? 'ticket' : 'tickets'}
          </p>
        </div>
        <Button onClick={() => navigate('/tickets/create')}>
          Create Ticket
        </Button>
      </div>

      {tickets && tickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No open tickets</p>
          <p className="mt-2">All work is complete! Create a new ticket to get started.</p>
        </div>
      ) : (
        <OpenTicketsList tickets={tickets || []} />
      )}
    </div>
  );
};

export default OpenTicketsPage;
