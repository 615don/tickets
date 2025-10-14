import { apiClient } from '@/lib/api-client';

export interface BackupSettings {
  id: number;
  enabled: boolean;
  schedule_cron: string;
  retention_days: number;
  last_backup_at: string | null;
  last_backup_status: string | null;
  last_backup_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleDriveStatus {
  authenticated: boolean;
}

export interface BackupFile {
  id: string;
  name: string;
  size: number;
  createdTime: string;
}

export interface BackupsListResponse {
  backups: BackupFile[];
}

export interface ManualBackupResponse {
  message: string;
  fileName: string;
  fileId: string;
}

export const backupSettingsApi = {
  // Get Google Drive authentication URL
  getAuthUrl: async (): Promise<{ authUrl: string }> => {
    return await apiClient.get('/api/backup/google-drive/auth-url');
  },

  // Get Google Drive connection status
  getStatus: async (): Promise<GoogleDriveStatus> => {
    return await apiClient.get('/api/backup/google-drive/status');
  },

  // Get backup settings
  getSettings: async (): Promise<BackupSettings> => {
    return await apiClient.get('/api/backup/settings');
  },

  // Update backup settings
  updateSettings: async (settings: Partial<Pick<BackupSettings, 'enabled' | 'schedule_cron' | 'retention_days'>>): Promise<BackupSettings> => {
    return await apiClient.put('/api/backup/settings', settings);
  },

  // Trigger manual backup
  triggerManual: async (): Promise<ManualBackupResponse> => {
    return await apiClient.post('/api/backup/trigger-manual');
  },

  // List backups in Google Drive
  listBackups: async (): Promise<BackupsListResponse> => {
    return await apiClient.get('/api/backup/list');
  },
};
