/**
 * Script to fix orphaned assets pointing to deleted contacts
 *
 * This script:
 * 1. Finds all assets pointing to deleted contacts
 * 2. For each client, ensures a "Deleted Contact" system contact exists
 * 3. Reassigns orphaned assets to the appropriate deleted contact
 */

import pg from 'pg';
const { Pool } = pg;

// Database connection using local .env settings
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ticketing_system',
  user: process.env.DB_USER || 'dgivens',
  password: process.env.DB_PASSWORD || '',
});

async function fixOrphanedAssets() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔍 Finding orphaned assets...');

    // Find all assets pointing to deleted contacts
    const orphanedAssets = await client.query(`
      SELECT
        a.id as asset_id,
        a.hostname,
        a.client_id,
        a.contact_id,
        c.name as deleted_contact_name,
        c.deleted_at
      FROM assets a
      JOIN contacts c ON a.contact_id = c.id
      WHERE c.deleted_at IS NOT NULL
      ORDER BY a.client_id, a.contact_id
    `);

    if (orphanedAssets.rows.length === 0) {
      console.log('✅ No orphaned assets found. Database is clean!');
      await client.query('COMMIT');
      return;
    }

    console.log(`📊 Found ${orphanedAssets.rows.length} orphaned asset(s):\n`);

    // Group by client and deleted contact
    const byClient = {};
    orphanedAssets.rows.forEach(row => {
      if (!byClient[row.client_id]) {
        byClient[row.client_id] = {};
      }
      if (!byClient[row.client_id][row.contact_id]) {
        byClient[row.client_id][row.contact_id] = {
          name: row.deleted_contact_name,
          deletedAt: row.deleted_at,
          assets: []
        };
      }
      byClient[row.client_id][row.contact_id].assets.push(row);
    });

    // Display summary
    for (const [clientId, contacts] of Object.entries(byClient)) {
      console.log(`  Client ID ${clientId}:`);
      for (const [contactId, info] of Object.entries(contacts)) {
        console.log(`    - Contact ID ${contactId} (${info.name}) - deleted ${info.deletedAt}`);
        console.log(`      ${info.assets.length} asset(s): ${info.assets.map(a => a.hostname).join(', ')}`);
      }
    }

    console.log('\n🔧 Reassigning orphaned assets...\n');

    let totalReassigned = 0;

    // Process each client
    for (const [clientId, contacts] of Object.entries(byClient)) {
      // Get or create "Deleted Contact" for this client
      let deletedContact = await client.query(`
        SELECT id FROM contacts
        WHERE client_id = $1
        AND is_system_contact = TRUE
        AND email LIKE 'deleted+%@system.local'
      `, [parseInt(clientId)]);

      let deletedContactId;

      if (deletedContact.rows.length === 0) {
        console.log(`  📝 Creating "Deleted Contact" for client ${clientId}...`);
        deletedContact = await client.query(`
          INSERT INTO contacts (client_id, name, email, is_system_contact, created_at, updated_at)
          VALUES ($1, '(Deleted Contact)', $2, TRUE, NOW(), NOW())
          RETURNING id
        `, [parseInt(clientId), `deleted+${clientId}@system.local`]);
        deletedContactId = deletedContact.rows[0].id;
        console.log(`  ✅ Created system contact ID ${deletedContactId}`);
      } else {
        deletedContactId = deletedContact.rows[0].id;
        console.log(`  ✅ Using existing "Deleted Contact" ID ${deletedContactId} for client ${clientId}`);
      }

      // Reassign all orphaned assets for this client
      for (const [oldContactId, info] of Object.entries(contacts)) {
        const result = await client.query(`
          UPDATE assets
          SET contact_id = $1, updated_at = NOW()
          WHERE client_id = $2 AND contact_id = $3
        `, [deletedContactId, parseInt(clientId), parseInt(oldContactId)]);

        console.log(`  ✅ Reassigned ${result.rowCount} asset(s) from contact ${oldContactId} (${info.name}) → ${deletedContactId}`);
        totalReassigned += result.rowCount;
      }
    }

    await client.query('COMMIT');

    console.log(`\n✨ Successfully reassigned ${totalReassigned} asset(s)!`);
    console.log('🎉 Database cleanup complete!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing orphaned assets:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixOrphanedAssets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
