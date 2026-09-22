import { io } from 'socket.io-client';

let socket = null;

/**
 * Create or return the existing Socket.IO connection.
 * Credentials are passed in the auth handshake — never in events.
 */
export const getSocket = ({ sessionToken, participantId, participantToken } = {}) => {
  if (socket && socket.connected) return socket;

  // Disconnect stale socket if credentials changed
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || window.location.origin;

  socket = io(backendUrl, {
    auth: { sessionToken, participantId, participantToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { socket };
