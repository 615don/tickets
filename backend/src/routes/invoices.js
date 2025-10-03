import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateMonthFormat } from '../middleware/validation.js';
import { previewInvoice } from '../controllers/invoiceController.js';

const router = express.Router();

// GET /api/invoices/preview?month=YYYY-MM
router.get(
  '/preview',
  requireAuth,
  validateMonthFormat,
  previewInvoice
);

export default router;
