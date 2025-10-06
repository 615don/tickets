import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateMonthFormat } from '../middleware/validation.js';
import { previewInvoice, generateInvoices, getInvoiceHistory, deleteInvoiceLock, deleteInvoiceFromLock } from '../controllers/invoiceController.js';
import { body } from 'express-validator';

const router = express.Router();

// GET /api/invoices/history
router.get(
  '/history',
  requireAuth,
  getInvoiceHistory
);

// GET /api/invoices/preview?month=YYYY-MM
router.get(
  '/preview',
  requireAuth,
  validateMonthFormat,
  previewInvoice
);

// POST /api/invoices/generate
router.post(
  '/generate',
  requireAuth,
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
  generateInvoices
);

// DELETE /api/invoices/:id/invoice/:invoiceId - Delete individual invoice from lock
router.delete(
  '/:id/invoice/:invoiceId',
  requireAuth,
  deleteInvoiceFromLock
);

// DELETE /api/invoices/:id - Delete entire invoice lock
router.delete(
  '/:id',
  requireAuth,
  deleteInvoiceLock
);

export default router;
