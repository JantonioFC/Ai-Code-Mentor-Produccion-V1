/**
 * SCRIPT: CREATE DEMO USER FOR E2E TESTS (LOCAL SQLITE)
 * 
 * Purpose: Register demo@aicodementor.com with password demo123
 * directly in local SQLite database.
 */

const db = require('../lib/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DEMO_EMAIL = 'demo@aicodementor.com';
const DEMO_PASSWORD = 'demo123';
const DEMO_NAME = 'Usuario Demo';

async function createDemoUser() {
  console.log('🚀 Creating Demo User...');

  try {
    // 1. Check if user exists
    const existingUser = db.findOne('users', { email: DEMO_EMAIL });

    if (existingUser) {
      console.log('✅ Demo user already exists.');
      // Optional: Verify password? Overwrite? 
      // For now just assume it's good or update password.
      const match = await bcrypt.compare(DEMO_PASSWORD, existingUser.password_hash);
      if (!match) {
        console.log('⚠️ Password mismatch. Updating password...');
        const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
        db.update('users', { password_hash: hashedPassword }, { email: DEMO_EMAIL });
        console.log('✅ Password updated.');
      }
      return;
    }

    // 2. Create user
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userId = uuidv4();

    db.insert('users', {
      id: userId,
      email: DEMO_EMAIL,
      password_hash: hashedPassword,
      full_name: DEMO_NAME,
      avatar_url: '',
      created_at: new Date().toISOString()
    });

    console.log(`✅ User created! ID: ${userId}`);

  } catch (err) {
    console.error('❌ Error creating demo user:', err);
    process.exit(1);
  }
}

createDemoUser();
