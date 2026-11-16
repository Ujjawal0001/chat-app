import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { User, Mail, Lock, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SetupModal = ({ isOpen, onClose, onSetupSuccess }) => {
  const { setupOwner, systemStatus } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    setupSecret: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data = await setupOwner(formData);
      onClose();
      if (onSetupSuccess) {
        onSetupSuccess(data);
      }
    } catch (err) {
      console.error('Setup owner error:', err);
      const fieldErrors = (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) ? err.errors : {};
      const generalMessage = err.message || (typeof err.errors === 'string' ? err.errors : 'Setup failed. Please check your inputs.');
      setErrors({
        ...fieldErrors,
        general: generalMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Your Space"
      description="Initialize TogetherSpace as the primary owner. You will receive an invitation code to invite your partner."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3.5 text-xs font-medium rounded-xl bg-coral-50 dark:bg-coral-950/40 text-coral-600 dark:text-coral-300 border border-coral-200 dark:border-coral-800">
            {errors.general}
          </div>
        )}

        <Input
          label="Your Name"
          placeholder="e.g. Maya"
          icon={User}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="maya@example.com"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <Input
          label="Master Password"
          type="password"
          placeholder="At least 8 characters"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          required
        />

        <Input
          label={systemStatus?.requiresSetupSecret ? "Initial Setup Passphrase (Required)" : "Initial Setup Secret (Optional)"}
          type="password"
          placeholder={systemStatus?.requiresSetupSecret ? "Enter your server's INITIAL_SETUP_SECRET" : "Leave blank if not configured"}
          icon={KeyRound}
          value={formData.setupSecret}
          onChange={(e) => setFormData({ ...formData, setupSecret: e.target.value })}
          error={errors.setupSecret}
          required={Boolean(systemStatus?.requiresSetupSecret)}
          helperText={
            systemStatus?.requiresSetupSecret
              ? "Your server has INITIAL_SETUP_SECRET configured in Render. Enter that exact passphrase to unlock setup."
              : "Only required if INITIAL_SETUP_SECRET was configured in server environment."
          }
        />

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={loading}
            icon={Sparkles}
            className="w-full"
          >
            Create Space & Generate Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SetupModal;
