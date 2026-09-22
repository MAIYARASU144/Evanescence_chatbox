const rateLimit = require('express-rate-limit');

const makeWindowMs = (minutes) => minutes * 60 * 1000;

/**
 * Session creation: 5 per hour per IP
 */
const sessionCreateLimiter = rateLimit({
  windowMs: makeWindowMs(60),
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session creation attempts. Please try again later.' },
});

/**
 * Session join + PIN verification: 20 attempts per 10 minutes per IP
 */
const sessionJoinLimiter = rateLimit({
  windowMs: makeWindowMs(10),
  max: parseInt(process.env.JOIN_RATE_LIMIT || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many join attempts. Please wait and try again.' },
});

/**
 * PIN attempts specifically: 5 per 15 minutes per IP (brute-force protection)
 */
const pinAttemptLimiter = rateLimit({
  windowMs: makeWindowMs(15),
  max: parseInt(process.env.PIN_ATTEMPT_RATE_LIMIT || '5', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many incorrect PIN attempts. Please try again later.' },
});

/**
 * Media upload URL requests: 10 per minute per IP
 */
const uploadLimiter = rateLimit({
  windowMs: makeWindowMs(1),
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_PER_MIN || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit exceeded. Please slow down.' },
});

/**
 * Download URL requests: 30 per minute per IP
 */
const downloadLimiter = rateLimit({
  windowMs: makeWindowMs(1),
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Download rate limit exceeded. Please slow down.' },
});

/**
 * General API limiter
 */
const generalLimiter = rateLimit({
  windowMs: makeWindowMs(15),
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = {
  sessionCreateLimiter,
  sessionJoinLimiter,
  pinAttemptLimiter,
  uploadLimiter,
  downloadLimiter,
  generalLimiter,
};
