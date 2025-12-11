/**
 * HELPER DE AUTENTICACIÓN E2E CENTRALIZADO
 * MISIÓN 230.9 - VUELTA AL FLUJO UI ESTÁNDAR
 * 
 * REVERSIÓN ARQUITECTÓNICA (M-230.9):
 * ==========================================
 * Después de intentos fallidos con inyección de tokens (M-23.6B, M-23.7, M-274),
 * volvemos al flujo de autenticación mediante UI real.
 * 
 * PROBLEMA DETECTADO:
 * La inyección programática de tokens es rechazada por el middleware del servidor.
 * Error 401 indica que el token, aunque válido en formato, no es aceptado por el servidor
 * cuando no proviene del flujo de autenticación real.
 * 
 * SOLUCIÓN K.I.S.S.:
 * Usar el flujo de autenticación exacto que usa el usuario real:
 * 1. Navegar a /login
 * 2. Llenar formulario
 * 3. Click en botón
 * 4. Esperar redirección
 * 
 * PRINCIPIO RECTOR:
 * "Si el usuario usa la UI, el test usa la UI".
 * 
 * @author Mentor Coder
 * @version v4.0 - Back to UI Flow (M-230.9)
 * 
 * HISTORY:
 * - v1.0-2.5: Intentos de optimización con flujo UI
 * - v2.6-2.7: Mecanismos de retry
 * - v3.0: Bypass con inyección de tokens (fallido)
 * - v4.0: Vuelta al flujo UI estándar (actual)
 */

/**
 * CONFIGURACIÓN DE CREDENCIALES DEMO Y NAVEGACIÓN
 */
const TEST_CONFIG = {
  // Credenciales Demo
  DEMO_EMAIL: 'demo@aicodementor.com',
  DEMO_PASSWORD: 'demo123',
  
  // Timeouts optimizados para flujo UI
  LOGIN_TIMEOUT: 15000,        // Tiempo para cargar página de login
  REDIRECT_TIMEOUT: 15000,     // Tiempo para redirección tras login
  LOAD_TIMEOUT: 10000,         // Tiempo para carga de elementos DOM
  NAVIGATION_TIMEOUT: 15000,   // Tiempo general de navegación
  
  // Páginas de la Aplicación
  PAGES: {
    HOME: 'http://localhost:3000',
    MODULOS: 'http://localhost:3000/modulos',
    SANDBOX: 'http://localhost:3000/sandbox',
    PORTFOLIO: 'http://localhost:3000/portfolio'
  }
};

// Función getSupabaseToken removida en M-230.9 - Vuelta al flujo UI real

/**
 * MISIÓN 230.9 - VUELTA AL FLUJO UI REAL
 * 
 * CAMBIO ARQUITECTÓNICO:
 * Después de múltiples intentos fallidos con inyección de tokens (M-23.6B, M-23.7),
 * volvemos al flujo estándar de autenticación mediante la interfaz de usuario.
 * 
 * JUSTIFICACIÓN:
 * La inyección programática de tokens es rechazada por el middleware del servidor (401).
 * Solo el flujo real de UI garantiza un token válido y aceptado por el servidor.
 * 
 * PRINCIPIO: "Si el usuario usa la UI, el test usa la UI".
 * 
 * FLUJO ESTÁNDAR:
 * 1. Navegar a /login
 * 2. Llenar formulario con credenciales demo
 * 3. Click en botón de login
 * 4. Esperar redirección automática al panel
 * 5. Validar presencia en /panel-de-control
 * 
 * @param {Page} page - Instancia de página de Playwright
 * @returns {Promise<void>}
 * 
 * @example
 * test.beforeEach(async ({ page }) => {
 *   await authenticateDemo(page); // Usa flujo UI real
 * });
 */
async function authenticateDemo(page) {
  console.log('🔐 [AUTH-UI] Iniciando autenticación estándar vía Formulario...');

  // 1. Navegar al Login y esperar carga completa
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // 2. Rellenar credenciales (Selectores robustos)
  // Usamos las credenciales de demo documentadas
  await page.fill('input[type="email"]', 'demo@aicodementor.com');
  await page.fill('input[type="password"]', 'demo123');

  // 3. Ejecutar acción de Login
  // Buscamos el botón por texto visible para ser resilientes a cambios de CSS
  await page.click('button:has-text("Acceso Demo Rápido")');

  // 4. Esperar Redirección Real (Punto Crítico de Validación)
  // Esperamos hasta 15s para dar tiempo al backend de procesar y redirigir.
  // Si esto pasa, el token es 100% válido para el servidor.
  await page.waitForURL('**/panel-de-control', { timeout: 15000 });

  // 5. Validación visual extra (opcional pero recomendada)
  await page.waitForSelector('h1', { state: 'visible' });

  console.log('✅ [AUTH-UI] Autenticación exitosa. Estamos en el Panel de Control.');
}

/**
 * Limpia el estado de autenticación (logout o limpieza de cookies)
 * MISIÓN 265 - FASE 2: Prevención de Test Pollution
 * 
 * @param {Page} page - Instancia de página de Playwright
 * @returns {Promise<void>}
 * 
 * @example
 * test.afterEach(async ({ page }) => {
 *   await cleanupAuth(page);
 * });
 */
async function cleanupAuth(page) {
  try {
    console.log('🧹 [AUTH-HELPER] Limpiando estado de autenticación...');
    
    // Navegar a página válida antes de limpiar storage
    try {
      await page.goto(TEST_CONFIG.PAGES.HOME, { timeout: 5000 });
      console.log('✅ [AUTH-HELPER] Navegado a página válida para cleanup');
    } catch (navError) {
      console.warn('⚠️  [AUTH-HELPER] No se pudo navegar para cleanup:', navError.message);
    }
    
    // Limpiar cookies
    await page.context().clearCookies();
    console.log('✅ [AUTH-HELPER] Cookies limpiadas');
    
    // Limpiar storage
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      console.log('✅ [AUTH-HELPER] Storage limpiado');
    } catch (storageError) {
      console.warn(`⚠️  [AUTH-HELPER] Error no crítico durante cleanup de storage: ${storageError.message}`);
    }
    
  } catch (error) {
    console.warn('⚠️  [AUTH-HELPER] Error durante cleanup:', error.message);
  }
}

module.exports = {
  authenticateDemo,
  cleanupAuth,
  TEST_CONFIG
};
