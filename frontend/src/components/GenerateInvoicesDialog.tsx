import { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { InvoicePreview, InvoiceGenerationResult } from '@/types/invoice';

interface GenerateInvoicesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoicePreview;
  onGenerate: () => Promise<InvoiceGenerationResult>;
}

export const GenerateInvoicesDialog = ({
  isOpen,
  onClose,
  invoiceData,
  onGenerate
}: GenerateInvoicesDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await onGenerate();
      
      if (!result.success) {
        setError(result.message || 'Failed to generate invoices');
        setIsGenerating(false);
      }
      // Success case is handled by parent component showing success dialog
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsGenerating(false);
    }
  };

  const totalAmount = invoiceData.clients.reduce((sum, client) => sum + client.estimatedAmount, 0);
  const monthDisplay = new Date(invoiceData.month + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Generate Invoices for {monthDisplay}?</DialogTitle>
          <DialogDescription>
            Review the summary below before generating invoices in Xero
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Clients</p>
              <p className="text-2xl font-bold">{invoiceData.summary.totalClients}</p>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="text-2xl font-bold">{invoiceData.summary.totalBillableHours.toFixed(1)}</p>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="space-y-1">
                <p className="font-medium flex items-center space-x-2">
                  <Lock size={14} />
                  <span>This will lock all time entries for {monthDisplay}</span>
                </p>
                <p className="text-sm">
                  You will not be able to edit time entries after invoicing.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Client Breakdown */}
          <div>
            <h4 className="font-medium mb-3">Invoice Breakdown</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-2 px-4 text-sm font-medium">Client</th>
                    <th className="text-right py-2 px-4 text-sm font-medium">Hours</th>
                    <th className="text-right py-2 px-4 text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.clients.map((client) => (
                    <tr key={client.clientId} className="border-t border-border">
                      <td className="py-2 px-4">{client.clientName}</td>
                      <td className="py-2 px-4 text-right">{client.billableHours.toFixed(1)}</td>
                      <td className="py-2 px-4 text-right font-semibold">
                        ${client.estimatedAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isGenerating ? 'Generating...' : 'Generate Invoices'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
