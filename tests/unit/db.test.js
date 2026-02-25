/**
 * Unit Tests: lib/db.js
 * Covers: query, get, run, exec, transaction, find, findOne, insert, update, close
 */

const Database = require('better-sqlite3');
const path = require('path');

// Mock better-sqlite3
const mockStatement = {
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
};

const mockDbInstance = {
  prepare: jest.fn(() => mockStatement),
  exec: jest.fn(),
  transaction: jest.fn((fn) => fn),
  pragma: jest.fn(),
  close: jest.fn(),
};

jest.mock('better-sqlite3', () => {
  return jest.fn(() => mockDbInstance);
});

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
}));

// Must require after mocks
let db;

describe('db module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module to get fresh db instance
    jest.resetModules();
    jest.mock('better-sqlite3', () => jest.fn(() => mockDbInstance));
    jest.mock('fs', () => ({ existsSync: jest.fn(() => true) }));
    db = require('../../lib/db.js');
  });

  // ==================== Initialization ====================
  describe('initialization', () => {
    it('enables WAL mode on first use', () => {
      db.query('SELECT 1');
      expect(mockDbInstance.pragma).toHaveBeenCalledWith('journal_mode = WAL');
    });

    it('enables foreign keys on first use', () => {
      db.query('SELECT 1');
      expect(mockDbInstance.pragma).toHaveBeenCalledWith('foreign_keys = ON');
    });
  });

  // ==================== query ====================
  describe('query', () => {
    it('executes SQL and returns all rows', () => {
      const rows = [{ id: 1 }, { id: 2 }];
      mockStatement.all.mockReturnValue(rows);

      const result = db.query('SELECT * FROM users');
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result).toEqual(rows);
    });

    it('passes params to the statement', () => {
      mockStatement.all.mockReturnValue([]);

      db.query('SELECT * FROM users WHERE id = ?', [1]);
      expect(mockStatement.all).toHaveBeenCalledWith([1]);
    });

    it('uses empty array as default params', () => {
      mockStatement.all.mockReturnValue([]);

      db.query('SELECT 1');
      expect(mockStatement.all).toHaveBeenCalledWith([]);
    });
  });

  // ==================== get ====================
  describe('get', () => {
    it('returns a single row', () => {
      const row = { id: 1, email: 'a@b.com' };
      mockStatement.get.mockReturnValue(row);

      const result = db.get('SELECT * FROM users WHERE id = ?', [1]);
      expect(result).toEqual(row);
    });

    it('returns undefined when no match', () => {
      mockStatement.get.mockReturnValue(undefined);

      const result = db.get('SELECT * FROM users WHERE id = ?', [999]);
      expect(result).toBeUndefined();
    });
  });

  // ==================== run ====================
  describe('run', () => {
    it('executes INSERT/UPDATE/DELETE statement', () => {
      mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 5 });

      const result = db.run('INSERT INTO users (email) VALUES (?)', ['a@b.com']);
      expect(result.changes).toBe(1);
    });
  });

  // ==================== exec ====================
  describe('exec', () => {
    it('executes raw SQL (for migrations)', () => {
      db.exec('CREATE TABLE test (id INTEGER)');
      expect(mockDbInstance.exec).toHaveBeenCalledWith('CREATE TABLE test (id INTEGER)');
    });
  });

  // ==================== transaction ====================
  describe('transaction', () => {
    it('wraps function in a transaction', () => {
      const fn = jest.fn();
      db.transaction(fn);
      expect(mockDbInstance.transaction).toHaveBeenCalledWith(fn);
    });
  });

  // ==================== find ====================
  describe('find', () => {
    it('returns all matching rows', () => {
      const rows = [{ id: 1, email: 'a@b.com' }];
      mockStatement.all.mockReturnValue(rows);

      const result = db.find('user_profiles', { email: 'a@b.com' });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'SELECT * FROM user_profiles WHERE email = ?'
      );
      expect(mockStatement.all).toHaveBeenCalledWith(['a@b.com']);
      expect(result).toEqual(rows);
    });

    it('builds WHERE with multiple conditions', () => {
      mockStatement.all.mockReturnValue([]);

      db.find('users', { email: 'a@b.com', role: 'admin' });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND role = ?'
      );
      expect(mockStatement.all).toHaveBeenCalledWith(['a@b.com', 'admin']);
    });

    it('returns all rows when no where clause', () => {
      mockStatement.all.mockReturnValue([]);

      db.find('users');
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT * FROM users ');
    });

    it('supports custom select columns', () => {
      mockStatement.all.mockReturnValue([]);

      db.find('users', { id: 1 }, 'id, email');
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'SELECT id, email FROM users WHERE id = ?'
      );
    });
  });

  // ==================== findOne ====================
  describe('findOne', () => {
    it('returns single matching row with LIMIT 1', () => {
      const row = { id: 1, email: 'a@b.com' };
      mockStatement.get.mockReturnValue(row);

      const result = db.findOne('user_profiles', { email: 'a@b.com' });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'SELECT * FROM user_profiles WHERE email = ? LIMIT 1'
      );
      expect(result).toEqual(row);
    });

    it('returns undefined when no match', () => {
      mockStatement.get.mockReturnValue(undefined);

      const result = db.findOne('users', { id: 'nonexistent' });
      expect(result).toBeUndefined();
    });
  });

  // ==================== insert ====================
  describe('insert', () => {
    it('generates correct INSERT statement', () => {
      mockStatement.run.mockReturnValue({ changes: 1 });

      db.insert('users', { email: 'a@b.com', display_name: 'Test' });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'INSERT INTO users (email, display_name) VALUES (?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(['a@b.com', 'Test']);
    });

    it('handles single column insert', () => {
      mockStatement.run.mockReturnValue({ changes: 1 });

      db.insert('tokens', { token: 'abc' });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'INSERT INTO tokens (token) VALUES (?)'
      );
    });
  });

  // ==================== update ====================
  describe('update', () => {
    it('generates correct UPDATE statement', () => {
      mockStatement.run.mockReturnValue({ changes: 1 });

      db.update('users', { display_name: 'New Name' }, { id: 'user-1' });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'UPDATE users SET display_name = ? WHERE id = ?'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(['New Name', 'user-1']);
    });

    it('handles multiple SET and WHERE columns', () => {
      mockStatement.run.mockReturnValue({ changes: 1 });

      db.update(
        'tokens',
        { revoked: 1, updated_at: '2026-01-01' },
        { user_id: 'u1', token: 'abc' }
      );
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(
        'UPDATE tokens SET revoked = ?, updated_at = ? WHERE user_id = ? AND token = ?'
      );
      expect(mockStatement.run).toHaveBeenCalledWith([1, '2026-01-01', 'u1', 'abc']);
    });
  });

  // ==================== close ====================
  describe('close', () => {
    it('closes the database instance', () => {
      // Trigger initialization first
      db.query('SELECT 1');
      db.close();
      expect(mockDbInstance.close).toHaveBeenCalled();
    });

    it('does not throw when called without open instance', () => {
      // Reset to get fresh module with no dbInstance
      jest.resetModules();
      jest.mock('better-sqlite3', () => jest.fn(() => mockDbInstance));
      jest.mock('fs', () => ({ existsSync: jest.fn(() => true) }));
      const freshDb = require('../../lib/db.js');
      expect(() => freshDb.close()).not.toThrow();
    });
  });
});
