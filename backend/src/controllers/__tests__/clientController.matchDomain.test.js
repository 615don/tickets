import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Client } from '../../models/Client.js';
import { query } from '../../config/database.js';

/**
 * Client Controller - matchDomain Endpoint Tests
 * Tests for GET /api/clients/match-domain endpoint
 */
describe('Client Controller - matchDomain', () => {
  let testClient1Id;
  let testClient2Id;

  // Clean up test data
  beforeEach(async () => {
    await query("DELETE FROM client_domains WHERE domain LIKE '%.test-match.com'");
    await query("DELETE FROM client_domains WHERE domain LIKE 'test-domain%'");
    await query("DELETE FROM clients WHERE company_name LIKE 'Test Match%'");
  });

  afterEach(async () => {
    await query("DELETE FROM client_domains WHERE domain LIKE '%.test-match.com'");
    await query("DELETE FROM client_domains WHERE domain LIKE 'test-domain%'");
    await query("DELETE FROM clients WHERE company_name LIKE 'Test Match%'");
  });

  describe('matchByDomain method', () => {
    beforeEach(async () => {
      // Create test client 1
      const client1 = await query(
        `INSERT INTO clients (company_name, maintenance_contract_type, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        ['Test Match Client 1', 'On Demand']
      );
      testClient1Id = client1.rows[0].id;

      // Add domain to client 1
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient1Id, 'example.test-match.com']
      );
    });

    it('should find exact match - single client with domain', async () => {
      const matches = await Client.matchByDomain('example.test-match.com');

      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].id, testClient1Id);
      assert.strictEqual(matches[0].name, 'Test Match Client 1');
      assert.ok(Array.isArray(matches[0].domains));
      assert.ok(matches[0].domains.includes('example.test-match.com'));
    });

    it('should match case-insensitive - uppercase/lowercase variations', async () => {
      // Test uppercase query
      const matchesUpper = await Client.matchByDomain('EXAMPLE.TEST-MATCH.COM');
      assert.strictEqual(matchesUpper.length, 1);
      assert.strictEqual(matchesUpper[0].name, 'Test Match Client 1');

      // Test mixed case query
      const matchesMixed = await Client.matchByDomain('Example.Test-Match.COM');
      assert.strictEqual(matchesMixed.length, 1);
      assert.strictEqual(matchesMixed[0].name, 'Test Match Client 1');
    });

    it('should enforce unique domain constraint - domain belongs to single client only', async () => {
      // Create second client
      const client2 = await query(
        `INSERT INTO clients (company_name, maintenance_contract_type, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        ['Test Match Client 2', 'Regular Maintenance']
      );
      testClient2Id = client2.rows[0].id;

      // Add unique domain to client 2
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient2Id, 'unique.test-match.com']
      );

      // Query for client 2's domain should return only client 2
      const matches = await Client.matchByDomain('unique.test-match.com');

      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].id, testClient2Id);
      assert.strictEqual(matches[0].name, 'Test Match Client 2');
      assert.ok(matches[0].domains.includes('unique.test-match.com'));
    });

    it('should return empty array when no match found', async () => {
      const matches = await Client.matchByDomain('nonexistent.test-match.com');

      assert.strictEqual(Array.isArray(matches), true);
      assert.strictEqual(matches.length, 0);
    });

    it('should aggregate all domains for matched client', async () => {
      // Add additional domain to client 1
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient1Id, 'another.test-match.com']
      );

      const matches = await Client.matchByDomain('example.test-match.com');

      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].domains.length, 2);
      assert.ok(matches[0].domains.includes('example.test-match.com'));
      assert.ok(matches[0].domains.includes('another.test-match.com'));
    });

    it('should use exact domain matching - no wildcard subdomain matching', async () => {
      // Query for domain that doesn't exist (parent domain scenario)
      // Client only has example.test-match.com, not mail.example.test-match.com
      const nonExistentSubdomain = await Client.matchByDomain('mail.example.test-match.com');

      // Should not match because mail.example.test-match.com doesn't exist
      assert.strictEqual(nonExistentSubdomain.length, 0);

      // Query for existing domain should work
      const existingDomain = await Client.matchByDomain('example.test-match.com');
      assert.strictEqual(existingDomain.length, 1);
      assert.ok(existingDomain[0].domains.includes('example.test-match.com'));

      // Now add the subdomain to the same client
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient1Id, 'mail.example.test-match.com']
      );

      // Query for subdomain should now match and return client with both domains
      const subdomainMatches = await Client.matchByDomain('mail.example.test-match.com');
      assert.strictEqual(subdomainMatches.length, 1);
      assert.strictEqual(subdomainMatches[0].id, testClient1Id);
      assert.ok(subdomainMatches[0].domains.includes('mail.example.test-match.com'));
      assert.ok(subdomainMatches[0].domains.includes('example.test-match.com'));
    });

    it('should return results with proper structure', async () => {
      const matches = await Client.matchByDomain('example.test-match.com');

      assert.strictEqual(matches.length, 1);

      const match = matches[0];

      // Verify structure
      assert.strictEqual(typeof match.id, 'number');
      assert.strictEqual(typeof match.name, 'string');
      assert.ok(Array.isArray(match.domains));

      // Verify only expected fields are present (id, name, domains)
      const keys = Object.keys(match).sort();
      assert.deepStrictEqual(keys, ['domains', 'id', 'name']);
    });
  });

  describe('Domain validation edge cases', () => {
    beforeEach(async () => {
      // Create test client
      const client = await query(
        `INSERT INTO clients (company_name, maintenance_contract_type, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        ['Test Match Client', 'On Demand']
      );
      testClient1Id = client.rows[0].id;

      // Add various domain formats
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient1Id, 'test-domain.com']
      );
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient1Id, 'test-domain.co.uk']
      );
      await query(
        `INSERT INTO client_domains (client_id, domain, created_at)
         VALUES ($1, $2, NOW())`,
        [testClient1Id, 'test-123.com']
      );
    });

    it('should match domain with hyphens', async () => {
      const matches = await Client.matchByDomain('test-domain.com');
      assert.strictEqual(matches.length, 1);
    });

    it('should match domain with multi-level TLD', async () => {
      const matches = await Client.matchByDomain('test-domain.co.uk');
      assert.strictEqual(matches.length, 1);
    });

    it('should match domain with numbers', async () => {
      const matches = await Client.matchByDomain('test-123.com');
      assert.strictEqual(matches.length, 1);
    });
  });
});
