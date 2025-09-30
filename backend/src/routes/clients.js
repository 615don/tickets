import express from 'express';
import { body } from 'express-validator';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import { validate } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All client routes require authentication
router.use(requireAuth);

// Validation rules
const clientValidation = [
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
  body('xeroCustomerId')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Xero customer ID must be less than 255 characters'),
  body('maintenanceContractType')
    .isIn(['Hourly', 'Monthly Retainer', 'Project-Based', 'None'])
    .withMessage('Invalid maintenance contract type'),
  body('domains')
    .optional()
    .isArray()
    .withMessage('Domains must be an array'),
  body('domains.*')
    .optional()
    .matches(/^[a-z0-9-]+\.[a-z]{2,}$/i)
    .withMessage('Invalid domain format')
];

// GET /api/clients - List all clients (with optional search)
router.get('/', getAllClients);

// GET /api/clients/:id - Get client by ID
router.get('/:id', getClientById);

// POST /api/clients - Create new client
router.post('/', clientValidation, validate, createClient);

// PUT /api/clients/:id - Update client
router.put('/:id', clientValidation, validate, updateClient);

// DELETE /api/clients/:id - Delete client
router.delete('/:id', deleteClient);

export default router;
