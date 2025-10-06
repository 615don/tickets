import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TimeEntry } from '../../models/TimeEntry.js';
import { Ticket } from '../../models/Ticket.js';
import { Client } from '../../models/Client.js';
import { Contact } from '../../models/Contact.js';
import { InvoiceLock } from '../../models/InvoiceLock.js';
import { query } from '../../config/database.js';

describe('Time Entry Lock Validation - Integration Tests', () => {
  let testClient;
  let testContact;
  let testTicket;
  let testTimeEntry;

  before(async () => {
    // Clean up test data
    await query("DELETE FROM invoice_locks WHERE month >= '2024-01-01'");

    // Create test client
    testClient = await Client.create({
      companyName: 'Lock Test Company',
      maintenanceContractType: 'On Demand',
      domains: ['locktest.com']
    });

    // Create test contact
    testContact = await Contact.create({
      clientId: testClient.id,
      name: 'Lock Test Contact',
      email: 'locktest@example.com'
    });

    // Create test ticket
    testTicket = await Ticket.create({
      clientId: testClient.id,
      contactId: testContact.id,
      description: 'Lock validation test ticket',
      state: 'open'
    });
  });

  after(async () => {
    // Clean up
    await query("DELETE FROM invoice_locks WHERE month >= '2024-01-01'");
    if (testClient) {
      await query('DELETE FROM clients WHERE id = $1', [testClient.id]);
    }
  });

  beforeEach(async () => {
    // Create a fresh time entry for each test
    testTimeEntry = await TimeEntry.create({
      ticketId: testTicket.id,
      workDate: '2025-09-15',
      duration: '2h',
      billable: true
    });
  });

  describe('Update time entry validation', () => {
    it('should allow update when month is not locked', async () => {
      // Update time entry (September 2025 not locked)
      const updated = await TimeEntry.update(testTimeEntry.id, {
        duration: '3h'
      });

      assert.ok(updated);
      assert.strictEqual(updated.durationHours, 3);
    });
  });

  describe('Delete time entry validation', () => {
    it('should allow delete when month is not locked', async () => {
      // Create a time entry in unlocked month (November 2024 - past date)
      const entry = await TimeEntry.create({
        ticketId: testTicket.id,
        workDate: '2024-11-15',
        duration: '1h',
        billable: true
      });

      // Delete should succeed
      const result = await TimeEntry.softDelete(entry.id);

      assert.ok(result);
      assert.ok(result.deletedAt);
    });

    it('should validate lock status via utility function', async () => {
      const { validateNotLocked } = await import('../../utils/invoiceLock.js');

      // Lock October 2024
      await InvoiceLock.create('2024-10', ['INV-TEST-003']);

      // Validation function should throw for locked month
      await assert.rejects(
        async () => await validateNotLocked('2024-10-20'),
        (error) => {
          return error.statusCode === 403 && error.message.includes('2024-10');
        }
      );
    });
  });

  describe('Lock error message format', () => {
    it('should include locked month in YYYY-MM format in error message', async () => {
      // Lock December 2025
      await InvoiceLock.create('2025-12', []);

      const { validateNotLocked } = await import('../../utils/invoiceLock.js');

      try {
        await validateNotLocked('2025-12-25');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.statusCode, 403);
        assert.strictEqual(error.type, 'InvoiceLockError');
        assert.ok(error.message.includes('2025-12'));
        assert.ok(error.message.includes('Cannot modify time entries for locked month'));
      }
    });
  });

  describe('Multiple time entries with different months', () => {
    it('should only reject operations on locked months', async () => {
      // Lock only August 2025
      await InvoiceLock.create('2025-08', ['INV-TEST-004']);

      // Create entries in August (locked) and July (unlocked)
      const augustEntry = await TimeEntry.create({
        ticketId: testTicket.id,
        workDate: '2025-08-15',
        duration: '2h',
        billable: true
      });

      const julyEntry = await TimeEntry.create({
        ticketId: testTicket.id,
        workDate: '2025-07-15',
        duration: '2h',
        billable: true
      });

      // July entry should be updatable
      const updated = await TimeEntry.update(julyEntry.id, { duration: '3h' });
      assert.strictEqual(updated.durationHours, 3);

      // Validation for August entry happens at controller level
      const { validateNotLocked } = await import('../../utils/invoiceLock.js');

      await assert.rejects(
        async () => await validateNotLocked(augustEntry.workDate),
        (error) => {
          return error.statusCode === 403 && error.message.includes('2025-08');
        }
      );
    });
  });
});
