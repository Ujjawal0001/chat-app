import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { User, Mail, Lock, Key, HeartHandshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AcceptInviteModal = ({ isOpen, onClose, initialToken = '', onSuccess }) => {
  const { acceptInvite } = useAuth();
  const [formData, setFormData] = useState({
    token: initialToken || '',
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setFormData((prev) => ({ ...prev, token: initialToken }));
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data = await acceptInvite(formData);
      onClose();
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Accept invite error:', err);
      const fieldErrors = (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) ? err.errors : {};
      const generalMessage = err.message || (typeof err.errors === 'string' ? err.errors : 'Invitation acceptance failed.');
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
      title="Join Your Shared Space"
      description="Enter the private invitation code provided by your partner to create your account. This permanently closes registration."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3.5 text-xs font-medium rounded-xl bg-coral-50 dark:bg-coral-950/40 text-coral-600 dark:text-coral-300 border border-coral-200 dark:border-coral-800">
            {errors.general}
          </div>
        )}

        <Input
          label="Single-Use Invitation Code"
          placeholder="Paste the 64-character token here"
          icon={Key}
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          error={errors.token}
          required
        />

        <Input
          label="Your Name"
          placeholder="e.g. Leo"
          icon={User}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Your Email"
          type="email"
          placeholder="leo@example.com"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={loading}
            icon={HeartHandshake}
            className="w-full"
          >
            Accept Invitation & Join Space
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AcceptInviteModal;
