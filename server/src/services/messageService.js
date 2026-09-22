const Message = require('../models/Message');

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_HISTORY = 100; // messages loaded on reconnect

/**
 * Save a new message to the database.
 * Server generates the timestamp — never trust client.
 */
const saveMessage = async ({ sessionId, senderParticipantId, senderName, type, content, mediaId }) => {
  if (type === 'text' && (!content || content.trim().length === 0)) {
    throw new Error('Message content cannot be empty.');
  }
  if (content && content.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const message = new Message({
    sessionId,
    senderParticipantId,
    senderName,
    type,
    content: content ? content.trim() : '',
    mediaId: mediaId || null,
    createdAt: new Date(), // server timestamp
  });

  await message.save();
  return message;
};

/**
 * Get recent messages for a session (for reconnect catch-up).
 */
const getRecentMessages = async (sessionId, limit = MAX_MESSAGES_HISTORY) => {
  return Message.find({ sessionId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('mediaId', 'type originalName mimeType size storageKey confirmed')
    .lean();
};

/**
 * Delete all messages for a session (called during cleanup).
 * Idempotent — safe to call multiple times.
 */
const deleteSessionMessages = async (sessionId) => {
  const result = await Message.deleteMany({ sessionId });
  console.log(`[MessageService] Deleted ${result.deletedCount} messages for session ${sessionId}`);
  return result.deletedCount;
};

module.exports = { saveMessage, getRecentMessages, deleteSessionMessages };
