const express = require('express');
const router = express.Router();

const { getUploadUrl, confirmUpload, getDownloadUrl, deleteMedia } = require('../controllers/mediaController');
const { requireParticipant } = require('../middleware/auth');
const { uploadLimiter, downloadLimiter } = require('../middleware/rateLimiter');
const { uploadUrlRules, validate } = require('../middleware/uploadValidation');

// All media routes require a valid participant
// The token is passed in the body for media routes since there's no :token param
// We override requireParticipant to look in body.sessionToken
const requireParticipantFromBody = async (req, res, next) => {
  // Inject token into params for reuse of requireParticipant
  req.params.token = req.body.sessionToken || req.query.sessionToken;
  return requireParticipant(req, res, next);
};

// Generate presigned upload URL
router.post(
  '/upload-url',
  uploadLimiter,
  requireParticipantFromBody,
  uploadUrlRules,
  validate,
  getUploadUrl
);

// Confirm upload complete
router.post(
  '/:id/confirm',
  requireParticipantFromBody,
  confirmUpload
);

// Get presigned download URL
router.get(
  '/:id/download-url',
  downloadLimiter,
  (req, res, next) => {
    req.params.token = req.query.sessionToken;
    next();
  },
  requireParticipant,
  getDownloadUrl
);

// Delete a media item
router.delete('/:id', requireParticipantFromBody, deleteMedia);

module.exports = router;
