import { useParams, useNavigate } from 'react-router-dom';
import { TicketDetail } from '@/components/TicketDetail';
import { useTicket } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = id ? parseInt(id, 10) : undefined;
  const { data: ticket, isLoading, error } = useTicket(ticketId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-8 text-muted-foreground">Loading ticket...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Error loading ticket</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message || 'Ticket not found. It may have been deleted.'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Ticket not found</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <TicketDetail ticket={ticket} />;
};

export default TicketDetailPage;
