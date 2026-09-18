const { body, param, validationResult } = require('express-validator');

/**
 * Run validation rules and return 400 on failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const sessionCreateRules = [
  body('temporaryName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters.'),
  body('maxParticipants')
    .isInt({ min: 2, max: 50 })
    .withMessage('Maximum participants must be between 2 and 50.'),
  body('expiresInHours')
    .isFloat({ min: 0.016, max: 48 })
    .withMessage('Session duration must be between 1 minute and 48 hours.'),
  body('pin')
    .optional({ nullable: true })
    .isLength({ min: 4, max: 20 })
    .withMessage('PIN must be between 4 and 20 characters.'),
];

const sessionJoinRules = [
  param('token')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid session token.'),
  body('temporaryName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters.'),
  body('pin')
    .optional({ nullable: true })
    .isLength({ min: 1, max: 20 })
    .withMessage('Invalid PIN format.'),
];

const uploadUrlRules = [
  body('originalName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Invalid file name.'),
  body('mimeType')
    .trim()
    .matches(/^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm|ogg|quicktime))$/)
    .withMessage('Unsupported file type.'),
  body('size')
    .isInt({ min: 1 })
    .withMessage('Invalid file size.'),
];

module.exports = {
  validate,
  sessionCreateRules,
  sessionJoinRules,
  uploadUrlRules,
};
