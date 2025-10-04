import express from 'express';
import {
  getInvoiceConfig,
  updateInvoiceConfig
} from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings/invoice-config - Get invoice configuration (requires auth)
router.get('/invoice-config', requireAuth, getInvoiceConfig);

// PUT /api/settings/invoice-config - Update invoice configuration (requires auth)
router.put('/invoice-config', requireAuth, updateInvoiceConfig);

export default router;
