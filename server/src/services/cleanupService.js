const cron = require('node-cron');
const Session = require('../models/Session');
const { deleteSessionMessages } = require('./messageService');
const { deleteSessionMedia } = require('./mediaService');

// In-memory set to track sessions currently being cleaned up
// Prevents double-cleanup even within a single process
const cleaningUp = new Set();

/**
 * Core cleanup function — destroys a session and all associated data.
 * IDEMPOTENT: Safe to call multiple times for the same session.
 * 
 * @param {string|ObjectId} sessionId 
 * @param {SocketIO.Server} io - Pass io to emit events; optional for background jobs
 */
const cleanupSession = async (sessionId, io = null) => {
  const idStr = sessionId.toString();

  // Prevent concurrent cleanup of the same session
  if (cleaningUp.has(idStr)) {
    console.log(`[Cleanup] Session ${idStr} already being cleaned up, skipping.`);
    return;
  }

  cleaningUp.add(idStr);

  try {
    // Step 1: Atomically transition to 'destroying' — prevents new joins
    const session = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        status: { $in: ['active', 'expired'] },
      },
      {
        status: 'destroying',
        cleanupStartedAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      // Either already being destroyed or doesn't exist — idempotent exit
      const existing = await Session.findById(sessionId);
      if (!existing || existing.status === 'destroyed') {
        console.log(`[Cleanup] Session ${idStr} already destroyed.`);
        return;
      }
      if (existing.status === 'destroying') {
        console.log(`[Cleanup] Session ${idStr} already in destroying state.`);
        return;
      }
      console.log(`[Cleanup] Session ${idStr} not found or not in cleanable state.`);
      return;
    }

    console.log(`[Cleanup] Starting cleanup for session ${idStr}`);

    // Step 2: Notify connected clients before disconnecting them
    if (io) {
      io.to(`session:${idStr}`).emit('session:destroyed', {
        message: 'This temporary chat has ended. All server-side data has been deleted.',
        destroyedAt: new Date().toISOString(),
      });
    }

    // Step 3: Disconnect all sockets in the room
    if (io) {
      try {
        const sockets = await io.in(`session:${idStr}`).fetchSockets();
        for (const socket of sockets) {
          socket.leave(`session:${idStr}`);
          socket.emit('force:disconnect');
        }
      } catch (err) {
        console.error(`[Cleanup] Error disconnecting sockets for ${idStr}:`, err.message);
      }
    }

    // Step 4: Delete all media from R2 and MongoDB
    await deleteSessionMedia(sessionId);

    // Step 5: Delete all messages
    await deleteSessionMessages(sessionId);

    // Step 6: Mark session as destroyed (don't delete the record — keep it to reject future joins)
    await Session.findByIdAndUpdate(sessionId, {
      status: 'destroyed',
      destroyedAt: new Date(),
      participants: [], // clear participant data
      pinHash: null,    // clear sensitive data
    });

    console.log(`[Cleanup] Session ${idStr} fully destroyed.`);
  } catch (err) {
    console.error(`[Cleanup] Error during cleanup of session ${idStr}:`, err.message);
    // Don't re-throw — cleanup should not crash the server
  } finally {
    cleaningUp.delete(idStr);
  }
};

/**
 * Background cleanup job — runs on a schedule to catch expired sessions.
 * This is a safety net for sessions that weren't manually ended.
 */
const startBackgroundCleanup = (io = null) => {
  const intervalMs = parseInt(process.env.CLEANUP_INTERVAL_MS || '60000', 10);
  const intervalCron = Math.max(1, Math.floor(intervalMs / 60000)); // convert ms to minutes

  // Use node-cron with a 1-minute minimum
  const cronExpression = `*/${intervalCron} * * * *`;

  cron.schedule(cronExpression, async () => {
    try {
      const now = new Date();

      // Find all active sessions that have expired
      const expiredSessions = await Session.find({
        status: 'active',
        expiresAt: { $lte: now },
      }).select('_id').lean();

      if (expiredSessions.length > 0) {
        console.log(`[Cleanup] Background job found ${expiredSessions.length} expired session(s).`);

        // Clean up each session (sequential to avoid hammering R2)
        for (const session of expiredSessions) {
          await cleanupSession(session._id, io);
        }
      }
    } catch (err) {
      console.error('[Cleanup] Background cleanup job error:', err.message);
    }
  });

  console.log(`[Cleanup] Background cleanup job scheduled (every ${intervalCron} minute(s)).`);
};

module.exports = { cleanupSession, startBackgroundCleanup };
