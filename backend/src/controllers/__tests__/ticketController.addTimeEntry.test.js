import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { addTimeEntry } from '../ticketController.js';
import { Ticket } from '../../models/Ticket.js';
import { TimeEntry } from '../../models/TimeEntry.js';
import { InvoiceLock } from '../../models/InvoiceLock.js';
import { parseTimeEntry } from '../../shared/utils/parseTimeEntry.js';
import { getClient } from '../../config/database.js';

describe('addTimeEntry', () => {
  let req, res, mockTicketFindById, mockTimeEntryCreate, mockInvoiceLockIsMonthLocked, mockTicketTouch, mockGetClient;

  beforeEach(() => {
    // Mock request with params and body
    req = {
      params: { id: '123' },
      body: {
        workDate: '2025-10-12',
        duration: '2h',
        billable: true
      }
    };

    // Mock response with status and json methods
    res = {
      status: mock.fn((code) => {
        res.statusCode = code;
        return res;
      }),
      json: mock.fn((data) => {
        res.jsonData = data;
        return res;
      })
    };

    // Mock Ticket.findById
    mockTicketFindById = mock.method(Ticket, 'findById', async () => ({
      id: 123,
      clientId: 5,
      contactId: 10,
      description: 'Test ticket',
      state: 'open',
      createdAt: '2025-10-01T10:00:00Z',
      updatedAt: '2025-10-01T10:00:00Z'
    }));

    // Mock TimeEntry.create
    mockTimeEntryCreate = mock.method(TimeEntry, 'create', async (data) => ({
      id: 456,
      ticketId: parseInt(data.ticketId, 10), // Convert string to number like the real model does
      workDate: data.workDate,
      durationHours: 2.0,
      billable: data.billable,
      createdAt: '2025-10-12T14:30:00Z',
      updatedAt: '2025-10-12T14:30:00Z'
    }));

    // Mock InvoiceLock.isMonthLocked
    mockInvoiceLockIsMonthLocked = mock.method(InvoiceLock, 'isMonthLocked', async () => false);

    // Mock Ticket.touch
    mockTicketTouch = mock.method(Ticket, 'touch', async () => {});

    // Mock getClient
    mockGetClient = mock.method({ getClient }, 'getClient', async () => ({
      query: mock.fn(async () => ({ rows: [], rowCount: 1 }))
    }));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should create time entry successfully with workDate provided', async () => {
    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.id, 456);
    assert.strictEqual(res.jsonData.ticketId, 123);
    assert.strictEqual(res.jsonData.workDate, '2025-10-12');
    assert.strictEqual(res.jsonData.durationHours, 2.0);
    assert.strictEqual(res.jsonData.billable, true);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 1);
  });

  it('should default workDate to today when not provided', async () => {
    req.body = { duration: '2h', billable: true };
    const today = new Date().toISOString().split('T')[0];

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 1);
    const createArgs = mockTimeEntryCreate.mock.calls[0].arguments[0];
    assert.strictEqual(createArgs.workDate, today);
  });

  it('should default billable to true when not provided', async () => {
    req.body = { workDate: '2025-10-12', duration: '2h' };

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 1);
    const createArgs = mockTimeEntryCreate.mock.calls[0].arguments[0];
    assert.strictEqual(createArgs.billable, true);
  });

  it('should return 404 when ticket not found', async () => {
    mockTicketFindById.mock.mockImplementationOnce(async () => null);

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.jsonData.error, 'NotFound');
    assert.match(res.jsonData.message, /Ticket with ID 123 not found/);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 0);
  });

  it('should return 400 when ticket is closed', async () => {
    mockTicketFindById.mock.mockImplementationOnce(async () => ({
      id: 123,
      state: 'closed',
      clientId: 5,
      contactId: 10
    }));

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.error, 'ValidationError');
    assert.match(res.jsonData.message, /Cannot add time to closed ticket/);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 0);
  });

  it('should return 400 when duration is missing', async () => {
    req.body = { workDate: '2025-10-12', billable: true };

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.error, 'ValidationError');
    assert.match(res.jsonData.message, /duration is required/);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 0);
  });

  it('should return 400 when duration format is invalid', async () => {
    req.body = { workDate: '2025-10-12', duration: 'invalid', billable: true };

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.error, 'ValidationError');
    assert.ok(res.jsonData.message);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 0);
  });

  it('should return 403 when month is locked', async () => {
    mockInvoiceLockIsMonthLocked.mock.mockImplementationOnce(async () => true);

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonData.error, 'Forbidden');
    assert.match(res.jsonData.message, /Cannot add time entries for locked month/);
    assert.strictEqual(mockTimeEntryCreate.mock.calls.length, 0);
  });

  it('should append notes to ticket when notes provided', async () => {
    req.body = {
      workDate: '2025-10-12',
      duration: '2h',
      billable: true,
      notes: 'Follow-up call completed'
    };

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.id, 456);
    // When notes provided, Ticket.touch should not be called (notes update handles timestamp)
    assert.strictEqual(mockTicketTouch.mock.calls.length, 0);
  });

  it('should update ticket timestamp when notes not provided', async () => {
    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(mockTicketTouch.mock.calls.length, 1);
    assert.strictEqual(mockTicketTouch.mock.calls[0].arguments[0], '123');
  });

  it('should return 500 on database error', async () => {
    mockTimeEntryCreate.mock.mockImplementationOnce(async () => {
      throw new Error('Database connection failed');
    });

    await addTimeEntry(req, res);

    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.jsonData.error, 'InternalServerError');
    assert.match(res.jsonData.message, /Database connection failed/);
  });
});
