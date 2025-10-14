import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import {
  generateBackup,
  restoreBackup,
  getGoogleDriveAuthUrl,
  handleGoogleDriveCallback,
  getGoogleDriveStatus,
  getBackupSettings,
  updateBackupSettings,
  triggerManual,
  listGoogleDriveBackups
} from '../controllers/backupController.js';
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

// Multer middleware for ZIP file upload (100MB limit)
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// POST /api/backup/generate - Generate and download backup ZIP file
router.post('/generate', requireAuth, backupRateLimiter, generateBackup);

// POST /api/backup/restore - Restore database from backup ZIP file
router.post('/restore', requireAuth, upload.single('backup'), restoreBackup);

// Google Drive OAuth routes
router.get('/google-drive/auth-url', requireAuth, getGoogleDriveAuthUrl);
router.get('/google-drive/callback', handleGoogleDriveCallback);
router.get('/google-drive/status', requireAuth, getGoogleDriveStatus);

// Backup settings routes
router.get('/settings', requireAuth, getBackupSettings);
router.put('/settings', requireAuth, updateBackupSettings);

// Manual backup trigger
router.post('/trigger-manual', requireAuth, backupRateLimiter, triggerManual);

// List backups in Google Drive
router.get('/list', requireAuth, listGoogleDriveBackups);

export default router;
