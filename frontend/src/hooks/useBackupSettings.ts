import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupSettingsApi, BackupSettings } from '@/lib/api/backup-settings';

// Query keys
export const backupSettingsKeys = {
  all: ['backupSettings'] as const,
  status: () => [...backupSettingsKeys.all, 'status'] as const,
  settings: () => [...backupSettingsKeys.all, 'settings'] as const,
  list: () => [...backupSettingsKeys.all, 'list'] as const,
};

/**
 * Get Google Drive connection status
 */
export function useGoogleDriveStatus() {
  return useQuery({
    queryKey: backupSettingsKeys.status(),
    queryFn: backupSettingsApi.getStatus,
    staleTime: 30000, // 30 seconds
    retry: 1, // Only retry once
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Get backup settings
 */
export function useBackupSettings() {
  return useQuery({
    queryKey: backupSettingsKeys.settings(),
    queryFn: backupSettingsApi.getSettings,
    staleTime: 10000, // 10 seconds
    retry: 1, // Only retry once
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Update backup settings
 */
export function useUpdateBackupSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backupSettingsApi.updateSettings,
    onSuccess: (data) => {
      // Update the settings cache
      queryClient.setQueryData(backupSettingsKeys.settings(), data);
    },
  });
}

/**
 * Trigger manual backup
 */
export function useTriggerManualBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backupSettingsApi.triggerManual,
    onSuccess: () => {
      // Invalidate settings to refresh last backup status
      queryClient.invalidateQueries({ queryKey: backupSettingsKeys.settings() });
      // Invalidate backup list
      queryClient.invalidateQueries({ queryKey: backupSettingsKeys.list() });
    },
  });
}

/**
 * List backups in Google Drive
 */
export function useListBackups(enabled: boolean = true) {
  return useQuery({
    queryKey: backupSettingsKeys.list(),
    queryFn: backupSettingsApi.listBackups,
    staleTime: 30000, // 30 seconds
    retry: 1, // Only retry once
    refetchOnWindowFocus: false, // Don't refetch on window focus
    enabled, // Only fetch when explicitly enabled
  });
}

/**
 * Get Google Drive auth URL and redirect
 */
export function useConnectGoogleDrive() {
  return useMutation({
    mutationFn: async () => {
      const { authUrl } = await backupSettingsApi.getAuthUrl();
      window.location.href = authUrl;
    },
  });
}
