import express from 'express';
import { body } from 'express-validator';
import { register, login, logout, getCurrentUser } from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';
import { requireAuth, redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

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

// POST /api/auth/register - Register new user
router.post('/register', redirectIfAuthenticated, registerValidation, validate, register);

// POST /api/auth/login - Login
router.post('/login', redirectIfAuthenticated, loginValidation, validate, login);

// POST /api/auth/logout - Logout
router.post('/logout', requireAuth, logout);

// GET /api/auth/me - Get current user
router.get('/me', requireAuth, getCurrentUser);

export default router;
