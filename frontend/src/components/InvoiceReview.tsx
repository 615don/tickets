import { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, Lock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { SummaryCard } from './SummaryCard';
import { MonthSelector } from './MonthSelector';
import { ClientInvoiceGroup } from './ClientInvoiceGroup';
import { GenerateInvoicesDialog } from './GenerateInvoicesDialog';
import { InvoiceSuccessDialog } from './InvoiceSuccessDialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { InvoicePreview, InvoiceGenerationResult } from '@/types/invoice';

const BILLABLE_RATE = 150;

// Generate last 12 months for selector
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7); // "2025-01"
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options;
};

// Mock data generator
const generateMockData = (month: string): InvoicePreview => {
  const isCurrentMonth = month === new Date().toISOString().slice(0, 7);
  
  return {
    month,
    isLocked: !isCurrentMonth,
    lockedAt: isCurrentMonth ? null : '2025-01-31T14:30:00Z',
    xeroInvoiceIds: isCurrentMonth ? [] : ['INV-001', 'INV-002'],
    summary: {
      totalBillableHours: 92.5,
      totalClients: 3,
      totalTickets: 12,
      missingDescriptionCount: isCurrentMonth ? 2 : 0
    },
    clients: [
      {
        clientId: 1,
        clientName: 'Acme Corporation',
        xeroCustomerId: 'CUST-001',
        totalHours: 34.5,
        billableHours: 34.5,
        estimatedAmount: 34.5 * BILLABLE_RATE,
        tickets: [
          {
            id: 101,
            description: 'Email migration and server setup',
            totalHours: 12.5,
            billableHours: 12.5,
            billable: true,
            hasMissingDescription: false,
            timeEntries: []
          },
          {
            id: 102,
            description: isCurrentMonth ? null : 'Network troubleshooting',
            totalHours: 8.0,
            billableHours: 8.0,
            billable: true,
            hasMissingDescription: isCurrentMonth,
            timeEntries: []
          },
          {
            id: 103,
            description: 'Database optimization and backup',
            totalHours: 14.0,
            billableHours: 14.0,
            billable: true,
            hasMissingDescription: false,
            timeEntries: []
          }
        ]
      },
      {
        clientId: 2,
        clientName: 'TechStart Inc',
        xeroCustomerId: 'CUST-002',
        totalHours: 28.0,
        billableHours: 25.0,
        estimatedAmount: 25.0 * BILLABLE_RATE,
        tickets: [
          {
            id: 104,
            description: 'Cloud infrastructure setup',
            totalHours: 18.0,
            billableHours: 18.0,
            billable: true,
            hasMissingDescription: false,
            timeEntries: []
          },
          {
            id: 105,
            description: isCurrentMonth ? null : 'Security audit',
            totalHours: 7.0,
            billableHours: 7.0,
            billable: true,
            hasMissingDescription: isCurrentMonth,
            timeEntries: []
          },
          {
            id: 106,
            description: 'Training session',
            totalHours: 3.0,
            billableHours: 0,
            billable: false,
            hasMissingDescription: false,
            timeEntries: []
          }
        ]
      },
      {
        clientId: 3,
        clientName: 'Global Enterprises',
        xeroCustomerId: 'CUST-003',
        totalHours: 33.0,
        billableHours: 33.0,
        estimatedAmount: 33.0 * BILLABLE_RATE,
        tickets: [
          {
            id: 107,
            description: 'ERP system integration',
            totalHours: 20.0,
            billableHours: 20.0,
            billable: true,
            hasMissingDescription: false,
            timeEntries: []
          },
          {
            id: 108,
            description: 'API development',
            totalHours: 13.0,
            billableHours: 13.0,
            billable: true,
            hasMissingDescription: false,
            timeEntries: []
          }
        ]
      }
    ]
  };
};

