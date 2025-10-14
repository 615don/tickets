import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { UserProfileSection } from '@/components/UserProfileSection';
import { XeroConnectionCard } from '@/components/XeroConnectionCard';
import { XeroContactsDialog } from '@/components/XeroContactsDialog';
import { BackupSection } from '@/components/BackupSection';
import { RestoreSection } from '@/components/RestoreSection';
import { AutomatedBackupSection } from '@/components/AutomatedBackupSection';
import { AiSettingsSection } from '@/components/AiSettingsSection';
import { XeroConnectionStatus } from '@/types/xero';
import { useToast } from '@/hooks/use-toast';
import { useXeroStatus, useDisconnectXero } from '@/hooks/useXero';
import { useInvoiceConfig, useUpdateInvoiceConfig } from '@/hooks/useInvoiceConfig';
import { useGoogleDriveStatus } from '@/hooks/useBackupSettings';
import { xeroApi } from '@/lib/api/xero';
import { Button } from '@/components/ui/button';

export const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [contactsDialogOpen, setContactsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch Xero connection status
  const { data: xeroStatus, isLoading, refetch } = useXeroStatus();
  const disconnectMutation = useDisconnectXero();

  // Fetch invoice configuration
  const { data: invoiceConfig, isLoading: isConfigLoading } = useInvoiceConfig();
  const updateConfigMutation = useUpdateInvoiceConfig();

  // Fetch Google Drive status for refetch on callback
  const { refetch: refetchDriveStatus } = useGoogleDriveStatus();

  // Transform API response to component format
  const connectionStatus: XeroConnectionStatus = {
    isConnected: xeroStatus?.isConnected || false,
    organizationName: xeroStatus?.organizationName || undefined,
    organizationId: xeroStatus?.organizationId || undefined,
    connectedAt: xeroStatus?.lastSyncAt || undefined,
    lastSyncAt: xeroStatus?.lastSyncAt || undefined,
    isValid: xeroStatus?.isConnected || false,
  };

  // Handle OAuth callbacks (Xero and Google Drive)
  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const googleDrive = searchParams.get('google_drive');

    // Handle Xero OAuth callback
    if (success === 'true') {
      toast({
        title: 'Connected to Xero',
        description: 'Your Xero account has been successfully connected.',
      });
      // Refetch connection status
      refetch();
      // Clear query params
      searchParams.delete('success');
      setSearchParams(searchParams);
    } else if (errorParam) {
      let errorMessage = 'Failed to connect to Xero. Please try again.';

      if (errorParam === 'no_code') {
        errorMessage = 'No authorization code received from Xero.';
      } else if (errorParam === 'no_tenant') {
        errorMessage = 'No Xero organization found.';
      } else if (errorParam === 'callback_failed') {
        errorMessage = 'Failed to complete Xero authorization.';
      }

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      // Clear query params
      searchParams.delete('error');
      setSearchParams(searchParams);
    }

    // Handle Google Drive OAuth callback
    if (googleDrive === 'connected') {
      toast({
        title: 'Connected to Google Drive',
        description: 'Your Google Drive has been successfully connected for backups.',
      });
      // Refetch Google Drive status
      refetchDriveStatus();
      // Clear query params
      searchParams.delete('google_drive');
      setSearchParams(searchParams);
    } else if (googleDrive === 'error') {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Google Drive. Please try again.',
        variant: 'destructive',
      });
      // Clear query params
      searchParams.delete('google_drive');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast, refetch, refetchDriveStatus]);

  const handleConnect = () => {
    xeroApi.initiateConnect();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestSuccess(null);

    try {
      // Test by refetching status
      const result = await refetch();

      if (result.data?.isConnected) {
        setTestSuccess(true);
        toast({
          title: 'Connection Test Successful',
          description: 'Your Xero connection is active.',
        });
      } else {
        setTestSuccess(false);
        toast({
          title: 'Connection Test Failed',
          description: 'Unable to verify Xero connection.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTestSuccess(false);
      toast({
        title: 'Connection Test Failed',
        description: 'An error occurred while testing the connection.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setTestSuccess(null);
      toast({
        title: 'Disconnected from Xero',
        description: 'Your Xero connection has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Disconnect Failed',
        description: 'Could not disconnect from Xero. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleInvoiceStatusChange = async (newStatus: 'DRAFT' | 'AUTHORISED') => {
    try {
      await updateConfigMutation.mutateAsync({ xeroInvoiceStatus: newStatus });
      toast({
        title: 'Configuration Updated',
        description: 'Invoice settings saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update invoice configuration.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <PageHeader title="Settings" />
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader title="Settings" />

        <div className="space-y-6">
          {/* User Profile Section */}
          <UserProfileSection />

          {/* Xero Integration Section */}
          <SettingsSection
            title="Xero Integration"
            description="Connect your Xero account to enable automatic invoice generation."
          >
            <XeroConnectionCard
              connectionStatus={connectionStatus}
              onConnect={handleConnect}
              onTest={handleTest}
              onDisconnect={handleDisconnect}
              isTesting={isTesting}
              testSuccess={testSuccess}
            />
            {connectionStatus.isConnected && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setContactsDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  View Xero Customer IDs
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Copy customer IDs to map them to your clients
                </p>
              </div>
            )}
          </SettingsSection>

          {/* AI Email Summarization Section */}
          <SettingsSection
            title="AI Email Summarization"
            description="Configure OpenAI integration for automatic email summarization in the Outlook add-in."
          >
            <AiSettingsSection />
          </SettingsSection>

          {/* Invoice Configuration Section */}
          <SettingsSection
            title="Invoice Configuration"
            description="Configure how invoices are created in Xero."
          >
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Xero Invoice Status</span>
                      <span className="text-xs text-muted-foreground/70">
                        Draft: Review in Xero before approving. Approved: Ready for payment.
                      </span>
                    </div>
                    <select
                      value={invoiceConfig?.xeroInvoiceStatus || 'DRAFT'}
                      onChange={(e) => handleInvoiceStatusChange(e.target.value as 'DRAFT' | 'AUTHORISED')}
                      disabled={isConfigLoading || updateConfigMutation.isPending}
                      className="text-sm font-medium bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="AUTHORISED">Approved</option>
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground/70 italic">
                You can send invoices to customers manually in Xero after generation.
              </p>
            </div>
          </SettingsSection>

          {/* Backup & Restore Section */}
          <SettingsSection
            title="Backup & Restore"
            description="Configure automated backups to Google Drive and manage manual backups."
          >
            <div className="space-y-6">
              {/* Automated Backups */}
              <div>
                <h3 className="text-sm font-medium mb-3">Automated Backups</h3>
                <AutomatedBackupSection />
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Manual Backup Download */}
              <div>
                <h3 className="text-sm font-medium mb-3">Manual Backup</h3>
                <BackupSection />
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Restore upload */}
              <div>
                <h3 className="text-sm font-medium mb-3">Restore from Backup</h3>
                <RestoreSection />
              </div>
            </div>
          </SettingsSection>

          {/* General Settings Section - Placeholder */}
          <SettingsSection
            title="General"
            description="System preferences and configuration."
          >
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Default Billable Rate</span>
                      {connectionStatus.isConnected && (
                        <span className="text-xs text-muted-foreground/70">
                          From Xero "Consulting Services" item
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {connectionStatus.isConnected && connectionStatus.billableRate
                        ? `$${connectionStatus.billableRate}/hour`
                        : 'Connect Xero to sync rate'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Timezone</span>
                    <span className="text-sm font-medium text-foreground">Central Time (CST/CDT)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Date Format</span>
                    <span className="text-sm font-medium text-foreground">MM/DD/YYYY</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Additional settings coming soon
              </p>
            </div>
          </SettingsSection>
        </div>
      </div>

      {/* Xero Contacts Dialog */}
      <XeroContactsDialog
        open={contactsDialogOpen}
        onOpenChange={setContactsDialogOpen}
      />
    </div>
  );
};
