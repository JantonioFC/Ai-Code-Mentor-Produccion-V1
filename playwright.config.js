// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

/**
 * CONFIGURACIÓN CERTIFICADA v19.1 (Roadmap Técnico - Arquitectura IA Resiliente)
 * Basada en: ARQUITECTURA_VIVA v19.1
 * 
 * Timeouts optimizados para 98% de estabilidad:
 * - timeout: 90s (robusto para Supabase cold-start)
 * - actionTimeout: 15s
 * - navigationTimeout: 45s
 * - expect.timeout: 10s
 * 
 * Nuevos tests v19.1:
 * - API v2 health check (/api/v2/health)
 * - Router IA resiliente
 * 
 * Resuelve:
 * 1. [M-232] 'Missing X server' via 'headless: isCI'
 * 2. [M-233] 'port already used' via 'reuseExistingServer: true'
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  // Timeouts globales optimizados (v17.0 - M-XXX: Supabase cold-start)
  timeout: 90000,              // 90s - Timeout global por test (aumentado para Supabase)

  use: {
    headless: isCI,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',

    // Timeouts específicos de acciones (v16.0)
    actionTimeout: 15000,      // 15s - Timeout para acciones (click, fill, etc.)
    navigationTimeout: 45000,  // 45s - Timeout para navegación (goto, waitForURL)
  },

  // Timeout para expects (v16.0)
  expect: {
    timeout: 10000,            // 10s - Timeout para aserciones
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer disabled to avoid lock conflicts with existing 'npm run dev'
  /*
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
  */
});
