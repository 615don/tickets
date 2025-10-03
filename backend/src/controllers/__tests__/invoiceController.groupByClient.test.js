import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Unit tests for groupByClient helper function
 * This function is tested in isolation to verify aggregation logic
 */

// Helper function extracted for testing (mirrors implementation in invoiceController.js)
function groupByClient(rows) {
  const clientMap = new Map();
  const ticketMap = new Map();

  rows.forEach(row => {
    // Get or create client entry
    if (!clientMap.has(row.client_id)) {
      clientMap.set(row.client_id, {
        clientId: row.client_id,
        clientName: row.client_name,
        subtotalHours: 0,
        tickets: []
      });
    }

    const client = clientMap.get(row.client_id);
    const ticketKey = `${row.client_id}-${row.ticket_id}`;

    // Get or create ticket entry
    if (!ticketMap.has(ticketKey)) {
      const ticket = {
        ticketId: row.ticket_id,
        description: row.description,
        contactId: row.contact_id,
        contactName: row.contact_name,
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        billable: false,
        missingDescription: row.missing_description,
        timeEntries: []
      };
      ticketMap.set(ticketKey, ticket);
      client.tickets.push(ticket);
    }

    const ticket = ticketMap.get(ticketKey);

    // Add time entry to ticket
    const timeEntry = {
      id: row.time_entry_id,
      workDate: row.work_date,
      durationHours: parseFloat(row.duration_hours),
      billable: row.billable
    };
    ticket.timeEntries.push(timeEntry);

    // Aggregate hours
    const hours = parseFloat(row.duration_hours);
    ticket.totalHours += hours;

    if (row.billable) {
      ticket.billableHours += hours;
      ticket.billable = true;
      client.subtotalHours += hours;
    } else {
      ticket.nonBillableHours += hours;
    }
  });

  return Array.from(clientMap.values());
}

