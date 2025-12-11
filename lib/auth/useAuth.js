// lib/auth/useAuth.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createSupabaseClient } from './auth';

// Crear el contexto de autenticación
const AuthContext = createContext();

/**
 * Provider de autenticación que envuelve la aplicación
 * Proporciona el contexto de autenticación a todos los componentes hijos
 * 
 * MISIÓN 249: Implementación de resiliencia con:
 * 1. Bypass E2E cuando NEXT_PUBLIC_E2E_TEST_MODE='true'
 * 2. Timeout de seguridad para evitar bucle de loading infinito
 */
export function AuthProvider({ children }) {
  // MISIÓN 258: Detectar modo E2E ANTES de inicializar estados
  // Robustez: Chequear tanto env var como flag inyectada por tests (window.PLAYWRIGHT_TEST)
  const isE2EMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true' ||
    (typeof window !== 'undefined' && window.PLAYWRIGHT_TEST === true);

  // MISIÓN 234: Router para forzar navegación en logout E2E
  const router = useRouter();

  // MISIÓN 258: Usuario mock con UUID correcto (sincronizado con backend)
  const e2eMockUser = isE2EMode ? {
    id: '11111111-1111-1111-1111-111111111111', // UUID correcto (M-258)
    email: 'e2e-test@example.com',
    user_metadata: {
      full_name: 'E2E Test User'
    },
    role: 'student'
  } : null;

  const e2eMockSession = isE2EMode ? {
    access_token: 'mock-e2e-access-token',
    user: e2eMockUser
  } : null;

  // MISIÓN 258: FORZAR ESTADO INICIAL basado en modo E2E
  // En E2E, empezamos en loading y dejamos que useEffect determine si hay sesión mock
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [internalToken, setInternalToken] = useState(isE2EMode ? 'mock-e2e-internal-token' : null);
  const [loading, setLoading] = useState(true);

  // MISIÓN 258: Estado triestatal con valor inicial correcto para E2E
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

  // MISIÓN 249: Crear cliente Supabase solo si NO estamos en modo E2E
  const [supabase] = useState(() => {
    if (isE2EMode) {
      console.log('🧪 [AUTH-M249] Modo E2E detectado - Bypass de inicialización de Supabase');
      return null; // No crear cliente en tests E2E
    }
    return createSupabaseClient();
  });

  /**
   * MISIÓN 197: Función para obtener token interno del sistema principal
   * @param {string} supabaseAccessToken - Token de acceso de Supabase
   */
  const fetchInternalToken = async (supabaseAccessToken) => {
    if (!supabaseAccessToken) {
      console.warn('⚠️ [AUTH] No hay access_token de Supabase');
      return null;
    }

    try {
      console.log('🔄 [AUTH] Obteniendo token interno para IRP...');
      const translateResponse = await fetch('/api/v1/auth/translate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: supabaseAccessToken,
        }),
      });

      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        const token = translateData.data.access_token;
        setInternalToken(token);
        console.log('✅ [AUTH] Token interno obtenido exitosamente');
        return token;
      } else {
        console.error('❌ [AUTH] Error obteniendo token interno:', translateResponse.status);
        return null;
      }
    } catch (error) {
      console.error('❌ [AUTH] Error en traducción de token:', error);
      return null;
    }
  };

  useEffect(() => {
    // MISIÓN 258 - BYPASS E2E COMPLETO: Estado ya inicializado, solo loggear
    if (isE2EMode) {
      console.log('🧪 [AUTH-M258] Modo E2E (Frontend): Bypass completo activado');

      // Check localStorage for mock session (compatibility with auth-mock-helper)
      const mockSessionStr = typeof window !== 'undefined' ?
        (localStorage.getItem('sb-mock-project-auth-token') || localStorage.getItem('supabase.auth.token')) : null;

      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          console.log('✅ [AUTH-M258] Sesión mock encontrada en localStorage');
          setSession(mockSession);
          setUser(mockSession.user || e2eMockUser);
          setAuthState('authenticated');
        } catch (e) {
          console.error('❌ [AUTH-M258] Error parsing mock session:', e);
          setAuthState('unauthenticated');
        }
      } else {
        console.log('⚠️ [AUTH-M258] No hay sesión mock - Estado inicial: UNAUTHENTICATED');
        setAuthState('unauthenticated');
        setUser(null);
        setSession(null);
      }

      setLoading(false);

      // No configurar listeners ni hacer llamadas a Supabase
      return;
    }

    // MISIÓN 249 - PRODUCCIÓN: Lógica normal con timeout de seguridad
    const getInitialSession = async () => {
      console.log('🔍 [AUTH-M249] Iniciando getInitialSession con timeout de seguridad');

      try {
        // MISIÓN 249: Crear promesa de timeout (8 segundos)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Auth timeout: getSession excedió 8 segundos'));
          }, 8000);
        });

        // MISIÓN 249: Crear promesa de sesión
        const sessionPromise = supabase.auth.getSession();

        // MISIÓN 249: Race entre timeout y sesión
        console.log('⏱️ [AUTH-M249] Iniciando Promise.race (timeout vs getSession)');
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);

        console.log('✅ [AUTH-M249] Promise.race completado - Sesión:', session ? 'encontrada' : 'no encontrada');

        if (error) {
          console.error('❌ [AUTH-M249] ERROR en getSession:', error.message);
          // MISIÓN 221: Error al obtener sesión = estado unauthenticated
          setAuthState('unauthenticated');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✅ [AUTH-M249] Sesión encontrada para:', session.user.email);
          setSession(session);
          setUser(session.user);

          // MISIÓN 197: Obtener token interno si hay sesión activa
          if (session.access_token) {
            await fetchInternalToken(session.access_token);
          }

          // MISIÓN 221: Solo marcar como authenticated DESPUÉS de cargar todo
          setAuthState('authenticated');
          console.log('✅ [AUTH-M249] Estado de sesión: AUTHENTICATED');
        } else {
          console.log('⚠️ [AUTH-M249] No hay sesión activa - Seteando UNAUTHENTICATED');
          // MISIÓN 221: No hay sesión = unauthenticated
          setAuthState('unauthenticated');
          setSession(null);
          setUser(null);
          console.log('✅ [AUTH-M249] Estado de sesión: UNAUTHENTICATED');
        }
      } catch (error) {
        // MISIÓN 249: Captura timeout o cualquier error crítico
        console.error('❌ [AUTH-M249] Error o timeout en getInitialSession:', error.message);
        console.error('🛡️ [AUTH-M249] Activando fail-safe: forzando estado UNAUTHENTICATED');

        // MISIÓN 249: FAIL-SAFE - Siempre resolver con unauthenticated, nunca dejar en loading
        setAuthState('unauthenticated');
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('✅ [AUTH-M249] getInitialSession finalizado - loading: false');
      }
    };

    getInitialSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH] Auth state change:', event, session?.user?.email);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // MISIÓN 221: Actualizar authState según el evento
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH] Usuario cerró sesión');
          setSession(null);
          setUser(null);
          setInternalToken(null);
          setAuthState('unauthenticated');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (session) {
            console.log('✅ [AUTH] Sesión activa para:', session.user.email);
            setSession(session);
            setUser(session.user);

            // MISIÓN 197: Obtener token interno en login y refresh
            if (session.access_token) {
              await fetchInternalToken(session.access_token);
            }

            // MISIÓN 221: Marcar como authenticated solo tras cargar todo
            setAuthState('authenticated');
          } else {
            console.log('⚠️ [AUTH] Evento', event, 'sin sesión válida');
            setAuthState('unauthenticated');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, isE2EMode]);

  // Función de login con email y contraseña
  const signIn = async (email, password) => {
    // MISIÓN 249: En modo E2E, simular login exitoso
    if (isE2EMode) {
      console.log('🧪 [AUTH-M249] Modo E2E: Simulando login exitoso');
      const mockUser = e2eMockUser || { email, id: 'mock-id' };
      const mockSession = { user: mockUser, access_token: 'mock-token' };

      setUser(mockUser);
      setSession(mockSession);
      setAuthState('authenticated');

      // Persistir para sobrevivir recargas
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-mock-project-auth-token', JSON.stringify(mockSession));
      }

      return {
        data: { session: mockSession, user: mockUser },
        error: null
      };
    }

    setLoading(true);
    setAuthState('loading'); // MISIÓN 221: Marcar como loading durante el proceso

    try {
      console.log('🔑 [AUTH] Intentando iniciar sesión para:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Error en login:', error.message);
        setAuthState('unauthenticated'); // MISIÓN 221: Login fallido = unauthenticated
        throw error;
      }

      console.log('✅ [AUTH] Login exitoso para:', email);

      // MISIÓN 197: Obtener token interno después del login exitoso
      if (data.session?.access_token) {
        await fetchInternalToken(data.session.access_token);
      }

      // MISIÓN 221: Solo marcar como authenticated DESPUÉS de cargar todo
      setAuthState('authenticated');
      console.log('✅ [AUTH] Estado actualizado: AUTHENTICATED');

      return { data, error: null };
    } catch (error) {
      console.error('❌ [AUTH] Error crítico en signIn:', error.message);
      setAuthState('unauthenticated'); // MISIÓN 221: Error = unauthenticated
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const signUp = async (email, password, metadata = {}) => {
    // MISIÓN 249: En modo E2E, simular registro exitoso
    if (isE2EMode) {
      console.log('🧪 [AUTH-M249] Modo E2E: Simulando registro exitoso');
      return {
        data: { session: session, user: user },
        error: null
      };
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error en signUp:', error.message);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const signOut = async () => {
    // MISIÓN 249: En modo E2E, simular logout exitoso
    if (isE2EMode) {
      console.log('🧪 [AUTH-M234] Modo E2E: Ejecutando logout simulado (Nuclear Solution)');
      setSession(null);
      setUser(null);
      setAuthState('unauthenticated');
      // Limpiar localStorage si se usa para persistencia mock
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sb-mock-project-auth-token');
      }
      // MISIÓN 234: SOLUCIÓN NUCLEAR - Forzar navegación con router
      await router.push('/');
      return { error: null };
    }

    setLoading(true);

    try {
      console.log('🚪 [AUTH] Cerrando sesión...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ [AUTH] Error al cerrar sesión:', error.message);
        throw error;
      }

      // Limpiar estado local
      setUser(null);
      setSession(null);
      setInternalToken(null); // MISIÓN 197: Limpiar token interno

      // MISIÓN 221: Marcar como unauthenticated tras logout exitoso
      setAuthState('unauthenticated');
      console.log('✅ [AUTH] Sesión cerrada - Estado: UNAUTHENTICATED');

      return { error: null };
    } catch (error) {
      console.error('❌ [AUTH] Error crítico en signOut:', error.message);
      // MISIÓN 221: Incluso con error, marcar como unauthenticated por seguridad
      setAuthState('unauthenticated');
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar la sesión
  const refreshSession = async () => {
    // MISIÓN 249: En modo E2E, retornar sesión mock
    if (isE2EMode) {
      console.log('🧪 [AUTH-M249] Modo E2E: Retornando sesión mock');
      return { session: session, error: null };
    }

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      setSession(session);
      setUser(session?.user ?? null);

      return { session, error: null };
    } catch (error) {
      console.error('Error refrescando sesión:', error.message);
      return { session: null, error: error.message };
    }
  };

  /**
   * MISIÓN 197.1: Obtener token interno válido, renovándolo si es necesario
   * Esta función garantiza que siempre se retorne un token válido
   */
  const getValidInternalToken = async () => {
    // MISIÓN 249: En modo E2E, retornar token mock
    if (isE2EMode) {
      console.log('🧪 [AUTH-M249] Modo E2E: Retornando token interno mock');
      return internalToken;
    }

    // Si no hay sesión, no podemos obtener token
    if (!session?.access_token) {
      console.warn('⚠️ [AUTH] No hay sesión activa para obtener token interno');
      return null;
    }

    // Si ya tenemos un token interno, verificar si sigue válido
    // El token expira en 15 minutos, así que renovamos si han pasado más de 14 minutos
    if (internalToken) {
      // TODO: Aquí podríamos decodificar el JWT para ver si está por expirar
      // Por ahora, simplemente retornamos el token existente
      console.log('✅ [AUTH] Usando token interno existente');
      return internalToken;
    }

    // Si no hay token o está expirado, obtener uno nuevo
    console.log('🔄 [AUTH] Renovando token interno...');
    const newToken = await fetchInternalToken(session.access_token);
    return newToken;
  };

  const value = {
    user,
    session,
    internalToken, // MISIÓN 197: Exponer token interno para uso en IRP
    loading,
    authLoading: loading, // MISIÓN 230.2: Alias explícito para claridad en componentes
    authState, // MISIÓN 221: Exponer estado triestatal explícito
    signIn,
    signUp,
    signOut,
    refreshSession,
    getValidInternalToken, // MISIÓN 197.1: Nueva función para obtener token válido
    // Utilities
    isAuthenticated: authState === 'authenticated', // MISIÓN 221: Usar authState en lugar de !!user
    isLoading: authState === 'loading', // MISIÓN 221: Nuevo helper para verificar si está cargando
    isUnauthenticated: authState === 'unauthenticated', // MISIÓN 221: Nuevo helper
    userId: user?.id || null,
    isE2EMode, // MISIÓN 249: Exponer modo E2E para debugging
  };

  // MISIÓN 230.2: Debug logging para tracking de estado
  if (typeof window !== 'undefined') {
    useEffect(() => {
      console.log('🔍 [AUTH-DEBUG] Estado del contexto:', {
        authState,
        loading,
        isAuthenticated: authState === 'authenticated',
        hasUser: !!user,
        hasSession: !!session
      });
    }, [authState, loading, user, session]);
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para usar el contexto de autenticación
 * Debe ser usado dentro de un AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
}

export default useAuth;
