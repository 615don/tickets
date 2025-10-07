import express from 'express';
import rateLimit from 'express-rate-limit';
import { generateBackup } from '../controllers/backupController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for backup generation - 1 backup per 5 minutes per user
const backupRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1, // 1 request per window
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many backup requests. Please wait 5 minutes before requesting another backup.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use user session ID as key to limit per-user (requires authentication)
  keyGenerator: (req) => {
    // Always use session user ID since requireAuth middleware ensures it exists
    return `user:${req.session.userId}`;
  }
});

// POST /api/backup/generate - Generate and download backup ZIP file
router.post('/generate', requireAuth, backupRateLimiter, generateBackup);

export default router;
