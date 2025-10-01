import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createTicket } from '../controllers/ticketController.js';

const router = express.Router();

// All ticket routes require authentication
router.post('/', requireAuth, createTicket);

export default router;
