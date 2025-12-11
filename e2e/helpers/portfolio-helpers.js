/**
 * Portfolio Test Helpers - WITH AUTH MOCK
 * Misión 219.0.2 - Tests con Autenticación Mockeada
 */

const { expect } = require('@playwright/test');
const { setupAuthenticatedPage } = require('./auth-mock-helper');

/**
 * Setup completo para tests de Portfolio
 * Incluye navegación + autenticación mockeada
 * 
 * @param {Page} page - Página de Playwright
 * @param {Object} options - Opciones de configuración
 * @param {string} options.email - Email del usuario mockeado
 * @param {string} options.userId - ID del usuario
 */
async function setupPortfolioTest(page, options = {}) {
  const url = 'http://localhost:3000/portfolio';
  
  // Usar helper de auth que configura todo
  await setupAuthenticatedPage(page, url, options);
  
  // Esperar a que el componente principal esté visible
  // Usar timeout más largo para dar tiempo a que cargue
  await page.waitForSelector('h1:has-text("Gestión de Portfolio")', { 
    timeout: 15000,
    state: 'visible'
  });
  
  console.log('✅ [TEST] Portfolio test setup completo');
}

/**
 * Mock de API de exportación de portfolio
 * @param {Page} page - Página de Playwright
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.shouldSucceed - Si debe tener éxito (default: true)
 * @param {number} options.delay - Delay en ms (default: 0)
 */
async function mockExportPortfolioAPI(page, options = {}) {
  const {
    shouldSucceed = true,
    delay = 0
  } = options;
  
  await page.route('**/api/export-portfolio', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (shouldSucceed) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          downloadUrl: 'http://example.com/portfolio-test.pdf',
          metadata: {
            format: 'pdf',
            size: 102400,
            pages: 10,
            sections: 6
          }
        })
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Export failed - Test error'
        })
      });
    }
  });
}

/**
 * Mock de API de reset de sistema
 * @param {Page} page - Página de Playwright
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.shouldSucceed - Si debe tener éxito (default: true)
 * @param {number} options.delay - Delay en ms (default: 0)
 */
async function mockResetSystemAPI(page, options = {}) {
  const {
    shouldSucceed = true,
    delay = 0
  } = options;
  
  await page.route('**/api/reset-system', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (shouldSucceed) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          archiveUrl: 'http://example.com/archive-test.zip',
          preResetExportUrl: 'http://example.com/backup-test.zip',
          newCycleId: 'cycle-test-123',
          metadata: {
            previousEntries: 10,
            newEntries: 0
          }
        })
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Reset failed - Test error'
        })
      });
    }
  });
}

/**
 * Verificar que el tab especificado esté activo
 * CORRECCIÓN MISIÓN 219.2: Usar .last() para seleccionar tab real (no sidebar)
 * @param {Page} page - Página de Playwright
 * @param {string} tabName - Nombre del tab ('Export Portfolio' o 'Gestión de Ciclos')
 */
async function expectTabToBeActive(page, tabName) {
  // Hay DOS botones con el mismo texto: uno en sidebar, otro en tabs
  // Usamos .last() para seleccionar el tab real (el segundo botón)
  const tab = page.locator(`button:has-text("${tabName}")`).last();
  await expect(tab).toHaveClass(/from-blue-500/); // Tiene degradado azul cuando activo
}

/**
 * Cambiar al tab especificado
 * CORRECCIÓN MISIÓN 219.4: Usar JavaScript directo para bypasear portal bloqueador
 * @param {Page} page - Página de Playwright
 * @param {string} tabName - Nombre del tab
 */
async function switchToTab(page, tabName) {
  // Hay DOS botones con el mismo texto: uno en sidebar, otro en tabs
  // Usamos .last() para seleccionar el tab real (el segundo botón)
  const tabButton = page.locator(`button:has-text("${tabName}")`).last();
  
  // Esperar a que el tab sea visible
  await tabButton.waitFor({ state: 'visible', timeout: 10000 });
  
  // SOLUCIÓN: Usar JavaScript para hacer el click y bypasear el portal bloqueador
  // El <nextjs-portal> intercepta eventos de pointer pero no puede bloquear JavaScript
  await tabButton.evaluate(node => node.click());
  
  // Esperar a que el tab cambie de estado (debe tener la clase activa)
  await expect(tabButton).toHaveClass(/from-blue-500/, { timeout: 5000 });
  
  await page.waitForTimeout(300); // Pequeña pausa para animaciones
}

/**
 * Utility: Esperar a que el elemento esté visible con timeout personalizado
 * @param {Page} page - Página de Playwright
 * @param {string} selector - Selector del elemento
 * @param {number} timeout - Timeout en ms (default: 5000)
 */
async function waitForVisible(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Utility: Click y esperar navegación
 * @param {Page} page - Página de Playwright
 * @param {string} selector - Selector del elemento a hacer click
 */
async function clickAndWait(page, selector) {
  await page.click(selector);
  await page.waitForTimeout(300); // Pequeña pausa para animaciones
}

// Exportar todas las funciones
module.exports = {
  setupPortfolioTest,
  mockExportPortfolioAPI,
  mockResetSystemAPI,
  expectTabToBeActive,
  switchToTab,
  waitForVisible,
  clickAndWait
};
