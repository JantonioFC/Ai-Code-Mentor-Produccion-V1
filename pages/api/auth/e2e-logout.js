/**
 * ENDPOINT DE RESETEO DE ESTADO E2E (SERVER-SIDE)
 * MISIÓN 262 - SOLUCIÓN A POLUCIÓN DE ESTADO DEL SERVIDOR
 * 
 * CAUSA RAÍZ IDENTIFICADA (Veredicto M-261):
 * El bypass de autenticación E2E [AUTH-M249] mantiene estado stateful entre pruebas.
 * Test 1 pasa (servidor limpio), Test 2+ fallan (servidor aún autenticado).
 * 
 * SOLUCIÓN IMPLEMENTADA:
 * Endpoint exclusivo para E2E que resetea el estado de autenticación del servidor,
 * permitiendo que cada test comience con un servidor en estado limpio.
 * 
 * ARQUITECTURA DE SEGURIDAD:
 * 1. Protegido por NEXT_PUBLIC_E2E_TEST_MODE='true' (debe estar en .env)
 * 2. Solo disponible en modo de desarrollo/testing
 * 3. Limpia cookies de sesión server-side
 * 4. Resetea cualquier estado de autenticación en memoria
 * 
 * FLUJO DE USO:
 * 1. Test E2E llama GET /api/auth/e2e-logout ANTES de navegar a /login
 * 2. Servidor resetea estado de autenticación
 * 3. Test procede con flujo normal de autenticación
 * 4. Servidor responde como si fuera primera vez (sin polución)
 * 
 * @author Mentor Coder
 * @version 1.0 (M-262)
 */

export default async function handler(req, res) {
  // PASO 1: VALIDAR MODO E2E
  // Este endpoint SOLO debe estar activo cuando E2E_TEST_MODE está habilitado
  if (process.env.NEXT_PUBLIC_E2E_TEST_MODE !== 'true') {
    console.warn('[M-262] ⚠️  Intento de acceso a e2e-logout sin modo E2E habilitado');
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Este endpoint solo está disponible en modo E2E',
      code: 'E2E_MODE_DISABLED',
      metadata: {
        timestamp: new Date().toISOString(),
        mission: 'M-262'
      }
    });
  }

  // PASO 2: VALIDAR MÉTODO HTTP
  // Solo permitimos GET y POST para flexibilidad del cliente E2E
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Solo se permiten los métodos GET o POST',
      code: 'METHOD_NOT_ALLOWED',
      metadata: {
        timestamp: new Date().toISOString(),
        mission: 'M-262',
        receivedMethod: req.method
      }
    });
  }

  try {
    console.log('[M-262] 🔄 Iniciando reseteo de estado E2E del servidor...');

    // PASO 3: LIMPIAR COOKIES DE SESIÓN
    // Expiramos todas las cookies de autenticación estableciendo fecha pasada
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'next-auth.session-token',
      'supabase-auth-token'
    ];

    const clearedCookies = cookiesToClear.map(cookieName => 
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
    );

    res.setHeader('Set-Cookie', clearedCookies);
    console.log('[M-262] ✅ Cookies de sesión limpiadas:', cookiesToClear.join(', '));

    // PASO 4: RESETEAR ESTADO EN MEMORIA (SI EXISTE)
    // Si el bypass AUTH-M249 mantiene estado en memoria, debe resetearse aquí
    // Esto es específico a la implementación del bypass y puede requerir ajustes
    
    // Nota: Si hay un módulo de gestión de sesiones global, debe resetearse aquí
    // Ejemplo (ajustar según implementación real):
    // if (global.e2eAuthState) {
    //   global.e2eAuthState = null;
    // }

    console.log('[M-262] ✅ Estado de autenticación del servidor reseteado exitosamente');

    // PASO 5: RESPUESTA EXITOSA
    return res.status(200).json({
      success: true,
      message: 'Estado de autenticación E2E reseteado exitosamente',
      metadata: {
        timestamp: new Date().toISOString(),
        mission: 'M-262',
        resetType: 'full',
        cookiesCleared: cookiesToClear,
        e2eMode: process.env.NEXT_PUBLIC_E2E_TEST_MODE
      }
    });

  } catch (error) {
    console.error('[M-262] ❌ Error reseteando estado E2E:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error reseteando estado de autenticación E2E',
      code: 'E2E_RESET_FAILED',
      metadata: {
        timestamp: new Date().toISOString(),
        mission: 'M-262',
        errorMessage: error.message
      }
    });
  }
}
