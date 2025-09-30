import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DeleteClientData } from '@/types';

interface DeleteClientDialogProps {
  isOpen: boolean;
  clientData: DeleteClientData | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteClientDialog = ({
  isOpen,
  clientData,
  onConfirm,
  onCancel,
}: DeleteClientDialogProps) => {
  if (!clientData) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will permanently delete <strong>{clientData.companyName}</strong> and all associated data:
              </p>
              <ul className="space-y-1 text-sm">
                <li>• {clientData.contactCount} contacts</li>
                <li>• {clientData.ticketCount} tickets</li>
                <li>• {clientData.timeEntryCount} time entries</li>
              </ul>
              {clientData.hasInvoices ? (
                <p className="text-destructive font-semibold">
                  ⚠️ Cannot delete - invoices have been generated for this client
                </p>
              ) : (
                <p className="text-destructive font-semibold">
                  ⚠️ This action cannot be undone
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          {!clientData.hasInvoices && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Client
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
