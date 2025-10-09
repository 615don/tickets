import express from 'express';
import { body, query } from 'express-validator';
import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  matchEmail
} from '../controllers/contactController.js';
import { validate } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All contact routes require authentication
router.use(requireAuth);

// Validation rules
const contactValidation = [
  body('clientId')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

// GET /api/contacts - List all contacts (with optional filters)
router.get('/', getAllContacts);

// GET /api/contacts/match-email - Match contacts by email address
router.get('/match-email', [
  query('email').isEmail().normalizeEmail(),
  validate
], matchEmail);

// GET /api/contacts/:id - Get contact by ID
router.get('/:id', getContactById);

// POST /api/contacts - Create new contact
router.post('/', contactValidation, validate, createContact);

// PUT /api/contacts/:id - Update contact
router.put('/:id', contactValidation, validate, updateContact);

// DELETE /api/contacts/:id - Soft delete contact
router.delete('/:id', deleteContact);

export default router;
