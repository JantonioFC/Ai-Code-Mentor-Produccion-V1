/**
 * MISIÓN 268 - FASE 1.4: INSTRUCCIONES DE ACTUALIZACIÓN DE TESTS
 * 
 * OBJETIVO:
 * Eliminar TODAS las llamadas a authenticateDemo() y cleanupAuth() de los tests E2E.
 * Los tests ahora usan el estado de autenticación guardado automáticamente por
 * playwright.config.js (storageState).
 * 
 * ARCHIVOS A ACTUALIZAR:
 * - e2e/ai-code-mentor.spec.js
 * - e2e/portfolio-characterization.spec.js
 * - Cualquier otro archivo .spec.js en e2e/ que use authenticateDemo
 * 
 * =============================================================================
 * PATRÓN DE MIGRACIÓN
 * =============================================================================
 * 
 * ANTES (M-266):
 * ```javascript
 * const { authenticateDemo } = require('./helpers/authHelper.js');
 * 
 * test.beforeEach(async ({ page }) => {
 *   await authenticateDemo(page);
 * });
 * 
 * test('AUTH-001', async ({ page }) => {
 *   // Test code
 * });
 * ```
 * 
 * DESPUÉS (M-268):
 * ```javascript
 * // ELIMINAR: import de authHelper
 * 
 * test.beforeEach(async ({ page }) => {
 *   // VACÍO o navegación directa si es necesaria
 *   // Los tests ya están autenticados por globalSetup
 * });
 * 
 * test('AUTH-001', async ({ page }) => {
 *   // Test code (sin cambios)
 * });
 * ```
 * 
 * =============================================================================
 * INSTRUCCIONES ESPECÍFICAS POR ARCHIVO
 * =============================================================================
 * 
 * ARCHIVO: e2e/ai-code-mentor.spec.js
 * 
 * PASO 1: ELIMINAR la clase E2EHelpers.authenticateDemo()
 *   Buscar: "static async authenticateDemo(page) {"
 *   Acción: Eliminar toda la función (líneas ~62-119)
 * 
 * PASO 2: ELIMINAR imports obsoletos
 *   NO se importa authHelper en este archivo (usa clase local)
 * 
 * PASO 3: ACTUALIZAR beforeEach en cada suite de tests
 *   
 *   A) Suite AUTENTICACIÓN:
 *      ANTES:
 *      ```javascript
 *      test('AUTH-001: ...', async ({ page }) => {
 *        await E2EHelpers.authenticateDemo(page);
 *        // ...
 *      });
 *      ```
 *      
 *      DESPUÉS:
 *      ```javascript
 *      test('AUTH-001: ...', async ({ page }) => {
 *        // Ya autenticado por globalSetup
 *        await page.goto('/panel-de-control');
 *        await page.waitForLoadState('networkidle');
 *        // ...
 *      });
 *      ```
 *   
 *   B) Suite PANEL DE CONTROL (línea ~231):
 *      ANTES:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        await page.goto(TEST_CONFIG.PAGES.HOME);
 *        await E2EHelpers.authenticateDemo(page);
 *      });
 *      ```
 *      
 *      DESPUÉS:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        // Ya autenticado por globalSetup
 *        await page.goto(TEST_CONFIG.PAGES.PANEL);
 *        await page.waitForLoadState('networkidle');
 *      });
 *      ```
 *   
 *   C) Suite CURRÍCULO (línea ~301):
 *      ANTES:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        await page.goto(TEST_CONFIG.PAGES.HOME);
 *        await E2EHelpers.authenticateDemo(page);
 *        await page.goto(TEST_CONFIG.PAGES.MODULOS, { timeout: 30000 });
 *      });
 *      ```
 *      
 *      DESPUÉS:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        // Ya autenticado por globalSetup
 *        await page.goto(TEST_CONFIG.PAGES.MODULOS, { timeout: 30000 });
 *        await page.waitForLoadState('networkidle');
 *      });
 *      ```
 *   
 *   D) Suite GENERACIÓN DE LECCIONES (línea ~382):
 *      ANTES:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        await page.goto(TEST_CONFIG.PAGES.HOME);
 *        await E2EHelpers.authenticateDemo(page);
 *        await page.goto(TEST_CONFIG.PAGES.MODULOS);
 *      });
 *      ```
 *      
 *      DESPUÉS:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        // Ya autenticado por globalSetup
 *        await page.goto(TEST_CONFIG.PAGES.MODULOS);
 *        await page.waitForLoadState('networkidle');
 *      });
 *      ```
 *   
 *   E) Suite SANDBOX (línea ~451):
 *      ANTES:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        await page.goto(TEST_CONFIG.PAGES.HOME);
 *        await E2EHelpers.authenticateDemo(page);
 *      });
 *      ```
 *      
 *      DESPUÉS:
 *      ```javascript
 *      test.beforeEach(async ({ page }) => {
 *        // Ya autenticado por globalSetup
 *        // No es necesario navegar aquí, cada test navega donde necesita
 *      });
 *      ```
 * 
 * PASO 4: ACTUALIZAR test AUTH-002 (logout)
 *   Este test YA NO NECESITA autenticación previa explícita
 *   ANTES (línea ~162):
 *   ```javascript
 *   await E2EHelpers.authenticateDemo(page);
 *   ```
 *   
 *   DESPUÉS:
 *   ```javascript
 *   // Ya autenticado por globalSetup
 *   await page.goto('/panel-de-control');
 *   await page.waitForLoadState('networkidle');
 *   ```
 * 
 * PASO 5: ACTUALIZAR test SMOKE-001 (línea ~507)
 *   ANTES:
 *   ```javascript
 *   await E2EHelpers.authenticateDemo(page);
 *   ```
 *   
 *   DESPUÉS:
 *   ```javascript
 *   // Ya autenticado por globalSetup
 *   await page.goto('/panel-de-control');
 *   await page.waitForLoadState('networkidle');
 *   ```
 * 
 * =============================================================================
 * 
 * ARCHIVO: e2e/portfolio-characterization.spec.js
 * 
 * PASO 1: ELIMINAR import de authHelper
 *   Buscar: "const { authenticateDemo } = require('./helpers/authHelper.js');"
 *   Acción: Eliminar línea completa
 * 
 * PASO 2: ACTUALIZAR beforeEach global (línea ~48)
 *   ANTES:
 *   ```javascript
 *   test.beforeEach(async ({ page }) => {
 *     await authenticateDemo(page);
 *     console.log('✅ [SETUP-M230.9] Usuario autenticado...');
 *   });
 *   ```
 *   
 *   DESPUÉS:
 *   ```javascript
 *   test.beforeEach(async ({ page }) => {
 *     // Ya autenticado por globalSetup (M-268)
 *     console.log('✅ [SETUP-M268] Usuario autenticado por globalSetup');
 *   });
 *   ```
 * 
 * =============================================================================
 * VALIDACIÓN DESPUÉS DE LOS CAMBIOS
 * =============================================================================
 * 
 * 1. Asegurar que NO quedan imports de authHelper en los archivos
 * 2. Asegurar que NO quedan llamadas a authenticateDemo()
 * 3. Asegurar que NO quedan llamadas a cleanupAuth()
 * 4. Los beforeEach deben estar vacíos o solo tener navegación directa
 * 5. Los tests individuales deben funcionar sin cambios significativos
 * 
 * =============================================================================
 * NOTAS IMPORTANTES
 * =============================================================================
 * 
 * - Los tests ahora inician CON sesión activa (gracias a globalSetup)
 * - No es necesario hacer login explícito en cada test
 * - Los tests pueden navegar directamente a rutas protegidas
 * - El estado de autenticación se mantiene entre tests
 * - La limpieza ocurre UNA VEZ al final (globalTeardown)
 * 
 * @author Mentor Coder
 * @version M-268 - Fase 1.4
 */

console.log('⚠️  Este es un archivo de documentación - No ejecutable');
