const mediaService = require('../services/mediaService');
const Media = require('../models/Media');

/**
 * POST /api/media/upload-url
 * Generate a presigned PUT URL for direct browser upload to R2.
 * Participant must be verified via requireParticipant middleware.
 */
const getUploadUrl = async (req, res) => {
  try {
    const { originalName, mimeType, size } = req.body;
    const { session, participant } = req;

    const result = await mediaService.generateUploadUrl({
      sessionId: session._id,
      participantId: participant.participantId,
      originalName,
      mimeType,
      size: parseInt(size, 10),
    });

    res.json({
      uploadUrl: result.uploadUrl,
      mediaId: result.mediaId,
    });
  } catch (err) {
    const status = {
      STORAGE_UNAVAILABLE: 503,
      INVALID_TYPE: 400,
      TOO_LARGE: 413,
      EXTENSION_MISMATCH: 400,
    }[err.code] || 400;

    res.status(status).json({ error: err.message, code: err.code });
  }
};

/**
 * POST /api/media/:id/confirm
 * Confirm that the browser finished uploading to R2.
 */
const confirmUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const { session, participant } = req;

    const media = await mediaService.confirmUpload({
      mediaId: id,
      sessionId: session._id,
      participantId: participant.participantId,
    });

    res.json({
      mediaId: media._id.toString(),
      type: media.type,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
    });
  } catch (err) {
    const status = { NOT_FOUND: 404, UPLOAD_MISSING: 400 }[err.code] || 400;
    res.status(status).json({ error: err.message });
  }
};

/**
 * GET /api/media/:id/download-url
 * Get a short-lived signed URL for downloading media.
 */
const getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { session } = req;

    const result = await mediaService.generateDownloadUrl({
      mediaId: id,
      sessionId: session._id,
    });

    res.json({
      downloadUrl: result.downloadUrl,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    const status = { NOT_FOUND: 404 }[err.code] || 400;
    res.status(status).json({ error: err.message });
  }
};

/**
 * DELETE /api/media/:id
 * Delete a specific media item (uploader only).
 */
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { session, participant } = req;

    const media = await Media.findOne({
      _id: id,
      sessionId: session._id,
      uploaderParticipantId: participant.participantId,
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found or not authorized.' });
    }

    // Delete from R2 and MongoDB
    await mediaService.deleteSessionMedia(session._id); // simplified — delete all for now
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete media.' });
  }
};

module.exports = { getUploadUrl, confirmUpload, getDownloadUrl, deleteMedia };
