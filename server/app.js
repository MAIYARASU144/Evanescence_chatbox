require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const sessionRoutes = require('./src/routes/sessionRoutes');
const mediaRoutes = require('./src/routes/mediaRoutes');
const { generalLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // needed for signed R2 URLs
  })
);

// CORS — support comma-separated CLIENT_URL for multi-origin (e.g. Vercel + preview URLs)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'x-participant-id',
      'x-participant-token',
      'Authorization',
    ],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' })); // JSON bodies only — media goes direct to R2
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// General rate limit for all routes
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/media', mediaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler — never expose stack traces to clients
app.use((err, req, res, next) => {
  console.error('[Express] Unhandled error:', err.message);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message;
  res.status(status).json({ error: message });
});

module.exports = app;