export const InvoiceReview = () => {
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [invoiceData, setInvoiceData] = useState<InvoicePreview>(generateMockData(monthOptions[0].value));
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generationResult, setGenerationResult] = useState<InvoiceGenerationResult | null>(null);

  useEffect(() => {
    // Simulate API call to fetch invoice data
    const data = generateMockData(selectedMonth);
    setInvoiceData(data);
  }, [selectedMonth]);

  const handleDescriptionUpdate = async (ticketId: number, description: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    setInvoiceData(prev => ({
      ...prev,
      clients: prev.clients.map(client => ({
        ...client,
        tickets: client.tickets.map(ticket =>
          ticket.id === ticketId
            ? { ...ticket, description, hasMissingDescription: false }
            : ticket
        )
      })),
      summary: {
        ...prev.summary,
        missingDescriptionCount: Math.max(0, prev.summary.missingDescriptionCount - 1)
      }
    }));
  };

  const handleGenerateInvoices = async (): Promise<InvoiceGenerationResult> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result: InvoiceGenerationResult = {
      success: true,
      invoiceCount: invoiceData.clients.length,
      results: invoiceData.clients.map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        xeroInvoiceId: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        xeroInvoiceUrl: `https://go.xero.com/organisationlogin/default.aspx`,
        amount: client.estimatedAmount,
        lineItemCount: client.tickets.filter(t => t.billable).length
      }))
    };

    setGenerationResult(result);
    setShowGenerateDialog(false);
    setShowSuccessDialog(true);
    
    // Update invoice data to locked state
    setInvoiceData(prev => ({
      ...prev,
      isLocked: true,
      lockedAt: new Date().toISOString()
    }));

    return result;
  };

  const canGenerateInvoices = !invoiceData.isLocked && invoiceData.summary.missingDescriptionCount === 0;
  const monthDisplay = new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Invoice Review"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Month Selector */}
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableMonths={monthOptions}
        />

        {invoiceData.clients.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <AlertCircle size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tickets found for {monthDisplay}</h3>
            <p className="text-muted-foreground mb-6">
              Create tickets or select a different month to review invoices.
            </p>
            <Button asChild>
              <Link to="/tickets/create">
                <Plus size={16} className="mr-2" />
                Create Ticket
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Total Billable Hours"
                value={invoiceData.summary.totalBillableHours.toFixed(1)}
                subtext={`Across ${invoiceData.summary.totalClients} ${invoiceData.summary.totalClients === 1 ? 'client' : 'clients'}`}
                icon={Clock}
                variant="info"
              />
              <SummaryCard
                title="Total Clients"
                value={invoiceData.summary.totalClients}
                subtext={`${invoiceData.summary.totalTickets} ${invoiceData.summary.totalTickets === 1 ? 'ticket' : 'tickets'} total`}
                icon={Users}
                variant="info"
              />
              <SummaryCard
                title="Status"
                value={
                  invoiceData.isLocked
                    ? 'Invoiced'
                    : invoiceData.summary.missingDescriptionCount > 0
                    ? `${invoiceData.summary.missingDescriptionCount} Need Attention`
                    : 'Ready'
                }
                subtext={
                  invoiceData.isLocked
                    ? `Locked on ${new Date(invoiceData.lockedAt!).toLocaleDateString()}`
                    : invoiceData.summary.missingDescriptionCount > 0
                    ? 'Tickets need descriptions'
                    : 'Ready to invoice'
                }
                icon={invoiceData.isLocked ? Lock : AlertCircle}
                variant={
                  invoiceData.isLocked
                    ? 'locked'
                    : invoiceData.summary.missingDescriptionCount > 0
                    ? 'warning'
                    : 'success'
                }
              />
            </div>

            {/* Action Bar */}
            <div className="space-y-4">
              {invoiceData.isLocked && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    🔒 This month has been invoiced and is locked. Time entries cannot be edited.
                    {invoiceData.xeroInvoiceIds.length > 0 && (
                      <span className="block mt-1 text-xs">
                        Invoice IDs: {invoiceData.xeroInvoiceIds.join(', ')}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => setShowGenerateDialog(true)}
                  disabled={!canGenerateInvoices}
                  title={
                    invoiceData.isLocked
                      ? 'This month is already invoiced and locked'
                      : invoiceData.summary.missingDescriptionCount > 0
                      ? `${invoiceData.summary.missingDescriptionCount} ${invoiceData.summary.missingDescriptionCount === 1 ? 'ticket needs' : 'tickets need'} descriptions before invoicing`
                      : 'Generate invoices for this month'
                  }
                >
                  Generate Invoices for {monthDisplay}
                </Button>
              </div>
            </div>

            {/* Client Groups */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Clients</h2>
              {invoiceData.clients.map((client) => (
                <ClientInvoiceGroup
                  key={client.clientId}
                  client={client}
                  onDescriptionUpdate={handleDescriptionUpdate}
                  isLocked={invoiceData.isLocked}
                  billableRate={BILLABLE_RATE}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <GenerateInvoicesDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        invoiceData={invoiceData}
        onGenerate={handleGenerateInvoices}
      />

      {generationResult && (
        <InvoiceSuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            // Refresh the page data
            setInvoiceData(generateMockData(selectedMonth));
          }}
          result={generationResult}
        />
      )}
    </div>
  );
};
