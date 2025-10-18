/**
 * Verify that orphaned assets have been fixed
 */

import { query } from './src/config/database.js';

async function verify() {
  console.log('\n📋 Contacts visible in dropdowns (non-deleted, non-system):');
  const visible = await query(`
    SELECT id, name, email
    FROM contacts
    WHERE deleted_at IS NULL AND is_system_contact = FALSE
    ORDER BY id
  `);
  visible.rows.forEach(c => console.log(`  - ID ${c.id}: ${c.name} (${c.email})`));

  console.log('\n🗑️  Deleted contacts (hidden from dropdowns):');
  const deleted = await query(`
    SELECT id, name, email, deleted_at
    FROM contacts
    WHERE deleted_at IS NOT NULL
    ORDER BY id
  `);
  if (deleted.rows.length === 0) {
    console.log('  (none)');
  } else {
    deleted.rows.forEach(c => console.log(`  - ID ${c.id}: ${c.name} - deleted ${c.deleted_at}`));
  }

  console.log('\n🔧 System contacts (hidden from dropdowns):');
  const system = await query(`
    SELECT id, name, email
    FROM contacts
    WHERE is_system_contact = TRUE
    ORDER BY id
  `);
  system.rows.forEach(c => console.log(`  - ID ${c.id}: ${c.name} (${c.email})`));

  console.log('\n💻 Assets and their assigned contacts:');
  const assets = await query(`
    SELECT a.id, a.hostname, a.contact_id, c.name as contact_name, c.is_system_contact, c.deleted_at
    FROM assets a
    LEFT JOIN contacts c ON a.contact_id = c.id
    ORDER BY a.id
  `);
  assets.rows.forEach(a => {
    const flags = [];
    if (a.is_system_contact) flags.push('SYSTEM');
    if (a.deleted_at) flags.push('DELETED');
    const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
    console.log(`  - Asset ID ${a.id} (${a.hostname}): Contact ID ${a.contact_id} - ${a.contact_name}${flagStr}`);
  });

  console.log('\n✅ Verification complete!\n');
  process.exit(0);
}

verify().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
