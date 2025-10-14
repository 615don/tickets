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
    const response = await apiClient.get('/backup/google-drive/auth-url');
    return response.data;
  },

  // Get Google Drive connection status
  getStatus: async (): Promise<GoogleDriveStatus> => {
    const response = await apiClient.get('/backup/google-drive/status');
    return response.data;
  },

  // Get backup settings
  getSettings: async (): Promise<BackupSettings> => {
    const response = await apiClient.get('/backup/settings');
    return response.data;
  },

  // Update backup settings
  updateSettings: async (settings: Partial<Pick<BackupSettings, 'enabled' | 'schedule_cron' | 'retention_days'>>): Promise<BackupSettings> => {
    const response = await apiClient.put('/backup/settings', settings);
    return response.data;
  },

  // Trigger manual backup
  triggerManual: async (): Promise<ManualBackupResponse> => {
    const response = await apiClient.post('/backup/trigger-manual');
    return response.data;
  },

  // List backups in Google Drive
  listBackups: async (): Promise<BackupsListResponse> => {
    const response = await apiClient.get('/backup/list');
    return response.data;
  },
};
