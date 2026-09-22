const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  temporaryName: { type: String, required: true, maxlength: 50 },
  role: { type: String, enum: ['creator', 'participant'], required: true },
  joinedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['online', 'offline'], default: 'online' },
  disconnectedAt: { type: Date, default: null },
  participantToken: { type: String, required: true }, // hashed token for auth
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  creatorParticipantId: { type: String, required: true },

  maxParticipants: { type: Number, required: true, min: 2, max: 50 },

  participants: [participantSchema],

  status: {
    type: String,
    enum: ['active', 'expired', 'destroying', 'destroyed'],
    default: 'active',
    index: true,
  },

  pinEnabled: { type: Boolean, default: false },
  pinHash: { type: String, default: null },

  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  destroyedAt: { type: Date, default: null },

  // Tracks if cleanup already started to prevent double-runs
  cleanupStartedAt: { type: Date, default: null },
});

// Compound index for efficient lookups of active sessions by token
sessionSchema.index({ token: 1, status: 1 });

// Helper: count currently active participants
sessionSchema.virtual('activeParticipantCount').get(function () {
  return this.participants.filter((p) => p.status === 'online').length;
});

// Helper: total joined participants (online + offline in grace period)
sessionSchema.virtual('totalParticipantCount').get(function () {
  return this.participants.length;
});

module.exports = mongoose.model('Session', sessionSchema);
