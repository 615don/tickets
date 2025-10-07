import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RestoreSection } from '../RestoreSection';
import { useRestoreBackup } from '@/hooks/useBackup';
import { useToast } from '@/hooks/use-toast';
import { BrowserRouter } from 'react-router-dom';

// Mock the hooks
vi.mock('@/hooks/useBackup');
vi.mock('@/hooks/use-toast');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockUseToast = useToast as ReturnType<typeof vi.fn>;
const mockUseRestoreBackup = useRestoreBackup as ReturnType<typeof vi.fn>;

describe('RestoreSection', () => {
  const mockToast = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseRestoreBackup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders file dropzone with instructions', () => {
    renderWithRouter(<RestoreSection />);

    expect(screen.getByText(/Drag and drop backup ZIP file here, or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 100MB/i)).toBeInTheDocument();
  });

  it('renders restore button in disabled state when no file selected', () => {
    renderWithRouter(<RestoreSection />);

    const button = screen.getByRole('button', { name: /restore database from backup/i });
    expect(button).toBeDisabled();
  });

  it('displays help text with restore information and warning', () => {
    renderWithRouter(<RestoreSection />);

    expect(screen.getByText(/Restore from backup:/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload a backup ZIP file to restore your database/i)).toBeInTheDocument();
    expect(screen.getByText(/WARNING: This will permanently delete all current data/i)).toBeInTheDocument();
  });

  it('accepts ZIP file via dropzone', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('backup-2024-01-01-120000.zip')).toBeInTheDocument();
      });
    }
  });

  it('enables restore button when file is selected', async () => {
    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /restore database from backup/i });
        expect(button).not.toBeDisabled();
      });
    }
  });

  it('shows file size validation error for files over 100MB', async () => {
    renderWithRouter(<RestoreSection />);

    // Create a mock file over 100MB (just set the size property)
    const largeFile = new File(['content'], 'large-backup.zip', {
      type: 'application/zip',
    });

    // Mock the file size
    Object.defineProperty(largeFile, 'size', {
      value: 101 * 1024 * 1024,
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, largeFile);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'File Too Large',
            description: expect.stringContaining('100MB'),
            variant: 'destructive',
          })
        );
      });
    }
  });

  it('removes selected file when Remove button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('backup-2024-01-01-120000.zip')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove selected file/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('backup-2024-01-01-120000.zip')).not.toBeInTheDocument();
      });
    }
  });

  it('displays confirmation dialog when restore button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('backup-2024-01-01-120000.zip')).toBeInTheDocument();
      });

      const restoreButton = screen.getByRole('button', { name: /restore database from backup/i });
      await user.click(restoreButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Backup File/i)).toBeInTheDocument();
      });
    }
  });

  it('displays data loss warning in confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        const restoreButton = screen.getByRole('button', { name: /restore database from backup/i });
        await user.click(restoreButton);
      });

      // Click Continue in first step
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/WARNING: Permanent Data Loss/i)).toBeInTheDocument();
        expect(screen.getByText(/This action CANNOT be undone/i)).toBeInTheDocument();
      });
    }
  });

  it('requires confirmation checkbox to be checked before restore', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      const restoreButton = screen.getByRole('button', { name: /restore database from backup/i });
      await user.click(restoreButton);

      // Click Continue to step 2
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /restore database/i });
        expect(confirmButton).toBeDisabled();
      });
    }
  });

  it('displays success toast and environment config after successful restore', async () => {
    const user = userEvent.setup();
    const mockEnvironmentConfig = {
      XERO_CLIENT_ID: 'test_id',
      XERO_CLIENT_SECRET: 'test_secret',
      ENCRYPTION_KEY: 'test_key',
    };

    mockMutateAsync.mockResolvedValue({
      message: 'Database restored successfully',
      environmentConfig: mockEnvironmentConfig,
    });

    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      const restoreButton = screen.getByRole('button', { name: /restore database from backup/i });
      await user.click(restoreButton);

      // Continue to step 2
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Check confirmation checkbox
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Click Restore Database
      const confirmButton = screen.getByRole('button', { name: /restore database/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Database Restored Successfully',
          description: expect.stringContaining('logged out'),
        });
      });
    }
  });

  it('displays error toast when restore fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Invalid backup file'));

    renderWithRouter(<RestoreSection />);

    const file = new File(['backup content'], 'backup-2024-01-01-120000.zip', {
      type: 'application/zip',
    });

    const dropzone = screen.getByText(/Drag and drop backup ZIP file here/i).parentElement;
    const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      const restoreButton = screen.getByRole('button', { name: /restore database from backup/i });
      await user.click(restoreButton);

      // Continue to step 2
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Check confirmation checkbox
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Click Restore Database
      const confirmButton = screen.getByRole('button', { name: /restore database/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Restore Failed',
          description: 'Invalid backup file',
          variant: 'destructive',
        });
      });
    }
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<RestoreSection />);

    const restoreButton = screen.getByRole('button', { name: /restore database from backup/i });
    expect(restoreButton).toHaveAttribute('aria-label', 'Restore database from backup');
  });
});
