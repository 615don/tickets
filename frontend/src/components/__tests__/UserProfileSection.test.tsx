import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfileSection } from '../UserProfileSection';
import { useUpdateEmail, useUpdatePassword } from '@/hooks/useUserProfile';

// Mock the hooks
vi.mock('@/hooks/useUserProfile');

const mockUseUpdateEmail = useUpdateEmail as ReturnType<typeof vi.fn>;
const mockUseUpdatePassword = useUpdatePassword as ReturnType<typeof vi.fn>;

describe('UserProfileSection', () => {
  const mockEmailMutate = vi.fn();
  const mockPasswordMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateEmail.mockReturnValue({
      mutate: mockEmailMutate,
      isPending: false,
    });
    mockUseUpdatePassword.mockReturnValue({
      mutate: mockPasswordMutate,
      isPending: false,
    });
  });

  it('renders User Profile section with title and description', () => {
    render(<UserProfileSection />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your email and password')).toBeInTheDocument();
  });

  it('renders email change form with proper inputs', () => {
    render(<UserProfileSection />);
    expect(screen.getByLabelText('New Email')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Current Password')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update email/i })).toBeInTheDocument();
  });

  it('renders password change form with proper inputs', () => {
    render(<UserProfileSection />);
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('shows password requirements hint text', () => {
    render(<UserProfileSection />);
    expect(
      screen.getByText(/Password must be 8-128 characters with uppercase, lowercase, number, and special character/i)
    ).toBeInTheDocument();
  });

  it('submits email change with correct data', async () => {
    const user = userEvent.setup();
    render(<UserProfileSection />);

    const emailInput = screen.getByLabelText('New Email');
    const passwordInput = screen.getAllByLabelText('Current Password')[0];
    const submitButton = screen.getByRole('button', { name: /update email/i });

    await user.type(emailInput, 'newemail@test.com');
    await user.type(passwordInput, 'currentpass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockEmailMutate).toHaveBeenCalledWith(
        { email: 'newemail@test.com', currentPassword: 'currentpass123' },
        expect.any(Object)
      );
    });
  });

  it('clears email form on successful submission', async () => {
    const user = userEvent.setup();
    mockEmailMutate.mockImplementation((_, { onSuccess }) => {
      onSuccess();
    });

    render(<UserProfileSection />);

    const emailInput = screen.getByLabelText('New Email') as HTMLInputElement;
    const passwordInput = screen.getAllByLabelText('Current Password')[0] as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /update email/i });

    await user.type(emailInput, 'newemail@test.com');
    await user.type(passwordInput, 'currentpass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  it('submits password change with correct data', async () => {
    const user = userEvent.setup();
    render(<UserProfileSection />);

    const currentPasswordInput = screen.getAllByLabelText('Current Password')[1];
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPass123!');
    await user.type(confirmPasswordInput, 'NewPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPasswordMutate).toHaveBeenCalledWith(
        {
          currentPassword: 'currentpass123',
          newPassword: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        },
        expect.any(Object)
      );
    });
  });

  it('clears password form on successful submission', async () => {
    const user = userEvent.setup();
    mockPasswordMutate.mockImplementation((_, { onSuccess }) => {
      onSuccess();
    });

    render(<UserProfileSection />);

    const currentPasswordInput = screen.getAllByLabelText('Current Password')[1] as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPass123!');
    await user.type(confirmPasswordInput, 'NewPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe('');
      expect(newPasswordInput.value).toBe('');
      expect(confirmPasswordInput.value).toBe('');
    });
  });

  it('disables email submit button when pending', () => {
    mockUseUpdateEmail.mockReturnValue({
      mutate: mockEmailMutate,
      isPending: true,
    });

    render(<UserProfileSection />);

    const submitButton = screen.getByRole('button', { name: /updating/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables password submit button when pending', () => {
    mockUseUpdatePassword.mockReturnValue({
      mutate: mockPasswordMutate,
      isPending: true,
    });

    render(<UserProfileSection />);

    const passwordUpdateButton = screen.getByRole('button', { name: /updating/i });
    expect(passwordUpdateButton).toBeDisabled();
  });

  it('disables email submit button when fields are empty', () => {
    render(<UserProfileSection />);

    const submitButton = screen.getByRole('button', { name: /update email/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables password submit button when password too short', async () => {
    const user = userEvent.setup();
    render(<UserProfileSection />);

    const currentPasswordInput = screen.getAllByLabelText('Current Password')[1];
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'current');
    await user.type(newPasswordInput, 'short');
    await user.type(confirmPasswordInput, 'short');

    expect(submitButton).toBeDisabled();
  });

  it('disables password submit button when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<UserProfileSection />);

    const currentPasswordInput = screen.getAllByLabelText('Current Password')[1];
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPass123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');

    expect(submitButton).toBeDisabled();
  });

  it('enables password submit button when all validations pass', async () => {
    const user = userEvent.setup();
    render(<UserProfileSection />);

    const currentPasswordInput = screen.getAllByLabelText('Current Password')[1];
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'currentpass123');
    await user.type(newPasswordInput, 'NewPass123!');
    await user.type(confirmPasswordInput, 'NewPass123!');

    expect(submitButton).not.toBeDisabled();
  });

  it('uses proper input types for security', () => {
    render(<UserProfileSection />);

    const emailInput = screen.getByLabelText('New Email');
    const passwordInputs = screen.getAllByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    passwordInputs.forEach((input) => {
      expect(input).toHaveAttribute('type', 'password');
    });
  });
});
