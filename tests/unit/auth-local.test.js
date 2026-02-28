/**
 * Unit Tests: lib/auth-local.js
 * Covers: registerUser, loginUser, generateTokenPair, generateToken,
 *         verifyToken, refreshAccessToken, revokeRefreshToken, verifyPAT
 */

import jwt from 'jsonwebtoken';

// --- Mocks (must be defined inside factory for hoisting) ---
jest.mock('../../lib/db.js', () => {
  const db = {
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn((fn) => fn),
  };
  return { __esModule: true, default: db };
});

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
  };
});

// Import after mocks are set up
import AuthLocal from '../../lib/auth-local.js';
import db from '../../lib/db.js';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret-key-safe-for-local-only';

// --- Helpers ---
function createValidToken(payload = {}) {
  return jwt.sign(
    {
      sub: 'user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      v: 1,
      ...payload,
    },
    SECRET_KEY,
    { expiresIn: '15m' }
  );
}

// --- Tests ---
describe('AuthLocal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== generateToken ====================
  describe('generateToken', () => {
    it('returns a valid JWT string', () => {
      const token = AuthLocal.generateToken('user-1', 'a@b.com', 1);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('encodes correct claims', () => {
      const token = AuthLocal.generateToken('user-1', 'a@b.com', 2);
      const decoded = jwt.verify(token, SECRET_KEY);
      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.aud).toBe('authenticated');
      expect(decoded.role).toBe('authenticated');
      expect(decoded.v).toBe(2);
    });

    it('sets expiration', () => {
      const token = AuthLocal.generateToken('user-1', 'a@b.com', 1);
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  // ==================== verifyToken ====================
  describe('verifyToken', () => {
    it('returns isValid true for valid token', () => {
      const token = createValidToken();
      const result = AuthLocal.verifyToken(token);
      expect(result.isValid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('authenticated');
    });

    it('strips Bearer prefix', () => {
      const token = createValidToken();
      const result = AuthLocal.verifyToken(`Bearer ${token}`);
      expect(result.isValid).toBe(true);
    });

    it('returns error for null token', () => {
      const result = AuthLocal.verifyToken(null);
      expect(result.error).toBe('Token no proporcionado');
    });

    it('returns error for undefined token', () => {
      const result = AuthLocal.verifyToken(undefined);
      expect(result.error).toBe('Token no proporcionado');
    });

    it('returns error for empty string', () => {
      const result = AuthLocal.verifyToken('');
      expect(result.error).toBe('Token no proporcionado');
    });

    it('returns isValid false for invalid token', () => {
      const result = AuthLocal.verifyToken('invalid.token.here');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token inválido o expirado');
    });

    it('returns isValid false for expired token', () => {
      const expired = jwt.sign(
        { sub: 'user-1', email: 'a@b.com' },
        SECRET_KEY,
        { expiresIn: '0s' }
      );
      const result = AuthLocal.verifyToken(expired);
      expect(result.isValid).toBe(false);
    });
  });

  // ==================== generateTokenPair ====================
  describe('generateTokenPair', () => {
    it('returns access token and refresh token', async () => {
      db.insert.mockReturnValue({ changes: 1 });

      const result = await AuthLocal.generateTokenPair('user-1', 'a@b.com', 1);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
    });

    it('stores refresh token in database', async () => {
      db.insert.mockReturnValue({ changes: 1 });

      await AuthLocal.generateTokenPair('user-1', 'a@b.com', 1);

      expect(db.insert).toHaveBeenCalledWith(
        'refresh_tokens',
        expect.objectContaining({
          user_id: 'user-1',
        })
      );
    });

    it('sets expiration 30 days in the future', async () => {
      db.insert.mockReturnValue({ changes: 1 });

      await AuthLocal.generateTokenPair('user-1', 'a@b.com', 1);

      const insertCall = db.insert.mock.calls[0][1];
      const expiresAt = new Date(insertCall.expires_at);
      const now = new Date();
      const diffDays = (expiresAt - now) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThanOrEqual(30);
    });
  });

  // ==================== registerUser ====================
  describe('registerUser', () => {
    it('returns error when user already exists', async () => {
      db.findOne.mockReturnValue({ id: 'existing', email: 'a@b.com', password_hash: 'hashed_pw' });

      const result = await AuthLocal.registerUser('a@b.com', 'pass123');
      expect(result.error).toBe('El usuario ya existe');
    });

    it('creates user and returns tokens on success', async () => {
      db.findOne.mockReturnValue(null);
      db.transaction.mockReturnValue(jest.fn());
      db.insert.mockReturnValue({ changes: 1 });

      const result = await AuthLocal.registerUser('new@test.com', 'pass123', 'John');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('new@test.com');
      expect(result.user.full_name).toBe('John');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('calls transaction for user creation', async () => {
      db.findOne.mockReturnValue(null);
      db.transaction.mockReturnValue(jest.fn());
      db.insert.mockReturnValue({ changes: 1 });

      await AuthLocal.registerUser('test@example.com', 'pass123');
      expect(db.transaction).toHaveBeenCalled();
    });

    it('returns generic error on exception', async () => {
      db.findOne.mockImplementation(() => { throw new Error('DB crash'); });

      const result = await AuthLocal.registerUser('a@b.com', 'pass');
      expect(result.error).toBe('Error registrando usuario');
    });
  });

  // ==================== loginUser ====================
  describe('loginUser', () => {
    it('returns user and tokens on successful login', async () => {
      db.findOne.mockReturnValue({
        id: 'user-1',
        email: 'a@b.com',
        display_name: 'Test User',
        password_hash: '$2a$12$hashedpassword',
      });
      db.insert.mockReturnValue({ changes: 1 });

      const result = await AuthLocal.loginUser('a@b.com', 'pass123');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('a@b.com');
      expect(result.user.display_name).toBe('Test User');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('returns error when password_hash is missing', async () => {
      db.findOne.mockReturnValue({
        id: 'user-1',
        email: 'a@b.com',
        display_name: 'Test User',
      });

      const result = await AuthLocal.loginUser('a@b.com', 'pass123');
      expect(result.error).toBe('Credenciales inválidas');
    });

    it('returns error on exception', async () => {
      db.findOne.mockImplementation(() => { throw new Error('DB down'); });

      const result = await AuthLocal.loginUser('a@b.com', 'pass');
      expect(result.error).toBe('Error de inicio de sesión');
    });
  });

  // ==================== refreshAccessToken ====================
  describe('refreshAccessToken', () => {
    it('returns new access token for valid refresh token', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      db.findOne
        .mockReturnValueOnce({ user_id: 'user-1', expires_at: futureDate.toISOString() })
        .mockReturnValueOnce({ id: 'user-1', email: 'a@b.com' });

      const result = await AuthLocal.refreshAccessToken('valid-refresh');
      expect(result.token).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('returns error for invalid/revoked refresh token', async () => {
      db.findOne.mockReturnValue(null);

      const result = await AuthLocal.refreshAccessToken('invalid');
      expect(result.error).toBe('Refresh token inválido o revocado');
    });

    it('returns error for expired refresh token', async () => {
      const pastDate = new Date('2020-01-01');
      db.findOne.mockReturnValue({
        user_id: 'user-1',
        expires_at: pastDate.toISOString(),
      });

      const result = await AuthLocal.refreshAccessToken('expired-token');
      expect(result.error).toBe('Refresh token expirado');
    });

    it('returns error when user not found', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      db.findOne
        .mockReturnValueOnce({ user_id: 'ghost', expires_at: futureDate.toISOString() })
        .mockReturnValueOnce(null);

      const result = await AuthLocal.refreshAccessToken('orphan-token');
      expect(result.error).toBe('Usuario no encontrado');
    });

    it('returns error on exception', async () => {
      db.findOne.mockImplementation(() => { throw new Error('boom'); });

      const result = await AuthLocal.refreshAccessToken('any');
      expect(result.error).toBe('Error al refrescar token');
    });
  });

  // ==================== revokeRefreshToken ====================
  describe('revokeRefreshToken', () => {
    it('returns true on success', async () => {
      db.update.mockReturnValue({ changes: 1 });

      const result = await AuthLocal.revokeRefreshToken('token-to-revoke');
      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(
        'refresh_tokens',
        { revoked: 1 },
        { token: 'token-to-revoke' }
      );
    });

    it('returns false on error', async () => {
      db.update.mockImplementation(() => { throw new Error('fail'); });

      const result = await AuthLocal.revokeRefreshToken('any');
      expect(result).toBe(false);
    });
  });

  // ==================== verifyPAT ====================
  describe('verifyPAT', () => {
    it('returns error for null token', () => {
      const result = AuthLocal.verifyPAT(null);
      expect(result.error).toBe('Formato de token inválido');
    });

    it('returns error for token without pat_ prefix', () => {
      const result = AuthLocal.verifyPAT('invalid-token');
      expect(result.error).toBe('Formato de token inválido');
    });

    it('returns isValid false when PAT not found in DB', () => {
      db.findOne.mockReturnValue(null);

      const result = AuthLocal.verifyPAT('pat_abc123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token no encontrado o revocado');
    });

    it('returns isValid false when associated user not found', () => {
      db.findOne
        .mockReturnValueOnce({ id: 'pat-1', user_id: 'ghost', label: 'test' })
        .mockReturnValueOnce(null);

      const result = AuthLocal.verifyPAT('pat_abc123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Usuario asociado no encontrado');
    });

    it('returns isValid true with user and label for valid PAT', () => {
      const mockUser = { id: 'user-1', email: 'a@b.com', display_name: 'Test' };
      db.findOne
        .mockReturnValueOnce({ id: 'pat-1', user_id: 'user-1', label: 'vscode' })
        .mockReturnValueOnce(mockUser);
      db.update.mockReturnValue({ changes: 1 });

      const result = AuthLocal.verifyPAT('pat_abc123');
      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.patLabel).toBe('vscode');
    });

    it('updates last_used_at on valid PAT verification', () => {
      db.findOne
        .mockReturnValueOnce({ id: 'pat-1', user_id: 'user-1', label: 'test' })
        .mockReturnValueOnce({ id: 'user-1', email: 'a@b.com' });
      db.update.mockReturnValue({ changes: 1 });

      AuthLocal.verifyPAT('pat_abc123');

      expect(db.update).toHaveBeenCalledWith(
        'personal_access_tokens',
        expect.objectContaining({ last_used_at: expect.any(String) }),
        { id: 'pat-1' }
      );
    });

    it('returns isValid false on internal error', () => {
      db.findOne.mockImplementation(() => { throw new Error('crash'); });

      const result = AuthLocal.verifyPAT('pat_abc123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Error interno verificando token');
    });
  });
});
