/**
 * Tests: lib/auth/useAuth.js (React Hook)
 * Covers: AuthProvider, useAuth, signIn, signUp, signOut, checkSession
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../lib/auth/useAuth.js';

// --- Mock fetch ---
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock logger
jest.mock('../../lib/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

// --- Helpers ---
function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function resp(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

/**
 * Sets up fetch mock to handle the initial session check flow.
 * On mount, useAuth calls GET /api/auth/user, then POST /api/auth/refresh if 401.
 */
function setupInitialSession(user = null) {
  if (user) {
    // Session valid
    mockFetch.mockImplementation((url) => {
      if (url && url.toString().includes('/api/auth/user')) return Promise.resolve(resp(200, { user }));
      if (url === '/api/auth/refresh') return Promise.resolve(resp(200, {}));
      return Promise.resolve(resp(200, {}));
    });
  } else {
    // Session invalid
    mockFetch.mockImplementation((url) => {
      if (url && url.toString().includes('/api/auth/user')) return Promise.resolve(resp(401, { error: 'No session' }));
      if (url === '/api/auth/refresh') return Promise.resolve(resp(401, { error: 'No refresh' }));
      return Promise.resolve(resp(200, {}));
    });
  }
}

// Save/restore location
const originalLocation = window.location;

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  // ==================== Context ====================
  describe('context', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth debe ser usado dentro de un AuthProvider');
      consoleSpy.mockRestore();
    });

    it('provides initial loading state', () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.loading).toBe(true);
      expect(result.current.authState).toBe('loading');
    });
  });

  // ==================== checkSession ====================
  describe('checkSession', () => {
    it('sets authenticated state when session is valid', async () => {
      const user = { id: 'u1', email: 'test@test.com' };
      setupInitialSession(user);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toEqual(user);
      expect(result.current.authState).toBe('authenticated');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets unauthenticated when session check and refresh both fail', async () => {
      setupInitialSession(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.authState).toBe('unauthenticated');
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets unauthenticated on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.authState).toBe('unauthenticated');
    });
  });

  // ==================== signIn ====================
  describe('signIn', () => {
    it('returns user data on successful login', async () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Override mock for login call + subsequent session re-checks
      const user = { id: 'u1', email: 'a@b.com' };
      const userData = { user, token: 'jwt' };
      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/login') return Promise.resolve(resp(200, userData));
        if (url && url.toString().includes('/api/auth/user')) return Promise.resolve(resp(200, { user }));
        return Promise.resolve(resp(200, {}));
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.signIn('a@b.com', 'pass123');
      });

      expect(loginResult.error).toBeNull();
      expect(loginResult.data.user).toEqual(user);
      expect(result.current.authState).toBe('authenticated');
    });

    it('returns error on failed login', async () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/login') return Promise.resolve(resp(401, { error: 'Credenciales inválidas' }));
        return Promise.resolve(resp(401, {}));
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.signIn('bad@b.com', 'wrong');
      });

      expect(loginResult.error).toBe('Credenciales inválidas');
    });

    it('returns error on network failure', async () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/login') return Promise.reject(new Error('Network down'));
        return Promise.resolve(resp(401, {}));
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.signIn('a@b.com', 'pass');
      });

      expect(loginResult.error).toBe('Network down');
    });
  });

  // ==================== signUp ====================
  describe('signUp', () => {
    it('returns user data on successful registration', async () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      const user = { id: 'u2', email: 'new@b.com' };
      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/register') return Promise.resolve(resp(200, { user }));
        if (url && url.toString().includes('/api/auth/user')) return Promise.resolve(resp(200, { user }));
        return Promise.resolve(resp(200, {}));
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@b.com', 'pass', { display_name: 'New' });
      });

      expect(signUpResult.error).toBeNull();
      expect(result.current.authState).toBe('authenticated');
    });

    it('sends display_name in request body', async () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/register') return Promise.resolve(resp(200, { user: { id: 'u2' } }));
        return Promise.resolve(resp(200, {}));
      });

      await act(async () => {
        await result.current.signUp('a@b.com', 'pass', { display_name: 'Juan' });
      });

      const registerCall = mockFetch.mock.calls.find(
        (call) => call[0] === '/api/auth/register'
      );
      expect(registerCall).toBeDefined();
      const body = JSON.parse(registerCall[1].body);
      expect(body.display_name).toBe('Juan');
    });

    it('returns error on failed registration', async () => {
      setupInitialSession(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/register') return Promise.resolve(resp(409, { error: 'El usuario ya existe' }));
        return Promise.resolve(resp(401, {}));
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('dup@b.com', 'pass');
      });

      expect(signUpResult.error).toBe('El usuario ya existe');
    });
  });

  // ==================== signOut ====================
  describe('signOut', () => {
    it('clears user state and redirects to /', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      setupInitialSession(user);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      // After signOut, useEffect reruns checkSession - mock it as unauthenticated
      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/logout') return Promise.resolve(resp(200, {}));
        if (url && url.toString().includes('/api/auth/user')) return Promise.resolve(resp(401, {}));
        if (url === '/api/auth/refresh') return Promise.resolve(resp(401, {}));
        return Promise.resolve(resp(200, {}));
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.authState).toBe('unauthenticated');
      expect(window.location.href).toMatch(/\/$/); // '/' or 'http://localhost/'
    });

    it('clears state even if logout API fails', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      setupInitialSession(user);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/logout') return Promise.reject(new Error('Server error'));
        if (url && url.toString().includes('/api/auth/user')) return Promise.resolve(resp(401, {}));
        if (url === '/api/auth/refresh') return Promise.resolve(resp(401, {}));
        return Promise.resolve(resp(200, {}));
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.authState).toBe('unauthenticated');
    });
  });

  // ==================== session object ====================
  describe('session object', () => {
    it('returns session with user when authenticated', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      setupInitialSession(user);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      expect(result.current.session).toEqual({ user });
    });

    it('returns null session when not authenticated', async () => {
      setupInitialSession(null);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.session).toBeNull();
    });
  });
});
