import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  updateTimeEntry,
  deleteTimeEntry
} from '../controllers/timeEntryController.js';

const router = express.Router();

// All time entry routes require authentication
router.put('/:id', requireAuth, updateTimeEntry);
router.delete('/:id', requireAuth, deleteTimeEntry);

export default router;
