import { useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { useOpenTickets, useRecentlyClosedTickets, useDashboardStats } from '@/hooks/useTickets';
import { useUpdateTicket } from '@/hooks/useTickets';
import { Loader2 } from 'lucide-react';
import { DashboardStats } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const { data: openTickets, isLoading: isLoadingOpen } = useOpenTickets();
  const { data: recentlyClosedTickets, isLoading: isLoadingClosed } = useRecentlyClosedTickets();
  const { data: dashboardStats, isLoading: isLoadingStats } = useDashboardStats();
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

  const isLoading = isLoadingOpen || isLoadingClosed || isLoadingStats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Combine stats from API with open ticket count
  const stats: DashboardStats = {
    currentMonthHours: dashboardStats?.currentMonthHours || 0,
    openTicketCount: openTickets?.length || 0,
    recentlyClosedCount: recentlyClosedTickets?.length || 0,
    lastInvoiceDate: dashboardStats?.lastInvoiceDate || '',
    lastInvoicedMonth: dashboardStats?.lastInvoicedMonth || 'N/A'
  };

  return (
    <Dashboard
      stats={stats}
      openTickets={openTickets || []}
      recentlyClosedTickets={recentlyClosedTickets || []}
      onCreateTicket={handleCreateTicket}
      onReviewInvoices={handleReviewInvoices}
      onTicketClick={handleTicketClick}
      onReopenTicket={handleReopenTicket}
    />
  );
};

export default Index;
