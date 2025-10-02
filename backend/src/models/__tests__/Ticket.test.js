import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Ticket } from '../Ticket.js';

describe('Ticket.canReopen()', () => {
  it('should return true for ticket closed exactly 7 days ago', () => {
    const closedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Exactly 7 days
    assert.strictEqual(Ticket.canReopen(closedAt), true);
  });

  it('should return false for ticket closed 7 days + 1 second ago', () => {
    const closedAt = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000 + 1000)); // 7 days + 1 sec
    assert.strictEqual(Ticket.canReopen(closedAt), false);
  });

  it('should return false when closedAt is null', () => {
    assert.strictEqual(Ticket.canReopen(null), false);
  });

  it('should return false when closedAt is undefined', () => {
    assert.strictEqual(Ticket.canReopen(undefined), false);
  });

  it('should return true for ticket closed 3 days ago', () => {
    const closedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    assert.strictEqual(Ticket.canReopen(closedAt), true);
  });

  it('should return false for ticket closed 30 days ago', () => {
    const closedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    assert.strictEqual(Ticket.canReopen(closedAt), false);
  });

  it('should return true for ticket closed 6.9 days ago', () => {
    const closedAt = new Date(Date.now() - 6.9 * 24 * 60 * 60 * 1000);
    assert.strictEqual(Ticket.canReopen(closedAt), true);
  });

  it('should return false for ticket closed 7.1 days ago', () => {
    const closedAt = new Date(Date.now() - 7.1 * 24 * 60 * 60 * 1000);
    assert.strictEqual(Ticket.canReopen(closedAt), false);
  });
});
