import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { XeroConnectionCard } from '@/components/XeroConnectionCard';
import { XeroConnectionStatus } from '@/types/xero';
import { useToast } from '@/hooks/use-toast';

// Mock data for development - replace with actual API calls
const mockConnectionStatus: XeroConnectionStatus = {
  isConnected: false,
};

const mockConnectedStatus: XeroConnectionStatus = {
  isConnected: true,
  organizationName: 'Acme Consulting LLC',
  organizationId: '12345',
  connectedAt: '2025-01-15T10:30:00Z',
  lastSyncAt: '2025-01-31T12:20:00Z',
  isValid: true,
  billableRate: 150, // From Xero "Consulting Services" item
};

export const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState<XeroConnectionStatus>(mockConnectionStatus);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Handle OAuth callback
  useEffect(() => {
    const xeroStatus = searchParams.get('xero');
    
    if (xeroStatus === 'success') {
      toast({
        title: 'Success',
        description: 'Xero connected successfully!',
      });
      // Fetch actual connection status
      setConnectionStatus(mockConnectedStatus);
      // Clear query params
      searchParams.delete('xero');
      setSearchParams(searchParams);
    } else if (xeroStatus === 'error') {
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to Xero. Please try again.',
        variant: 'destructive',
      });
      // Clear query params
      searchParams.delete('xero');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast]);

  const handleConnect = () => {
    // In production, redirect to: GET /api/xero/connect
    // For demo, simulate OAuth flow
    toast({
      title: 'Redirecting to Xero',
      description: 'Please wait...',
    });
    
    // Simulate OAuth flow
    setTimeout(() => {
      setSearchParams({ xero: 'success' });
    }, 2000);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestSuccess(null);

    // Simulate API call
    setTimeout(() => {
      // Mock success
      setTestSuccess(true);
      setIsTesting(false);
      toast({
        title: 'Connection Test Successful',
        description: 'Your Xero connection is active.',
      });
    }, 1500);
  };

  const handleDisconnect = () => {
    // In production: POST /api/xero/disconnect
    setConnectionStatus(mockConnectionStatus);
    setTestSuccess(null);
    toast({
      title: 'Disconnected',
      description: 'Successfully disconnected from Xero.',
    });
  };

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
