import { TimeEntry } from '../models/TimeEntry.js';
import { Ticket } from '../models/Ticket.js';
import { InvoiceLock } from '../models/InvoiceLock.js';
import { parseTimeEntry } from '@tickets/shared';

// PUT /api/time-entries/:id - Update time entry
export const updateTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { workDate, duration, billable } = req.body;

    // Validate at least one field is provided
    if (workDate === undefined && duration === undefined && billable === undefined) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'At least one field (workDate, duration, billable) must be provided'
      });
    }

    // Get existing time entry
    const existing = await TimeEntry.findById(id);
    if (!existing) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Time entry with ID ${id} not found`
      });
    }

    // Check if already soft-deleted
    if (existing.deletedAt) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Time entry with ID ${id} not found`
      });
    }

    // Check if original month is locked
    const isOldMonthLocked = await InvoiceLock.isMonthLocked(existing.workDate);
    if (isOldMonthLocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot modify time entries for locked month'
      });
    }

    // Check if new month is locked (if workDate is changing)
    if (workDate && workDate !== existing.workDate) {
      const isNewMonthLocked = await InvoiceLock.isMonthLocked(workDate);
      if (isNewMonthLocked) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot modify time entries for locked month'
        });
      }
    }

    // Build updates object
    const updates = {};
    if (workDate !== undefined) updates.workDate = workDate;
    if (billable !== undefined) updates.billable = billable;

    // Parse duration if provided
    if (duration !== undefined) {
      const parseResult = parseTimeEntry(duration);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ValidationError',
          message: parseResult.error
        });
      }
      updates.duration = duration;
    }

    // Update time entry
    const timeEntry = await TimeEntry.update(id, updates);

    // Update ticket timestamp
    await Ticket.touch(existing.ticketId);

    res.status(200).json(timeEntry);
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};

// DELETE /api/time-entries/:id - Soft delete time entry
export const deleteTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing time entry
    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Time entry with ID ${id} not found`
      });
    }

    // Check if already soft-deleted
    if (timeEntry.deletedAt) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Time entry with ID ${id} not found`
      });
    }

    // Check if month is locked
    const isLocked = await InvoiceLock.isMonthLocked(timeEntry.workDate);
    if (isLocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete time entries for locked month'
      });
    }

    // Soft delete
    await TimeEntry.softDelete(id);

    // Update ticket timestamp
    await Ticket.touch(timeEntry.ticketId);

    res.status(200).json({
      message: 'Time entry deleted successfully',
      id: parseInt(id, 10)
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message
    });
  }
};
