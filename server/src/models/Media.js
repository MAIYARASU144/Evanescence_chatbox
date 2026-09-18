const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Session',
  },
  uploaderParticipantId: { type: String, required: true },

  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },

  // Original filename from the browser — for display only
  originalName: { type: String, required: true, maxlength: 255 },

  // Validated MIME type from the server
  mimeType: { type: String, required: true },

  // File size in bytes
  size: { type: Number, required: true },

  // The R2 object key — never the original filename
  storageKey: { type: String, required: true, unique: true },

  // Whether the upload has been confirmed (browser completed the PUT to R2)
  confirmed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

mediaSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('Media', mediaSchema);
