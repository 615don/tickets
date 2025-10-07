import { Button } from '@/components/ui/button';
import { SettingsSection } from '@/components/SettingsSection';
import { useToast } from '@/hooks/use-toast';
import { useGenerateBackup } from '@/hooks/useBackup';
import { Loader2, Download } from 'lucide-react';

export const BackupSection = () => {
  const { toast } = useToast();
  const generateBackupMutation = useGenerateBackup();

  const handleDownload = async () => {
    try {
      await generateBackupMutation.mutateAsync();
      toast({
        title: 'Backup Downloaded',
        description: 'Your backup has been downloaded successfully.',
      });
    } catch (error) {
      // Error handling with specific messages
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      let userMessage = 'Failed to generate backup. Please try again or contact support.';
      if (errorMessage.includes('Rate limit')) {
        userMessage = 'Backup rate limit exceeded. Please wait 5 minutes before trying again.';
      }

      toast({
        title: 'Backup Failed',
        description: userMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <SettingsSection
      title="Backup & Restore"
      description="Download a complete backup of your database and configuration for disaster recovery."
    >
      <div className="space-y-4">
        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Backup includes:</strong>
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
            <li>Complete database (all tickets, clients, contacts, invoices)</li>
            <li>Environment configuration (Xero tokens, encryption keys)</li>
          </ul>
          <p className="text-sm text-destructive font-medium">
            ⚠️ Keep backup files secure - they contain sensitive credentials
          </p>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={generateBackupMutation.isPending}
          className="w-full sm:w-auto"
          aria-label="Download database backup"
        >
          {generateBackupMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Backup...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Backup Now
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Backup generation may take several seconds for large databases. You can download one backup every 5 minutes.
        </p>
      </div>
    </SettingsSection>
  );
};
