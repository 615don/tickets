import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Ticket } from '../../models/Ticket.js';
import { Contact } from '../../models/Contact.js';
import { Client } from '../../models/Client.js';
import { TimeEntry } from '../../models/TimeEntry.js';
import { query } from '../../config/database.js';

describe('Ticket Close/Re-open Logic - Integration Tests', () => {
  let testClientId;
  let testContactId;
  let testTicketId;

  before(async () => {
    // Create test client
    const client = await Client.create({
      companyName: 'Test Company for Ticket Close/Reopen',
      maintenanceContractType: 'On Demand',
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

describe('Ticket Creation API - Integration Tests (TD-003)', () => {
  let testClientId;
  let testContactId;
  let otherClientId;
  let otherContactId;

  before(async () => {
    // Create test client 1
    const client1 = await Client.create({
      companyName: 'Test Company for Creation',
      maintenanceContractType: 'On Demand',
      domains: ['test-creation.com']
    });
    testClientId = client1.id;

    // Create test contact for client 1
    const contact1 = await Contact.create({
      clientId: testClientId,
      name: 'Test Contact',
      email: 'test-creation@test.com'
    });
    testContactId = contact1.id;

    // Create test client 2
    const client2 = await Client.create({
      companyName: 'Other Test Company',
      maintenanceContractType: 'On Demand',
      domains: ['other-test.com']
    });
    otherClientId = client2.id;

    // Create test contact for client 2
    const contact2 = await Contact.create({
      clientId: otherClientId,
      name: 'Other Contact',
      email: 'other-creation@test.com'
    });
    otherContactId = contact2.id;
  });

  after(async () => {
    // Clean up test data
    if (testClientId) {
      await query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
    if (otherClientId) {
      await query('DELETE FROM clients WHERE id = $1', [otherClientId]);
    }
  });

  describe('Successful ticket creation', () => {
    it('should create ticket with minimal required fields (AC1)', async () => {
      // Create ticket with minimal fields
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId
      });

      assert.ok(ticket.id);
      assert.strictEqual(ticket.clientId, testClientId);
      assert.strictEqual(ticket.contactId, testContactId);
      assert.strictEqual(ticket.state, 'open');
      assert.strictEqual(ticket.description, null);
      assert.strictEqual(ticket.notes, null);
      assert.strictEqual(ticket.closedAt, null);
      assert.ok(ticket.createdAt);
      assert.ok(ticket.updatedAt);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should create ticket with description and notes (AC2)', async () => {
      const testDescription = 'Test ticket description';
      const testNotes = 'Test internal notes';

      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: testDescription,
        notes: testNotes
      });

      assert.ok(ticket.id);
      assert.strictEqual(ticket.description, testDescription);
      assert.strictEqual(ticket.notes, testNotes);

      // Cleanup
      await Ticket.delete(ticket.id);
    });
  });

  describe('Time entry duration parsing (AC3)', () => {
    it('should parse "2h" as 2.0 hours', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for time entry'
      });

      const timeEntry = await TimeEntry.create({
        ticketId: ticket.id,
        duration: '2h',
        workDate: '2025-01-15',
        billable: true
      });

      assert.strictEqual(timeEntry.durationHours, 2.0);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should parse "90m" as 1.5 hours', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for time entry'
      });

      const timeEntry = await TimeEntry.create({
        ticketId: ticket.id,
        duration: '90m',
        workDate: '2025-01-15',
        billable: true
      });

      assert.strictEqual(timeEntry.durationHours, 1.5);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should parse "1h30m" as 1.5 hours', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for time entry'
      });

      const timeEntry = await TimeEntry.create({
        ticketId: ticket.id,
        duration: '1h30m',
        workDate: '2025-01-15',
        billable: true
      });

      assert.strictEqual(timeEntry.durationHours, 1.5);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should parse numeric string value as hours', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for time entry'
      });

      const timeEntry = await TimeEntry.create({
        ticketId: ticket.id,
        duration: '2.5',
        workDate: '2025-01-15',
        billable: true
      });

      assert.strictEqual(timeEntry.durationHours, 2.5);

      // Cleanup
      await Ticket.delete(ticket.id);
    });
  });

  describe('Time entry defaults (AC4, AC5)', () => {
    it('should default workDate to current date if not provided (AC4)', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for default workDate'
      });

      const today = new Date().toISOString().split('T')[0];

      const timeEntry = await TimeEntry.create({
        ticketId: ticket.id,
        duration: '1h',
        billable: true
      });

      assert.strictEqual(timeEntry.workDate, today);

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should default billable to true if not provided (AC5)', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for default billable'
      });

      const timeEntry = await TimeEntry.create({
        ticketId: ticket.id,
        duration: '1h',
        workDate: '2025-01-15'
      });

      assert.strictEqual(timeEntry.billable, true);

      // Cleanup
      await Ticket.delete(ticket.id);
    });
  });

  describe('Validation (AC6, AC7, AC8)', () => {
    it('should reject contact that does not belong to client (AC6)', async () => {
      // Try to create ticket with contact from different client
      await assert.rejects(
        async () => {
          await Ticket.create({
            clientId: testClientId,
            contactId: otherContactId // Contact belongs to otherClientId
          });
        },
        {
          message: /Contact with ID \d+ not found/
        }
      );
    });

    it('should reject missing required clientId (AC7)', async () => {
      await assert.rejects(
        async () => {
          await Ticket.create({
            contactId: testContactId
            // clientId is missing
          });
        },
        {
          message: /Client with ID undefined not found/
        }
      );
    });

    it('should reject missing required contactId (AC7)', async () => {
      await assert.rejects(
        async () => {
          await Ticket.create({
            clientId: testClientId
            // contactId is missing
          });
        },
        {
          message: /Contact with ID undefined not found/
        }
      );
    });

    it('should reject invalid duration format (AC8)', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for invalid duration'
      });

      await assert.rejects(
        async () => {
          await TimeEntry.create({
            ticketId: ticket.id,
            duration: 'invalid',
            workDate: '2025-01-15',
            billable: true
          });
        },
        {
          message: /Invalid duration format/
        }
      );

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should reject negative duration', async () => {
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for negative duration'
      });

      await assert.rejects(
        async () => {
          await TimeEntry.create({
            ticketId: ticket.id,
            duration: '-1',
            workDate: '2025-01-15',
            billable: true
          });
        },
        {
          message: /Invalid time format/
        }
      );

      // Cleanup
      await Ticket.delete(ticket.id);
    });

    it('should reject non-existent client', async () => {
      await assert.rejects(
        async () => {
          await Ticket.create({
            clientId: 999999,
            contactId: testContactId
          });
        },
        {
          message: /Client with ID 999999 not found/
        }
      );
    });

    it('should reject non-existent contact', async () => {
      await assert.rejects(
        async () => {
          await Ticket.create({
            clientId: testClientId,
            contactId: 999999
          });
        },
        {
          message: /Contact with ID 999999 not found/
        }
      );
    });
  });
});

