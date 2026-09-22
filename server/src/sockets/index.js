const { socketAuth } = require('../middleware/auth');
const { registerSessionSocket } = require('./sessionSocket');
const { registerMessageSocket } = require('./messageSocket');
const { registerPresenceSocket } = require('./presenceSocket');

/**
 * Initialize Socket.IO and register all event handlers.
 * @param {SocketIO.Server} io
 */
const initializeSockets = (io) => {
  // Apply auth middleware to all socket connections
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} | Participant: ${socket.participantId} | Session: ${socket.sessionId}`);

    // Join the session room
    socket.join(`session:${socket.sessionId}`);

    // Register domain-specific handlers
    registerSessionSocket(io, socket);
    registerMessageSocket(io, socket);
    registerPresenceSocket(io, socket);

    socket.on('error', (err) => {
      console.error(`[Socket] Error for ${socket.id}:`, err.message);
    });
  });

  console.log('[Socket] Socket.IO initialized.');
};

module.exports = { initializeSockets };
