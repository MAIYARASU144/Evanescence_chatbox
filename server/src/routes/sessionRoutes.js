const express = require('express');
const router = express.Router();

const {
  createSession,
  joinSession,
  getSession,
  leaveSession,
  endSession,
} = require('../controllers/sessionController');

const { requireParticipant, requireCreator } = require('../middleware/auth');
const {
  sessionCreateLimiter,
  sessionJoinLimiter,
} = require('../middleware/rateLimiter');
const {
  sessionCreateRules,
  sessionJoinRules,
  validate,
} = require('../middleware/uploadValidation');

// Create a new session
router.post('/', sessionCreateLimiter, sessionCreateRules, validate, createSession);

// Get session info (public — used to check pin requirement before join)
router.get('/:token', getSession);

// Join a session
router.post('/:token/join', sessionJoinLimiter, sessionJoinRules, validate, joinSession);

// Leave a session (authenticated participant)
router.post('/:token/leave', requireParticipant, leaveSession);

// End a session (creator only)
router.post('/:token/end', requireCreator, endSession);

module.exports = router;
