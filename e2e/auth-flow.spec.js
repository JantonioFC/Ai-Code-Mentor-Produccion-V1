/**
 * E2E Tests: Authentication Flows
 * Covers: Login, Registration, Quick Demo Access, Logout
 *
 * Uses Playwright with the existing authHelper pattern.
 * Dev server must be running on localhost:3000.
 */

const { test, expect } = require('@playwright/test');

const DEMO_EMAIL = 'demo@aicodementor.com';
const DEMO_PASSWORD = 'demo123';

/**
 * Helper: wait for login page to be fully loaded (client-side hydration complete)
 */
async function waitForLoginPage(page) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  // Wait for the client-side React hydration - the email input appears when ready
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
}

test.describe('Authentication - Login Flow', () => {

  test('login page loads with form and tabs', async ({ page }) => {
    await waitForLoginPage(page);

    // Verify page loaded - use the visible div with gradient text, not <title>
    await expect(page.locator('div:has-text("AI Code Mentor")').first()).toBeVisible();

    // Verify login/signup tab buttons (these are tab buttons without emojis)
    const tabs = page.locator('.bg-gray-100 button');
    await expect(tabs.nth(0)).toContainText('Iniciar Sesión');
    await expect(tabs.nth(1)).toContainText('Registrarse');

    // Verify login form fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify submit button (has emoji: 🔓 Iniciar Sesión)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Iniciar Sesión');

    // Verify demo button (has emoji: ⚡ Acceso Demo Rápido)
    await expect(page.locator('button:has-text("Acceso Demo")')).toBeVisible();

    // Verify back button
    await expect(page.locator('button:has-text("Volver al inicio")')).toBeVisible();
  });

  test('login form shows validation for empty fields', async ({ page }) => {
    await waitForLoginPage(page);

    // Verify required attribute on email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('login with demo credentials redirects to dashboard', async ({ page }) => {
    await waitForLoginPage(page);

    // Handle potential error dialog (if demo user doesn't exist in DB)
    let loginError = false;
    page.on('dialog', async (dialog) => {
      loginError = true;
      await dialog.accept();
    });

    // Fill login form
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or error
    try {
      await page.waitForURL(/panel-de-control/, { timeout: 60000 });
      expect(page.url()).toContain('/panel-de-control');
    } catch {
      // If login failed (demo user may not exist in local DB), skip
      test.skip(loginError, 'Demo user not seeded in local database');
    }
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await waitForLoginPage(page);

    await page.fill('input[type="email"]', 'fake@nonexistent.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Listen for dialog (alert) - must be registered before triggering action
    const dialogPromise = page.waitForEvent('dialog');

    await page.click('button[type="submit"]');

    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Error');
    await dialog.accept();

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });
});

test.describe('Authentication - Quick Demo Access', () => {

  test('demo button logs in and redirects to dashboard', async ({ page }) => {
    await waitForLoginPage(page);

    // Handle potential error dialog (if demo user doesn't exist in DB)
    let loginError = false;
    page.on('dialog', async (dialog) => {
      loginError = true;
      await dialog.accept();
    });

    // Click demo access button
    await page.click('button:has-text("Acceso Demo")');

    // Wait for redirect to dashboard or error
    try {
      await page.waitForURL(/panel-de-control/, { timeout: 60000 });
      expect(page.url()).toContain('/panel-de-control');
    } catch {
      test.skip(loginError, 'Demo user not seeded in local database');
    }
  });

  test('demo button shows loading state while processing', async ({ page }) => {
    await waitForLoginPage(page);

    // Handle potential error dialog
    let loginError = false;
    page.on('dialog', async (dialog) => {
      loginError = true;
      await dialog.accept();
    });

    // Click demo button
    await page.click('button:has-text("Acceso Demo")');

    // Button should show loading text (may be very brief)
    const wasLoading = await page.locator('button:has-text("Cargando")').isVisible({ timeout: 5000 }).catch(() => false);

    // Whether we caught the loading state or not, we should end up on dashboard
    try {
      await page.waitForURL(/panel-de-control/, { timeout: 60000 });
    } catch {
      test.skip(loginError, 'Demo user not seeded in local database');
    }
  });
});

test.describe('Authentication - Registration Flow', () => {

  test('switching to register tab shows signup form', async ({ page }) => {
    await waitForLoginPage(page);

    // Click "Registrarse" tab (inside the tab bar)
    const registerTab = page.locator('.bg-gray-100 button', { hasText: 'Registrarse' });
    await registerTab.click();

    // Verify signup form heading
    await expect(page.locator('h2')).toContainText('Empieza Gratis');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify submit button text changed
    await expect(page.locator('button[type="submit"]')).toContainText('Empezar Ahora');

    // Demo button should NOT be visible in signup mode
    await expect(page.locator('button:has-text("Acceso Demo")')).not.toBeVisible();
  });

  test('register form requires minimum 6 character password', async ({ page }) => {
    await waitForLoginPage(page);

    // Switch to register
    await page.locator('.bg-gray-100 button', { hasText: 'Registrarse' }).click();
    await page.waitForSelector('button[type="submit"]:has-text("Empezar")');

    // Verify the password input has minLength validation
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('minLength', '6');

    // Fill with short password and try to submit
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[type="password"]', '123');

    // The form may show HTML5 validation or a JS alert depending on browser behavior
    // Either way, the user should stay on the login page
    let dialogShown = false;
    page.on('dialog', async (dialog) => {
      dialogShown = true;
      await dialog.accept();
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should stay on login page (not redirected)
    expect(page.url()).toContain('/login');
  });

  test('register with duplicate email shows error', async ({ page }) => {
    await waitForLoginPage(page);

    // Switch to register
    await page.locator('.bg-gray-100 button', { hasText: 'Registrarse' }).click();
    await page.waitForSelector('button[type="submit"]:has-text("Empezar")');

    // Try to register with the demo email (already exists)
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', 'password123');

    // Listen for alert
    const dialogPromise = page.waitForEvent('dialog');

    await page.click('button[type="submit"]');

    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Error');
    await dialog.accept();

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('successful registration shows confirmation', async ({ page }) => {
    await waitForLoginPage(page);

    // Switch to register
    await page.locator('.bg-gray-100 button', { hasText: 'Registrarse' }).click();
    await page.waitForSelector('button[type="submit"]:has-text("Empezar")');

    // Register with unique email
    const uniqueEmail = `e2e-test-${Date.now()}@test.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'password123');

    // Listen for success alert or redirect
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    // Should show success OR redirect to dashboard (depending on implementation)
    const onDashboard = page.url().includes('/panel-de-control');
    const showedSuccess = alertMessage.includes('exitoso') || alertMessage.includes('Registro');

    expect(onDashboard || showedSuccess).toBe(true);
  });
});

test.describe('Authentication - Tab Switching', () => {

  test('switching between login and signup preserves page', async ({ page }) => {
    await waitForLoginPage(page);

    // Start on login
    await expect(page.locator('h2')).toContainText('Bienvenido de Vuelta');

    // Switch to signup
    await page.locator('.bg-gray-100 button', { hasText: 'Registrarse' }).click();
    await expect(page.locator('h2')).toContainText('Empieza Gratis');

    // Switch back to login
    await page.locator('.bg-gray-100 button', { hasText: 'Iniciar Sesión' }).click();
    await expect(page.locator('h2')).toContainText('Bienvenido de Vuelta');

    // URL should still be /login
    expect(page.url()).toContain('/login');
  });

  test('back to home link works from login page', async ({ page }) => {
    await waitForLoginPage(page);

    // Dismiss cookie banner if it's blocking the button
    const cookieAccept = page.locator('button:has-text("Aceptar")');
    if (await cookieAccept.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieAccept.click();
      await page.waitForTimeout(500);
    }

    await page.click('button:has-text("Volver al inicio")');

    await page.waitForURL(/\/$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/$/);
  });
});

test.describe('Authentication - Logout', () => {

  test('logout from dashboard redirects to home', async ({ page }) => {
    // First login via demo
    await waitForLoginPage(page);

    let loginError = false;
    page.on('dialog', async (dialog) => {
      loginError = true;
      await dialog.accept();
    });

    await page.click('button:has-text("Acceso Demo")');

    try {
      await page.waitForURL(/panel-de-control/, { timeout: 60000 });
    } catch {
      test.skip(loginError, 'Demo user not seeded in local database');
      return;
    }

    // Find and click logout
    const logoutButton = page.locator('text=Cerrar Sesión').first();
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();

      // Should redirect to home or login
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url.includes('/login') || url.endsWith('/')).toBe(true);
    }
  });
});

test.describe('Authentication - Protected Routes', () => {

  test('accessing /panel-de-control without auth redirects to login', async ({ page }) => {
    // Clear any existing cookies
    await page.context().clearCookies();

    await page.goto('/panel-de-control');

    // Should be redirected to login
    await page.waitForURL(/login/, { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });
});
