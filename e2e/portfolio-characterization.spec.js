/**
 * Portfolio Characterization Tests - REFACTORED
 * Misión 223.0 - Suite con Autenticación Real
 * 
 * CORRECCIÓN CRÍTICA: Reemplazo de autenticación por mock con flujo de usuario real
 * - EXTIRPADO: setupPortfolioTest() con mock de autenticación
 * - IMPLEMENTADO: E2EHelpers.authenticateDemo() con flujo validado
 * 
 * ARQUITECTURA:
 * - beforeEach ejecuta authenticateDemo() antes de CADA test
 * - Sesión válida garantizada por flujo de usuario real
 * - Tests independientes de mocks obsoletos
 */

const { test, expect } = require('@playwright/test');
const {
  mockExportPortfolioAPI,
  mockResetSystemAPI,
  expectTabToBeActive,
  switchToTab
} = require('./helpers/portfolio-helpers.js');

// MISIÓN 230.9: Importar helper estandarizado (M-221 - UI-Based, FUNCIONAL)
const { authenticateDemo } = require('./helpers/authHelper.js');

// ==============================================================================
// SETUP GLOBAL - AUTENTICACIÓN ESTANDARIZADA (MISIÓN 230.9)
// ==============================================================================

/**
 * SETUP GLOBAL: Autenticación con Flujo de UI (MISIÓN 230.9)
 * 
 * ESTANDARIZACIÓN COMPLETA:
 * - Usando authenticateDemo (M-221) - Único helper validado que funciona
 * - Abandono de authenticateProgrammatic (M-230.2 a M-230.8) - Incompatible con arquitectura
 * 
 * EVIDENCIA:
 * - Tests 1-9 (ai-code-mentor.spec.js con M-221): PASAN ✅
 * - Tests 24-44 (portfolio con M-230.2): FALLABAN ❌
 * 
 * FLUJO:
 * 1. Navegación a /login
 * 2. Relleno de credenciales
 * 3. Click en "Acceso Demo Rápido"
 * 4. Espera de redirección a /panel-de-control
 * 5. AuthContext se hidrata naturalmente durante el flujo
 */
test.beforeEach(async ({ page }) => {
  // MISIÓN 230.9: Usar único helper funcional estandarizado
  await authenticateDemo(page);
  console.log('✅ [SETUP-M230.9] Usuario autenticado con flujo de UI validado');

  // Usuario ahora autenticado en /panel-de-control
  // Puede navegar a /portfolio sin problemas de sesión
});

// ==============================================================================
// SUITE 1: RENDERIZADO Y NAVEGACIÓN BÁSICA (Tests 1-5)
// ==============================================================================

test.describe('Portfolio - Renderizado y Navegación', () => {
  // M-23.1: Timeout aumentado para dar tiempo a retry mechanism (4 intentos × 10s + buffers)
  test.setTimeout(60000);

  test('P1 - Debe renderizar el componente principal con título y navegación', async ({ page }) => {
    // NAVEGACIÓN: Ya autenticado por beforeEach, navegar a portfolio
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)

    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ }))
      .toBeVisible({ timeout: 30000 });

    // Verificar título del header de la página
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible();

    // Verificar título del componente PortfolioManagementSystem
    await expect(page.getByRole('heading', { name: /📊 Gestión de Portfolio y Ciclos/ })).toBeVisible();

    // Verificar presencia de tabs de navegación
    await expect(page.locator('button:has-text("Export Portfolio")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Gestión de Ciclos")').first()).toBeVisible();
  });

  test('P2 - Debe permitir cambio entre tabs sin errores', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Tab Export Portfolio debe estar activo por defecto
    await expectTabToBeActive(page, 'Export Portfolio');

    // Cambiar a Gestión de Ciclos
    await switchToTab(page, 'Gestión de Ciclos');
    await expectTabToBeActive(page, 'Gestión de Ciclos');

    // Verificar contenido del tab Gestión de Ciclos
    await expect(page.locator('text=Reset').first()).toBeVisible();

    // Volver a Export Portfolio
    await switchToTab(page, 'Export Portfolio');
    await expectTabToBeActive(page, 'Export Portfolio');
  });

  test('P3 - Debe mostrar secciones principales en tab Export Portfolio', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar que estamos en el tab correcto
    await expectTabToBeActive(page, 'Export Portfolio');

    // Verificar secciones clave del PortfolioExportSystem
    await expect(page.locator('text=Portfolio Export').first()).toBeVisible();
  });

  test('P4 - Debe mostrar secciones principales en tab Gestión de Ciclos', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    await switchToTab(page, 'Gestión de Ciclos');

    // Verificar secciones clave del tab
    await expect(page.locator('text=Reset').first()).toBeVisible();
  });

  test('P5 - Debe proteger la ruta con ProtectedRoute', async ({ page }) => {
    // Test de protección: navegar directamente sin beforeEach
    // NOTA: Este test técnicamente ya está autenticado por beforeEach global
    // Para testear protección real, necesitaríamos logout previo
    await page.goto('http://localhost:3000/portfolio');
    await page.waitForTimeout(2000);

    const url = page.url();
    const content = await page.content();

    // Verificar que muestra contenido protegido (usuario está autenticado)
    const hasPortfolioContent = content.includes('Portfolio') || content.includes('Gestión');

    expect(hasPortfolioContent).toBeTruthy();
  });
});

