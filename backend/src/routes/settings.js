import express from 'express';
import {
  getInvoiceConfig,
  updateInvoiceConfig,
  getAiSettings,
  updateAiSettings,
  testAiConnection
} from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings/invoice-config - Get invoice configuration (requires auth)
router.get('/invoice-config', requireAuth, getInvoiceConfig);

// PUT /api/settings/invoice-config - Update invoice configuration (requires auth)
router.put('/invoice-config', requireAuth, updateInvoiceConfig);

// GET /api/settings/ai - Get AI settings (requires auth)
router.get('/ai', requireAuth, getAiSettings);

// POST /api/settings/ai - Update AI settings (requires auth)
router.post('/ai', requireAuth, updateAiSettings);

// POST /api/settings/ai/test-connection - Test OpenAI connection (requires auth)
router.post('/ai/test-connection', requireAuth, testAiConnection);

export default router;
