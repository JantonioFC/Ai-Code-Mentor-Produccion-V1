import { test, expect } from '@playwright/test';

// Test E2E de Flujo Crítico: Carga de Landing -> Login -> Verificación
test('Main Flow: Landing loads and Login Modal works', async ({ page }) => {
    // 1. Navegar a Landing (Wait for network idle to ensure hydration)
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // 2. Verificar Diseño Industrial (Titulo presente - Loose match)
    // Usamos getByRole para ser más accesibles y robustos
    await expect(page.getByRole('heading', { name: /SYSTEM_LEARNING/i })).toBeVisible();

    // 3. Verificar Botón de Inicio
    const startBtn = page.getByRole('button', { name: /INITIALIZE_PLATFORM/i });
    await expect(startBtn).toBeVisible();

    // 4. Abrir Modal de Login
    await startBtn.click();

    // 5. Verificar Modal (Wait generic text inside modal)
    await expect(page.getByRole('heading', { name: /Acceder/i })).toBeVisible({ timeout: 15000 });

    // 6. Verificar input por placeholder (que es un buen proxy de "Login form loaded")
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
});
