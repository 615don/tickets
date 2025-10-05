/**
 * Invoice Preview Page
 * Displays pre-invoice review screen with ticket grouping and inline editing
 */

import { useState, useMemo } from 'react';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useInvoicePreview, useGenerateInvoices } from '@/hooks/useInvoicePreview';
import { InvoiceClientGroup } from '@/components/InvoiceClientGroup';
import { GenerateInvoicesButton } from '@/components/GenerateInvoicesButton';
import { InvoiceGenerationDialog } from '@/components/InvoiceGenerationDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InvoiceGenerationError } from '@/types/invoice';

// Helper function to generate last 12 months
function getLast12Months(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7); // YYYY-MM
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  return months;
}

// Helper to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

export function InvoicePreview() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useInvoicePreview(selectedMonth);
  const { mutate, isPending, isSuccess, isError: isMutationError, error: mutationError, data: mutationData, reset } = useGenerateInvoices();

  const months = useMemo(() => getLast12Months(), []);

  // Calculate missing description count
  const missingDescriptionCount = useMemo(() => {
    if (!data || !data.summary) return 0;
    return data.summary.missingDescriptionCount;
  }, [data]);

  const handleGenerateInvoices = () => {
    setDialogOpen(true);
  };

  const handleConfirmGeneration = () => {
    mutate(selectedMonth);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset mutation state when dialog closes
      reset();
    }
  };

  // Parse mutation error
  const parsedError: InvoiceGenerationError | null = useMemo(() => {
    if (!mutationError) return null;
    // ApiError from api-client has body property with error details
    const apiError = mutationError as unknown;
    if (
      apiError &&
      typeof apiError === 'object' &&
      'body' in apiError &&
      apiError.body &&
      typeof apiError.body === 'object' &&
      'error' in apiError.body &&
      'message' in apiError.body
    ) {
      return {
        error: (apiError.body as { error: string }).error,
        message: (apiError.body as { message: string }).message,
      };
    }
    // Fallback for network errors or unexpected errors
    return {
      error: 'NetworkError',
      message: 'Failed to connect to server. Please check your connection and try again.',
    };
  }, [mutationError]);

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Invoice Preview</h1>
        <p className="text-gray-600">
          Review tickets and verify accuracy before generating invoices
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <label htmlFor="month-selector" className="block text-sm font-medium mb-2">
          Select Month
        </label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger id="month-selector" className="w-full md:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load invoice preview</AlertTitle>
          <AlertDescription className="mt-2">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data && data.clients && data.clients.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No billable time entries found</AlertTitle>
          <AlertDescription>
            No billable time entries found for {formatMonth(selectedMonth)}. Try selecting a
            different month or add time entries for this period.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Loaded */}
      {!isLoading && !isError && data && data.summary && data.clients.length > 0 && (
        <>
          {/* Summary Header */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">{formatMonth(selectedMonth)}</h2>
                <p className="text-3xl font-bold text-blue-600">
                  {data.summary.totalBillableHours.toFixed(2)} hours
                </p>
                <p className="text-sm text-gray-600 mt-1">Total billable hours</p>
              </div>

              {data.isLocked && (
                <div>
                  <Badge variant="secondary" className="text-sm">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked - Month already invoiced
                  </Badge>
                </div>
              )}
            </div>

            {/* Missing Descriptions Warning */}
            {!data.isLocked && missingDescriptionCount > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  {missingDescriptionCount} ticket{missingDescriptionCount > 1 ? 's' : ''} missing
                  description{missingDescriptionCount > 1 ? 's' : ''}. All tickets must have
                  descriptions before invoices can be generated.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Client Groups */}
          <div className="space-y-4 mb-6">
            {data.clients.map((client) => (
              <InvoiceClientGroup
                key={client.clientId}
                client={client}
                month={selectedMonth}
                isLocked={data.isLocked}
              />
            ))}
          </div>

          {/* Generate Invoices Button */}
          <div className="sticky bottom-4 bg-white border-t pt-4 pb-2">
            <GenerateInvoicesButton
              month={selectedMonth}
              isLocked={data.isLocked}
              missingDescriptionCount={missingDescriptionCount}
              onGenerate={handleGenerateInvoices}
            />
          </div>

          {/* Invoice Generation Dialog */}
          <InvoiceGenerationDialog
            open={dialogOpen}
            onOpenChange={handleDialogClose}
            month={selectedMonth}
            isLoading={isPending}
            isSuccess={isSuccess}
            isError={isMutationError}
            error={parsedError}
            data={mutationData || null}
            onConfirm={handleConfirmGeneration}
          />
        </>
      )}
    </div>
  );
}
