require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./src/config/database');
const { initializeSockets } = require('./src/sockets');
const { startBackgroundCleanup } = require('./src/services/cleanupService');
const { setIo } = require('./src/controllers/sessionController');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Register socket handlers
  initializeSockets(io);

  // Inject io into session controller (for real-time notifications from REST endpoints)
  setIo(io);

  // Start background cleanup job (passes io for socket notifications)
  startBackgroundCleanup(io);

  // Start listening
  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[Server] Allowing connections from: ${CLIENT_URL}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`[Server] ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err.message);
  process.exit(1);
});
