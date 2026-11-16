import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { User, Mail, Lock, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SetupModal = ({ isOpen, onClose, onSetupSuccess }) => {
  const { setupOwner } = useAuth();
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
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ general: err.message || 'Setup failed. Please try again.' });
      }
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
          <div className="p-3 text-xs rounded-xl bg-coral-50 text-coral-600 border border-coral-200">
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
          label="Initial Setup Secret (Optional)"
          type="password"
          placeholder="If configured in server environment"
          icon={KeyRound}
          value={formData.setupSecret}
          onChange={(e) => setFormData({ ...formData, setupSecret: e.target.value })}
          error={errors.setupSecret}
          helperText="Only required if your administrator set INITIAL_SETUP_SECRET."
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
