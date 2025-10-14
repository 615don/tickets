import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Contact } from '../Contact.js';
import { Client } from '../Client.js';
import { Ticket } from '../Ticket.js';
import { query } from '../../config/database.js';

describe('Contact Audit Trail - TD-004 Integration Tests', () => {
  let testClientId;
  let testContactId;
  let testTicketId1, testTicketId2, testTicketId3;

  before(async () => {
    // Create test client
    const client = await Client.create({
      companyName: 'Audit Trail Test Company',
      maintenanceContractType: 'On Demand',
      domains: ['audit-test.com']
    });
    testClientId = client.id;
  });

  after(async () => {
    // Clean up test data
    if (testClientId) {
      await query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
  });

  beforeEach(async () => {
    // Create fresh contact and tickets for each test
    const timestamp = Date.now();
    const contact = await Contact.create({
      clientId: testClientId,
      name: 'John Audit',
      email: `john.audit.${timestamp}@test.com`
    });
    testContactId = contact.id;

    // Create multiple tickets for this contact
    const ticket1 = await Ticket.create({
      clientId: testClientId,
      contactId: testContactId,
      description: 'First test ticket',
      notes: 'Some notes for ticket 1'
    });
    testTicketId1 = ticket1.id;

    const ticket2 = await Ticket.create({
      clientId: testClientId,
      contactId: testContactId,
      description: 'Second test ticket',
      notes: 'Some notes for ticket 2'
    });
    testTicketId2 = ticket2.id;

    const ticket3 = await Ticket.create({
      clientId: testClientId,
      contactId: testContactId,
      description: 'Third test ticket',
      state: 'closed'
    });
    testTicketId3 = ticket3.id;
  });

  describe('Snapshot Capture on Ticket Creation', () => {
    it('should capture contact_name_snapshot when ticket is created', async () => {
      const ticket = await Ticket.findById(testTicketId1);

      // Verify snapshot was captured at creation
      const dbResult = await query(
        'SELECT contact_name_snapshot FROM tickets WHERE id = $1',
        [testTicketId1]
      );

      assert.strictEqual(
        dbResult.rows[0].contact_name_snapshot,
        'John Audit',
        'Snapshot should be captured at ticket creation'
      );
    });

    it('should display current contact name for active contacts', async () => {
      const ticket = await Ticket.findById(testTicketId1);

      assert.strictEqual(
        ticket.contactName,
        'John Audit',
        'Should display current contact name for active contacts'
      );
    });
  });

  describe('Snapshot Preservation on Contact Deletion', () => {
    it('should preserve original contact name after deletion', async () => {
      // Delete the contact
      await Contact.delete(testContactId);

      // Retrieve tickets - they should now show original name
      const ticket1 = await Ticket.findById(testTicketId1);
      const ticket2 = await Ticket.findById(testTicketId2);
      const ticket3 = await Ticket.findById(testTicketId3);

      assert.strictEqual(
        ticket1.contactName,
        'John Audit',
        'Ticket 1 should display original contact name after deletion'
      );
      assert.strictEqual(
        ticket2.contactName,
        'John Audit',
        'Ticket 2 should display original contact name after deletion'
      );
      assert.strictEqual(
        ticket3.contactName,
        'John Audit',
        'Ticket 3 should display original contact name after deletion'
      );
    });

    it('should update contact_name_snapshot in database before reassigning', async () => {
      // Delete the contact
      await Contact.delete(testContactId);

      // Check database directly
      const result = await query(
        `SELECT id, contact_name_snapshot, contact_id
         FROM tickets
         WHERE id IN ($1, $2, $3)`,
        [testTicketId1, testTicketId2, testTicketId3]
      );

      assert.strictEqual(result.rows.length, 3, 'Should find all 3 tickets');

      result.rows.forEach(row => {
        assert.strictEqual(
          row.contact_name_snapshot,
          'John Audit',
          `Ticket ${row.id} snapshot should be preserved`
        );
        assert.notStrictEqual(
          row.contact_id,
          testContactId,
          'Tickets should be reassigned to system contact'
        );
      });
    });

    it('should reassign tickets to system contact after snapshot', async () => {
      // Delete the contact
      const result = await Contact.delete(testContactId);

      // Verify tickets were reassigned
      assert.ok(result.ticketsReassigned >= 3, 'Should reassign all tickets');

      // Check tickets are now assigned to system contact
      const ticket = await Ticket.findById(testTicketId1);

      // Verify the contact is a system contact
      const contactCheck = await query(
        'SELECT is_system_contact FROM contacts WHERE id = $1',
        [ticket.contactId]
      );

      assert.strictEqual(
        contactCheck.rows[0].is_system_contact,
        true,
        'Tickets should be reassigned to system contact'
      );
    });
  });

  describe('Snapshot Only Updated if NULL', () => {
    it('should not overwrite existing snapshot on subsequent deletion', async () => {
      // Create another contact
      const timestamp = Date.now();
      const contact2 = await Contact.create({
        clientId: testClientId,
        name: 'Jane Second',
        email: `jane.second.${timestamp}@test.com`
      });

      // Create a ticket for contact2
      const ticket = await Ticket.create({
        clientId: testClientId,
        contactId: contact2.id,
        description: 'Ticket for second contact'
      });

      // Manually set snapshot to original contact name
      await query(
        'UPDATE tickets SET contact_name_snapshot = $1 WHERE id = $2',
        ['Original Name', ticket.id]
      );

      // Delete contact2
      await Contact.delete(contact2.id);

      // Verify snapshot was NOT overwritten
      const dbResult = await query(
        'SELECT contact_name_snapshot FROM tickets WHERE id = $1',
        [ticket.id]
      );

      assert.strictEqual(
        dbResult.rows[0].contact_name_snapshot,
        'Original Name',
        'Existing snapshot should not be overwritten'
      );
    });
  });

  describe('Display Logic for System Contacts', () => {
    it('should display snapshot for system contacts instead of "(Deleted Contact)"', async () => {
      // Delete the contact
      await Contact.delete(testContactId);

      // Get ticket
      const ticket = await Ticket.findById(testTicketId1);

      // Verify displayed name is from snapshot, not system contact name
      assert.strictEqual(
        ticket.contactName,
        'John Audit',
        'Should display snapshot name for system contact'
      );
      assert.notStrictEqual(
        ticket.contactName,
        '(Deleted Contact)',
        'Should not display system contact name'
      );
    });

    it('should handle tickets from findAll() correctly after deletion', async () => {
      // Delete the contact
      await Contact.delete(testContactId);

      // Get all tickets
      const tickets = await Ticket.findAll({ clientId: testClientId });

      // Find our test tickets
      const testTickets = tickets.filter(t =>
        [testTicketId1, testTicketId2, testTicketId3].includes(t.id)
      );

      assert.strictEqual(testTickets.length, 3, 'Should find all 3 tickets');

      testTickets.forEach(ticket => {
        assert.strictEqual(
          ticket.contactName,
          'John Audit',
          `Ticket ${ticket.id} should display original contact name`
        );
      });
    });
  });

  describe('Multiple Deletions for Same Client', () => {
    it('should preserve distinct names for different deleted contacts', async () => {
      // Create second contact
      const timestamp = Date.now();
      const contact2 = await Contact.create({
        clientId: testClientId,
        name: 'Sarah Different',
        email: `sarah.different.${timestamp}@test.com`
      });

      // Create ticket for second contact
      const ticket2 = await Ticket.create({
        clientId: testClientId,
        contactId: contact2.id,
        description: 'Ticket for different contact'
      });

      // Delete first contact
      await Contact.delete(testContactId);

      // Delete second contact
      await Contact.delete(contact2.id);

      // Verify distinct names are preserved
      const ticket1 = await Ticket.findById(testTicketId1);
      const ticket2Result = await Ticket.findById(ticket2.id);

      assert.strictEqual(
        ticket1.contactName,
        'John Audit',
        'First contact tickets should show first name'
      );
      assert.strictEqual(
        ticket2Result.contactName,
        'Sarah Different',
        'Second contact tickets should show second name'
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle tickets created before snapshot feature (NULL snapshot)', async () => {
      // Create ticket and manually clear snapshot to simulate old data
      const timestamp = Date.now();
      const oldContact = await Contact.create({
        clientId: testClientId,
        name: 'Old Legacy Contact',
        email: `old.legacy.${timestamp}@test.com`
      });

      const oldTicket = await Ticket.create({
        clientId: testClientId,
        contactId: oldContact.id,
        description: 'Old ticket without snapshot'
      });

      // Manually clear snapshot to simulate old ticket
      await query(
        'UPDATE tickets SET contact_name_snapshot = NULL WHERE id = $1',
        [oldTicket.id]
      );

      // Delete contact
      await Contact.delete(oldContact.id);

      // Retrieve ticket
      const ticket = await Ticket.findById(oldTicket.id);

      // Should now show captured name (set during deletion)
      assert.strictEqual(
        ticket.contactName,
        'Old Legacy Contact',
        'Should capture name during deletion for old tickets'
      );
    });

    it('should display "(Deleted Contact)" for truly legacy tickets without snapshot', async () => {
      // Create a ticket directly in database without snapshot
      const timestamp = Date.now();
      const legacyContact = await Contact.create({
        clientId: testClientId,
        name: 'Legacy Contact',
        email: `legacy.${timestamp}@test.com`
      });

      // Create system contact manually
      const systemContact = await query(
        `INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
         VALUES ($1, '(Deleted Contact)', $2, TRUE, NOW(), NOW())
         RETURNING id`,
        [testClientId, `deleted+legacy+${timestamp}@system.local`]
      );

      // Create ticket with NULL snapshot pointing to system contact
      const legacyTicket = await query(
        `INSERT INTO tickets (client_id, contact_id, description, contact_name_snapshot, created_at, updated_at)
         VALUES ($1, $2, 'Legacy ticket', NULL, NOW(), NOW())
         RETURNING id`,
        [testClientId, systemContact.rows[0].id]
      );

      // Retrieve ticket
      const ticket = await Ticket.findById(legacyTicket.rows[0].id);

      // Should display system contact name since no snapshot exists
      assert.strictEqual(
        ticket.contactName,
        '(Deleted Contact)',
        'Should display system contact name when no snapshot exists'
      );
    });
  });
});
