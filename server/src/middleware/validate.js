const { body, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Run after validation chains — returns 400 with all errors if any failed.
 * Usage: router.post('/register', registerRules, validate, handler)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Validation failed',
      400,
      errors.array().map((e) => e.msg)
    );
  }
  next();
};

// ── Auth validation rules ─────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name cannot exceed 60 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
];

const resetPasswordRules = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

// ── Listing validation rules ──────────────────────────────────────────────────

const listingRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('bedrooms')
    .isInt({ min: 0 }).withMessage('Bedrooms must be 0 or more (0 = studio)'),
  body('petsAllowed')
    .isBoolean().withMessage('Pet policy is required (true/false)'),
  body('utilitiesIncluded')
    .isBoolean().withMessage('Utilities policy is required (true/false)'),
  body('address')
    .trim().notEmpty().withMessage('Address is required'),
  body('city')
    .trim().notEmpty().withMessage('City is required'),
  body('state')
    .trim().notEmpty().withMessage('State is required')
    .isLength({ min: 2, max: 2 }).withMessage('Use 2-letter state code (e.g. FL)'),
  body('university')
    .trim().notEmpty().withMessage('University name is required'),
];

const listingStatusRules = [
  body('status')
    .isIn(['active', 'pending', 'offMarket'])
    .withMessage('Status must be active, pending, or offMarket'),
];

// ── Message validation rules ──────────────────────────────────────────────────

const messageRules = [
  body('body')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  listingRules,
  listingStatusRules,
  messageRules,
};