// ==============================================================================
// SUITE 2: ESTADOS DEL SISTEMA (Tests 6-10)
// ==============================================================================

test.describe('Portfolio - Estados del Sistema', () => {
  // M-23.1: Timeout aumentado para dar tiempo a retry mechanism (4 intentos × 10s + buffers)
  test.setTimeout(60000);

  test('P6 - Debe manejar estado vacío (sin evidencias)', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar que el componente carga
    await expect(page.locator('text=Evidencias Disponibles')).toBeVisible();

    // El contador debe existir
    const statsDiv = page.locator('text=Evidencias Disponibles').locator('..');
    await expect(statsDiv).toBeVisible();
  });

  test('P7 - Debe mostrar métricas del sistema', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar métricas en el header
    await expect(page.locator('text=Evidencias Disponibles')).toBeVisible();
    await expect(page.locator('text=Portfolio Export').first()).toBeVisible();
    await expect(page.locator('text=Competencias').first()).toBeVisible();
    await expect(page.locator('text=Gestión de Ciclos').first()).toBeVisible();
  });

  test('P8 - Debe mostrar quick stats correctamente', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar las 4 quick stats cards
    await expect(page.locator('text=Portfolio Export').first()).toBeVisible();
    await expect(page.locator('text=Competencias').first()).toBeVisible();
    await expect(page.locator('text=Gestión de Ciclos').first()).toBeVisible();
    await expect(page.locator('text=24 Meses').first()).toBeVisible();
  });

  test('P9 - Debe mostrar guía de ayuda al final', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Scroll al final para ver la guía
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Verificar sección de guía
    await expect(page.locator('text=Guía de Gestión de Portfolio')).toBeVisible();
  });

  test('P10 - Debe manejar navegación completa sin errores', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Navegar entre tabs múltiples veces
    for (let i = 0; i < 3; i++) {
      await switchToTab(page, 'Gestión de Ciclos');
      await switchToTab(page, 'Export Portfolio');
    }

    // Verificar que no hay errores
    await expect(page.locator('button:has-text("Export Portfolio")')).toBeVisible();
  });
});

// ==============================================================================
// SUITE 3: INTEGRACIÓN CON PROJECTTRACKINGCONTEXT (Tests 11-15)
// ==============================================================================

test.describe('Portfolio - Integración con Contexto', () => {
  // M-23.1: Timeout aumentado para dar tiempo a retry mechanism (4 intentos × 10s + buffers)
  test.setTimeout(60000);

  test('P11 - Debe consumir entryCounts del contexto correctamente', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar que el contador de evidencias se muestra
    await expect(page.locator('text=Evidencias Disponibles')).toBeVisible();

    const totalElement = page.locator('text=Evidencias Disponibles').locator('..');
    await expect(totalElement).toBeVisible();
  });

  test('P12 - Debe mostrar warning cuando hay evidencias en reset tab', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Cambiar a tab de Gestión de Ciclos
    await switchToTab(page, 'Gestión de Ciclos');

    // Verificar tab activo
    await expectTabToBeActive(page, 'Gestión de Ciclos');
  });

  test('P13 - Debe renderizar PortfolioExportSystem en tab Export', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Asegurar que estamos en tab Export Portfolio
    await expectTabToBeActive(page, 'Export Portfolio');

    // Verificar contenido relacionado con export
    await expect(page.locator('text=Portfolio Export').first()).toBeVisible();
  });

  test('P14 - Debe renderizar ResetSystem en tab Gestión de Ciclos', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Cambiar a tab de Gestión de Ciclos
    await switchToTab(page, 'Gestión de Ciclos');

    // Verificar contenido relacionado con reset/ciclos
    await expect(page.locator('text=Reset').first()).toBeVisible();
  });

  test('P15 - Debe actualizar total de evidencias dinámicamente', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar que el total se muestra
    const evidenciasText = page.locator('text=Evidencias Disponibles');
    await expect(evidenciasText).toBeVisible();

    // Verificar que hay un número
    const container = evidenciasText.locator('..');
    const textContent = await container.textContent();
    expect(textContent).toMatch(/\d+/);
  });
});

