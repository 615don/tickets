import express from 'express';
import { body, query } from 'express-validator';
import {
  getAllClients,
  getClientById,
  getDeletionImpact,
  createClient,
  updateClient,
  deleteClient,
  matchDomain
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
    .isIn(['On Demand', 'Regular Maintenance'])
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

// GET /api/clients/match-domain?domain={domain} - Find clients by domain (must be before /:id)
router.get('/match-domain', [
  query('domain').matches(/^[a-z0-9.-]+\.[a-z]{2,}$/i).withMessage('Invalid domain format'),
  validate
], matchDomain);

// GET /api/clients/:id/deletion-impact - Get deletion impact counts (must be before /:id)
router.get('/:id/deletion-impact', getDeletionImpact);

// GET /api/clients/:id - Get client by ID
router.get('/:id', getClientById);

// POST /api/clients - Create new client
router.post('/', clientValidation, validate, createClient);

// PUT /api/clients/:id - Update client
router.put('/:id', clientValidation, validate, updateClient);

// DELETE /api/clients/:id - Delete client
router.delete('/:id', deleteClient);

export default router;
