const crypto = require('crypto');

/**
 * Generate a cryptographically secure URL-safe token.
 * 32 bytes = 256 bits of entropy, encoded as base64url (~43 chars).
 * Never use Math.random() or timestamps for security tokens.
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('base64url');
};

/**
 * Generate a participant ID with a recognizable prefix for debugging.
 * Still cryptographically random — prefix carries no information.
 */
const generateParticipantId = () => {
  return `p_${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Generate a media object storage key.
 * Format: sessions/<sessionId>/media/<randomId>
 * Original filename is stored in metadata only.
 */
const generateStorageKey = (sessionId) => {
  const randomId = crypto.randomBytes(16).toString('hex');
  return `sessions/${sessionId}/media/${randomId}`;
};

module.exports = { generateSecureToken, generateParticipantId, generateStorageKey };
