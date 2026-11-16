import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Copy, Check, ShieldCheck, Clock, Share2, Sparkles } from 'lucide-react';
import api from '../../services/api';

export const InvitePartnerModal = ({
  isOpen,
  onClose,
  invitationCode,
  expiresAt,
  onCodeGenerated
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState(invitationCode);

  const inviteLink = currentCode
    ? `${window.location.origin}/accept-invite?code=${currentCode}`
    : '';

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleGenerateNew = async () => {
    setLoading(true);
    try {
      const response = await api.post('/invitations', { expiresInDays: 7 });
      if (response.success && response.data?.invitationCode) {
        setCurrentCode(response.data.invitationCode);
        if (onCodeGenerated) {
          onCodeGenerated(response.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to generate invitation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Your Partner"
      description="TogetherSpace is exclusively reserved for exactly two people. Share this private single-use code with your partner."
    >
      <div className="space-y-5 text-left">
        {/* Security Alert Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800 text-lavender-800 dark:text-lavender-300 text-xs">
          <ShieldCheck className="w-5 h-5 shrink-0 text-lavender-600 mt-0.5" />
          <p className="leading-relaxed">
            This invitation code is single-use and strictly valid for your second partner. Once redeemed, registration is permanently sealed.
          </p>
        </div>

        {/* Code Container */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Invitation Code
          </label>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-space-cardLight dark:bg-space-cardDark border border-space-borderLight dark:border-space-borderDark font-mono text-xs break-all select-all text-ink dark:text-gray-200">
            <span className="flex-1 truncate">{currentCode || 'No active code'}</span>
            <button
              onClick={() => handleCopy(currentCode)}
              className="p-1.5 rounded-lg hover:bg-space-borderLight dark:hover:bg-space-borderDark text-ink-muted transition-colors shrink-0"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expiration Note */}
        <div className="flex items-center gap-2 text-xs text-ink-light">
          <Clock className="w-3.5 h-3.5 text-lavender-500" />
          <span>Valid for 7 days from generation.</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            onClick={() => handleCopy(inviteLink)}
            icon={copied ? Check : Share2}
            className="flex-1"
          >
            {copied ? 'Link Copied!' : 'Copy Invitation Link'}
          </Button>

          <Button
            variant="outline"
            onClick={handleGenerateNew}
            isLoading={loading}
            icon={Sparkles}
          >
            Regenerate
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvitePartnerModal;