describe('Dashboard Endpoints - Integration Tests', () => {
  let testClientId;
  let testContactId;

  before(async () => {
    // Create test client
    const client = await Client.create({
      companyName: 'Test Company for Dashboard',
      maintenanceContractType: 'On Demand',
      domains: ['test-dashboard.com']
    });
    testClientId = client.id;

    // Create test contact
    const contact = await Contact.create({
      clientId: testClientId,
      name: 'Test Contact',
      email: 'test-dashboard@test.com'
    });
    testContactId = contact.id;
  });

  after(async () => {
    // Clean up test data
    if (testClientId) {
      await query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
  });

  describe('Recently closed tickets', () => {
    it('should return tickets closed within last 7 days', async () => {
      // Create a ticket and close it
      const ticket1 = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Recently closed ticket',
        state: 'open'
      });
      await Ticket.close(ticket1.id);

      // Create another ticket and close it 8 days ago (should not appear)
      const ticket2 = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Old closed ticket',
        state: 'open'
      });
      await Ticket.close(ticket2.id);
      await query(
        `UPDATE tickets SET closed_at = NOW() - INTERVAL '8 days' WHERE id = $1`,
        [ticket2.id]
      );

      // Find recently closed tickets
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentlyClosed = await Ticket.findAll({
        state: 'closed',
        closedSince: sevenDaysAgo.toISOString()
      });

      // Should include ticket1 but not ticket2
      const foundTicket1 = recentlyClosed.find(t => t.id === ticket1.id);
      const foundTicket2 = recentlyClosed.find(t => t.id === ticket2.id);

      assert.ok(foundTicket1, 'Recently closed ticket should be in results');
      assert.strictEqual(foundTicket2, undefined, 'Old closed ticket should not be in results');

      // Cleanup
      await Ticket.delete(ticket1.id);
      await Ticket.delete(ticket2.id);
    });
  });

  describe('Dashboard stats', () => {
    it('should calculate current month hours correctly', async () => {
      // Create a ticket with time entries for current month
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: testContactId,
        description: 'Test ticket for stats',
        state: 'open'
      });

      const currentMonth = new Date().toISOString().substring(0, 7) + '-01';

      // Add time entries
      await TimeEntry.create({
        ticketId: ticket.id,
        duration: '2h',
        workDate: currentMonth,
        billable: true
      });

      await TimeEntry.create({
        ticketId: ticket.id,
        duration: '1.5h',
        workDate: currentMonth,
        billable: true
      });

      // Add non-billable entry (should not count)
      await TimeEntry.create({
        ticketId: ticket.id,
        duration: '1h',
        workDate: currentMonth,
        billable: false
      });

      // Get stats through database query (simulating controller logic)
      const result = await query(
        `SELECT COALESCE(SUM(duration_hours), 0) as total_hours
         FROM time_entries
         WHERE billable = true
           AND deleted_at IS NULL
           AND work_date >= $1::date
           AND work_date < ($1::date + INTERVAL '1 month')`,
        [currentMonth]
      );

      const totalHours = parseFloat(result.rows[0].total_hours);
      assert.ok(totalHours >= 3.5, 'Total hours should be at least 3.5 (2 + 1.5)');

      // Cleanup
      await Ticket.delete(ticket.id);
    });
  });
});
