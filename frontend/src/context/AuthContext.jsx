import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    userCount: 0,
    maxUsers: 2,
    isSetupComplete: false,
    isRegistrationOpen: true,
    hasActiveInvitation: false,
    requiresSetupSecret: false
  });

  // Check current session from HTTP-only cookie
  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch system invitation & setup status
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await api.get('/invitations/status');
      if (response.success && response.data) {
        setSystemStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch invitation status:', err);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchSystemStatus();
  }, [checkAuth, fetchSystemStatus]);

  // Login handler
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      await fetchSystemStatus();
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  };

  // Initial owner setup handler
  const setupOwner = async ({ name, email, password, setupSecret }) => {
    const response = await api.post('/auth/setup', { name, email, password, setupSecret });
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      await fetchSystemStatus();
      return response.data;
    }
    throw new Error(response.message || 'Setup failed');
  };

  // Accept partner invitation handler
  const acceptInvite = async ({ token, name, email, password }) => {
    const response = await api.post('/auth/accept-invite', { token, name, email, password });
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      await fetchSystemStatus();
      return response.data;
    }
    throw new Error(response.message || 'Invitation acceptance failed');
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      await fetchSystemStatus();
    }
  };

  // Change password handler
  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        systemStatus,
        login,
        logout,
        setupOwner,
        acceptInvite,
        changePassword,
        checkAuth,
        refreshSystemStatus: fetchSystemStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
