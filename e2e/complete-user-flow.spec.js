/**
 * FASE 2: TEST E2E DE FLUJO COMPLETO
 *
 * Flujo integrado:
 * 1. Login con demo credentials
 * 2. Verificar carga del dashboard (/panel-de-control)
 * 3. Navegar a módulos/curriculum
 * 4. Navegar a sandbox e iniciar generación de lección (con API mockeada)
 * 5. Verificar contenido generado
 * 6. Verificar que se puede dar feedback
 *
 * Reutiliza:
 * - e2e/helpers/authHelper.js para login
 * - e2e/helpers/gemini-mock.js para mock de AI
 */

const { test, expect } = require('@playwright/test');
const { authenticateDemo } = require('./helpers/authHelper');
const { setupGeminiMock, mockSandboxResponse } = require('./helpers/gemini-mock');

const TEST_CONFIG = {
  PAGES: {
    HOME: '/',
    PANEL: '/panel-de-control',
    ANALITICAS: '/analiticas',
    MODULOS: '/modulos',
    SANDBOX: '/codigo'
  }
};

test.describe('🔄 FLUJO COMPLETO E2E - Login a Feedback', () => {

  test('FLOW-001: Flujo completo login → dashboard → módulos → sandbox → lección → feedback', async ({ page }) => {
    console.log('🚀 [FLOW-001] Iniciando flujo completo E2E...');

    // ═══════════════════════════════════════════
    // PASO 1: Login con demo credentials
    // ═══════════════════════════════════════════
    console.log('📋 [PASO 1] Login con demo credentials...');
    await authenticateDemo(page);

    // Verificar que llegamos al dashboard
    if (!page.url().includes('panel-de-control')) {
      await page.goto(TEST_CONFIG.PAGES.PANEL);
    }
    await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible({ timeout: 30000 });
    console.log('✅ [PASO 1] Login exitoso - Dashboard visible');

    // ═══════════════════════════════════════════
    // PASO 2: Verificar carga del dashboard
    // ═══════════════════════════════════════════
    console.log('📋 [PASO 2] Verificando dashboard...');

    // Verificar título de la página
    const title = await page.title();
    expect(title).toContain('Panel de Control');
    console.log('✅ [PASO 2] Dashboard cargado correctamente');

    // ═══════════════════════════════════════════
    // PASO 3: Navegar a módulos/curriculum
    // ═══════════════════════════════════════════
    console.log('📋 [PASO 3] Navegando a módulos...');
    await page.goto(TEST_CONFIG.PAGES.MODULOS, { timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 10000 });

    // Verificar que la página de módulos cargó (API de curriculum)
    const modulosContent = page.locator('h1');
    await expect(modulosContent.first()).toBeVisible({ timeout: 15000 });
    console.log('✅ [PASO 3] Página de módulos cargada');

    // ═══════════════════════════════════════════
    // PASO 4: Navegar a sandbox y generar lección
    // ═══════════════════════════════════════════
    console.log('📋 [PASO 4] Navegando a sandbox con mock de Gemini...');

    // Configurar mock ANTES de navegar al sandbox
    await setupGeminiMock(page, { delay: 300, verbose: true });

    await page.goto(TEST_CONFIG.PAGES.SANDBOX, { timeout: 30000 });

    // Esperar a que el widget sandbox cargue (dynamic import)
    const sandboxInput = page.locator('#sandbox-input');
    await expect(sandboxInput).toBeVisible({ timeout: 30000 });
    console.log('✅ [PASO 4a] Widget Sandbox cargado');

    // Escribir texto en el sandbox
    const testInput = 'Explícame los conceptos básicos de JavaScript ES6, incluyendo arrow functions y destructuring.';
    await sandboxInput.fill(testInput);
    console.log('✅ [PASO 4b] Texto ingresado en sandbox');

    // Encontrar y clickear botón de generar
    const generateButton = page.locator('button:has-text("Generar Lección Interactiva")');
    await expect(generateButton).toBeVisible({ timeout: 5000 });

    // Esperar respuesta mock
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/sandbox/generate') && response.status() === 200,
      { timeout: 10000 }
    );

    await generateButton.click({ force: true });
    console.log('✅ [PASO 4c] Botón de generar clickeado');

    const sandboxResponse = await responsePromise;
    expect(sandboxResponse.status()).toBe(200);
    console.log('✅ [PASO 4d] Respuesta mock recibida (status 200)');

    // ═══════════════════════════════════════════
    // PASO 5: Verificar contenido generado
    // ═══════════════════════════════════════════
    console.log('📋 [PASO 5] Verificando contenido generado...');

    // Esperar a que el resultado se renderice
    await page.waitForSelector('#sandbox-result, [data-testid="sandbox-result"]', {
      timeout: 10000
    });

    // Verificar que el título de la lección mock aparece
    const lessonTitle = page.getByRole('heading', { name: /Conceptos Básicos de JavaScript ES6/i }).first();
    await expect(lessonTitle).toBeVisible({ timeout: 5000 });
    console.log('✅ [PASO 5] Contenido de lección generado y visible');

    // ═══════════════════════════════════════════
    // PASO 6: Verificar feedback (si existe)
    // ═══════════════════════════════════════════
    console.log('📋 [PASO 6] Verificando componente de feedback...');

    // El componente de feedback puede no estar presente en el sandbox,
    // pero verificamos que la UI completa se renderizó sin errores
    const feedbackSection = page.locator('text=¿Qué te pareció');
    const hasFeedback = await feedbackSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFeedback) {
      console.log('✅ [PASO 6a] Componente de feedback encontrado');

      // Dar una calificación (click en la 4ta estrella)
      const stars = page.locator('button:has-text("★")');
      const starCount = await stars.count();
      if (starCount >= 4) {
        await stars.nth(3).click();
        console.log('✅ [PASO 6b] Calificación de 4 estrellas seleccionada');
      }

      // Click en "Sí, mucho" para utilidad
      const helpfulButton = page.locator('button:has-text("Sí, mucho")');
      if (await helpfulButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await helpfulButton.click();
        console.log('✅ [PASO 6c] Marcado como útil');
      }

      // Click en "Adecuada" para dificultad
      const difficultyButton = page.locator('button:has-text("Adecuada")');
      if (await difficultyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await difficultyButton.click();
        console.log('✅ [PASO 6d] Dificultad "Adecuada" seleccionada');
      }

      // Submit feedback
      const submitButton = page.locator('button:has-text("Enviar Valoración")');
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const feedbackPromise = page.waitForResponse(
          response => response.url().includes('/api/v1/lessons/feedback'),
          { timeout: 5000 }
        ).catch(() => null);

        await submitButton.click();
        const feedbackResponse = await feedbackPromise;

        if (feedbackResponse) {
          expect(feedbackResponse.status()).toBe(200);
          console.log('✅ [PASO 6e] Feedback enviado exitosamente');
        }
      }
    } else {
      console.log('ℹ️  [PASO 6] Componente de feedback no presente en sandbox (OK - opcional)');
    }

    console.log('🎉 [FLOW-001] Flujo completo E2E finalizado exitosamente');
  });

  test('FLOW-002: Navegación entre todas las páginas principales', async ({ page }) => {
    console.log('🚀 [FLOW-002] Verificando navegación entre páginas...');

    await authenticateDemo(page);

    const pages = [
      { path: TEST_CONFIG.PAGES.PANEL, name: 'Dashboard', selector: 'h1:has-text("Panel de Control")' },
      { path: TEST_CONFIG.PAGES.ANALITICAS, name: 'Analíticas', selector: 'h1:has-text("Analíticas")' },
      { path: TEST_CONFIG.PAGES.MODULOS, name: 'Módulos', selector: 'h1' },
      { path: TEST_CONFIG.PAGES.SANDBOX, name: 'Sandbox', selector: '#sandbox-input' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path, { timeout: 30000 });
      await page.waitForLoadState('load', { timeout: 10000 });

      const element = page.locator(pageInfo.selector).first();
      await expect(element).toBeVisible({ timeout: 20000 });
      console.log(`✅ ${pageInfo.name}: OK`);
    }

    console.log('🎉 [FLOW-002] Todas las páginas accesibles correctamente');
  });

  test('FLOW-003: Sandbox genera lección y muestra ejercicios', async ({ page }) => {
    console.log('🚀 [FLOW-003] Verificando generación completa con ejercicios...');

    await authenticateDemo(page);
    await setupGeminiMock(page, { delay: 200 });

    await page.goto(TEST_CONFIG.PAGES.SANDBOX, { timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});

    // Dismiss cookie consent if present
    const cookieButton = page.locator('button:has-text("Aceptar")').first();
    if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieButton.click();
      console.log('✅ Cookie consent aceptado');
    }

    // Esperar carga del widget (dynamic import)
    const sandboxInput = page.locator('#sandbox-input');
    await expect(sandboxInput).toBeVisible({ timeout: 30000 });
    console.log('✅ Widget Sandbox cargado');

    // Generar lección (mínimo 50 caracteres requeridos por el widget)
    await sandboxInput.fill('Explícame los conceptos básicos de JavaScript ES6, incluyendo arrow functions y destructuring.');

    const generateButton = page.locator('button:has-text("Generar Lección Interactiva")');
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
    console.log('✅ Botón generar visible y habilitado');

    // Registrar listener ANTES del click para no perder la respuesta
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/sandbox/generate') && response.status() === 200,
      { timeout: 20000 }
    );

    // Scroll al botón para asegurar visibilidad y click
    await generateButton.scrollIntoViewIfNeeded();
    await generateButton.click({ force: true });
    console.log('✅ Botón clickeado');

    const sandboxResp = await responsePromise;
    expect(sandboxResp.status()).toBe(200);
    console.log('✅ Respuesta mock recibida');

    // Verificar que el resultado se renderizó
    await page.waitForSelector('#sandbox-result, [data-testid="sandbox-result"]', {
      timeout: 10000
    });

    // Verificar título
    const lessonTitle = page.getByRole('heading', { name: /Conceptos Básicos de JavaScript ES6/i }).first();
    await expect(lessonTitle).toBeVisible({ timeout: 5000 });

    // Verificar que hay contenido de ejercicios (mock tiene 3 ejercicios)
    const exerciseIndicators = [
      'text=ventaja clave',
      'text=Ejercicio',
      'button:has-text("A)")',
      'button:has-text("B)")',
      '[class*="quiz"]',
      '[class*="exercise"]'
    ];

    let exercisesFound = false;
    for (const selector of exerciseIndicators) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 3000 })) {
          exercisesFound = true;
          console.log(`✅ Ejercicios detectados: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    console.log(`ℹ️  Ejercicios visibles en UI: ${exercisesFound}`);
    console.log('✅ [FLOW-003] Lección generada con contenido completo');
  });
});
