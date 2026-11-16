import axios from 'axios';

// In production or when hosted on any non-localhost domain (like Render or Vercel),
// always route to '/api' (same-origin) unless an explicit non-localhost VITE_API_URL is provided.
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      // In remote environment (like on Render), never allow a localhost fallback
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return '/api';
    }
  }
  return envUrl || '/api';
};

const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent response formatting or auth expiration handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {
      success: false,
      message: error.message || 'Network error occurred'
    };
    return Promise.reject(errorData);
  }
);

export default api;
