const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected.');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB connection error:', err.message);
    });
  } catch (err) {
    console.error('[DB] Initial connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
