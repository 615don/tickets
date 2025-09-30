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

interface DisconnectXeroDialogProps {
  isOpen: boolean;
  organizationName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DisconnectXeroDialog = ({
  isOpen,
  organizationName,
  onConfirm,
  onCancel,
}: DisconnectXeroDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect from Xero?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to disconnect from{' '}
              <span className="font-semibold">{organizationName || 'Xero'}</span>. 
              This will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Stop automatic invoice generation</li>
              <li>Require reconnection before next invoice push</li>
              <li>Not affect existing data or invoices</li>
            </ul>
            <p className="text-sm font-medium">You can reconnect anytime.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
