import { io } from 'socket.io-client';

// Determine Socket.IO server URL based on current environment
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      // In production (Render/custom domain), connect to same origin
      return window.location.origin;
    }
    // In local development, connect to backend port 5000
    return 'http://localhost:5000';
  }
  return 'http://localhost:5000';
};

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
};

export default getSocket;
