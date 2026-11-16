import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Sun,
  Moon,
  LogOut,
  Shield,
  KeyRound,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const SettingsPage = () => {
  const { user, logout, changePassword, systemStatus } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink dark:text-white">
          Settings & Account
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Manage your personal credentials, appearance, and space security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile & Security Info Card */}
        <div className="rounded-2xl bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-lavender-500 text-white flex items-center justify-center font-serif text-xl font-medium shadow-sm">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-ink dark:text-white leading-tight">
                {user?.name}
              </h3>
              <span className="text-xs text-ink-muted">{user?.email}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-space-borderLight dark:border-space-borderDark space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Space Limit</span>
              <span className="font-semibold text-ink dark:text-gray-200">
                {systemStatus.userCount}/2 Accounts
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Account Status</span>
              <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                <Check className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Privacy Mode</span>
              <span className="inline-flex items-center gap-1 text-lavender-600 font-medium">
                <Shield className="w-3.5 h-3.5" /> Strict 2-User
              </span>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="pt-4 border-t border-space-borderLight dark:border-space-borderDark space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Appearance Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? 'bg-lavender-900/40 border-lavender-700 text-lavender-300'
                    : 'border-space-borderLight hover:bg-space-cardLight text-ink-muted'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  !isDark
                    ? 'bg-lavender-100 border-lavender-300 text-lavender-800'
                    : 'border-space-borderDark hover:bg-space-cardDark text-ink-muted'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-space-borderLight dark:border-space-borderDark">
            <Button
              variant="outline"
              onClick={logout}
              icon={LogOut}
              className="w-full text-coral-600 dark:text-coral-400 hover:border-coral-300"
            >
              Log Out of Space
            </Button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="md:col-span-2 rounded-2xl bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-space-borderLight dark:border-space-borderDark">
            <KeyRound className="w-4 h-4 text-lavender-500" />
            <h2 className="font-serif text-xl font-medium text-ink dark:text-white">
              Change Password
            </h2>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-xs border border-green-200 dark:border-green-800">
              <Check className="w-4 h-4 shrink-0 text-green-600" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-coral-50 dark:bg-coral-950/30 text-coral-600 dark:text-coral-300 text-xs border border-coral-200 dark:border-coral-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-coral-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 8 characters"
              icon={Lock}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
            />

            <div className="pt-2">
              <Button type="submit" isLoading={passwordLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
