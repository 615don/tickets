import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  validateRequired,
  validateContactBelongsToClient,
  validateNumericParams,
  validateEnum
} from '../middleware/validation.js';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  addTimeEntry
} from '../controllers/ticketController.js';

const router = express.Router();

// All ticket routes require authentication
router.get(
  '/',
  requireAuth,
  validateEnum('state', ['open', 'closed']),
  getAllTickets
);

router.get(
  '/:id',
  requireAuth,
  validateNumericParams(['id']),
  getTicketById
);

router.post(
  '/',
  requireAuth,
  validateRequired(['clientId', 'contactId', 'timeEntry.duration']),
  validateContactBelongsToClient,
  createTicket
);

router.put(
  '/:id',
  requireAuth,
  validateNumericParams(['id']),
  updateTicket
);

router.post(
  '/:id/time-entries',
  requireAuth,
  validateNumericParams(['id']),
  addTimeEntry
);

export default router;