describe('groupByClient - Unit Tests', () => {
  describe('Empty input handling', () => {
    it('should return empty array for empty input', () => {
      const result = groupByClient([]);
      assert.strictEqual(result.length, 0);
    });
  });

  describe('Single client, single ticket, single entry', () => {
    it('should correctly aggregate single billable entry', () => {
      const rows = [
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: 2.5,
          billable: true,
          ticket_id: 100,
          description: 'Fix bug',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        }
      ];

      const result = groupByClient(rows);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].clientId, 1);
      assert.strictEqual(result[0].clientName, 'Acme Corp');
      assert.strictEqual(result[0].subtotalHours, 2.5);
      assert.strictEqual(result[0].tickets.length, 1);

      const ticket = result[0].tickets[0];
      assert.strictEqual(ticket.ticketId, 100);
      assert.strictEqual(ticket.description, 'Fix bug');
      assert.strictEqual(ticket.totalHours, 2.5);
      assert.strictEqual(ticket.billableHours, 2.5);
      assert.strictEqual(ticket.nonBillableHours, 0);
      assert.strictEqual(ticket.billable, true);
      assert.strictEqual(ticket.timeEntries.length, 1);
    });

    it('should correctly aggregate single non-billable entry', () => {
      const rows = [
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: 1.0,
          billable: false,
          ticket_id: 100,
          description: 'Internal work',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        }
      ];

      const result = groupByClient(rows);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].subtotalHours, 0); // Non-billable doesn't count in subtotal

      const ticket = result[0].tickets[0];
      assert.strictEqual(ticket.totalHours, 1.0);
      assert.strictEqual(ticket.billableHours, 0);
      assert.strictEqual(ticket.nonBillableHours, 1.0);
      assert.strictEqual(ticket.billable, false);
    });
  });

  describe('Mixed billable/non-billable time entries', () => {
    it('should correctly aggregate mixed entries for same ticket', () => {
      const rows = [
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: 2.0,
          billable: true,
          ticket_id: 100,
          description: 'Mixed ticket',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        },
        {
          time_entry_id: 2,
          work_date: '2025-09-16',
          duration_hours: 1.5,
          billable: false,
          ticket_id: 100,
          description: 'Mixed ticket',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        },
        {
          time_entry_id: 3,
          work_date: '2025-09-17',
          duration_hours: 1.0,
          billable: true,
          ticket_id: 100,
          description: 'Mixed ticket',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        }
      ];

      const result = groupByClient(rows);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].subtotalHours, 3.0); // 2.0 + 1.0 (only billable)

      const ticket = result[0].tickets[0];
      assert.strictEqual(ticket.totalHours, 4.5); // 2.0 + 1.5 + 1.0
      assert.strictEqual(ticket.billableHours, 3.0); // 2.0 + 1.0
      assert.strictEqual(ticket.nonBillableHours, 1.5);
      assert.strictEqual(ticket.billable, true); // Has some billable hours
      assert.strictEqual(ticket.timeEntries.length, 3);
    });
  });

  describe('Multiple tickets per client', () => {
    it('should correctly aggregate multiple tickets for same client', () => {
      const rows = [
        // Ticket 1: 2 billable hours
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: 2.0,
          billable: true,
          ticket_id: 100,
          description: 'Ticket 1',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        },
        // Ticket 2: 3 billable hours
        {
          time_entry_id: 2,
          work_date: '2025-09-16',
          duration_hours: 3.0,
          billable: true,
          ticket_id: 101,
          description: 'Ticket 2',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        }
      ];

      const result = groupByClient(rows);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].subtotalHours, 5.0); // Sum of both tickets
      assert.strictEqual(result[0].tickets.length, 2);

      const ticket1 = result[0].tickets.find(t => t.ticketId === 100);
      const ticket2 = result[0].tickets.find(t => t.ticketId === 101);

      assert.ok(ticket1);
      assert.ok(ticket2);
      assert.strictEqual(ticket1.billableHours, 2.0);
      assert.strictEqual(ticket2.billableHours, 3.0);
    });
  });

  describe('Multiple clients', () => {
    it('should correctly group tickets by client', () => {
      const rows = [
        // Client 1 - Ticket 1
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: 2.0,
          billable: true,
          ticket_id: 100,
          description: 'Client 1 work',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        },
        // Client 2 - Ticket 2
        {
          time_entry_id: 2,
          work_date: '2025-09-16',
          duration_hours: 3.5,
          billable: true,
          ticket_id: 200,
          description: 'Client 2 work',
          client_id: 2,
          client_name: 'Beta Inc',
          contact_id: 20,
          contact_name: 'Jane Smith',
          missing_description: false
        },
        // Client 1 - Ticket 1 (additional entry)
        {
          time_entry_id: 3,
          work_date: '2025-09-17',
          duration_hours: 1.5,
          billable: true,
          ticket_id: 100,
          description: 'Client 1 work',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        }
      ];

      const result = groupByClient(rows);

      assert.strictEqual(result.length, 2);

      const client1 = result.find(c => c.clientId === 1);
      const client2 = result.find(c => c.clientId === 2);

      assert.ok(client1);
      assert.ok(client2);

      assert.strictEqual(client1.subtotalHours, 3.5); // 2.0 + 1.5
      assert.strictEqual(client1.tickets.length, 1);
      assert.strictEqual(client1.tickets[0].timeEntries.length, 2);

      assert.strictEqual(client2.subtotalHours, 3.5);
      assert.strictEqual(client2.tickets.length, 1);
      assert.strictEqual(client2.tickets[0].timeEntries.length, 1);
    });
  });

  describe('Missing description flag', () => {
    it('should preserve missing_description flag', () => {
      const rows = [
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: 2.0,
          billable: true,
          ticket_id: 100,
          description: null,
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: true
        }
      ];

      const result = groupByClient(rows);
      const ticket = result[0].tickets[0];

      assert.strictEqual(ticket.description, null);
      assert.strictEqual(ticket.missingDescription, true);
    });
  });

  describe('Floating point precision', () => {
    it('should handle floating point numbers correctly', () => {
      const rows = [
        {
          time_entry_id: 1,
          work_date: '2025-09-15',
          duration_hours: '1.25',
          billable: true,
          ticket_id: 100,
          description: 'Test',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        },
        {
          time_entry_id: 2,
          work_date: '2025-09-16',
          duration_hours: '2.75',
          billable: true,
          ticket_id: 100,
          description: 'Test',
          client_id: 1,
          client_name: 'Acme Corp',
          contact_id: 10,
          contact_name: 'John Doe',
          missing_description: false
        }
      ];

      const result = groupByClient(rows);
      const ticket = result[0].tickets[0];

      assert.strictEqual(ticket.totalHours, 4.0); // 1.25 + 2.75
      assert.strictEqual(ticket.billableHours, 4.0);
      assert.strictEqual(result[0].subtotalHours, 4.0);
    });
  });

  describe('Complex real-world scenario', () => {
    it('should handle complex multi-client, multi-ticket, mixed billable scenario', () => {
      const rows = [
        // Client 1 - Ticket 1 - Mixed billable/non-billable
        { time_entry_id: 1, work_date: '2025-09-15', duration_hours: 2.0, billable: true, ticket_id: 100, description: 'Fix bug', client_id: 1, client_name: 'Acme', contact_id: 10, contact_name: 'John', missing_description: false },
        { time_entry_id: 2, work_date: '2025-09-16', duration_hours: 1.0, billable: false, ticket_id: 100, description: 'Fix bug', client_id: 1, client_name: 'Acme', contact_id: 10, contact_name: 'John', missing_description: false },

        // Client 1 - Ticket 2 - Pure billable
        { time_entry_id: 3, work_date: '2025-09-17', duration_hours: 3.5, billable: true, ticket_id: 101, description: 'New feature', client_id: 1, client_name: 'Acme', contact_id: 10, contact_name: 'John', missing_description: false },

        // Client 2 - Ticket 3 - Pure non-billable
        { time_entry_id: 4, work_date: '2025-09-18', duration_hours: 1.5, billable: false, ticket_id: 200, description: 'Internal', client_id: 2, client_name: 'Beta', contact_id: 20, contact_name: 'Jane', missing_description: false },

        // Client 2 - Ticket 4 - Missing description
        { time_entry_id: 5, work_date: '2025-09-19', duration_hours: 2.0, billable: true, ticket_id: 201, description: null, client_id: 2, client_name: 'Beta', contact_id: 20, contact_name: 'Jane', missing_description: true }
      ];

      const result = groupByClient(rows);

      assert.strictEqual(result.length, 2);

      const client1 = result.find(c => c.clientId === 1);
      const client2 = result.find(c => c.clientId === 2);

      // Client 1 assertions
      assert.strictEqual(client1.subtotalHours, 5.5); // 2.0 + 3.5 (non-billable excluded)
      assert.strictEqual(client1.tickets.length, 2);

      const c1t1 = client1.tickets.find(t => t.ticketId === 100);
      assert.strictEqual(c1t1.totalHours, 3.0);
      assert.strictEqual(c1t1.billableHours, 2.0);
      assert.strictEqual(c1t1.nonBillableHours, 1.0);
      assert.strictEqual(c1t1.billable, true);

      const c1t2 = client1.tickets.find(t => t.ticketId === 101);
      assert.strictEqual(c1t2.totalHours, 3.5);
      assert.strictEqual(c1t2.billableHours, 3.5);
      assert.strictEqual(c1t2.nonBillableHours, 0);
      assert.strictEqual(c1t2.billable, true);

      // Client 2 assertions
      assert.strictEqual(client2.subtotalHours, 2.0); // Only ticket 4 billable
      assert.strictEqual(client2.tickets.length, 2);

      const c2t1 = client2.tickets.find(t => t.ticketId === 200);
      assert.strictEqual(c2t1.totalHours, 1.5);
      assert.strictEqual(c2t1.billableHours, 0);
      assert.strictEqual(c2t1.nonBillableHours, 1.5);
      assert.strictEqual(c2t1.billable, false);

      const c2t2 = client2.tickets.find(t => t.ticketId === 201);
      assert.strictEqual(c2t2.totalHours, 2.0);
      assert.strictEqual(c2t2.billableHours, 2.0);
      assert.strictEqual(c2t2.missingDescription, true);
    });
  });
});
