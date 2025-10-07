import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackupSection } from '../BackupSection';
import { useGenerateBackup } from '@/hooks/useBackup';
import { useToast } from '@/hooks/use-toast';

// Mock the hooks
vi.mock('@/hooks/useBackup');
vi.mock('@/hooks/use-toast');

const mockUseToast = useToast as ReturnType<typeof vi.fn>;
const mockUseGenerateBackup = useGenerateBackup as ReturnType<typeof vi.fn>;

describe('BackupSection', () => {
  const mockToast = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseGenerateBackup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('renders "Download Backup Now" button', () => {
    render(<BackupSection />);
    expect(screen.getByRole('button', { name: /download database backup/i })).toBeInTheDocument();
    expect(screen.getByText('Download Backup Now')).toBeInTheDocument();
  });

  it('triggers generateBackup mutation on button click', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);

    render(<BackupSection />);

    const button = screen.getByRole('button', { name: /download database backup/i });
    await user.click(button);

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  it('shows loading state with spinner and disables button', () => {
    mockUseGenerateBackup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    });

    render(<BackupSection />);

    const button = screen.getByRole('button', { name: /download database backup/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('Generating Backup...')).toBeInTheDocument();
  });

  it('displays success toast after successful download', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);

    render(<BackupSection />);

    const button = screen.getByRole('button', { name: /download database backup/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Backup Downloaded',
        description: 'Your backup has been downloaded successfully.',
      });
    });
  });

  it('displays error toast for ServerError', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Failed to generate backup'));

    render(<BackupSection />);

    const button = screen.getByRole('button', { name: /download database backup/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Backup Failed',
        description: 'Failed to generate backup. Please try again or contact support.',
        variant: 'destructive',
      });
    });
  });

  it('displays error toast for RateLimitExceeded', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Rate limit exceeded'));

    render(<BackupSection />);

    const button = screen.getByRole('button', { name: /download database backup/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Backup Failed',
        description: 'Backup rate limit exceeded. Please wait 5 minutes before trying again.',
        variant: 'destructive',
      });
    });
  });

  it('displays help text with backup contents and security warning', () => {
    render(<BackupSection />);

    expect(screen.getByText(/Backup includes:/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete database \(all tickets, clients, contacts, invoices\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Environment configuration \(Xero tokens, encryption keys\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep backup files secure - they contain sensitive credentials/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<BackupSection />);

    const button = screen.getByRole('button', { name: /download database backup/i });
    expect(button).toHaveAttribute('aria-label', 'Download database backup');
  });
});
