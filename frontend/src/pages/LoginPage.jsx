import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Lock, Mail, ArrowRight, Sparkles, Key, Shield } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import SetupModal from '../components/auth/SetupModal';
import AcceptInviteModal from '../components/auth/AcceptInviteModal';
import InvitePartnerModal from '../components/auth/InvitePartnerModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage = () => {
  const { login, isAuthenticated, systemStatus } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');

  // Check URL query for invitation code (e.g. /login?code=xxx or /login?invite=xxx)
  const queryCode = searchParams.get('code') || searchParams.get('invite');

  useEffect(() => {
    if (queryCode) {
      setAcceptModalOpen(true);
    }
  }, [queryCode]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = (data) => {
    if (data?.invitationCode) {
      setNewInviteCode(data.invitationCode);
      setInviteModalOpen(true);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-space-light dark:bg-space-dark relative overflow-hidden transition-colors duration-200">
      {/* Background Soft Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lavender-300/20 dark:bg-lavender-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-coral-300/20 dark:bg-coral-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white/80 dark:bg-space-surfaceDark/90 backdrop-blur-xl border border-space-borderLight dark:border-space-borderDark p-8 sm:p-10 shadow-elevated z-10 text-center">
        {/* Logo Emblem */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-lavender-500 to-coral-400 text-white shadow-medium mb-6">
          <Heart className="w-7 h-7 fill-current" />
        </div>

        {/* Header */}
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink dark:text-white">
          TogetherSpace
        </h1>
        <p className="text-sm text-ink-muted mt-2 mb-8 leading-relaxed">
          An intimate, private digital sanctuary for two.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-coral-50 dark:bg-coral-950/30 border border-coral-200 dark:border-coral-800 text-xs text-coral-600 dark:text-coral-300 text-left">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="partner@togetherspace.local"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={loading}
              icon={ArrowRight}
              size="lg"
              className="w-full text-base font-medium"
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Dynamic Setup & Invitation Links */}
        <div className="mt-8 pt-6 border-t border-space-borderLight dark:border-space-borderDark space-y-3">
          {/* First time owner setup banner */}
          {!systemStatus.isSetupComplete ? (
            <button
              onClick={() => setSetupModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-lavender-50 dark:bg-lavender-950/40 text-lavender-700 dark:text-lavender-300 border border-lavender-200 dark:border-lavender-800 text-xs font-semibold hover:bg-lavender-100 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-lavender-500" />
              <span>Initial Setup &mdash; Create Your Space</span>
            </button>
          ) : systemStatus.isRegistrationOpen ? (
            /* Second partner invitation redemption */
            <button
              onClick={() => setAcceptModalOpen(true)}
              className="text-xs text-ink-muted hover:text-lavender-600 dark:hover:text-lavender-300 flex items-center justify-center gap-1.5 mx-auto transition-colors font-medium"
            >
              <Key className="w-3.5 h-3.5 text-lavender-500" />
              <span>Have an invitation code? Join here</span>
            </button>
          ) : (
            /* Registration permanently closed */
            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-light">
              <Shield className="w-3.5 h-3.5 text-lavender-400" />
              <span>Registration closed &bull; Strictly two authorized accounts</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onSetupSuccess={handleSetupComplete}
      />

      <AcceptInviteModal
        isOpen={acceptModalOpen}
        initialToken={queryCode}
        onClose={() => setAcceptModalOpen(false)}
        onSuccess={() => navigate('/dashboard')}
      />

      <InvitePartnerModal
        isOpen={inviteModalOpen}
        invitationCode={newInviteCode}
        onClose={() => {
          setInviteModalOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
};

export default LoginPage;
