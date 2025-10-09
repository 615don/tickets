import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Contact } from '../../models/Contact.js';
import { query } from '../../config/database.js';

/**
 * Contact Controller - matchEmail Endpoint Tests
 * Tests for GET /api/contacts/match-email endpoint
 */
describe('Contact Controller - matchEmail', () => {
  let testClient1Id;
  let testContact1Id;

  // Clean up test data
  beforeEach(async () => {
    await query("DELETE FROM contacts WHERE email LIKE '%@test-match.com'");
    await query("DELETE FROM contacts WHERE email LIKE '%@test-invalid.com'");
    await query("DELETE FROM clients WHERE company_name LIKE 'Test Match%'");
  });

  afterEach(async () => {
    await query("DELETE FROM contacts WHERE email LIKE '%@test-match.com'");
    await query("DELETE FROM contacts WHERE email LIKE '%@test-invalid.com'");
    await query("DELETE FROM clients WHERE company_name LIKE 'Test Match%'");
  });

  describe('matchByEmail method', () => {
    beforeEach(async () => {
      // Create test client
      const client1 = await query(
        `INSERT INTO clients (company_name, created_at, updated_at)
         VALUES ($1, NOW(), NOW())
         RETURNING id`,
        ['Test Match Client 1']
      );
      testClient1Id = client1.rows[0].id;

      // Create test contact
      const contact1 = await query(
        `INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
         VALUES ($1, $2, $3, FALSE, NOW(), NOW())
         RETURNING id`,
        [testClient1Id, 'Jane Doe', 'jane.doe@test-match.com']
      );
      testContact1Id = contact1.rows[0].id;
    });

    it('should find exact match - single contact', async () => {
      const matches = await Contact.matchByEmail('jane.doe@test-match.com');

      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].contact.email, 'jane.doe@test-match.com');
      assert.strictEqual(matches[0].contact.name, 'Jane Doe');
      assert.strictEqual(matches[0].contact.id, testContact1Id);
      assert.strictEqual(matches[0].contact.clientId, testClient1Id);
      assert.strictEqual(matches[0].client.name, 'Test Match Client 1');
    });

    it('should match case-insensitive - uppercase/lowercase variations', async () => {
      // Test uppercase query
      const matchesUpper = await Contact.matchByEmail('JANE.DOE@TEST-MATCH.COM');
      assert.strictEqual(matchesUpper.length, 1);
      assert.strictEqual(matchesUpper[0].contact.email, 'jane.doe@test-match.com');

      // Test mixed case query
      const matchesMixed = await Contact.matchByEmail('Jane.Doe@Test-Match.COM');
      assert.strictEqual(matchesMixed.length, 1);
      assert.strictEqual(matchesMixed[0].contact.email, 'jane.doe@test-match.com');
    });

    it('should return single match - database enforces unique email constraint', async () => {
      // Note: Database has unique_active_email constraint preventing duplicate emails
      const matches = await Contact.matchByEmail('jane.doe@test-match.com');

      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].contact.email, 'jane.doe@test-match.com');
    });

    it('should return empty array when no match found', async () => {
      const matches = await Contact.matchByEmail('nonexistent@test-match.com');

      assert.strictEqual(Array.isArray(matches), true);
      assert.strictEqual(matches.length, 0);
    });

    it('should exclude soft-deleted contacts', async () => {
      // Soft delete contact
      await query(
        'UPDATE contacts SET deleted_at = NOW() WHERE id = $1',
        [testContact1Id]
      );

      const matches = await Contact.matchByEmail('jane.doe@test-match.com');

      assert.strictEqual(matches.length, 0);
    });

    it('should exclude system contacts', async () => {
      // Create system contact with same email
      await query(
        `INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
         VALUES ($1, $2, $3, TRUE, NOW(), NOW())`,
        [testClient1Id, '(System Contact)', 'system@test-match.com']
      );

      const matches = await Contact.matchByEmail('system@test-match.com');

      assert.strictEqual(matches.length, 0);
    });

    it('should return results with proper structure', async () => {
      const matches = await Contact.matchByEmail('jane.doe@test-match.com');

      assert.strictEqual(matches.length, 1);
      assert.ok(matches[0].contact);
      assert.ok(matches[0].client);
      assert.strictEqual(matches[0].client.name, 'Test Match Client 1');
    });
  });

  describe('Response structure validation', () => {
    beforeEach(async () => {
      // Create minimal test setup
      const client = await query(
        `INSERT INTO clients (company_name, created_at, updated_at)
         VALUES ($1, NOW(), NOW())
         RETURNING id`,
        ['Test Match Client']
      );
      testClient1Id = client.rows[0].id;

      const contact = await query(
        `INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
         VALUES ($1, $2, $3, FALSE, NOW(), NOW())
         RETURNING id`,
        [testClient1Id, 'Test User', 'test@test-match.com']
      );
      testContact1Id = contact.rows[0].id;
    });

    it('should return correct response structure', async () => {
      const matches = await Contact.matchByEmail('test@test-match.com');

      assert.strictEqual(matches.length, 1);

      const match = matches[0];

      // Verify top-level structure
      assert.ok(match.contact);
      assert.ok(match.client);

      // Verify contact object
      assert.strictEqual(typeof match.contact.id, 'number');
      assert.strictEqual(typeof match.contact.name, 'string');
      assert.strictEqual(typeof match.contact.email, 'string');
      assert.strictEqual(typeof match.contact.clientId, 'number');

      // Verify client object
      assert.strictEqual(typeof match.client.id, 'number');
      assert.strictEqual(typeof match.client.name, 'string');

      // Verify no extra properties
      assert.strictEqual(Object.keys(match).length, 2);
      assert.strictEqual(Object.keys(match.contact).length, 4);
      assert.strictEqual(Object.keys(match.client).length, 2);
    });
  });
});
