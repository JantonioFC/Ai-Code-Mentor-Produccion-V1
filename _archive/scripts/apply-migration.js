const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'ai-code-mentor.db');
const migrationPath = path.join(__dirname, 'lib/db/migrations/008_add_generated_content.sql');

console.log(`Open database: ${dbPath}`);
const db = new Database(dbPath);

console.log(`Reading migration: ${migrationPath}`);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

try {
    console.log('Applying migration...');
    db.exec(migrationSql);
    console.log('Migration applied successfully!');

    // Verify table existence
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='generated_content'").get();
    if (tableCheck) {
        console.log('✅ Table generated_content exists.');
    } else {
        console.error('❌ Table generated_content NOT found after migration.');
    }

} catch (error) {
    console.error('Error applying migration:', error);
} finally {
    db.close();
}
