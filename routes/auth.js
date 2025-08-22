const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  verifyEmail
} = require('../controllers/authController');
const { authenticate, rateLimit } = require('../middleware/auth');

// Validation schemas
const registerValidation = [
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['admin', 'vendor', 'customer', 'delivery'])
    .withMessage('Invalid role specified'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('postal_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Postal code must be less than 20 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('postal_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Postal code must be less than 20 characters'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender specified')
];

const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes (no authentication required)
router.post('/register', rateLimit(5, 15 * 60 * 1000), registerValidation, register);
router.post('/login', rateLimit(10, 15 * 60 * 1000), loginValidation, login);
router.post('/forgot-password', rateLimit(3, 15 * 60 * 1000), forgotPasswordValidation, forgotPassword);
router.post('/reset-password', rateLimit(3, 15 * 60 * 1000), resetPasswordValidation, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (authentication required)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, rateLimit(10, 15 * 60 * 1000), updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, rateLimit(5, 15 * 60 * 1000), changePasswordValidation, changePassword);
router.post('/logout', authenticate, logout);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
