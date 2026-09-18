const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Session',
  },
  senderParticipantId: { type: String, required: true },
  senderName: { type: String, required: true, maxlength: 50 },

  type: {
    type: String,
    enum: ['text', 'image', 'video', 'system'],
    required: true,
  },

  // For text messages: the message content
  // For media messages: optional caption
  content: { type: String, maxlength: 2000, default: '' },

  // For media messages: reference to the Media document
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    default: null,
  },

  // Server-generated timestamp — never trust client timestamps
  createdAt: { type: Date, default: Date.now, index: true },
});

// Index for fetching session messages in order
messageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
