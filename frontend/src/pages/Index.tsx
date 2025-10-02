import { useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { useOpenTickets } from '@/hooks/useTickets';
import { useUpdateTicket } from '@/hooks/useTickets';
import { Loader2 } from 'lucide-react';
import { DashboardStats } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const { data: openTickets, isLoading } = useOpenTickets();
  const updateTicket = useUpdateTicket();

  const handleTicketClick = (id: number) => {
    navigate(`/tickets/${id}`);
  };

  const handleReopenTicket = async (id: number) => {
    try {
      await updateTicket.mutateAsync({ id, data: { state: 'open' } });
    } catch (error) {
      console.error('Failed to reopen ticket:', error);
    }
  };

  const handleReviewInvoices = () => {
    navigate('/invoices');
  };

  const handleCreateTicket = () => {
    navigate('/tickets/create');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate stats from actual data
  const stats: DashboardStats = {
    currentMonthHours: openTickets?.reduce((sum, ticket) => sum + ticket.totalHours, 0) || 0,
    openTicketCount: openTickets?.length || 0,
    recentlyClosedCount: 0, // TODO: Add closed tickets query
    lastInvoiceDate: '',
    lastInvoicedMonth: 'N/A'
  };

  return (
    <Dashboard
      stats={stats}
      openTickets={openTickets || []}
      recentlyClosedTickets={[]} // TODO: Add closed tickets query
      onCreateTicket={handleCreateTicket}
      onReviewInvoices={handleReviewInvoices}
      onTicketClick={handleTicketClick}
      onReopenTicket={handleReopenTicket}
    />
  );
};

export default Index;
