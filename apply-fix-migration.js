const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'ai-code-mentor.db');
const migrationPath = path.join(__dirname, 'lib/db/migrations/009_fix_generated_content_schema.sql');

console.log(`Open database: ${dbPath}`);
const db = new Database(dbPath);

console.log(`Reading migration: ${migrationPath}`);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

try {
    console.log('Applying migration...');
    db.exec(migrationSql);
    console.log('Migration applied successfully!');

    // Verify table schema
    const tableInfo = db.pragma('table_info(generated_content)');
    console.log('Table Schema:', tableInfo);

    const userIdCol = tableInfo.find(c => c.name === 'user_id');
    if (userIdCol && userIdCol.type === 'TEXT') {
        console.log('✅ user_id is now TEXT.');
    } else {
        console.error('❌ user_id is NOT TEXT:', userIdCol);
    }

} catch (error) {
    console.error('Error applying migration:', error);
} finally {
    db.close();
}
