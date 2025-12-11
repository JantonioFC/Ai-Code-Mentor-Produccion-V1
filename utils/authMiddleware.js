// utils/authMiddleware.js - MIGRADO A @supabase/ssr
// MISIÓN 70.0 FASE 3 - MIGRACIÓN DE FUNCIONES DEPRECADAS COMPLETADA
// MISIÓN 69.1 FASE 3 - MIDDLEWARE DE AUTENTICACIÓN UNIFICADO
// MISIÓN 217.0 - SOPORTE PARA AUTHORIZATION HEADER (JWT Bearer Token)
// MISIÓN 218.0 - FIX: Aceptar tokens tanto de cookies como de Authorization header
// MISIÓN 251 - E2E TEST MODE: Bypass de autenticación para tests E2E
// Implementa detección automática de sesión y contexto de autenticación adaptativo

import { createServerClient } from '@supabase/ssr';

/**
 * Extrae el token de autenticación del request
 * Soporta tanto cookies (navegador) como Authorization header (API/tests)
 * 
 * @param {Object} req - Request object
 * @returns {string|null} Token JWT o null
 */
function extractAuthToken(req) {
  // Prioridad 1: Authorization header (Bearer token)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[AUTH-MIDDLEWARE] ✅ Token extraído del Authorization header');
    return token;
  }

  // Prioridad 2: Cookies (Supabase auth)
  // El cliente de Supabase manejará la extracción de cookies automáticamente
  console.log('[AUTH-MIDDLEWARE] ⚠️ No se encontró Authorization header, intentando con cookies...');
  return null;
}

/**
 * MISIÓN 251/254: Crea un contexto de autenticación mock para tests E2E
 * MISIÓN 254: Incluye cliente de Supabase REAL para operaciones de BD
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Mock auth context con cliente real de Supabase
 */
function createE2EMockContext(req, res) {
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111', // MISIÓN 257: UUID válido para queries de BD
    email: 'e2e-test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {
      provider: 'e2e-test',
      providers: ['e2e-test']
    },
    user_metadata: {
      name: 'E2E Test User',
      full_name: 'E2E Test User'
    },
    aud: 'authenticated',
    role: 'authenticated'
  };

  // 🔧 MISIÓN 254: Crear cliente REAL de Supabase usando credenciales de CI
  console.log('[AUTH-MIDDLEWARE] 🔧 [M-254] Creando cliente real de Supabase para modo E2E...');

  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          const cookieString = [
            `${name}=${value}`,
            'Path=/',
            options.httpOnly ? 'HttpOnly' : '',
            options.secure ? 'Secure' : '',
            `SameSite=${options.sameSite || 'Lax'}`,
            options.maxAge ? `Max-Age=${options.maxAge}` : ''
          ].filter(Boolean).join('; ');
          res.setHeader('Set-Cookie', cookieString);
        },
        remove(name, options) {
          res.setHeader('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        },
      }
    }
  );

  console.log('[AUTH-MIDDLEWARE] ✅ [M-254] Cliente de Supabase real inicializado para E2E');

  return {
    isAuthenticated: true,
    user: mockUser,
    userId: mockUser.id,
    email: mockUser.email,
    authError: null,
    supabaseClient: supabaseClient, // ✅ Cliente REAL en lugar de null
    e2eMode: true // Flag para identificar modo E2E
  };
}

/**
 * Middleware de autenticación opcional que detecta automáticamente el estado de sesión
 * e inyecta contexto de autenticación en el request.
 * 
 * Soporta autenticación vía:
 * - Cookies de Supabase (navegador)
 * - Authorization header con Bearer token (API/tests)
 * - MISIÓN 251: E2E Test Mode bypass (tests automatizados)
 * 
 * Este middleware permite que un endpoint maneje tanto usuarios autenticados como anónimos
 * sin requerir duplicación de rutas (-secure vs base).
 * 
 * @param {Function} handler - Handler del endpoint API
 * @returns {Function} Handler wrapeado con contexto de autenticación
 */
