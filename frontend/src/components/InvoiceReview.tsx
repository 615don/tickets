import { useState, useMemo } from 'react';
import { Clock, Users, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useInvoiceHistory, useDeleteInvoiceLock } from '@/hooks/useInvoiceHistory';
import { InvoiceHistoryItem } from '@/types/invoice';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

/**
 * Formats a month string (YYYY-MM) to a readable format (e.g., "October 2025")
 */
function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Formats a date string to a readable format
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Invoice history card component
 */
function InvoiceHistoryCard({
  item,
  onDelete,
}: {
  item: InvoiceHistoryItem;
  onDelete: (item: InvoiceHistoryItem) => void;
}) {
  const monthDisplay = formatMonthDisplay(item.month);
  const lockedAtDisplay = formatDate(item.lockedAt);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{monthDisplay}</CardTitle>
            <CardDescription>Locked on {lockedAtDisplay}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title={`Delete invoice lock for ${monthDisplay}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.totalBillableHours.toFixed(1)} hours</div>
              <div className="text-xs text-muted-foreground">Billable</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {item.clientCount} {item.clientCount === 1 ? 'client' : 'clients'}
              </div>
              <div className="text-xs text-muted-foreground">Invoiced</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {item.xeroInvoiceIds.length} {item.xeroInvoiceIds.length === 1 ? 'invoice' : 'invoices'}
              </div>
              <div className="text-xs text-muted-foreground">In Xero</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for invoice history
 */
function InvoiceHistoryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Main Invoice Review component - displays invoice history
 */
export const InvoiceReview = () => {
  const { data: invoiceHistory, isLoading, error } = useInvoiceHistory();
  const deleteMutation = useDeleteInvoiceLock();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHistoryItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract unique months from invoice history and sort descending
  const availableMonths = useMemo(() => {
    if (!invoiceHistory) return [];
    const months = [...new Set(invoiceHistory.map(item => item.month))];
    return months.sort((a, b) => b.localeCompare(a)); // Newest first
  }, [invoiceHistory]);

  // Filter invoices by selected month
  const filteredInvoices = useMemo(() => {
    if (!invoiceHistory) return [];
    if (selectedMonth === 'all') return invoiceHistory;
    return invoiceHistory.filter(item => item.month === selectedMonth);
  }, [invoiceHistory, selectedMonth]);

  const handleDeleteClick = (item: InvoiceHistoryItem) => {
    setSelectedInvoice(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    try {
      await deleteMutation.mutateAsync(selectedInvoice.id);
      toast({
        title: 'Invoice lock deleted',
        description: `${formatMonthDisplay(selectedInvoice.month)} can now be edited and re-invoiced.`,
      });
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the invoice lock.';
      toast({
        title: 'Failed to delete invoice lock',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with action button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Generated Invoices</h2>
            <p className="text-muted-foreground">
              View and manage your invoice history. Delete locks to re-invoice a month.
            </p>
          </div>
          <Button asChild>
            <Link to="/invoices/preview">Generate New Invoice</Link>
          </Button>
        </div>

        {/* Month filter */}
        {!isLoading && !error && invoiceHistory && invoiceHistory.length > 0 && (
          <div className="flex items-center gap-4">
            <label htmlFor="month-filter" className="text-sm font-medium">
              Filter by month:
            </label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-filter" className="w-[200px]">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error Loading Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Failed to load invoice history. Please try again.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && <InvoiceHistoryLoadingSkeleton />}

        {/* Empty state */}
        {!isLoading && !error && (!invoiceHistory || invoiceHistory.length === 0) && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <AlertCircle size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No invoices generated yet</h3>
              <p className="text-muted-foreground mb-6">
                Visit Invoice Preview to generate your first invoice.
              </p>
              <Button asChild>
                <Link to="/invoices/preview">Go to Invoice Preview</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invoice history list */}
        {!isLoading && !error && invoiceHistory && invoiceHistory.length > 0 && (
          <div className="space-y-4">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((item) => (
                <InvoiceHistoryCard key={item.id} item={item} onDelete={handleDeleteClick} />
              ))
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <AlertCircle size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No invoices for {formatMonthDisplay(selectedMonth)}</h3>
                  <p className="text-muted-foreground">
                    Select a different month or view all invoices.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete invoice lock for {selectedInvoice ? formatMonthDisplay(selectedInvoice.month) : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will allow time entries for this month to be edited and re-invoiced. This does NOT
              delete the invoice in Xero. You must manually void or delete invoices in Xero if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
