#!/usr/bin/env node

/**
 * Cleanup Script: Remove Duplicate Client Domains
 *
 * This script finds and removes duplicate domain entries in the client_domains table.
 * It keeps the oldest entry (lowest ID) for each client/domain pair and removes duplicates.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-domains.js --dry-run    # Preview what will be deleted
 *   node scripts/cleanup-duplicate-domains.js --execute    # Actually delete duplicates
 *
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string (from Railway)
 */

import pg from 'pg';
const { Pool } = pg;

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !args.includes('--execute');

if (isDryRun) {
  console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
} else {
  console.log('\n⚠️  EXECUTE MODE - Duplicates will be deleted\n');
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function findDuplicates() {
  console.log('Step 1: Finding duplicate domain entries...\n');

  const result = await pool.query(`
    SELECT
      domain,
      client_id,
      COUNT(*) as duplicate_count,
      array_agg(id ORDER BY id) as domain_ids,
      MIN(id) as keep_id
    FROM client_domains
    GROUP BY domain, client_id
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC, domain
  `);

  return result.rows;
}

async function getClientName(clientId) {
  const result = await pool.query(
    'SELECT company_name FROM clients WHERE id = $1',
    [clientId]
  );
  return result.rows[0]?.company_name || 'Unknown';
}

async function deleteDuplicates(duplicates) {
  console.log('\nStep 2: Removing duplicate entries...\n');

  let totalDeleted = 0;

  for (const dup of duplicates) {
    // Keep the first ID, delete all others
    const idsToDelete = dup.domain_ids.slice(1);

    if (!isDryRun) {
      const result = await pool.query(
        'DELETE FROM client_domains WHERE id = ANY($1::int[])',
        [idsToDelete]
      );
      totalDeleted += result.rowCount;
    } else {
      totalDeleted += idsToDelete.length;
    }

    const clientName = await getClientName(dup.client_id);
    console.log(`  ${isDryRun ? 'Would delete' : 'Deleted'} ${idsToDelete.length} duplicate(s) of "${dup.domain}" for "${clientName}" (Client ID: ${dup.client_id})`);
    console.log(`    Keeping ID: ${dup.keep_id}, ${isDryRun ? 'Would delete' : 'Deleted'} IDs: ${idsToDelete.join(', ')}`);
  }

  return totalDeleted;
}

async function verifyNoDuplicates() {
  console.log('\nStep 3: Verifying no duplicates remain...\n');

  const result = await pool.query(`
    SELECT domain, client_id, COUNT(*) as count
    FROM client_domains
    GROUP BY domain, client_id
    HAVING COUNT(*) > 1
  `);

  if (result.rows.length === 0) {
    console.log('✅ No duplicates found - database is clean!\n');
    return true;
  } else {
    console.log(`❌ Found ${result.rows.length} duplicate(s) remaining:\n`);
    result.rows.forEach(row => {
      console.log(`  - ${row.domain} (Client ID: ${row.client_id}): ${row.count} entries`);
    });
    return false;
  }
}

async function main() {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Find duplicates
    const duplicates = await findDuplicates();

    if (duplicates.length === 0) {
      console.log('✅ No duplicate domains found - database is already clean!\n');
      await pool.end();
      return;
    }

    console.log(`Found ${duplicates.length} domain(s) with duplicates:\n`);

    for (const dup of duplicates) {
      const clientName = await getClientName(dup.client_id);
      console.log(`  - "${dup.domain}" for "${clientName}" (Client ID: ${dup.client_id}): ${dup.duplicate_count} entries`);
      console.log(`    IDs: ${dup.domain_ids.join(', ')} (will keep ID ${dup.keep_id})`);
    }
    console.log('');

    // Delete duplicates
    const deletedCount = await deleteDuplicates(duplicates);

    console.log(`\n${isDryRun ? 'Would delete' : 'Deleted'} ${deletedCount} duplicate domain entries\n`);

    // Verify cleanup (only in execute mode)
    if (!isDryRun) {
      await verifyNoDuplicates();
    } else {
      console.log('💡 To actually delete duplicates, run:\n');
      console.log('   node scripts/cleanup-duplicate-domains.js --execute\n');
    }

    await pool.end();
    console.log('✅ Cleanup script completed\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