export function withOptionalAuth(handler) {
  return async (req, res) => {
    console.log('[AUTH-MIDDLEWARE] Iniciando detección de autenticación...');
    console.log(`[AUTH-MIDDLEWARE] Método: ${req.method}, URL: ${req.url}`);

    // 🧪 MISIÓN 251/254: Detectar modo E2E y crear contexto mock con cliente real
    const isE2EMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

    if (isE2EMode) {
      console.log('[AUTH-MIDDLEWARE] 🧪 [M-251/254] MODO E2E DETECTADO - Bypass de autenticación activado');
      req.authContext = createE2EMockContext(req, res);
      // MISIÓN 254: También adjuntar cliente directamente en req para compatibilidad
      req.supabaseClient = req.authContext.supabaseClient;
      req.user = req.authContext.user;
      console.log('[AUTH-MIDDLEWARE] ✅ [M-254] Contexto mock + cliente real inyectados');
      console.log('[AUTH-MIDDLEWARE] 🧪 Usuario mock: e2e-test@example.com');
      console.log('[AUTH-MIDDLEWARE] 🔧 Cliente Supabase: REAL (conectado a BD)');
      return await handler(req, res);
    }

    try {
      // 🆕 MISIÓN 218.0: Extraer token del Authorization header si existe
      const bearerToken = extractAuthToken(req);

      if (bearerToken) {
        console.log('[AUTH-MIDDLEWARE] 🔑 Token Bearer detectado en header');
      } else {
        console.log('[AUTH-MIDDLEWARE] 🍪 Intentando autenticación con cookies');
      }

      // Crear cliente Supabase para autenticación con @supabase/ssr
      const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              const cookieValue = req.cookies[name];
              if (cookieValue) {
                console.log(`[AUTH-MIDDLEWARE] Cookie encontrada: ${name}`);
              }
              return cookieValue;
            },
            set(name, value, options) {
              // Para Pages Router, usar res.setHeader para cookies
              const cookieString = [
                `${name}=${value}`,
                'Path=/',
                options.httpOnly ? 'HttpOnly' : '',
                options.secure ? 'Secure' : '',
                `SameSite=${options.sameSite || 'Lax'}`,
                options.maxAge ? `Max-Age=${options.maxAge}` : ''
              ].filter(Boolean).join('; ');

              res.setHeader('Set-Cookie', cookieString);
            },
            remove(name, options) {
              res.setHeader('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
            },
          },
          // 🆕 MISIÓN 218.0: Si hay token en Authorization header, configurar sesión global
          global: bearerToken ? {
            headers: {
              Authorization: `Bearer ${bearerToken}`
            }
          } : undefined
        }
      );

      // Intentar obtener sesión y usuario actual
      let user = null;
      let authError = null;

      if (bearerToken) {
        // 🆕 MISIÓN 218.0: Si hay Bearer token, usar getUser con el token
        console.log('[AUTH-MIDDLEWARE] 🔍 Validando Bearer token con Supabase...');
        const result = await supabaseClient.auth.getUser(bearerToken);
        user = result.data?.user || null;
        authError = result.error;

        if (user) {
          console.log(`[AUTH-MIDDLEWARE] ✅ Token válido para usuario: ${user.email}`);
        } else {
          console.log(`[AUTH-MIDDLEWARE] ❌ Token inválido o expirado`);
          if (authError) {
            console.log(`[AUTH-MIDDLEWARE]    Error: ${authError.message}`);
          }
        }
      } else {
        // Si no hay Bearer token, intentar con cookies
        console.log('[AUTH-MIDDLEWARE] 🔍 Intentando autenticación con cookies...');
        const result = await supabaseClient.auth.getUser();
        user = result.data?.user || null;
        authError = result.error;

        if (user) {
          console.log(`[AUTH-MIDDLEWARE] ✅ Cookie válida para usuario: ${user.email}`);
        } else {
          console.log(`[AUTH-MIDDLEWARE] ❌ No hay sesión activa en cookies`);
        }
      }

      // Determinar estado de autenticación
      const isAuthenticated = !authError && !!user;

      if (isAuthenticated) {
        console.log(`[AUTH-MIDDLEWARE] ✅ Usuario autenticado: ${user.email}`);
      } else {
        console.log('[AUTH-MIDDLEWARE] ❌ Usuario no autenticado o sesión inválida');
        if (authError) {
          console.log(`[AUTH-MIDDLEWARE]    Error de autenticación: ${authError.message}`);
        }
      }

      // Inyectar contexto de autenticación en el request
      req.authContext = {
        isAuthenticated,
        user: user || null,
        userId: user?.id || null,
        email: user?.email || null,
        authError: authError || null,
        supabaseClient // Opcional: permitir acceso al cliente para operaciones específicas
      };

      console.log(`[AUTH-MIDDLEWARE] Contexto inyectado - Auth: ${isAuthenticated}`);

      // Ejecutar handler original con contexto enriquecido
      return await handler(req, res);

    } catch (error) {
      console.error('[AUTH-MIDDLEWARE] ❌ Error crítico en middleware:', error);

      // En caso de error crítico, inyectar contexto de emergencia
      req.authContext = {
        isAuthenticated: false,
        user: null,
        userId: null,
        email: null,
        authError: error,
        supabaseClient: null
      };

      console.log('[AUTH-MIDDLEWARE] Contexto de emergencia inyectado - continuando...');

      // Continuar con handler original (degradación elegante)
      return await handler(req, res);
    }
  };
}

