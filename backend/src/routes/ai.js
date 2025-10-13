import express from 'express';
import { summarizeEmailThread } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/summarize-email - Summarize email thread (requires auth)
router.post('/summarize-email', requireAuth, summarizeEmailThread);

export default router;
