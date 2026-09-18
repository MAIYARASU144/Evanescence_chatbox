const Session = require('../models/Session');
const { getRecentMessages } = require('../services/messageService');
const { cleanupSession } = require('../services/cleanupService');

/**
 * Handle session-related socket events.
 */
const registerSessionSocket = (io, socket) => {
  /**
   * session:joined — sent to new participant after connecting.
   * Delivers current participants and recent message history.
   */
  const sendSessionState = async () => {
    try {
      const session = await Session.findById(socket.sessionId).lean();
      if (!session) return;

      // Send current participant list (safe fields only)
      const participants = session.participants.map((p) => ({
        participantId: p.participantId,
        temporaryName: p.temporaryName,
        role: p.role,
        status: p.status,
        joinedAt: p.joinedAt,
      }));

      // Send recent message history for reconnect
      const messages = await getRecentMessages(socket.sessionId);

      socket.emit('session:state', {
        participants,
        messages,
        expiresAt: session.expiresAt,
        maxParticipants: session.maxParticipants,
        status: session.status,
      });

      // Notify other participants that someone joined/reconnected
      socket.to(`session:${socket.sessionId}`).emit('participant:joined', {
        participantId: socket.participantId,
        temporaryName: socket.participantName,
        role: socket.participantRole,
      });
    } catch (err) {
      console.error('[SessionSocket] sendSessionState error:', err.message);
    }
  };

  sendSessionState();

  /**
   * session:destroy — creator requests session destruction.
   * Server verifies role — never trust the client.
   */
  socket.on('session:destroy', async () => {
    try {
      if (socket.participantRole !== 'creator') {
        socket.emit('error:unauthorized', { message: 'Only the creator can end the session.' });
        return;
      }

      console.log(`[SessionSocket] Creator ${socket.participantId} destroying session ${socket.sessionId}`);
      await cleanupSession(socket.sessionId, io);
    } catch (err) {
      console.error('[SessionSocket] session:destroy error:', err.message);
    }
  });

  /**
   * force:disconnect — sent to clients when session is destroyed.
   */
  socket.on('force:disconnect', () => {
    socket.disconnect(true);
  });
};

module.exports = { registerSessionSocket };
