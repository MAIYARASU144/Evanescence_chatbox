const Message = require('../models/Message');
const { saveMessage } = require('../services/messageService');
const Media = require('../models/Media');

// Per-participant message rate limiting (in-memory for V1)
// Maps participantId -> { count, windowStart }
const messageRateMap = new Map();
const MESSAGE_RATE_LIMIT = parseInt(process.env.MESSAGE_RATE_LIMIT_PER_MIN || '30', 10);
const RATE_WINDOW_MS = 60 * 1000;

const checkMessageRateLimit = (participantId) => {
  const now = Date.now();
  const entry = messageRateMap.get(participantId);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    messageRateMap.set(participantId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MESSAGE_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
};

/**
 * Handle message-related socket events.
 */
const registerMessageSocket = (io, socket) => {
  /**
   * message:send — client sends a new message.
   * Server validates, persists, and broadcasts.
   */
  socket.on('message:send', async (data) => {
    try {
      // Rate limit check
      if (!checkMessageRateLimit(socket.participantId)) {
        socket.emit('error:rate_limit', { message: 'Message rate limit exceeded. Please slow down.' });
        return;
      }

      const { type, content, mediaId } = data;

      // Validate type
      if (!['text', 'image', 'video'].includes(type)) {
        socket.emit('error:invalid', { message: 'Invalid message type.' });
        return;
      }

      // For media messages, verify the media belongs to this session and is confirmed
      let verifiedMediaId = null;
      if (type === 'image' || type === 'video') {
        if (!mediaId) {
          socket.emit('error:invalid', { message: 'Media ID required for media messages.' });
          return;
        }
        const media = await Media.findOne({
          _id: mediaId,
          sessionId: socket.sessionId,
          confirmed: true,
          uploaderParticipantId: socket.participantId,
        });
        if (!media) {
          socket.emit('error:invalid', { message: 'Media not found or not authorized.' });
          return;
        }
        verifiedMediaId = media._id;
      }

      const message = await saveMessage({
        sessionId: socket.sessionId,
        senderParticipantId: socket.participantId,
        senderName: socket.participantName,
        type,
        content: content || '',
        mediaId: verifiedMediaId,
      });

      // Broadcast to all in session (including sender for consistency)
      const messagePayload = {
        messageId: message._id.toString(),
        sessionId: socket.sessionId,
        senderParticipantId: socket.participantId,
        senderName: socket.participantName,
        type: message.type,
        content: message.content,
        mediaId: verifiedMediaId ? verifiedMediaId.toString() : null,
        createdAt: message.createdAt.toISOString(),
        seenBy: [],
      };

      io.to(`session:${socket.sessionId}`).emit('message:new', messagePayload);
    } catch (err) {
      console.error('[MessageSocket] message:send error:', err.message);
      socket.emit('error:server', { message: 'Failed to send message.' });
    }
  });

  /**
   * message:seen — client reports they have seen up to a given messageId.
   * Server marks all messages up to that point as seen by this participant
   * and broadcasts the update to everyone in the session.
   */
  socket.on('message:seen', async ({ messageId } = {}) => {
    try {
      if (!messageId) return;

      // Find the target message to get its createdAt timestamp
      const targetMessage = await Message.findOne({
        _id: messageId,
        sessionId: socket.sessionId,
      }).lean();

      if (!targetMessage) return;

      // Mark all messages in this session up to (and including) the target as seen
      // Only add if not already in seenBy for this participant
      await Message.updateMany(
        {
          sessionId: socket.sessionId,
          createdAt: { $lte: targetMessage.createdAt },
          'seenBy.participantId': { $ne: socket.participantId },
          senderParticipantId: { $ne: socket.participantId }, // Don't mark own messages
        },
        {
          $push: {
            seenBy: {
              participantId: socket.participantId,
              temporaryName: socket.participantName,
              seenAt: new Date(),
            },
          },
        }
      );

      // Broadcast seen event to the whole session so all clients update
      io.to(`session:${socket.sessionId}`).emit('message:seen', {
        upToMessageId: messageId,
        participantId: socket.participantId,
        temporaryName: socket.participantName,
        seenAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[MessageSocket] message:seen error:', err.message);
    }
  });
};

module.exports = { registerMessageSocket };
