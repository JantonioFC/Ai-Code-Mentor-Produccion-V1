/**
 * CONFIGURACIÓN E2E - ECOSISTEMA 360
 * MISIÓN M-274: Inyección Híbrida Verdadera (Cookie + Storage)
 * 
 * Este archivo centraliza la configuración para tests E2E.
 * 
 * @author Mentor Coder
 * @version M-274
 */

/**
 * CONFIGURACIÓN DE AUTENTICACIÓN Y NAVEGACIÓN E2E
 */
const TEST_CONFIG = {
  // M-274: Credenciales de Usuario E2E (para inyección híbrida)
  TEST_USER_EMAIL: 'e2e-test@example.com',
  TEST_USER_ID: '11111111-1111-1111-1111-111111111111',
  
  // Credenciales Demo (legacy - para flujos de UI si es necesario)
  DEMO_EMAIL: 'demo@aicodementor.com',
  DEMO_PASSWORD: 'demo123',
  
  // M-274: Token Mock para Header HTTP + Storage
  // Este es el string exacto que el middleware (M-264) busca en modo E2E.
  // NO es un objeto JSON. Es un string simple (JWT mock).
  MOCK_TOKEN: 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5',
  E2E_MOCK_TOKEN: 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5', // Alias para compatibilidad

  // M-274: Clave de localStorage (RESTAURADA para inyección híbrida)
  E2E_TOKEN_KEY: 'sb-localhost-auth-token',
  
  // Timeouts ajustados para CI/CD
  LOGIN_TIMEOUT: 60000,
  REDIRECT_TIMEOUT: 90000,
  LOAD_TIMEOUT: 30000,
  API_TIMEOUT: 45000,
  NAVIGATION_TIMEOUT: 60000,
  
  // Páginas de la Aplicación
  PAGES: {
    HOME: 'http://localhost:3000',
    LOGIN: 'http://localhost:3000/login',
    PANEL: 'http://localhost:3000/panel-de-control',
    MODULOS: 'http://localhost:3000/modulos',
    SANDBOX: 'http://localhost:3000/sandbox',
    PORTFOLIO: 'http://localhost:3000/portfolio'
  }
};

// Exports individuales para conveniencia (CommonJS)
module.exports = {
  TEST_CONFIG,
  TEST_USER_EMAIL: TEST_CONFIG.TEST_USER_EMAIL,
  TEST_USER_ID: TEST_CONFIG.TEST_USER_ID,
  MOCK_TOKEN: TEST_CONFIG.MOCK_TOKEN,
  E2E_MOCK_TOKEN: TEST_CONFIG.E2E_MOCK_TOKEN,
  E2E_TOKEN_KEY: TEST_CONFIG.E2E_TOKEN_KEY
};
