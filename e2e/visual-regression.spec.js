/**
 * FASE 3: REGRESIÓN VISUAL - Screenshots Baseline
 *
 * Captura screenshots full-page de las 6 páginas clave y compara
 * contra baselines usando toHaveScreenshot() de Playwright.
 *
 * Primera ejecución: genera baselines en visual-regression.spec.js-snapshots/
 * Ejecuciones posteriores: comparan contra baselines (maxDiffPixelRatio: 0.01)
 *
 * Páginas:
 * - Landing (/) - sin auth
 * - Login (/login) - sin auth
 * - Dashboard (/panel-de-control) - con auth
 * - Analíticas (/analiticas) - con auth
 * - Módulos (/modulos) - con auth
 * - Sandbox (/codigo) - con auth
 */

const { test, expect } = require('@playwright/test');
const { authenticateDemo } = require('./helpers/authHelper');

/**
 * Dismiss cookie banner if present
 */
async function dismissCookieBanner(page) {
  const cookieButton = page.locator('button:has-text("Aceptar")').first();
  if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieButton.click();
    await page.waitForTimeout(500);
  }
}

// ═══════════════════════════════════════════════════════════
// PÁGINAS PÚBLICAS (sin autenticación)
// ═══════════════════════════════════════════════════════════

test.describe('📸 REGRESIÓN VISUAL - Páginas Públicas', () => {

  test('VR-001: Landing page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await dismissCookieBanner(page);

    // Esperar a que el contenido principal sea visible
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
    });
  });

  test('VR-002: Login page screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');
    await dismissCookieBanner(page);

    // Esperar formulario de login
    await page.waitForSelector('form', { state: 'visible', timeout: 15000 });

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
    });
  });
});

// ═══════════════════════════════════════════════════════════
// PÁGINAS PROTEGIDAS (con autenticación)
// ═══════════════════════════════════════════════════════════

test.describe('📸 REGRESIÓN VISUAL - Páginas Protegidas', () => {

  test.beforeEach(async ({ page }) => {
    await authenticateDemo(page);
  });

  test('VR-003: Dashboard page screenshot', async ({ page }) => {
    await page.goto('/panel-de-control');
    await page.waitForLoadState('load');
    await dismissCookieBanner(page);

    await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible({ timeout: 20000 });

    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
    });
  });

  test('VR-004: Analytics page screenshot', async ({ page }) => {
    await page.goto('/analiticas');
    await page.waitForLoadState('load');
    await dismissCookieBanner(page);

    await expect(page.locator('h1:has-text("Analíticas")')).toBeVisible({ timeout: 20000 });

    await expect(page).toHaveScreenshot('analytics-page.png', {
      fullPage: true,
    });
  });

  test('VR-005: Modules page screenshot', async ({ page }) => {
    await page.goto('/modulos');
    await page.waitForLoadState('load');
    await dismissCookieBanner(page);

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });

    await expect(page).toHaveScreenshot('modules-page.png', {
      fullPage: true,
    });
  });

  test('VR-006: Sandbox page screenshot', async ({ page }) => {
    await page.goto('/codigo');
    await page.waitForLoadState('load');
    await dismissCookieBanner(page);

    // Esperar a que el widget sandbox cargue (dynamic import)
    await expect(page.locator('#sandbox-input')).toBeVisible({ timeout: 30000 });

    await expect(page).toHaveScreenshot('sandbox-page.png', {
      fullPage: true,
    });
  });
});
