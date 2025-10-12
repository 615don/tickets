import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Ticket } from '../../models/Ticket.js';
import { TimeEntry } from '../../models/TimeEntry.js';
import { Client } from '../../models/Client.js';
import { Contact } from '../../models/Contact.js';
import { InvoiceLock } from '../../models/InvoiceLock.js';
import { query } from '../../config/database.js';

describe('Ticket Deletion with Time Entries - Integration Tests', () => {
  let testClient;
  let testContact;

  before(async () => {
    // Clean up test data
    await query("DELETE FROM invoice_locks WHERE month >= '2024-01-01'");

    // Create test client
    testClient = await Client.create({
      companyName: 'Deletion Test Company',
      maintenanceContractType: 'On Demand',
      domains: ['deletiontest.com']
    });

    // Create test contact
    testContact = await Contact.create({
      clientId: testClient.id,
      name: 'Deletion Test Contact',
      email: 'deletiontest@example.com'
    });
  });

  after(async () => {
    // Clean up
    await query("DELETE FROM invoice_locks WHERE month >= '2024-01-01'");
    if (testClient) {
      await query('DELETE FROM clients WHERE id = $1', [testClient.id]);
    }
  });

  it('should successfully delete ticket with billable time entries when month is not locked', async () => {
    // Create a ticket
    const ticket = await Ticket.create({
      clientId: testClient.id,
      contactId: testContact.id,
      description: 'Ticket with billable time',
      state: 'open'
    });

    // Add a billable time entry for current month (not locked)
    // Use yesterday's date to avoid timezone issues
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const workDate = yesterday.toISOString().split('T')[0];

    await TimeEntry.create({
      ticketId: ticket.id,
      workDate: workDate,
      duration: '2h',
      billable: true
    });

    // Should be able to delete the ticket
    const result = await Ticket.delete(ticket.id);
    assert.ok(result, 'Ticket should be deleted successfully');

    // Verify ticket no longer exists
    const deletedTicket = await Ticket.findById(ticket.id);
    assert.strictEqual(deletedTicket, null, 'Ticket should not exist after deletion');
  });

  it('should successfully delete ticket when checking Date objects for locks', async () => {
    // This test verifies the Date-to-string conversion fix for the "Month must be a non-empty string" error
    // Create a ticket
    const ticket = await Ticket.create({
      clientId: testClient.id,
      contactId: testContact.id,
      description: 'Ticket to test Date handling',
      state: 'open'
    });

    // Add a time entry (workDate will be returned as a Date object from DB)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const workDate = yesterday.toISOString().split('T')[0];

    await TimeEntry.create({
      ticketId: ticket.id,
      workDate: workDate,
      duration: '2h',
      billable: true
    });

    // Get the time entries (this returns Date objects for workDate)
    const timeEntries = await TimeEntry.findByTicketId(ticket.id);

    // Verify workDate is a Date object (this is the key issue we're testing)
    assert.ok(timeEntries[0].workDate instanceof Date, 'workDate should be a Date object');

    // Delete should work without throwing "Month must be a non-empty string" error
    const result = await Ticket.delete(ticket.id);
    assert.ok(result, 'Ticket should be deleted successfully despite Date object');

    // Verify ticket no longer exists
    const deletedTicket = await Ticket.findById(ticket.id);
    assert.strictEqual(deletedTicket, null, 'Ticket should not exist after deletion');
  });


  it('should successfully delete ticket with multiple time entries when none are locked', async () => {
    // Create a ticket
    const ticket = await Ticket.create({
      clientId: testClient.id,
      contactId: testContact.id,
      description: 'Ticket with multiple time entries',
      state: 'open'
    });

    // Add multiple time entries for current month (not locked)
    // Use yesterday's date to avoid timezone issues
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const workDate = yesterday.toISOString().split('T')[0];

    await TimeEntry.create({
      ticketId: ticket.id,
      workDate: workDate,
      duration: '1h',
      billable: true
    });

    await TimeEntry.create({
      ticketId: ticket.id,
      workDate: workDate,
      duration: '2.5h',
      billable: true
    });

    await TimeEntry.create({
      ticketId: ticket.id,
      workDate: workDate,
      duration: '0.5h',
      billable: false
    });

    // Get time entries to verify they exist
    const timeEntries = await TimeEntry.findByTicketId(ticket.id);
    assert.strictEqual(timeEntries.length, 3, 'Should have 3 time entries');

    // Should be able to delete the ticket
    const result = await Ticket.delete(ticket.id);
    assert.ok(result, 'Ticket should be deleted successfully');

    // Verify time entries were cascade deleted
    const remainingEntries = await TimeEntry.findByTicketId(ticket.id);
    assert.strictEqual(remainingEntries.length, 0, 'Time entries should be deleted');
  });
});
