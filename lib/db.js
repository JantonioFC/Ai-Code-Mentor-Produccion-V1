const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuration
const DB_PATH = path.join(process.cwd(), 'database', 'sqlite', 'curriculum.db');

// Ensure DB exists or init it
if (!fs.existsSync(DB_PATH) && process.env.NODE_ENV !== 'test') {
    // In production/dev, we expect init-sqlite.js to have run via auto-setup
    // But we can lazy load it if needed (optional safety net)
    console.warn(`⚠️ [SQLite] Database not found at ${DB_PATH}`);
}

let dbInstance = null;

function getDb() {
    if (!dbInstance) {
        try {
            dbInstance = new Database(DB_PATH, {
                verbose: process.env.DB_VERBOSE === 'true' ? console.log : null
            });
            // Performance: WAL mode
            dbInstance.pragma('journal_mode = WAL');
            // Data Integrity (DAT-01): Enforce Foreign Keys
            dbInstance.pragma('foreign_keys = ON');
        } catch (err) {
            console.error('[SQLite] Connection failed:', err);
            throw err;
        }
    }
    return dbInstance;
}

const db = {
    // Raw query execution
    query: (sql, params = []) => {
        return getDb().prepare(sql).all(params);
    },

    // Get single result
    get: (sql, params = []) => {
        return getDb().prepare(sql).get(params);
    },

    // Execute statement (INSERT, UPDATE, DELETE)
    run: (sql, params = []) => {
        return getDb().prepare(sql).run(params);
    },

    // Raw exec (for migrations/scripts)
    exec: (sql) => {
        return getDb().exec(sql);
    },

    // Transaction helper
    transaction: (fn) => {
        return getDb().transaction(fn);
    },

    // Helper: Select with filters (mimics basic Supabase .from().select())
    // Ex: db.find('user_profiles', { email: '...' })
    find: (table, where = {}, select = '*') => {
        const keys = Object.keys(where);
        const whereClause = keys.length ? `WHERE ${keys.map(k => `${k} = ?`).join(' AND ')}` : '';
        const sql = `SELECT ${select} FROM ${table} ${whereClause}`;
        return getDb().prepare(sql).all(Object.values(where));
    },

    findOne: (table, where = {}, select = '*') => {
        const keys = Object.keys(where);
        const whereClause = keys.length ? `WHERE ${keys.map(k => `${k} = ?`).join(' AND ')}` : '';
        const sql = `SELECT ${select} FROM ${table} ${whereClause} LIMIT 1`;
        return getDb().prepare(sql).get(Object.values(where));
    },

    insert: (table, data) => {
        const keys = Object.keys(data);
        const cols = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`;
        return getDb().prepare(sql).run(Object.values(data));
    },

    update: (table, data, where) => {
        const dataKeys = Object.keys(data);
        const setClause = dataKeys.map(k => `${k} = ?`).join(', ');
        const whereKeys = Object.keys(where);
        const whereClause = whereKeys.map(k => `${k} = ?`).join(' AND ');

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const params = [...Object.values(data), ...Object.values(where)];
        return getDb().prepare(sql).run(params);
    },

    // Explicit close (mostly for tests)
    close: () => {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    },

    // Compatibility: Expose prepare method for legacy/custom queries
    prepare: (sql) => {
        return getDb().prepare(sql);
    }
};

module.exports = db;
