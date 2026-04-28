const { body, validationResult } = require('express-validator');
const xss = require('xss-filters');

/**
 * Validates diary entry creation/update
 */
const validateEntry = [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 5000 }).withMessage('Content too long')
    .customSanitizer(value => xss.inHTMLData(value)), // XSS Protection
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title too long')
    .customSanitizer(value => xss.inHTMLData(value)),

  body('aiEnabled')
    .optional()
    .isBoolean().withMessage('aiEnabled must be a boolean'),

  body('mood')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Mood must be between 1 and 10'),

  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

/**
 * Validates media file types
 */
const validateMedia = (req, res, next) => {
  const { fileType } = req.body;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
  
  if (fileType && !allowedTypes.includes(fileType)) {
    return res.status(400).json({ error: 'Unsupported file type' });
  }
  next();
};

module.exports = {
  validateEntry,
  validateMedia
};
