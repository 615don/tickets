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

interface DeleteContactDialogProps {
  isOpen: boolean;
  contactName: string;
  contactEmail: string;
  ticketCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteContactDialog = ({
  isOpen,
  contactName,
  contactEmail,
  ticketCount,
  onConfirm,
  onCancel,
}: DeleteContactDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Remove <strong>{contactName}</strong> ({contactEmail})?
              </p>
              <p className="text-sm text-muted-foreground">
                Associated tickets will be preserved and assigned to a system contact.
              </p>
              {ticketCount > 0 && (
                <p className="text-sm">
                  This contact has <strong>{ticketCount} tickets</strong>
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Contact
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
