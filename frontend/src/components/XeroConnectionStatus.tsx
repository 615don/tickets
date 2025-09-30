import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoList } from '@/components/InfoList';
import { InfoListItem } from '@/types/xero';
import { formatDistanceToNow } from 'date-fns';

interface XeroConnectionStatusProps {
  isConnected: boolean;
  organizationName?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  onTest: () => void;
  onDisconnect: () => void;
  isTesting: boolean;
  testSuccess?: boolean | null;
}

export const XeroConnectionStatus = ({
  isConnected,
  organizationName,
  connectedAt,
  lastSyncAt,
  onTest,
  onDisconnect,
  isTesting,
  testSuccess,
}: XeroConnectionStatusProps) => {
  const getStatusBadge = () => {
    if (isTesting) {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Testing...
        </Badge>
      );
    }

    if (isConnected) {
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">
        <XCircle className="mr-1 h-3 w-3" />
        Not Connected
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-between">
        {getStatusBadge()}
      </div>
    );
  }

  const infoItems: InfoListItem[] = [
    { label: 'Organization', value: organizationName || 'Unknown' },
    { label: 'Connected Date', value: formatDate(connectedAt) },
    { label: 'Last Sync', value: formatLastSync(lastSyncAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {getStatusBadge()}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <InfoList items={infoItems} />
      </div>

      {testSuccess === true && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          <CheckCircle className="h-4 w-4" />
          <span>Connection is active and working</span>
        </div>
      )}

      {testSuccess === false && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertCircle className="h-4 w-4" />
          <span>Connection issue detected - try reconnecting</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={onTest} 
          disabled={isTesting}
          className="flex-1"
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={onDisconnect}
          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
};
