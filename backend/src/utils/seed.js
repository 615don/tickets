/**
 * Seeds the database with initial test data
 * Usage: node src/utils/seed.js
 */

import bcrypt from 'bcrypt';
import pool from '../config/database.js';

async function seed() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'Admin User';

  try {
    console.log('🌱 Seeding database...\n');

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists. Skipping user creation.');
      console.log('   Email:', email);
      console.log('   If you need to reset the password, use reset-test-user.js\n');
    } else {
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, passwordHash, name]
      );

      console.log('✅ Admin user created successfully!\n');
      console.log('   Email:', result.rows[0].email);
      console.log('   Password:', password);
      console.log('   Name:', result.rows[0].name);
      console.log('\n📝 IMPORTANT: Change this password after first login!\n');
    }

    console.log('✅ Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