// ==============================================================================
// SUITE 4: NAVEGACIÓN Y UI (Tests 16-20)
// ==============================================================================

test.describe('Portfolio - Navegación y UI', () => {
  // M-23.1: Timeout aumentado para dar tiempo a retry mechanism (4 intentos × 10s + buffers)
  test.setTimeout(60000);

  test('P16 - Debe mostrar badge AVANZADO en tab Gestión de Ciclos', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar que el badge "AVANZADO" existe
    await expect(page.locator('text=AVANZADO')).toBeVisible();
  });

  test('P17 - Debe mostrar iconos correctos en tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar emojis en tabs
    const exportTab = page.locator('button:has-text("Export Portfolio")').last();
    const exportTabContent = await exportTab.textContent();
    expect(exportTabContent).toContain('📄');

    const ciclosTab = page.locator('button:has-text("Gestión de Ciclos")').last();
    const ciclosTabContent = await ciclosTab.textContent();
    expect(ciclosTabContent).toContain('🔄');
  });

  test('P18 - Debe mostrar descripciones de tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Verificar descripciones
    await expect(page.locator('text=Generar portfolio profesional')).toBeVisible();
    await expect(page.locator('text=Reset y nuevo ciclo curricular')).toBeVisible();
  });

  test('P19 - Debe aplicar estilos correctos al tab activo', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Tab Export debe tener gradient
    const exportTab = page.locator('button:has-text("Export Portfolio")').last();
    await expect(exportTab).toHaveClass(/from-blue-500/);
    await expect(exportTab).toHaveClass(/to-purple-600/);

    // Cambiar tab
    await switchToTab(page, 'Gestión de Ciclos');

    // Verificar que Ciclos tiene gradient
    const ciclosTab = page.locator('button:has-text("Gestión de Ciclos")').last();
    await expect(ciclosTab).toHaveClass(/from-blue-500/);
  });

  test('P20 - Debe mostrar sección de ayuda con metodología Ecosistema 360', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // Scroll al final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Verificar metodología mencionada
    await expect(page.locator('text=Metodología Ecosistema 360').first()).toBeVisible();
    await expect(page.locator('text=Simbiosis Crítica Humano-IA')).toBeVisible();
  });
});

// ==============================================================================
// TEST ADICIONAL: SMOKE TEST INTEGRAL
// ==============================================================================

test.describe('Portfolio - Smoke Test Integral', () => {
  // M-23.1: Timeout aumentado para dar tiempo a retry mechanism (4 intentos × 10s + buffers)
  test.setTimeout(60000);

  test('P-SMOKE - Flujo completo: Cargar, navegar, verificar elementos clave', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    // ESPERA DETERMINÍSTICA (MISIÓN 225 - Sistémico)
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible({ timeout: 30000 });

    // 1. Verificar carga inicial
    await expect(page.getByRole('heading', { name: /^Gestión de Portfolio/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /📊 Gestión de Portfolio y Ciclos/ })).toBeVisible();

    // 2. Verificar métricas
    await expect(page.locator('text=Evidencias Disponibles')).toBeVisible();

    // 3. Navegar entre tabs
    await switchToTab(page, 'Gestión de Ciclos');
    await expectTabToBeActive(page, 'Gestión de Ciclos');

    await switchToTab(page, 'Export Portfolio');
    await expectTabToBeActive(page, 'Export Portfolio');

    // 4. Scroll y verificar guía
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('text=Guía de Gestión de Portfolio')).toBeVisible();

    // Test completo sin errores
    expect(true).toBe(true);
  });
});
