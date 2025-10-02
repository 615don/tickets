import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { XeroConnectionCard } from '@/components/XeroConnectionCard';
import { XeroConnectionStatus } from '@/types/xero';
import { useToast } from '@/hooks/use-toast';
import { useXeroStatus, useDisconnectXero } from '@/hooks/useXero';
import { xeroApi } from '@/lib/api/xero';

export const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Fetch Xero connection status
  const { data: xeroStatus, isLoading, refetch } = useXeroStatus();
  const disconnectMutation = useDisconnectXero();

  // Transform API response to component format
  const connectionStatus: XeroConnectionStatus = {
    isConnected: xeroStatus?.isConnected || false,
    organizationName: xeroStatus?.organizationName || undefined,
    organizationId: xeroStatus?.organizationId || undefined,
    connectedAt: xeroStatus?.lastSyncAt || undefined,
    lastSyncAt: xeroStatus?.lastSyncAt || undefined,
    isValid: xeroStatus?.isConnected || false,
  };

  // Handle OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

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
  }, [searchParams, setSearchParams, toast, refetch]);

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
    </div>
  );
};
