// lib/auth/useAuth.js
// LOCAL-FIRST AUTHENTICATION PROVIDER (Real Implementation)
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

  // --- Functions (Defined with useCallback for stable references) ---

  const checkSession = useCallback(async (silent = false) => {
    try {
      console.log(`[USE-AUTH] Checking session (Client)... Silent: ${silent}`);
      if (!silent) setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`/api/auth/user?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAuthState('authenticated');
      } else {
        setUser(null);
        setAuthState('unauthenticated');
      }
    } catch (error) {
      console.error('[USE-AUTH] Session check error:', error.name === 'AbortError' ? 'Timeout' : error);
      setUser(null);
      setAuthState('unauthenticated');
    } finally {
      if (!silent) setLoading(false);
      // Ensure we don't get stuck if silent was true but interaction is needed
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('[USE-AUTH] Refreshing session...');
      const res = await fetch('/api/auth/refresh', { method: 'POST' });

      if (res.ok) {
        console.log('[USE-AUTH] Session refreshed, re-checking silently...');
        await checkSession(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }, [checkSession]);

  // Verificación inicial de sesión (solo una vez al montar)
  useEffect(() => {
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh cada 10 minutos (AccessToken dura 15m)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (authState === 'authenticated') {
        refreshSession();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [authState, refreshSession]);

  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || 'Error al iniciar sesión' };
      }

      setUser(data.user);
      setAuthState('authenticated');
      return { data, error: null };

    } catch (error) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: metadata.display_name
        })
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || 'Error al registrarse' };
      }

      setUser(data.user);
      setAuthState('authenticated');
      return { data, error: null };

    } catch (error) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      logger.error('Error signing out', error);
    } finally {
      setUser(null);
      setAuthState('unauthenticated');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return { error: null };
  }, []);

  const value = {
    user,
    session: user ? { user } : null,
    loading,
    authLoading: loading,
    authState,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export default useAuth;
