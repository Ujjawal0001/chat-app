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
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ general: err.message || 'Invitation acceptance failed.' });
      }
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
          <div className="p-3 text-xs rounded-xl bg-coral-50 text-coral-600 border border-coral-200">
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
