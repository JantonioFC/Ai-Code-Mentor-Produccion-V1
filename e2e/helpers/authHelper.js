/**
 * HELPER DE AUTENTICACIÓN E2E - VERSIÓN 6.0 (LOCAL FIRST)
 * 
 * CAMBIO ARQUITECTÓNICO (Local-First):
 * La aplicación ahora utiliza "Auto-Login" con un usuario demo local.
 * No es necesaria la inyección de tokens de Supabase.
 * 
 * Este helper simplemente asegura que la navegación ocurra y
 * verifica que el usuario llegue al dashboard correctamente.
 * 
 * @version v6.0 - Local First Simplification
 */

const TEST_CONFIG = {
  // Ya no necesitamos credenciales reales, el app auto-loguea
  DEMO_EMAIL: 'demo@aicodementor.com',

  // Timeouts
  LOAD_TIMEOUT: 10000,
  NAVIGATION_TIMEOUT: 15000,

  PAGES: {
    HOME: 'http://localhost:3000',
    PANEL: 'http://localhost:3000/panel-de-control',
    MODULOS: 'http://localhost:3000/modulos',
    SANDBOX: 'http://localhost:3000/sandbox',
    PORTFOLIO: 'http://localhost:3000/portfolio'
  }
};

/**
 * AUTENTICACIÓN SIMPLIFICADA (AUTO-LOGIN / UI LOGIN)
 *
 * FASE 2 FIX: Navegar siempre a /login primero para evitar race condition
 * donde el client-side redirect tarda más que el wait de estabilización.
 *
 * @param {Page} page - Instancia de Playwright
 * @param {string} targetPath - Ruta destino (default: /panel-de-control)
 */
async function authenticateDemo(page, targetPath = '/panel-de-control') {
  console.log('🔐 [AUTH-LOCAL] Verificando login...');

  // FASE 2: Navegar a /login directamente para evitar race condition
  // El problema anterior: navegar a /panel-de-control, esperar 2s, y verificar URL
  // no era suficiente porque el client-side auth check tarda >2s en redirigir.
  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Esperar a que el formulario sea visible
  await page.waitForSelector('form', { state: 'visible', timeout: 15000 });
  console.log('🔒 [AUTH-LOCAL] Página de login cargada. Iniciando sesión...');

  // Llenar formulario
  await page.fill('input[type="email"]', TEST_CONFIG.DEMO_EMAIL);
  await page.fill('input[type="password"]', 'demo123');

  // Click en botón de login
  await page.click('button[type="submit"]');

  // Esperar navegación al dashboard
  console.log('🔒 [AUTH-LOCAL] Formulario enviado. Esperando redirección...');

  // FASE 2 FIX: Esperar solo por URL change o h1 del panel (NO "Bienvenido" que también
  // aparece en la página de login como "Bienvenido de Vuelta")
  await page.waitForURL(/panel-de-control/, { timeout: 45000, waitUntil: 'domcontentloaded' });

  // Esperar a que el panel se estabilice
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});

  console.log('✅ [AUTH-LOCAL] Navegación completada. URL:', page.url());
}

/**
 * Cleanup (No-op en local first, o reset de estado si fuera necesario)
 */
async function cleanupAuth(page) {
  // Nada crítico que limpiar en local-auto-login
  await page.evaluate(() => {
    delete window.PLAYWRIGHT_TEST;
  });
}

module.exports = {
  authenticateDemo,
  cleanupAuth,
  TEST_CONFIG
};
