import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getCurrentUser, updateProfile, updatePassword } from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';
import { requireAuth, redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

/**
 * Login Rate Limiter
 * Protects against brute force attacks while allowing reasonable retry attempts for typos
 * 10 attempts per 15 minutes - balanced security without frustrating legitimate users
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: 'Too many attempts',
    message: 'Too many login attempts, please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Registration Rate Limiter
 * Prevents spam account creation while allowing legitimate registrations
 * 5 attempts per 15 minutes - stricter to prevent abuse
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many attempts',
    message: 'Too many registration attempts, please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Profile Update Rate Limiter
 * For authenticated users making legitimate profile/password changes
 * 15 attempts per 15 minutes - more generous since users are authenticated
 * and may need multiple tries to update correctly
 */
const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  message: {
    error: 'Too many attempts',
    message: 'Too many profile update attempts, please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords must match')
];

// POST /api/auth/register - Register new user
router.post('/register', registerLimiter, redirectIfAuthenticated, registerValidation, validate, register);

// POST /api/auth/login - Login
router.post('/login', loginLimiter, redirectIfAuthenticated, loginValidation, validate, login);

// POST /api/auth/logout - Logout
router.post('/logout', requireAuth, logout);

// GET /api/auth/me - Get current user
router.get('/me', requireAuth, getCurrentUser);

// PUT /api/auth/profile - Update user email
router.put('/profile', profileUpdateLimiter, requireAuth, updateProfileValidation, validate, updateProfile);

// PUT /api/auth/password - Update user password
router.put('/password', profileUpdateLimiter, requireAuth, updatePasswordValidation, validate, updatePassword);

export default router;
