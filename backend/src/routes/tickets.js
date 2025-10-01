import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  addTimeEntry
} from '../controllers/ticketController.js';

const router = express.Router();

// All ticket routes require authentication
router.get('/', requireAuth, getAllTickets);
router.get('/:id', requireAuth, getTicketById);
router.post('/', requireAuth, createTicket);
router.put('/:id', requireAuth, updateTicket);
router.post('/:id/time-entries', requireAuth, addTimeEntry);

export default router;
