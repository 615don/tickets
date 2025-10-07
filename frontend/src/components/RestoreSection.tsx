import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRestoreBackup } from '@/hooks/useBackup';
import { Upload, X, FileArchive } from 'lucide-react';
import { RestoreConfirmDialog } from './RestoreConfirmDialog';

export const RestoreSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const restoreMutation = useRestoreBackup();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [environmentConfig, setEnvironmentConfig] = useState<Record<string, string> | null>(null);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: { 'application/zip': ['.zip'] },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  // Handle file rejection errors
  useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];

      if (rejection.errors.some((e) => e.code === 'file-too-large')) {
        toast({
          title: 'File Too Large',
          description: 'File too large. Maximum backup size is 100MB.',
          variant: 'destructive',
        });
      } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
        toast({
          title: 'Invalid File Type',
          description: 'Invalid file type. Please select a ZIP backup file.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Upload Error',
          description: 'Failed to upload file. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [fileRejections, toast]);

  // Handle restore button click
  const handleRestoreClick = () => {
    if (selectedFile) {
      setIsDialogOpen(true);
    }
  };

  // Handle confirmed restore
  const handleConfirmRestore = async () => {
    if (!selectedFile) return;

    try {
      const result = await restoreMutation.mutateAsync(selectedFile);

      // Store environment config for display
      setEnvironmentConfig(result.environmentConfig);

      // Show success message
      toast({
        title: 'Database Restored Successfully',
        description: 'All users have been logged out. Please update your .env file.',
      });

      // Wait a moment for user to see the environment config, then redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 5000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Restore failed';

      toast({
        title: 'Restore Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      // Close dialog on error
      setIsDialogOpen(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Restore from backup:</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Upload a backup ZIP file to restore your database. This will replace all current data
            with the data from the backup file.
          </p>
          <p className="text-sm text-destructive font-medium">
            ⚠️ WARNING: This will permanently delete all current data. Make sure you have a recent
            backup before restoring.
          </p>
        </div>

        {/* File Upload Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${selectedFile ? 'bg-muted/30' : ''}
          `}
        >
          <input {...getInputProps()} aria-label="Upload backup file" />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileArchive className="h-8 w-8 text-primary" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop backup file here...'
                  : 'Drag and drop backup ZIP file here, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 100MB
              </p>
            </div>
          )}
        </div>

        {/* Restore Button */}
        <Button
          onClick={handleRestoreClick}
          disabled={!selectedFile || restoreMutation.isPending}
          variant="destructive"
          className="w-full sm:w-auto"
          aria-label="Restore database from backup"
        >
          Restore from Backup
        </Button>

        <p className="text-xs text-muted-foreground">
          Restore process may take several minutes for large databases. All users will be logged
          out after a successful restore.
        </p>
      </div>

      {/* Confirmation Dialog */}
      <RestoreConfirmDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmRestore}
        selectedFile={selectedFile}
        isRestoring={restoreMutation.isPending}
        environmentConfig={environmentConfig}
      />
    </>
  );
};
