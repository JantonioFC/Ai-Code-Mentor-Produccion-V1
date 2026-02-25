/**
 * SCRIPT: CREATE DEMO USER FOR E2E TESTS (LOCAL SQLITE)
 *
 * Purpose: Register demo@aicodementor.com
 * STRATEGY: DESTROY AND RECREATE (Clean Slate).
 */

const db = require('../lib/db');
const bcrypt = require('bcryptjs');

const DEMO_EMAIL = 'demo@aicodementor.com';
const DEMO_PASSWORD = 'demo123';
const DEMO_NAME = 'Usuario Demo';
const BCRYPT_SALT_ROUNDS = 12;

async function createDemoUser() {
  console.log('Creating Demo User (Upsert)...');

  try {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);
    const userId = '00000000-0000-0000-0000-000000000001';
    const now = new Date().toISOString();

    // Upsert user profile with password_hash
    try {
      db.run(
        `INSERT INTO user_profiles (id, email, password_hash, display_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'authenticated', ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           password_hash = excluded.password_hash,
           display_name = excluded.display_name,
           updated_at = excluded.updated_at`,
        [userId, DEMO_EMAIL, hashedPassword, DEMO_NAME, now, now]
      );
      console.log('User profile upserted in user_profiles table.');
    } catch (e) {
      console.warn('user_profiles table:', e.message);
    }

    console.log(`Demo user ready! ID: ${userId}, Email: ${DEMO_EMAIL}, Password: ${DEMO_PASSWORD}`);

  } catch (err) {
    console.error('Error creating demo user:', err);
    process.exit(1);
  }
}

createDemoUser();
