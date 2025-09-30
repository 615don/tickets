import { CheckCircle2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { InvoiceGenerationResult } from '@/types/invoice';

interface InvoiceSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: InvoiceGenerationResult;
}

export const InvoiceSuccessDialog = ({ isOpen, onClose, result }: InvoiceSuccessDialogProps) => {
  if (!result.success || !result.results) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle2 className="text-success" size={24} />
            </div>
            <DialogTitle className="text-2xl">Invoices Generated Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            Generated {result.invoiceCount} {result.invoiceCount === 1 ? 'invoice' : 'invoices'} for {result.results.length} {result.results.length === 1 ? 'client' : 'clients'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-2 px-4 text-sm font-medium">Client</th>
                  <th className="text-right py-2 px-4 text-sm font-medium">Amount</th>
                  <th className="text-center py-2 px-4 text-sm font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((invoice) => (
                  <tr key={invoice.clientId} className="border-t border-border">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{invoice.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.lineItemCount} line {invoice.lineItemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-lg">${invoice.amount.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {invoice.xeroInvoiceUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={invoice.xeroInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1"
                          >
                            <span>View</span>
                            <ExternalLink size={14} />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{invoice.xeroInvoiceId}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              🔒 All time entries for this month have been locked and cannot be edited.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
