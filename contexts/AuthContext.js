/**
 * AuthContext - Contexto de Autenticación Básico
 * 
 * NOTA: Este es un contexto TEMPORAL para Fase 3 del Dashboard IRP.
 * En producción, este debe ser reemplazado con el sistema de autenticación
 * completo del Ecosistema 360.
 * 
 * ÚLTIMA ACTUALIZACIÓN (M-23.8): Agregada pausa crítica de 200ms para
 * permitir hidratación correcta del cliente Supabase antes de verificación
 * de autenticación en ProtectedRoute. Resuelve race condition en el flujo
 * de inicialización.
 * 
 * @author Mentor Coder
 * @version 1.1.0 (TEMPORAL - Hidratación Supabase)
 * @created 2025-10-05
 * @updated 2025-11-21 (M-23.8)
 * @mission 204.0 - Dashboard de Métricas IRP - Fase 3
 * @mission 23.8 - Corrección Race Condition Autenticación
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * Provider de autenticación temporal
 * 
 * TODO: Reemplazar con sistema de autenticación real del Ecosistema 360
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ⏱️ PAUSA CRÍTICA: Permitir hidratación de Supabase
    // El cliente de Supabase necesita ~200ms para inicializarse
    // y leer el token desde localStorage antes de que ProtectedRoute
    // verifique la autenticación. Sin esta pausa, se produce un
    // falso negativo que causa redirección incorrecta.
    const initializeAuth = async () => {
      // Esperar que Supabase complete su inicialización
      await new Promise(resolve => setTimeout(resolve, 200));
      
      loadUser();
    };
    
    // Simular carga de usuario desde localStorage o cookie
    const loadUser = () => {
      try {
        // Intentar cargar usuario de localStorage con manejo defensivo
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('access_token');

        // 🛡️ MANEJO DEFENSIVO: Validar antes de parsear JSON
        if (storedUser && storedToken && 
            storedUser !== 'null' && storedUser !== 'undefined' &&
            storedUser.trim() !== '') {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (parseError) {
            console.error('[AUTH] Error parsing stored user data:', parseError.message);
            console.warn('[AUTH] Clearing corrupted localStorage data');
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            // Fall through to create mock user
          }
        }
        
        // Si no hay usuario válido en localStorage, crear usuario mock
        if (!user) {
          // Usuario mock para desarrollo/testing
          // TODO: Remover en producción
          const mockUser = {
            id: 'mock-user-123',
            name: 'Usuario Demo',
            email: 'demo@ecosistema360.com',
            role: 'student'
          };
          
          const mockToken = 'mock-jwt-token-for-development';
          
          // Guardar en localStorage para persistencia
          localStorage.setItem('user', JSON.stringify(mockUser));
          localStorage.setItem('access_token', mockToken);
          
          setUser(mockUser);
          
          console.warn('⚠️ USANDO USUARIO MOCK - Reemplazar con autenticación real');
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    // Iniciar proceso de autenticación con hidratación de Supabase
    initializeAuth();
  }, []);

  /**
   * Login temporal
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      // TODO: Implementar llamada real a API de autenticación
      const mockUser = {
        id: 'user-' + Date.now(),
        name: email.split('@')[0],
        email,
        role: 'student'
      };
      
      const mockToken = 'jwt-token-' + Date.now();
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('access_token', mockToken);
      
      setUser(mockUser);
      setLoading(false);
      
      return { success: true, user: mockUser };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    setUser(null);
  };

  /**
   * Obtener token actual
   */
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
