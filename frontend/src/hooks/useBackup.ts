import { useMutation } from '@tanstack/react-query';
import { backupApi } from '@/lib/api/backup';

export const useGenerateBackup = () => {
  return useMutation({
    mutationFn: backupApi.generateBackup,
    onError: (error) => {
      console.error('Backup generation failed:', error);
    },
  });
};
