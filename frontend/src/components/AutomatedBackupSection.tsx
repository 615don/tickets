import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useGoogleDriveStatus,
  useBackupSettings,
  useUpdateBackupSettings,
  useTriggerManualBackup,
  useListBackups,
  useConnectGoogleDrive,
} from '@/hooks/useBackupSettings';
import {
  Loader2,
  Cloud,
  CloudOff,
  Calendar,
  HardDrive,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AutomatedBackupSection = () => {
  const { toast } = useToast();
  const [retentionInput, setRetentionInput] = useState<string>('');

  // Queries
  const { data: driveStatus, isLoading: isStatusLoading } = useGoogleDriveStatus();
  const { data: settings, isLoading: isSettingsLoading, refetch: refetchSettings } = useBackupSettings();

  const isAuthenticated = driveStatus?.authenticated ?? false;

  // Only fetch backup list if authenticated with Google Drive
  const { data: backupsList, isLoading: isBackupsLoading } = useListBackups(isAuthenticated);

  // Mutations
  const connectMutation = useConnectGoogleDrive();
  const updateSettingsMutation = useUpdateBackupSettings();
  const triggerBackupMutation = useTriggerManualBackup();

  const isLoading = isStatusLoading || isSettingsLoading;

  // Handle connect to Google Drive
  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync();
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to initiate Google Drive connection.',
        variant: 'destructive',
      });
    }
  };

  // Handle enable/disable toggle
  const handleToggleEnabled = async (enabled: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to Google Drive first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({ enabled });
      toast({
        title: enabled ? 'Backups Enabled' : 'Backups Disabled',
        description: enabled
          ? 'Automated backups are now active.'
          : 'Automated backups have been disabled.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update backup settings.',
        variant: 'destructive',
      });
    }
  };

  // Handle retention days change
  const handleRetentionUpdate = async () => {
    const days = parseInt(retentionInput);

    if (isNaN(days) || days < 1 || days > 365) {
      toast({
        title: 'Invalid Input',
        description: 'Retention days must be between 1 and 365.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({ retention_days: days });
      setRetentionInput('');
      toast({
        title: 'Settings Updated',
        description: `Backups will be kept for ${days} days.`,
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update retention settings.',
        variant: 'destructive',
      });
    }
  };

  // Handle manual backup trigger
  const handleManualBackup = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to Google Drive first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await triggerBackupMutation.mutateAsync();
      await refetchSettings();
      toast({
        title: 'Backup Completed',
        description: `Backup ${result.fileName} uploaded successfully.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Backup Failed',
        description: errorMessage.includes('Rate limit')
          ? 'Please wait 5 minutes before triggering another backup.'
          : 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Drive Connection Status */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {isAuthenticated ? (
              <Cloud className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <CloudOff className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-medium">Google Drive Connection</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {isAuthenticated
                  ? 'Connected - Backups will be stored in your Google Drive'
                  : 'Not connected - Connect to enable automated backups'}
              </p>
            </div>
          </div>
          {!isAuthenticated && (
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              size="sm"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Cloud className="mr-2 h-4 w-4" />
                  Connect Google Drive
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Automated Backup Settings */}
      {isAuthenticated && settings && (
        <>
          {/* Enable/Disable Toggle */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="backup-enabled" className="text-sm font-medium">
                  Automated Backups
                </Label>
                <p className="text-xs text-muted-foreground">
                  Daily backups at midnight (CST)
                </p>
              </div>
              <Switch
                id="backup-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          </div>

          {/* Retention Settings */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="retention-days" className="text-sm font-medium">
                  Retention Policy
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Currently keeping backups for <strong>{settings.retention_days} days</strong>
              </p>
              <div className="flex gap-2">
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  placeholder={settings.retention_days.toString()}
                  value={retentionInput}
                  onChange={(e) => setRetentionInput(e.target.value)}
                  className="w-32"
                />
                <Button
                  onClick={handleRetentionUpdate}
                  disabled={!retentionInput || updateSettingsMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          {/* Last Backup Status */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              {settings.last_backup_status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : settings.last_backup_status === 'failed' ? (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="text-sm font-medium">Last Backup Status</h4>
                {settings.last_backup_at ? (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(settings.last_backup_at), { addSuffix: true })}
                    </p>
                    {settings.last_backup_status === 'success' && (
                      <p className="text-xs text-green-600">Completed successfully</p>
                    )}
                    {settings.last_backup_status === 'failed' && settings.last_backup_error && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-destructive">{settings.last_backup_error}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">No backups yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Manual Backup Button */}
          <Button
            onClick={handleManualBackup}
            disabled={triggerBackupMutation.isPending}
            className="w-full sm:w-auto"
          >
            {triggerBackupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Backup Now
              </>
            )}
          </Button>

          {/* Backup Files List */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Google Drive Backups</h4>
              <span className="text-xs text-muted-foreground">
                {backupsList?.backups?.length || 0} backup(s)
              </span>
            </div>
            {isBackupsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : backupsList?.backups && backupsList.backups.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backupsList.backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-2 bg-background rounded border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{backup.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(backup.size)} • {formatDistanceToNow(new Date(backup.createdTime), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No backups found in Google Drive
              </p>
            )}
          </div>
        </>
      )}

      {/* Help Text */}
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>ℹ️ Automated backups:</strong> When enabled, your database will be backed up daily at
          midnight (CST) and stored in a "Ticketing System Backups" folder in your Google Drive. Old backups
          are automatically deleted based on your retention policy.
        </p>
      </div>
    </div>
  );
};
