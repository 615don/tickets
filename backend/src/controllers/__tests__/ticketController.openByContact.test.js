import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { getOpenTicketsByContact } from '../ticketController.js';
import { Ticket } from '../../models/Ticket.js';

describe('getOpenTicketsByContact', () => {
  let req, res, mockTicketFindOpenByContact;

  beforeEach(() => {
    // Mock request with query params
    req = {
      query: { contactId: '42' }
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

    // Mock Ticket.findOpenByContact method
    mockTicketFindOpenByContact = mock.method(Ticket, 'findOpenByContact', async () => []);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should return open tickets for valid contactId', async () => {
    const mockTickets = [
      { id: 10, description: 'Email configuration help', updatedAt: '2025-10-12T10:00:00Z' },
      { id: 8, description: 'Password reset assistance', updatedAt: '2025-10-11T15:30:00Z' },
      { id: 5, description: 'Printer setup', updatedAt: '2025-10-10T09:00:00Z' }
    ];
    mockTicketFindOpenByContact.mock.mockImplementationOnce(async () => mockTickets);

    await getOpenTicketsByContact(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.jsonData, mockTickets);
    assert.strictEqual(mockTicketFindOpenByContact.mock.calls.length, 1);
    assert.strictEqual(mockTicketFindOpenByContact.mock.calls[0].arguments[0], 42);
  });

  it('should return empty array when contact has no open tickets', async () => {
    mockTicketFindOpenByContact.mock.mockImplementationOnce(async () => []);

    await getOpenTicketsByContact(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.jsonData, []);
  });

  it('should return 400 when contactId parameter is missing', async () => {
    req.query = {}; // No contactId

    await getOpenTicketsByContact(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.error, 'BadRequest');
    assert.match(res.jsonData.message, /contactId.*required/i);
  });

  it('should return 400 when contactId is not a valid integer', async () => {
    req.query.contactId = 'invalid';

    await getOpenTicketsByContact(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.error, 'BadRequest');
    assert.match(res.jsonData.message, /positive integer/i);
  });

  it('should return 400 when contactId is negative', async () => {
    req.query.contactId = '-5';

    await getOpenTicketsByContact(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.error, 'BadRequest');
  });

  it('should return 500 when database error occurs', async () => {
    mockTicketFindOpenByContact.mock.mockImplementationOnce(async () => {
      throw new Error('Database connection failed');
    });

    await getOpenTicketsByContact(req, res);

    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.jsonData.error, 'InternalServerError');
    assert.match(res.jsonData.message, /Database connection failed/);
  });
});
