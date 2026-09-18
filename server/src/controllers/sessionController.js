const sessionService = require('../services/sessionService');
const { cleanupSession } = require('../services/cleanupService');

// io is injected after socket server starts
let _io = null;
const setIo = (io) => { _io = io; };

/**
 * POST /api/sessions
 * Create a new chat session.
 */
const createSession = async (req, res) => {
  try {
    const { temporaryName, maxParticipants, expiresInHours, pin } = req.body;

    const result = await sessionService.createSession({
      temporaryName,
      maxParticipants: parseInt(maxParticipants, 10),
      expiresInHours: parseFloat(expiresInHours),
      pin,
    });

    res.status(201).json({
      sessionToken: result.sessionToken,
      sessionId: result.sessionId,
      participantId: result.participantId,
      participantToken: result.participantToken,
      expiresAt: result.expiresAt,
      pinEnabled: result.pinEnabled,
      shareUrl: `${process.env.CLIENT_URL}/chat/${result.sessionToken}`,
    });
  } catch (err) {
    console.error('[SessionController] createSession error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * POST /api/sessions/:token/join
 * Join an existing session.
 */
const joinSession = async (req, res) => {
  try {
    const { token } = req.params;
    const { temporaryName, pin } = req.body;

    const result = await sessionService.joinSession({ token, temporaryName, pin });

    res.status(200).json({
      sessionId: result.sessionId,
      sessionToken: result.sessionToken,
      participantId: result.participantId,
      participantToken: result.participantToken,
      expiresAt: result.expiresAt,
      temporaryName: result.temporaryName,
    });
  } catch (err) {
    const status = {
      NOT_FOUND: 404,
      EXPIRED: 410,
      DESTROYED: 410,
      UNAVAILABLE: 503,
      FULL: 403,
      PIN_REQUIRED: 400,
      INVALID_PIN: 403,
    }[err.code] || 400;

    res.status(status).json({ error: err.message, code: err.code });
  }
};

/**
 * GET /api/sessions/:token
 * Get session info (safe public fields only).
 */
const getSession = async (req, res) => {
  try {
    const { token } = req.params;
    const session = await sessionService.getSession(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Return safe public info — no PIN hash, no participant tokens
    res.json({
      sessionId: session._id.toString(),
      status: session.status,
      pinEnabled: session.pinEnabled,
      maxParticipants: session.maxParticipants,
      participantCount: session.participants.length,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    });
  } catch (err) {
    console.error('[SessionController] getSession error:', err.message);
    res.status(500).json({ error: 'Failed to get session.' });
  }
};

/**
 * POST /api/sessions/:token/leave
 * Participant leaves voluntarily.
 */
const leaveSession = async (req, res) => {
  try {
    const { session, participant } = req;

    await sessionService.removeParticipant(session._id, participant.participantId);

    // Notify other participants
    if (_io) {
      _io.to(`session:${session._id}`).emit('participant:left', {
        participantId: participant.participantId,
        temporaryName: participant.temporaryName,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[SessionController] leaveSession error:', err.message);
    res.status(500).json({ error: 'Failed to leave session.' });
  }
};

/**
 * POST /api/sessions/:token/end
 * Creator ends the session — triggers full cleanup.
 */
const endSession = async (req, res) => {
  try {
    const { session } = req;

    // Respond immediately — cleanup happens asynchronously
    res.json({ success: true, message: 'Session is being destroyed.' });

    // Run cleanup (async, non-blocking for response)
    setImmediate(() => {
      cleanupSession(session._id, _io).catch((err) => {
        console.error('[SessionController] cleanup error:', err.message);
      });
    });
  } catch (err) {
    console.error('[SessionController] endSession error:', err.message);
    res.status(500).json({ error: 'Failed to end session.' });
  }
};

module.exports = { createSession, joinSession, getSession, leaveSession, endSession, setIo };
