import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Contact } from '../Contact.js';
import { Client } from '../Client.js';
import { Ticket } from '../Ticket.js';
import { query } from '../../config/database.js';

describe('Contact Model - Integration Tests', () => {
  let testClientId;
  let testClientId2;

  before(async () => {
    // Create test clients
    const client1 = await Client.create({
      companyName: 'Test Company for Contacts',
      maintenanceContractType: 'On Demand',
      domains: ['test-contacts.com']
    });
    testClientId = client1.id;

    const client2 = await Client.create({
      companyName: 'Test Company 2 for Contacts',
      maintenanceContractType: 'Monthly Retainer',
      domains: ['test-contacts2.com']
    });
    testClientId2 = client2.id;
  });

  after(async () => {
    // Clean up test data
    if (testClientId) {
      await query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
    if (testClientId2) {
      await query('DELETE FROM clients WHERE id = $1', [testClientId2]);
    }
  });

  describe('Contact Creation (TD-001)', () => {
    it('should create a contact with valid data', async () => {
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'John Doe',
        email: 'john.doe@test.com'
      });

      assert.ok(contact.id, 'Contact should have an ID');
      assert.strictEqual(contact.name, 'John Doe');
      assert.strictEqual(contact.email, 'john.doe@test.com');
      assert.strictEqual(contact.clientId, testClientId);
      assert.strictEqual(contact.isSystemContact, false);
      assert.ok(contact.createdAt);
      assert.ok(contact.updatedAt);
    });

    it('should normalize email to lowercase', async () => {
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'Jane Doe',
        email: 'Jane.DOE@TEST.COM'
      });

      assert.strictEqual(contact.email, 'jane.doe@test.com');
    });

    it('should reject contact creation with missing name', async () => {
      await assert.rejects(
        async () => {
          await Contact.create({
            clientId: testClientId,
            name: '',
            email: 'missing-name@test.com'
          });
        },
        { message: 'Contact name is required' }
      );
    });

    it('should reject contact creation with missing email', async () => {
      await assert.rejects(
        async () => {
          await Contact.create({
            clientId: testClientId,
            name: 'No Email',
            email: null
          });
        },
        { message: 'Email is required' }
      );
    });

    it('should reject contact creation with invalid email format', async () => {
      await assert.rejects(
        async () => {
          await Contact.create({
            clientId: testClientId,
            name: 'Invalid Email',
            email: 'not-an-email'
          });
        },
        { message: /Invalid email format/ }
      );
    });

    it('should reject contact creation with non-existent client', async () => {
      await assert.rejects(
        async () => {
          await Contact.create({
            clientId: 999999,
            name: 'No Client',
            email: 'no-client@test.com'
          });
        },
        { message: /Client with ID 999999 not found/ }
      );
    });

    it('should reject contact creation with name exceeding 255 characters', async () => {
      const longName = 'A'.repeat(256);
      await assert.rejects(
        async () => {
          await Contact.create({
            clientId: testClientId,
            name: longName,
            email: 'long-name@test.com'
          });
        },
        { message: 'Contact name must be 255 characters or less' }
      );
    });
  });

  describe('Contact Retrieval (TD-001)', () => {
    let contactId1, contactId2, contactId3;

    beforeEach(async () => {
      // Create test contacts with unique emails using timestamp
      const timestamp = Date.now();
      const c1 = await Contact.create({
        clientId: testClientId,
        name: 'Alice Smith',
        email: `alice.smith.${timestamp}@test.com`
      });
      contactId1 = c1.id;

      const c2 = await Contact.create({
        clientId: testClientId,
        name: 'Bob Jones',
        email: `bob.jones.${timestamp}@test.com`
      });
      contactId2 = c2.id;

      const c3 = await Contact.create({
        clientId: testClientId2,
        name: 'Charlie Brown',
        email: `charlie.brown.${timestamp}@test.com`
      });
      contactId3 = c3.id;
    });

    it('should retrieve all contacts', async () => {
      const contacts = await Contact.findAll();

      assert.ok(Array.isArray(contacts));
      assert.ok(contacts.length >= 3);

      // Check for camelCase properties
      const contact = contacts[0];
      assert.ok(contact.clientId, 'Should have clientId in camelCase');
      assert.ok(contact.clientName, 'Should have clientName');
      assert.strictEqual(contact.isSystemContact !== undefined, true, 'Should have isSystemContact');
    });

    it('should filter contacts by clientId', async () => {
      const contacts = await Contact.findAll({ clientId: testClientId });

      assert.ok(contacts.length >= 2);
      contacts.forEach(contact => {
        assert.strictEqual(contact.clientId, testClientId);
      });
    });

    it('should search contacts by name', async () => {
      const contacts = await Contact.findAll({ search: 'Alice' });

      assert.ok(contacts.length >= 1);
      const found = contacts.find(c => c.id === contactId1);
      assert.ok(found, 'Should find Alice Smith by name search');
    });

    it('should search contacts by email', async () => {
      const contacts = await Contact.findAll({ search: 'bob.jones' });

      assert.ok(contacts.length >= 1);
      const found = contacts.find(c => c.id === contactId2);
      assert.ok(found, 'Should find Bob Jones by email search');
    });

    it('should retrieve contact by ID', async () => {
      const contact = await Contact.findById(contactId1);

      assert.ok(contact);
      assert.strictEqual(contact.id, contactId1);
      assert.strictEqual(contact.name, 'Alice Smith');
      assert.match(contact.email, /^alice\.smith\.\d+@test\.com$/);
      assert.ok(contact.clientName, 'Should include client name');
    });

    it('should return null for non-existent contact ID', async () => {
      const contact = await Contact.findById(999999);
      assert.strictEqual(contact, null);
    });

    it('should not return soft-deleted contacts', async () => {
      // Delete a contact
      await Contact.delete(contactId1);

      // Try to find it
      const contact = await Contact.findById(contactId1);
      assert.strictEqual(contact, null, 'Deleted contact should not be found');

      // Should not appear in findAll either
      const allContacts = await Contact.findAll();
      const found = allContacts.find(c => c.id === contactId1);
      assert.strictEqual(found, undefined, 'Deleted contact should not appear in list');
    });
  });

  describe('Contact Update (TD-001)', () => {
    let contactId;

    beforeEach(async () => {
      const timestamp = Date.now();
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'Original Name',
        email: `original.${timestamp}@test.com`
      });
      contactId = contact.id;
    });

    it('should update contact name', async () => {
      // Get current email
      const current = await Contact.findById(contactId);
      const updated = await Contact.update(contactId, {
        name: 'Updated Name',
        email: current.email,
        clientId: testClientId
      });

      assert.strictEqual(updated.name, 'Updated Name');
      assert.strictEqual(updated.email, current.email);
    });

    it('should update contact email', async () => {
      const timestamp = Date.now();
      const updated = await Contact.update(contactId, {
        name: 'Original Name',
        email: `updated.${timestamp}@test.com`,
        clientId: testClientId
      });

      assert.strictEqual(updated.email, `updated.${timestamp}@test.com`);
    });

    it('should update contact client', async () => {
      const current = await Contact.findById(contactId);
      const updated = await Contact.update(contactId, {
        name: 'Original Name',
        email: current.email,
        clientId: testClientId2
      });

      assert.strictEqual(updated.clientId, testClientId2);
    });

    it('should normalize email to lowercase on update', async () => {
      const timestamp = Date.now();
      const updated = await Contact.update(contactId, {
        name: 'Original Name',
        email: `UPDATED.${timestamp}@TEST.COM`,
        clientId: testClientId
      });

      assert.strictEqual(updated.email, `updated.${timestamp}@test.com`);
    });

    it('should reject update with invalid email', async () => {
      await assert.rejects(
        async () => {
          await Contact.update(contactId, {
            name: 'Original Name',
            email: 'invalid-email',
            clientId: testClientId
          });
        },
        { message: /Invalid email format/ }
      );
    });

    it('should reject update with empty name', async () => {
      const current = await Contact.findById(contactId);
      await assert.rejects(
        async () => {
          await Contact.update(contactId, {
            name: '',
            email: current.email,
            clientId: testClientId
          });
        },
        { message: 'Contact name is required' }
      );
    });

    it('should reject update with non-existent client', async () => {
      const current = await Contact.findById(contactId);
      await assert.rejects(
        async () => {
          await Contact.update(contactId, {
            name: 'Original Name',
            email: current.email,
            clientId: 999999
          });
        },
        { message: /Client with ID 999999 not found/ }
      );
    });

    it('should reject update for non-existent contact', async () => {
      await assert.rejects(
        async () => {
          await Contact.update(999999, {
            name: 'Name',
            email: 'email@test.com',
            clientId: testClientId
          });
        },
        { message: 'Contact not found' }
      );
    });
  });

  describe('Contact Deletion with Ticket Reassignment (TD-002)', () => {
    let contactId;
    let ticketId1, ticketId2;

    beforeEach(async () => {
      // Create contact with unique email
      const timestamp = Date.now();
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'Delete Me',
        email: `delete-me.${timestamp}@test.com`
      });
      contactId = contact.id;

      // Create tickets assigned to this contact
      const ticket1 = await Ticket.create({
        clientId: testClientId,
        contactId: contactId,
        description: 'Ticket 1 for deletion test',
        state: 'open'
      });
      ticketId1 = ticket1.id;

      const ticket2 = await Ticket.create({
        clientId: testClientId,
        contactId: contactId,
        description: 'Ticket 2 for deletion test',
        state: 'closed',
        closedAt: new Date()
      });
      ticketId2 = ticket2.id;
    });

    it('should soft delete contact and reassign tickets to system contact (AC2)', async () => {
      const result = await Contact.delete(contactId);

      assert.ok(result.deletedContactId, 'Should return deleted contact ID');
      assert.strictEqual(result.deletedContactId, contactId);
      assert.strictEqual(result.deletedContactName, 'Delete Me');
      assert.strictEqual(result.ticketsReassigned, 2);

      // Verify contact is soft deleted
      const contact = await Contact.findById(contactId);
      assert.strictEqual(contact, null, 'Deleted contact should not be retrievable');

      // Verify tickets are reassigned
      const ticket1 = await Ticket.findById(ticketId1);
      const ticket2 = await Ticket.findById(ticketId2);

      assert.notStrictEqual(ticket1.contactId, contactId, 'Ticket 1 should be reassigned');
      assert.notStrictEqual(ticket2.contactId, contactId, 'Ticket 2 should be reassigned');
      assert.strictEqual(ticket1.contactId, ticket2.contactId, 'Both tickets should be assigned to same system contact');
    });

    it('should create system contact with correct format (AC1)', async () => {
      await Contact.delete(contactId);

      // Find the system contact
      const systemContacts = await query(
        'SELECT * FROM contacts WHERE client_id = $1 AND is_system_contact = TRUE',
        [testClientId]
      );

      assert.ok(systemContacts.rows.length >= 1, 'System contact should exist');

      const systemContact = systemContacts.rows[0];
      assert.strictEqual(systemContact.name, '(Deleted Contact)');
      assert.match(systemContact.email, /deleted\+\d+@system\.local/);
      assert.strictEqual(systemContact.is_system_contact, true);
    });

    it('should reuse existing system contact for same client (AC3)', async () => {
      // Delete first contact
      await Contact.delete(contactId);

      // Get system contact count
      const systemContactsBefore = await query(
        'SELECT id FROM contacts WHERE client_id = $1 AND is_system_contact = TRUE',
        [testClientId]
      );
      const systemContactCountBefore = systemContactsBefore.rows.length;

      // Create and delete another contact
      const contact2 = await Contact.create({
        clientId: testClientId,
        name: 'Delete Me Too',
        email: 'delete-me-too@test.com'
      });

      await Contact.delete(contact2.id);

      // Get system contact count after second deletion
      const systemContactsAfter = await query(
        'SELECT id FROM contacts WHERE client_id = $1 AND is_system_contact = TRUE',
        [testClientId]
      );
      const systemContactCountAfter = systemContactsAfter.rows.length;

      assert.strictEqual(systemContactCountBefore, systemContactCountAfter,
        'Should reuse existing system contact, not create a new one');
    });

    it('should handle deletion of contact with no tickets', async () => {
      // Create contact with no tickets
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'No Tickets',
        email: 'no-tickets@test.com'
      });

      const result = await Contact.delete(contact.id);

      assert.strictEqual(result.ticketsReassigned, 0);
      assert.strictEqual(result.deletedContactName, 'No Tickets');
    });

    it('should prevent deletion of system contact (AC4)', async () => {
      // First delete a contact to create system contact
      await Contact.delete(contactId);

      // Get the system contact ID
      const systemContact = await query(
        'SELECT id FROM contacts WHERE client_id = $1 AND is_system_contact = TRUE',
        [testClientId]
      );

      const systemContactId = systemContact.rows[0].id;

      // Try to delete system contact
      await assert.rejects(
        async () => {
          await Contact.delete(systemContactId);
        },
        { message: 'Cannot delete system contact' }
      );
    });

    it('should rollback transaction on error (AC5)', async () => {
      // Force an error by trying to delete non-existent contact
      await assert.rejects(
        async () => {
          await Contact.delete(999999);
        },
        { message: 'Contact not found' }
      );

      // Verify tickets are still assigned to original contact
      const ticket1 = await Ticket.findById(ticketId1);
      assert.strictEqual(ticket1.contactId, contactId,
        'Ticket should still be assigned to original contact after failed deletion');
    });

    it('should handle multiple deletions creating separate system contacts per client', async () => {
      // Create contact for client 2
      const contact2 = await Contact.create({
        clientId: testClientId2,
        name: 'Client 2 Contact',
        email: 'client2@test.com'
      });

      // Create ticket for client 2
      const ticket = await Ticket.create({
        clientId: testClientId2,
        contactId: contact2.id,
        description: 'Client 2 ticket',
        state: 'open'
      });

      // Delete contacts from both clients
      await Contact.delete(contactId); // Client 1
      await Contact.delete(contact2.id); // Client 2

      // Verify separate system contacts exist for each client
      const systemContact1 = await query(
        'SELECT * FROM contacts WHERE client_id = $1 AND is_system_contact = TRUE',
        [testClientId]
      );

      const systemContact2 = await query(
        'SELECT * FROM contacts WHERE client_id = $1 AND is_system_contact = TRUE',
        [testClientId2]
      );

      assert.strictEqual(systemContact1.rows.length, 1, 'Client 1 should have 1 system contact');
      assert.strictEqual(systemContact2.rows.length, 1, 'Client 2 should have 1 system contact');
      assert.notStrictEqual(systemContact1.rows[0].id, systemContact2.rows[0].id,
        'Each client should have different system contacts');
    });
  });

  describe('Email Uniqueness (TD-001)', () => {
    it('should detect existing email', async () => {
      await Contact.create({
        clientId: testClientId,
        name: 'Unique Test',
        email: 'unique@test.com'
      });

      const exists = await Contact.emailExists('unique@test.com');
      assert.strictEqual(exists, true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await Contact.emailExists('nonexistent@test.com');
      assert.strictEqual(exists, false);
    });

    it('should exclude specific contact ID when checking email', async () => {
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'Exclude Test',
        email: 'exclude@test.com'
      });

      // Should return false when excluding the contact's own ID
      const exists = await Contact.emailExists('exclude@test.com', contact.id);
      assert.strictEqual(exists, false);
    });

    it('should be case-insensitive', async () => {
      await Contact.create({
        clientId: testClientId,
        name: 'Case Test',
        email: 'case@test.com'
      });

      const exists = await Contact.emailExists('CASE@TEST.COM');
      assert.strictEqual(exists, true);
    });

    it('should not consider deleted contacts', async () => {
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'Will Delete',
        email: 'will-delete@test.com'
      });

      await Contact.delete(contact.id);

      const exists = await Contact.emailExists('will-delete@test.com');
      assert.strictEqual(exists, false, 'Email should be available after contact deletion');
    });
  });

  describe('CamelCase Property Conversion (TD-005)', () => {
    it('should return camelCase properties from findById', async () => {
      const contact = await Contact.create({
        clientId: testClientId,
        name: 'CamelCase Test',
        email: 'camelcase@test.com'
      });

      const retrieved = await Contact.findById(contact.id);

      // Verify camelCase properties exist
      assert.ok(retrieved.clientId, 'Should have clientId');
      assert.ok(retrieved.clientName, 'Should have clientName');
      assert.strictEqual(typeof retrieved.isSystemContact, 'boolean', 'Should have isSystemContact');
      assert.ok(retrieved.createdAt, 'Should have createdAt');
      assert.ok(retrieved.updatedAt, 'Should have updatedAt');

      // Verify snake_case properties do NOT exist
      assert.strictEqual(retrieved.client_id, undefined, 'Should not have client_id');
      assert.strictEqual(retrieved.is_system_contact, undefined, 'Should not have is_system_contact');
      assert.strictEqual(retrieved.created_at, undefined, 'Should not have created_at');
      assert.strictEqual(retrieved.updated_at, undefined, 'Should not have updated_at');
    });

    it('should return camelCase properties from findAll', async () => {
      const contacts = await Contact.findAll({ clientId: testClientId });

      assert.ok(contacts.length > 0, 'Should have contacts');

      contacts.forEach(contact => {
        assert.ok(contact.clientId, 'Should have clientId');
        assert.ok(contact.clientName, 'Should have clientName');
        assert.strictEqual(typeof contact.isSystemContact, 'boolean', 'Should have isSystemContact');

        // Verify snake_case properties do NOT exist
        assert.strictEqual(contact.client_id, undefined, 'Should not have client_id');
        assert.strictEqual(contact.is_system_contact, undefined, 'Should not have is_system_contact');
      });
    });
  });
});
