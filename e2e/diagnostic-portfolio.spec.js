/**
 * DIAGNOSTIC TEST - Portfolio Rendering
 * Objetivo: Capturar el estado HTML real de la página para debugging
 */

const { test, expect } = require('@playwright/test');
const { setupAuthenticatedPage } = require('./helpers/auth-mock-helper');

test('DIAGNOSTIC - Capturar HTML de portfolio con mock', async ({ page }) => {
  const url = 'http://localhost:3000/portfolio';

  console.log('\n🔍 === INICIO DIAGNÓSTICO ===\n');

  // Setup con autenticación mockeada (igual que setupPortfolioTest)
  await setupAuthenticatedPage(page, url);

  // Esperar un poco para que cargue lo que pueda cargar
  await page.waitForTimeout(3000);

  // Capturar información de debug
  const currentUrl = page.url();
  const pageTitle = await page.title();
  const htmlContent = await page.content();

  console.log('📍 URL actual:', currentUrl);
  console.log('📄 Título de página:', pageTitle);
  console.log('\n📝 HTML completo (primeros 2000 caracteres):');
  console.log(htmlContent.substring(0, 2000));

  // Buscar todos los h1
  const allH1s = await page.$$eval('h1', elements =>
    elements.map(el => el.textContent.trim())
  );

  console.log('\n🎯 H1s encontrados:', allH1s.length);
  allH1s.forEach((text, index) => {
    console.log(`  ${index + 1}. "${text}"`);
  });

  // Verificar si hay elementos de autenticación
  const hasLoginForm = await page.$('input[type="email"]') !== null;
  const hasPasswordInput = await page.$('input[type="password"]') !== null;

  console.log('\n🔐 Elementos de autenticación:');
  console.log('  - Input email:', hasLoginForm ? 'SÍ' : 'NO');
  console.log('  - Input password:', hasPasswordInput ? 'SÍ' : 'NO');

  // Verificar si hay errores en consola
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));

  await page.waitForTimeout(1000);

  console.log('\n💬 Mensajes de consola:', consoleMessages.length);
  consoleMessages.slice(0, 5).forEach(msg => {
    console.log('  -', msg);
  });

  console.log('\n🔍 === FIN DIAGNÓSTICO ===\n');

  // M-257: ENDURECIMIENTO - Validar que realmente estamos en /portfolio
  console.log('\n⚠️  [M-257] ENDURECIMIENTO: Validando URL de destino...');

  // ASERCIÓN ESTRICTA: Debemos estar en /portfolio, no en /login
  await expect(page).toHaveURL(/portfolio/);
  console.log('✅ [M-257] URL validada: Estamos en /portfolio (mock de autenticación funcional)');

  // NOTA: Este test FALLARÁ si el mock de autenticación no funciona correctamente
  // y nos redirige a /login. Esto es INTENCIONAL para exponer el problema real.
});
