const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Session = require('../models/Session');
const { generateSecureToken, generateParticipantId } = require('../utils/tokenGenerator');

const BCRYPT_ROUNDS = 10;
const MAX_HOURS = parseInt(process.env.MAX_SESSION_DURATION_HOURS || '48', 10);

/**
 * Create a new chat session.
 */
const createSession = async ({ temporaryName, maxParticipants, expiresInHours, pin }) => {
  if (expiresInHours > MAX_HOURS) {
    throw new Error(`Session duration cannot exceed ${MAX_HOURS} hours.`);
  }

  const sessionToken = generateSecureToken(32);
  const participantId = generateParticipantId();
  const participantToken = generateSecureToken(24);
  const participantTokenHash = crypto
    .createHash('sha256')
    .update(participantToken)
    .digest('hex');

  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  let pinEnabled = false;
  let pinHash = null;
  if (pin && pin.trim()) {
    pinEnabled = true;
    pinHash = await bcrypt.hash(pin.trim(), BCRYPT_ROUNDS);
  }

  const session = new Session({
    token: sessionToken,
    creatorParticipantId: participantId,
    maxParticipants,
    participants: [
      {
        participantId,
        temporaryName: temporaryName.trim(),
        role: 'creator',
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        status: 'online',
        participantToken: participantTokenHash,
      },
    ],
    status: 'active',
    pinEnabled,
    pinHash,
    expiresAt,
  });

  await session.save();

  return {
    sessionToken,
    sessionId: session._id.toString(),
    participantId,
    participantToken,
    expiresAt,
    pinEnabled,
  };
};

/**
 * Join an existing session atomically.
 * Uses findOneAndUpdate to prevent race conditions on participant limits.
 */
const joinSession = async ({ token, temporaryName, pin }) => {
  // First, validate the session exists and is joinable
  const session = await Session.findOne({ token, status: 'active' });

  if (!session) {
    const expired = await Session.findOne({ token });
    if (!expired) throw Object.assign(new Error('Session not found.'), { code: 'NOT_FOUND' });
    if (expired.status === 'expired') throw Object.assign(new Error('This temporary chat has ended (expired).'), { code: 'EXPIRED' });
    if (expired.status === 'destroyed' || expired.status === 'destroying') throw Object.assign(new Error('This temporary chat has ended.'), { code: 'DESTROYED' });
    throw Object.assign(new Error('Session unavailable.'), { code: 'UNAVAILABLE' });
  }

  // Check expiry
  if (new Date() >= session.expiresAt) {
    await Session.findByIdAndUpdate(session._id, { status: 'expired' });
    throw Object.assign(new Error('This temporary chat has ended (expired).'), { code: 'EXPIRED' });
  }

  // Validate PIN
  if (session.pinEnabled) {
    if (!pin) throw Object.assign(new Error('PIN is required.'), { code: 'PIN_REQUIRED' });
    const pinValid = await bcrypt.compare(pin.trim(), session.pinHash);
    if (!pinValid) throw Object.assign(new Error('Incorrect PIN.'), { code: 'INVALID_PIN' });
  }

  // Atomic participant slot claim — only adds participant if current count < max
  const participantId = generateParticipantId();
  const participantToken = generateSecureToken(24);
  const participantTokenHash = crypto
    .createHash('sha256')
    .update(participantToken)
    .digest('hex');

  const newParticipant = {
    participantId,
    temporaryName: temporaryName.trim(),
    role: 'participant',
    joinedAt: new Date(),
    lastSeenAt: new Date(),
    status: 'online',
    participantToken: participantTokenHash,
  };

  // findOneAndUpdate with array size condition — atomic, prevents race conditions
  const updated = await Session.findOneAndUpdate(
    {
      _id: session._id,
      status: 'active',
      $expr: { $lt: [{ $size: '$participants' }, session.maxParticipants] },
    },
    { $push: { participants: newParticipant } },
    { new: true }
  );

  if (!updated) {
    throw Object.assign(new Error('This chat is currently full.'), { code: 'FULL' });
  }

  return {
    sessionId: session._id.toString(),
    sessionToken: token,
    participantId,
    participantToken,
    expiresAt: session.expiresAt,
    temporaryName: temporaryName.trim(),
  };
};

/**
 * Get session info (safe subset for clients).
 */
const getSession = async (token) => {
  const session = await Session.findOne({ token });
  if (!session) return null;
  return session;
};

/**
 * Remove a participant from a session (on leave or after grace period).
 */
const removeParticipant = async (sessionId, participantId) => {
  await Session.findByIdAndUpdate(sessionId, {
    $pull: { participants: { participantId } },
  });
};

/**
 * Update participant status (online/offline).
 */
const updateParticipantStatus = async (sessionId, participantId, status) => {
  const update = {
    'participants.$.status': status,
    'participants.$.lastSeenAt': new Date(),
  };
  if (status === 'offline') {
    update['participants.$.disconnectedAt'] = new Date();
  } else {
    update['participants.$.disconnectedAt'] = null;
  }

  await Session.findOneAndUpdate(
    { _id: sessionId, 'participants.participantId': participantId },
    { $set: update }
  );
};

/**
 * Verify a participant token against the session.
 * Returns participant info or null.
 */
const verifyParticipantToken = async (sessionId, participantId, participantToken) => {
  const session = await Session.findById(sessionId);
  if (!session) return null;

  const participant = session.participants.find((p) => p.participantId === participantId);
  if (!participant) return null;

  const tokenHash = crypto
    .createHash('sha256')
    .update(participantToken)
    .digest('hex');

  if (tokenHash !== participant.participantToken) return null;

  return { participant, session };
};

module.exports = {
  createSession,
  joinSession,
  getSession,
  removeParticipant,
  updateParticipantStatus,
  verifyParticipantToken,
};
