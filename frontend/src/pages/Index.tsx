import { useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { DashboardStats, Ticket } from '@/types';

// Mock data
const mockStats: DashboardStats = {
  currentMonthHours: 92.5,
  openTicketCount: 7,
  recentlyClosedCount: 3,
  lastInvoiceDate: '2025-01-31',
  lastInvoicedMonth: 'January 2025'
};

const mockOpenTickets: Ticket[] = [
  {
    id: 1,
    clientName: 'Acme Corp',
    contactName: 'John Smith',
    description: 'Network troubleshooting',
    totalHours: 3.5,
    state: 'open',
    updatedAt: '2025-09-30T14:23:00Z'
  },
  {
    id: 2,
    clientName: 'TechStart Inc',
    contactName: 'Mike Chen',
    description: 'Email migration support',
    totalHours: 5.25,
    state: 'open',
    updatedAt: '2025-09-29T10:15:00Z'
  },
  {
    id: 3,
    clientName: 'Global Solutions',
    contactName: 'Robert Wilson',
    description: 'VPN configuration',
    totalHours: 2.0,
    state: 'open',
    updatedAt: '2025-09-29T08:45:00Z'
  },
  {
    id: 4,
    clientName: 'DataFlow Systems',
    contactName: 'Lisa Anderson',
    description: 'Server maintenance',
    totalHours: 4.5,
    state: 'open',
    updatedAt: '2025-09-28T16:30:00Z'
  },
  {
    id: 5,
    clientName: 'CloudWorks Ltd',
    contactName: 'David Brown',
    description: 'Cloud infrastructure setup',
    totalHours: 8.0,
    state: 'open',
    updatedAt: '2025-09-28T11:20:00Z'
  },
  {
    id: 6,
    clientName: 'Acme Corp',
    contactName: 'Sarah Johnson',
    description: 'Security audit',
    totalHours: 6.75,
    state: 'open',
    updatedAt: '2025-09-27T14:10:00Z'
  },
  {
    id: 7,
    clientName: 'TechStart Inc',
    contactName: 'Emily Davis',
    description: 'Software installation',
    totalHours: 1.5,
    state: 'open',
    updatedAt: '2025-09-27T09:00:00Z'
  }
];

const mockClosedTickets: Ticket[] = [
  {
    id: 8,
    clientName: 'Acme Corp',
    contactName: 'John Smith',
    description: 'Printer setup',
    totalHours: 1.0,
    state: 'closed',
    updatedAt: '2025-09-26T15:30:00Z',
    closedAt: '2025-09-26T15:30:00Z'
  },
  {
    id: 9,
    clientName: 'Global Solutions',
    contactName: 'Robert Wilson',
    description: 'WiFi optimization',
    totalHours: 2.5,
    state: 'closed',
    updatedAt: '2025-09-25T11:45:00Z',
    closedAt: '2025-09-25T11:45:00Z'
  },
  {
    id: 10,
    clientName: 'DataFlow Systems',
    contactName: 'Lisa Anderson',
    description: 'Backup configuration',
    totalHours: 3.0,
    state: 'closed',
    updatedAt: '2025-09-24T13:20:00Z',
    closedAt: '2025-09-24T13:20:00Z'
  }
];

const Index = () => {
  const navigate = useNavigate();

  const handleTicketClick = (id: number) => {
    navigate(`/tickets/${id}`);
  };

  const handleReopenTicket = (id: number) => {
    console.log('Reopening ticket:', id);
    // API call to reopen ticket (future implementation)
  };

  const handleReviewInvoices = () => {
    navigate('/invoices');
  };

  const handleCreateTicket = () => {
    navigate('/tickets/create');
  };

  return (
    <Dashboard
      stats={mockStats}
      openTickets={mockOpenTickets}
      recentlyClosedTickets={mockClosedTickets}
      onCreateTicket={handleCreateTicket}
      onReviewInvoices={handleReviewInvoices}
      onTicketClick={handleTicketClick}
      onReopenTicket={handleReopenTicket}
    />
  );
};

export default Index;
