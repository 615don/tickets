import { Clock, FileText, CheckCircle2, Calendar, Plus, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickStatsCard } from './QuickStatsCard';
import { TicketRow } from './TicketRow';
import { EmptyState } from './EmptyState';
import { DashboardStats, Ticket } from '@/types';

interface DashboardProps {
  stats: DashboardStats;
  openTickets: Ticket[];
  recentlyClosedTickets: Ticket[];
  onCreateTicket: () => void;
  onReviewInvoices: () => void;
  onTicketClick: (id: number) => void;
  onReopenTicket: (id: number) => void;
}

export const Dashboard = ({
  stats,
  openTickets,
  recentlyClosedTickets,
  onCreateTicket,
  onReviewInvoices,
  onTicketClick,
  onReopenTicket
}: DashboardProps) => {
  
  const getHoursIndicator = (hours: number): 'success' | 'warning' | 'error' => {
    if (hours >= 85 && hours <= 100) return 'success';
    if (hours < 85) return 'warning';
    return 'error';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats - Different layout for mobile vs desktop */}
        <section className="mb-6 md:mb-8">
          {/* Desktop: Show all 4 stats */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6">
            <QuickStatsCard
              label="Current Month Hours"
              value={stats.currentMonthHours}
              indicator={getHoursIndicator(stats.currentMonthHours)}
              icon={Clock}
            />
            <QuickStatsCard
              label="Open Tickets"
              value={stats.openTicketCount}
              icon={FileText}
            />
            <QuickStatsCard
              label="Recently Closed"
              value={stats.recentlyClosedCount}
              icon={CheckCircle2}
            />
            <QuickStatsCard
              label="Last Invoice"
              value={stats.lastInvoicedMonth}
              icon={Calendar}
            />
          </div>

          {/* Quick Actions - Desktop only */}
          <div className="hidden md:flex flex-col sm:flex-row gap-3">
            <Button onClick={onCreateTicket} size="lg" className="flex-1 sm:flex-none h-12">
              <Plus className="w-5 h-5 mr-2" />
              Create Ticket
            </Button>
            <Button onClick={onReviewInvoices} variant="outline" size="lg" className="flex-1 sm:flex-none h-12">
              <FileCheck className="w-5 h-5 mr-2" />
              Review Invoices
            </Button>
          </div>
        </section>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-4 md:mb-0">
          {/* Open Tickets */}
          <section className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Open Tickets</h2>
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {stats.openTicketCount}
                  </span>
                </div>
              </div>

              {openTickets.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  message="No open tickets - great job staying on top of your work!"
                />
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Ticket
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Client
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Description
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Hours
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {openTickets.slice(0, 20).map((ticket) => (
                          <TicketRow
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => onTicketClick(ticket.id)}
                            variant="desktop"
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden p-4">
                    {openTickets.slice(0, 20).map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => onTicketClick(ticket.id)}
                        variant="mobile"
                      />
                    ))}
                  </div>

                  {openTickets.length > 20 && (
                    <div className="px-6 py-4 border-t border-border text-center">
                      <button className="text-primary hover:text-primary/80 text-sm font-medium">
                        View All ({openTickets.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Recently Closed Tickets */}
          <section className="lg:col-span-2 hidden lg:block">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Recently Closed</h2>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>

              {recentlyClosedTickets.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  message="No recently closed tickets"
                />
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Ticket
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Client
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Hours
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Closed
                          </th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentlyClosedTickets.slice(0, 10).map((ticket) => (
                          <TicketRow
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => onTicketClick(ticket.id)}
                            showCloseButton
                            onReopen={onReopenTicket}
                            variant="desktop"
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden p-4">
                    {recentlyClosedTickets.slice(0, 10).map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => onTicketClick(ticket.id)}
                        showCloseButton
                        onReopen={onReopenTicket}
                        variant="mobile"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Mobile: Bottom section with secondary stats and actions */}
        <div className="md:hidden mt-6 mb-24 space-y-4">
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-4">
            <QuickStatsCard
              label="Current Month Hours"
              value={stats.currentMonthHours}
              indicator={getHoursIndicator(stats.currentMonthHours)}
              icon={Clock}
            />
            <QuickStatsCard
              label="Open Tickets"
              value={stats.openTicketCount}
              icon={FileText}
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-4">
            <QuickStatsCard
              label="Recently Closed"
              value={stats.recentlyClosedCount}
              icon={CheckCircle2}
            />
            <QuickStatsCard
              label="Last Invoice"
              value={stats.lastInvoicedMonth}
              icon={Calendar}
            />
          </div>

          {/* Review Invoices button */}
          <Button onClick={onReviewInvoices} variant="outline" size="lg" className="w-full h-12">
            <FileCheck className="w-5 h-5 mr-2" />
            Review Invoices
          </Button>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-50">
        <Button onClick={onCreateTicket} size="lg" className="w-full h-14 text-lg font-semibold">
          <Plus className="w-6 h-6 mr-2" />
          Create Ticket
        </Button>
      </div>
    </div>
  );
};
