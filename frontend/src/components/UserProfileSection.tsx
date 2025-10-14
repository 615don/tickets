import { useState } from 'react';
import { SettingsSection } from '@/components/SettingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useUpdateEmail, useUpdatePassword } from '@/hooks/useUserProfile';

export const UserProfileSection = () => {
  const { mutate: updateEmail, isPending: isEmailPending } = useUpdateEmail();
  const { mutate: updatePassword, isPending: isPasswordPending } = useUpdatePassword();

  // Collapsible state
  const [isOpen, setIsOpen] = useState(false);

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!newEmail || !emailPassword) {
      return;
    }

    updateEmail(
      { email: newEmail, currentPassword: emailPassword },
      {
        onSuccess: () => {
          // Clear form on success
          setNewEmail('');
          setEmailPassword('');
        },
      }
    );
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword.length < 8) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    updatePassword(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          // Clear form on success
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SettingsSection
        title="User Profile"
        description="Manage your email and password"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full justify-between p-2 hover:bg-muted/50 rounded-md -mt-2 mb-4"
          >
            <span className="text-sm font-medium">
              {isOpen ? 'Hide profile settings' : 'Show profile settings'}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          {/* Email change form */}
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Change Email</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    disabled={isEmailPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPassword">Current Password</Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    disabled={isEmailPending}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isEmailPending || !newEmail || !emailPassword}
                  className="w-full sm:w-auto"
                >
                  {isEmailPending ? 'Updating...' : 'Update Email'}
                </Button>
              </div>
            </div>
          </form>

          <div className="border-t border-border my-6" />

          {/* Password change form */}
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Change Password</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    disabled={isPasswordPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={isPasswordPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be 8-128 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={isPasswordPending}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    isPasswordPending ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  className="w-full sm:w-auto"
                >
                  {isPasswordPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          </form>
        </CollapsibleContent>
      </SettingsSection>
    </Collapsible>
  );
};
