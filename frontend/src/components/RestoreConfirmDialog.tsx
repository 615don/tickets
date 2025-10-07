import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedFile: File | null;
  isRestoring: boolean;
  environmentConfig: Record<string, string> | null;
}

export const RestoreConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  selectedFile,
  isRestoring,
  environmentConfig,
}: RestoreConfirmDialogProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [step, setStep] = useState<'file-selection' | 'confirmation' | 'success'>('file-selection');

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmed(false);
      setStep('file-selection');
    }
    onOpenChange(newOpen);
  };

  // Parse timestamp from backup filename (format: backup-YYYY-MM-DD-HHMMSS.zip)
  const getBackupTimestamp = () => {
    if (!selectedFile) return 'Unknown';

    const match = selectedFile.name.match(/backup-(\d{4})-(\d{2})-(\d{2})-(\d{6})\.zip/);
    if (!match) return selectedFile.name;

    const [, year, month, day, time] = match;
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    const seconds = time.substring(4, 6);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Format file size
  const getFileSize = () => {
    if (!selectedFile) return '';
    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  };

  // Handle proceed to confirmation step
  const handleProceedToConfirmation = () => {
    setStep('confirmation');
  };

  // Handle restore confirmation
  const handleConfirmRestore = () => {
    onConfirm();
  };

  // Show success step with environment config
  if (step === 'success' && environmentConfig) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              ✓ Database Restored Successfully
            </DialogTitle>
            <DialogDescription>
              Your database has been restored. Please update your .env file with the configuration below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Environment Configuration:</p>
              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                {Object.entries(environmentConfig)
                  .map(([key, value]) => `${key}=${value}`)
                  .join('\n')}
              </pre>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> You will be logged out shortly. After updating your .env file, restart your server and log in again.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 1: File Selection
  if (step === 'file-selection') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Backup File</DialogTitle>
            <DialogDescription>
              Please verify the backup file details before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Filename:</span>
                <span className="font-medium">{selectedFile?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-medium">{getFileSize()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backup Date:</span>
                <span className="font-medium">{getBackupTimestamp()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceedToConfirmation}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: Confirmation with Warning
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Database Restore
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete all current data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Box */}
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              WARNING: Permanent Data Loss
            </p>
            <p className="text-sm text-destructive/90">
              Restoring will permanently delete ALL current data including tickets, clients, contacts,
              invoices, and configuration. This action CANNOT be undone.
            </p>
          </div>

          {/* Backup Info */}
          <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restoring from:</span>
              <span className="font-medium">{getBackupTimestamp()}</span>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-4 border rounded-lg">
            <Checkbox
              id="confirm-restore"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={isRestoring}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="confirm-restore"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand that all current data will be permanently deleted
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmRestore}
            disabled={!confirmed || isRestoring}
            aria-label="Restore database from backup"
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring Database...
              </>
            ) : (
              'Restore Database'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
