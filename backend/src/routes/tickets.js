import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createTicket,
  getAllTickets,
  getTicketById
} from '../controllers/ticketController.js';

const router = express.Router();

// All ticket routes require authentication
router.get('/', requireAuth, getAllTickets);
router.get('/:id', requireAuth, getTicketById);
router.post('/', requireAuth, createTicket);

export default router;
