import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Ticket } from '../../models/Ticket.js';
import { Contact } from '../../models/Contact.js';
import { Client } from '../../models/Client.js';
import { query } from '../../config/database.js';

describe('Ticket Close/Re-open Logic - Integration Tests', () => {
  let testClientId;
  let testContactId;
  let testTicketId;

  before(async () => {
    // Create test client
    const client = await Client.create({
      companyName: 'Test Company for Ticket Close/Reopen',
      maintenanceContractType: 'Hourly',
      domains: ['test-close-reopen.com']
    });
    testClientId = client.id;

    // Create test contact
    const contact = await Contact.create({
      clientId: testClientId,
      name: 'Test Contact',
      email: 'test-close-reopen@test.com'
    });
    testContactId = contact.id;
  });

  after(async () => {
    // Clean up test data
    if (testClientId) {
      await query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
  });

  describe('Closing tickets', () => {
    it('should set closed_at when closing an open ticket (AC1)', async () => {
      // Create open ticket
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for closing',
        state: 'open'
      });

      assert.strictEqual(ticket.state, 'open');
      assert.strictEqual(ticket.closedAt, null);
      assert.strictEqual(ticket.canReopen, null);

      // Close the ticket
      const closedTicket = await Ticket.close(ticket.id);

      assert.strictEqual(closedTicket.state, 'closed');
      assert.notStrictEqual(closedTicket.closedAt, null);
      assert.strictEqual(closedTicket.canReopen, true);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should be idempotent when closing already-closed ticket (AC5)', async () => {
      // Create and close ticket
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for idempotent closing',
        state: 'open'
      });

      const firstClose = await Ticket.close(ticket.id);
      const firstClosedAt = firstClose.closedAt;

      // Wait a moment to ensure timestamp would be different
      await new Promise(resolve => setTimeout(resolve, 10));

      // Close again (should be idempotent)
      const secondClose = await Ticket.close(ticket.id);

      assert.strictEqual(secondClose.state, 'closed');
      assert.notStrictEqual(secondClose.closedAt, null);
      // Timestamp should be updated
      assert.notStrictEqual(secondClose.closedAt, firstClosedAt);

      // Cleanup
      await Ticket.delete(ticket.id);
    });
  });

  describe('Re-opening tickets', () => {
    it('should re-open ticket within 7 days and clear closed_at (AC2, AC4)', async () => {
      // Create and close ticket
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for reopening',
        state: 'open'
      });

      const closedTicket = await Ticket.close(ticket.id);
      assert.strictEqual(closedTicket.state, 'closed');
      assert.notStrictEqual(closedTicket.closedAt, null);

      // Re-open the ticket
      const reopenedTicket = await Ticket.reopen(ticket.id);

      assert.strictEqual(reopenedTicket.state, 'open');
      assert.strictEqual(reopenedTicket.closedAt, null);
      assert.strictEqual(reopenedTicket.canReopen, null);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should fail to re-open ticket after 7 days (AC3)', async () => {
      // Create ticket
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for 7-day validation',
        state: 'open'
      });

      // Close ticket and manually set closed_at to 8 days ago
      await Ticket.close(ticket.id);
      await query(
        `UPDATE tickets SET closed_at = NOW() - INTERVAL '8 days' WHERE id = $1`,
        [ticket.id]
      );

      // Verify canReopen returns false
      const oldTicket = await Ticket.findById(ticket.id);
      assert.strictEqual(Ticket.canReopen(oldTicket.closedAt), false);
      assert.strictEqual(oldTicket.canReopen, false);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should allow re-opening at exactly 7 days boundary', async () => {
      // Create ticket
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for 7-day boundary',
        state: 'open'
      });

      // Close ticket and set closed_at to exactly 7 days ago
      await Ticket.close(ticket.id);
      await query(
        `UPDATE tickets SET closed_at = NOW() - INTERVAL '7 days' WHERE id = $1`,
        [ticket.id]
      );

      // Verify canReopen returns true
      const boundaryTicket = await Ticket.findById(ticket.id);
      assert.strictEqual(Ticket.canReopen(boundaryTicket.closedAt), true);
      assert.strictEqual(boundaryTicket.canReopen, true);

      // Should be able to reopen
      const reopenedTicket = await Ticket.reopen(ticket.id);
      assert.strictEqual(reopenedTicket.state, 'open');
      assert.strictEqual(reopenedTicket.closedAt, null);

      // Cleanup
      await Ticket.delete(ticket.id);
    });
  });

  describe('canReopen flag in responses (AC6)', () => {
    it('should return canReopen=true for closed ticket within 7 days', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test canReopen flag - within 7 days',
        state: 'open'
      });

      const closedTicket = await Ticket.close(ticket.id);

      assert.strictEqual(closedTicket.state, 'closed');
      assert.strictEqual(closedTicket.canReopen, true);

      // Verify in findById as well
      const retrievedTicket = await Ticket.findById(ticket.id);
      assert.strictEqual(retrievedTicket.canReopen, true);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should return canReopen=false for closed ticket after 7 days', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test canReopen flag - after 7 days',
        state: 'open'
      });

      await Ticket.close(ticket.id);
      await query(
        `UPDATE tickets SET closed_at = NOW() - INTERVAL '8 days' WHERE id = $1`,
        [ticket.id]
      );

      const oldTicket = await Ticket.findById(ticket.id);
      assert.strictEqual(oldTicket.state, 'closed');
      assert.strictEqual(oldTicket.canReopen, false);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should return canReopen=null for open ticket', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test canReopen flag - open ticket',
        state: 'open'
      });

      assert.strictEqual(ticket.state, 'open');
      assert.strictEqual(ticket.canReopen, null);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should include canReopen flag in findAll results', async () => {
      // Create multiple tickets with different states
      const openTicket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Open ticket for findAll test',
        state: 'open'
      });

      const closedTicket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Closed ticket for findAll test',
        state: 'open'
      });
      await Ticket.close(closedTicket.id);

      // Get all tickets
      const allTickets = await Ticket.findAll({ clientId: testClientId });

      const openResult = allTickets.find(t => t.id === openTicket.id);
      const closedResult = allTickets.find(t => t.id === closedTicket.id);

      assert.strictEqual(openResult.canReopen, null);
      assert.strictEqual(closedResult.canReopen, true);

      // Cleanup
      await Ticket.delete(openTicket.id);
      await Ticket.delete(closedTicket.id);
    });
  });
});