/**
 * Middleware de autenticación requerida - falla si no hay usuario autenticado
 * Útil para endpoints que requieren autenticación obligatoria.
 * 
 * MISIÓN 251: Soporta bypass en modo E2E para tests automatizados
 * 
 * @param {Function} handler - Handler del endpoint API
 * @returns {Function} Handler wrapeado con validación de autenticación
 */
export function withRequiredAuth(handler) {
  return withOptionalAuth(async (req, res) => {
    const { isAuthenticated, authError, e2eMode } = req.authContext;

    // 🧪 MISIÓN 251: En modo E2E, el contexto mock ya está autenticado
    if (e2eMode) {
      console.log('[AUTH-MIDDLEWARE] 🧪 [M-251] Modo E2E - Autenticación mock activa');
      return await handler(req, res);
    }

    if (!isAuthenticated) {
      console.log('[AUTH-MIDDLEWARE] ❌ Acceso denegado - autenticación requerida');

      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        code: 'AUTHENTICATION_REQUIRED',
        details: (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') ? {
          authError: authError?.message || 'Auth session missing!',
          suggested_action: 'Usuario debe iniciar sesión',
          hint: 'Envíe el token en el header Authorization: Bearer <token> o en cookies'
        } : undefined
      });
    }

    console.log('[AUTH-MIDDLEWARE] ✅ Autenticación verificada - procediendo...');
    return await handler(req, res);
  });
}

/**
 * Utilidad para crear respuestas adaptativas basadas en estado de autenticación
 * Facilita el patrón de respuesta condicional en endpoints unificados.
 * 
 * @param {Object} req - Request object con authContext inyectado
 * @param {Object} authenticatedResponse - Respuesta para usuarios autenticados
 * @param {Object} anonymousResponse - Respuesta para usuarios anónimos
 * @returns {Object} Respuesta apropiada según estado de autenticación
 */
export function createAdaptiveResponse(req, authenticatedResponse, anonymousResponse) {
  const { isAuthenticated } = req.authContext;

  if (isAuthenticated) {
    console.log('[AUTH-MIDDLEWARE] Generando respuesta para usuario autenticado');
    return {
      success: true,
      authenticated: true,
      data: authenticatedResponse,
      timestamp: new Date().toISOString()
    };
  } else {
    console.log('[AUTH-MIDDLEWARE] Generando respuesta para usuario anónimo');
    return {
      success: true,
      authenticated: false,
      data: anonymousResponse,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Utilidad para logging de contexto de autenticación
 * Útil para debugging y monitoreo de uso del middleware.
 * 
 * @param {Object} req - Request object con authContext
 * @param {string} endpointName - Nombre del endpoint para logging
 */
export function logAuthContext(req, endpointName) {
  const { isAuthenticated, userId, email, authError, e2eMode } = req.authContext;

  console.log(`[AUTH-CONTEXT] ${endpointName}:`);
  console.log(`   Autenticado: ${isAuthenticated}`);
  console.log(`   Usuario ID: ${userId || 'N/A'}`);
  console.log(`   Email: ${email || 'N/A'}`);

  if (e2eMode) {
    console.log(`   🧪 Modo E2E: Activo`);
  }

  if (authError) {
    console.log(`   Error Auth: ${authError.message}`);
  }
}
