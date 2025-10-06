/**
 * Invoice Generation Dialog Component
 * Displays confirmation dialog, loading state, success message with Xero links, and error handling
 */

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { InvoiceGenerationResponse, InvoiceGenerationError } from '@/types/invoice';

interface InvoiceGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: InvoiceGenerationError | null;
  data: InvoiceGenerationResponse | null;
  onConfirm: () => void;
  onInvoiceUrlsFetched?: (invoiceUrls: Map<string, string>) => void;
}

export function InvoiceGenerationDialog({
  open,
  onOpenChange,
  month,
  isLoading,
  isSuccess,
  isError,
  error,
  data,
  onConfirm,
  onInvoiceUrlsFetched,
}: InvoiceGenerationDialogProps) {
  const [invoiceUrls, setInvoiceUrls] = useState<Map<string, string>>(new Map());
  const [loadingUrls, setLoadingUrls] = useState(false);

  // Format month for display (YYYY-MM -> Month Year)
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Fetch Xero invoice URLs when generation succeeds
  useEffect(() => {
    if (isSuccess && data?.xeroInvoiceIds && data.xeroInvoiceIds.length > 0) {
      const fetchInvoiceUrls = async () => {
        setLoadingUrls(true);
        const urlMap = new Map<string, string>();

        for (const invoiceId of data.xeroInvoiceIds) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/xero/invoices/${invoiceId}/online-url`, {
              credentials: 'include',
            });
            if (response.ok) {
              const urlData = await response.json();
              urlMap.set(invoiceId, urlData.onlineInvoiceUrl);
            } else {
              console.error(`Failed to fetch URL for invoice ${invoiceId}: ${response.status} ${response.statusText}`);
            }
          } catch (err) {
            console.error(`Failed to fetch URL for invoice ${invoiceId}:`, err);
          }
        }

        setInvoiceUrls(urlMap);
        setLoadingUrls(false);
        onInvoiceUrlsFetched?.(urlMap);
      };

      fetchInvoiceUrls();
    }
  }, [isSuccess, data, onInvoiceUrlsFetched]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInvoiceUrls(new Map());
      setLoadingUrls(false);
    }
  }, [open]);

  // Render loading state
  if (isLoading) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Invoices
            </AlertDialogTitle>
            <AlertDialogDescription aria-live="polite">
              Generating invoices... This may take a few seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Render success state
  if (isSuccess && data) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Invoices Generated Successfully
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4" aria-live="polite">
            <Alert>
              <AlertDescription>
                Successfully generated {data.clientsInvoiced} invoice{data.clientsInvoiced !== 1 ? 's' : ''} for {formatMonth(data.month)}.
                Total: {data.totalBillableHours.toFixed(2)} billable hours.
              </AlertDescription>
            </Alert>

            {data.xeroInvoiceIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">View Invoices in Xero</h4>
                {loadingUrls ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading invoice links...
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.xeroInvoiceIds.map((invoiceId, index) => {
                      const url = invoiceUrls.get(invoiceId);
                      return (
                        <Button
                          key={invoiceId}
                          variant="outline"
                          size="sm"
                          asChild
                          className="justify-start"
                          disabled={!url}
                        >
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View invoice ${index + 1} in Xero`}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Invoice {index + 1}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              Invoice {index + 1} (URL unavailable)
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Render error state
  if (isError && error) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invoice Generation Failed
            </AlertDialogTitle>
          </AlertDialogHeader>

          <Alert variant="destructive" aria-live="assertive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.error}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onOpenChange(false)}>
              Close
            </AlertDialogCancel>
            {['XeroApiError', 'NetworkError'].includes(error.error) && (
              <AlertDialogAction onClick={onConfirm}>
                Retry
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Render confirmation state
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate Invoices for {formatMonth(month)}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will generate invoices in Xero and lock all time entries for this month.
            You will not be able to edit time entries or ticket descriptions after invoicing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}>
            Generate Invoices
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
