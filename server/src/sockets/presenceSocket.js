const Session = require('../models/Session');
const { updateParticipantStatus, removeParticipant } = require('../services/sessionService');

const GRACE_PERIOD_MS = parseInt(process.env.RECONNECT_GRACE_PERIOD_MS || '30000', 10);

// Maps participantId -> grace period timeout handle
const gracePeriodTimers = new Map();

/**
 * Handle presence and typing-related socket events.
 */
const registerPresenceSocket = (io, socket) => {
  /**
   * typing:start — participant started typing.
   * Broadcast to everyone else in the room.
   */
  socket.on('typing:start', () => {
    socket.to(`session:${socket.sessionId}`).emit('typing:start', {
      participantId: socket.participantId,
      temporaryName: socket.participantName,
    });
  });

  /**
   * typing:stop — participant stopped typing.
   */
  socket.on('typing:stop', () => {
    socket.to(`session:${socket.sessionId}`).emit('typing:stop', {
      participantId: socket.participantId,
    });
  });

  /**
   * Handle disconnect — start grace period before removing participant.
   * A refresh or temporary network drop should NOT immediately evict the participant.
   */
  socket.on('disconnect', async (reason) => {
    console.log(`[Presence] Socket ${socket.id} disconnected: ${reason} | Participant: ${socket.participantId}`);

    try {
      // Cancel any existing grace timer for this participant (e.g., from a previous disconnect)
      clearGraceTimer(socket.participantId);

      // Mark participant as offline
      await updateParticipantStatus(socket.sessionId, socket.participantId, 'offline');

      // Stop typing indicator if they were typing
      socket.to(`session:${socket.sessionId}`).emit('typing:stop', {
        participantId: socket.participantId,
      });

      // Notify other participants of offline status
      io.to(`session:${socket.sessionId}`).emit('presence:update', {
        participantId: socket.participantId,
        status: 'offline',
        temporaryName: socket.participantName,
      });

      // Start grace period — if they don't reconnect within the window, remove them
      const timer = setTimeout(async () => {
        try {
          gracePeriodTimers.delete(socket.participantId);

          // Check if they reconnected (status would be 'online' again)
          const session = await Session.findById(socket.sessionId);
          if (!session) return;

          const participant = session.participants.find(
            (p) => p.participantId === socket.participantId
          );

          // If still offline after grace period, remove from session
          if (participant && participant.status === 'offline') {
            await removeParticipant(socket.sessionId, socket.participantId);

            io.to(`session:${socket.sessionId}`).emit('participant:left', {
              participantId: socket.participantId,
              temporaryName: socket.participantName,
            });

            console.log(
              `[Presence] Participant ${socket.participantId} removed after grace period.`
            );
          }
        } catch (err) {
          console.error('[Presence] Grace period timer error:', err.message);
        }
      }, GRACE_PERIOD_MS);

      gracePeriodTimers.set(socket.participantId, timer);
    } catch (err) {
      console.error('[Presence] disconnect handler error:', err.message);
    }
  });

  /**
   * When a participant reconnects, cancel their grace period timer
   * and restore online status.
   * This is triggered by the session:state emission on new socket connection
   * for the same participant.
   */
  socket.on('presence:reconnected', async () => {
    clearGraceTimer(socket.participantId);
    await updateParticipantStatus(socket.sessionId, socket.participantId, 'online');

    io.to(`session:${socket.sessionId}`).emit('presence:update', {
      participantId: socket.participantId,
      status: 'online',
      temporaryName: socket.participantName,
    });
  });
};

const clearGraceTimer = (participantId) => {
  const timer = gracePeriodTimers.get(participantId);
  if (timer) {
    clearTimeout(timer);
    gracePeriodTimers.delete(participantId);
  }
};

module.exports = { registerPresenceSocket };
