const crypto = require('crypto');
const Session = require('../models/Session');

/**
 * Middleware: Verify that the request comes from a valid session participant.
 * Reads participantId and participantToken from request headers.
 * Attaches session and participant to req.
 */
const requireParticipant = async (req, res, next) => {
  try {
    const participantId = req.headers['x-participant-id'];
    const participantToken = req.headers['x-participant-token'];
    const { token } = req.params;

    if (!participantId || !participantToken) {
      return res.status(401).json({ error: 'Missing participant credentials.' });
    }

    // Find the session
    const session = await Session.findOne({
      token: token || req.body.sessionToken,
      status: { $in: ['active'] }, // Only allow actions on active sessions
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or has ended.' });
    }

    // Check session expiry
    if (new Date() >= session.expiresAt) {
      return res.status(410).json({ error: 'Session has expired.' });
    }

    // Find and verify participant
    const participant = session.participants.find((p) => p.participantId === participantId);
    if (!participant) {
      return res.status(403).json({ error: 'Participant not found in this session.' });
    }

    // Verify token hash
    const tokenHash = crypto
      .createHash('sha256')
      .update(participantToken)
      .digest('hex');

    if (tokenHash !== participant.participantToken) {
      return res.status(403).json({ error: 'Invalid participant credentials.' });
    }

    // Attach to request for downstream use
    req.session = session;
    req.participant = participant;

    next();
  } catch (err) {
    console.error('[Auth] requireParticipant error:', err.message);
    res.status(500).json({ error: 'Authorization failed.' });
  }
};

/**
 * Middleware: Verify participant AND that they are the session creator.
 * Must be used AFTER or in place of requireParticipant.
 */
const requireCreator = async (req, res, next) => {
  try {
    const participantId = req.headers['x-participant-id'];
    const participantToken = req.headers['x-participant-token'];
    const { token } = req.params;

    if (!participantId || !participantToken) {
      return res.status(401).json({ error: 'Missing participant credentials.' });
    }

    const session = await Session.findOne({
      token,
      status: { $in: ['active'] },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or has ended.' });
    }

    if (new Date() >= session.expiresAt) {
      return res.status(410).json({ error: 'Session has expired.' });
    }

    const participant = session.participants.find((p) => p.participantId === participantId);
    if (!participant) {
      return res.status(403).json({ error: 'Participant not found in this session.' });
    }

    // Verify token
    const tokenHash = crypto
      .createHash('sha256')
      .update(participantToken)
      .digest('hex');

    if (tokenHash !== participant.participantToken) {
      return res.status(403).json({ error: 'Invalid participant credentials.' });
    }

    // Verify creator role — NEVER trust client-supplied role
    if (participant.role !== 'creator') {
      return res.status(403).json({ error: 'Only the session creator can perform this action.' });
    }

    req.session = session;
    req.participant = participant;

    next();
  } catch (err) {
    console.error('[Auth] requireCreator error:', err.message);
    res.status(500).json({ error: 'Authorization failed.' });
  }
};

/**
 * Socket.IO middleware: Verify participant credentials on socket connection.
 */
const socketAuth = async (socket, next) => {
  try {
    const { participantId, participantToken, sessionToken } = socket.handshake.auth;

    if (!participantId || !participantToken || !sessionToken) {
      return next(new Error('Missing socket credentials.'));
    }

    const session = await Session.findOne({
      token: sessionToken,
      status: { $in: ['active'] },
    });

    if (!session) {
      return next(new Error('Session not found or has ended.'));
    }

    if (new Date() >= session.expiresAt) {
      return next(new Error('Session has expired.'));
    }

    const participant = session.participants.find((p) => p.participantId === participantId);
    if (!participant) {
      return next(new Error('Participant not found in this session.'));
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(participantToken)
      .digest('hex');

    if (tokenHash !== participant.participantToken) {
      return next(new Error('Invalid participant credentials.'));
    }

    // Attach to socket for downstream handlers
    socket.sessionId = session._id.toString();
    socket.sessionToken = sessionToken;
    socket.participantId = participantId;
    socket.participantName = participant.temporaryName;
    socket.participantRole = participant.role;

    next();
  } catch (err) {
    console.error('[SocketAuth] Error:', err.message);
    next(new Error('Socket authorization failed.'));
  }
};

module.exports = { requireParticipant, requireCreator, socketAuth };
