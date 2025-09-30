import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { XeroConnectionStatus } from '@/components/XeroConnectionStatus';
import { DisconnectXeroDialog } from '@/components/DisconnectXeroDialog';
import { XeroConnectionStatus as ConnectionStatusType } from '@/types/xero';

interface XeroConnectionCardProps {
  connectionStatus: ConnectionStatusType;
  onConnect: () => void;
  onTest: () => void;
  onDisconnect: () => void;
  isTesting: boolean;
  testSuccess?: boolean | null;
}

export const XeroConnectionCard = ({
  connectionStatus,
  onConnect,
  onTest,
  onDisconnect,
  isTesting,
  testSuccess,
}: XeroConnectionCardProps) => {
  const [showRequirements, setShowRequirements] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleDisconnect = () => {
    setShowDisconnectDialog(true);
  };

  const confirmDisconnect = () => {
    onDisconnect();
    setShowDisconnectDialog(false);
  };

  if (connectionStatus.isConnected) {
    return (
      <>
        <XeroConnectionStatus
          isConnected={true}
          organizationName={connectionStatus.organizationName}
          connectedAt={connectionStatus.connectedAt}
          lastSyncAt={connectionStatus.lastSyncAt}
          onTest={onTest}
          onDisconnect={handleDisconnect}
          isTesting={isTesting}
          testSuccess={testSuccess}
        />
        <DisconnectXeroDialog
          isOpen={showDisconnectDialog}
          organizationName={connectionStatus.organizationName}
          onConfirm={confirmDisconnect}
          onCancel={() => setShowDisconnectDialog(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <XeroConnectionStatus
        isConnected={false}
        onTest={onTest}
        onDisconnect={onDisconnect}
        isTesting={false}
      />

      <div className="space-y-3 mt-6">
        <p className="text-sm text-muted-foreground">
          Connect your Xero account to enable automatic invoice generation and synchronization.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Benefits</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Automatically push invoices to Xero</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Sync client information with Xero contacts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Generate detailed invoice line items per ticket</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Lock time entries after invoicing for accuracy</span>
            </li>
          </ul>
        </div>

        <Button 
          onClick={onConnect} 
          size="lg" 
          className="w-full"
        >
          Connect to Xero
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You'll be redirected to Xero to authorize access. This is secure and you can disconnect anytime.
        </p>

        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowRequirements(!showRequirements)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-semibold text-foreground">Before You Connect</span>
            {showRequirements ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showRequirements && (
            <div className="p-4 pt-0 space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>You need a Xero account with Admin access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Ensure you have a 'Consulting Services' item in Xero</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Your Xero clients should match the clients in this system</span>
                </li>
              </ul>
              <a
                href="https://docs.xero.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Learn how to set up Xero
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
