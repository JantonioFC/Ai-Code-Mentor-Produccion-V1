const Database = require('better-sqlite3');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'database', 'sqlite', 'curriculum.db');

// Colors
const c = { green: '\x1b[32m', cyan: '\x1b[36m', red: '\x1b[31m', reset: '\x1b[0m', yellow: '\x1b[33m' };
const log = (msg, color = 'reset') => console.log(`${c[color]}${msg}${c.reset}`);

function migrate() {
    log('🚀 Starting Auth Persistence Migration...', 'cyan');

    if (!require('fs').existsSync(DB_PATH)) {
        log(`❌ Database not found at ${DB_PATH}`, 'red');
        process.exit(1);
    }

    const db = new Database(DB_PATH);
    log(`✅ Connected to ${DB_PATH}`, 'green');

    try {
        log('📊 Checking schema...', 'cyan');

        // Check if column exists
        const tableInfo = db.pragma('table_info(users)');
        const hasVersion = tableInfo.some(col => col.name === 'token_version');

        if (!hasVersion) {
            log('✨ Adding token_version column...', 'yellow');
            db.exec(`ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1;`);
            log('✅ Column added.', 'green');
        } else {
            log('ℹ️ Column token_version already exists.', 'dim');
        }

        log('✅ Schema migration applied successfully.', 'green');

    } catch (error) {
        log(`❌ Migration Error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        db.close();
        log('🔒 Connection closed.', 'dim');
    }
}

// Run
migrate();
