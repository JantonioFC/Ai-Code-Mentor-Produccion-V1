/**
 * ⚠️ ARCHIVO OBSOLETO - MISIÓN 274
 * 
 * Este archivo fue archivado como parte de la Misión M-274: Inyección Híbrida Verdadera
 * 
 * RAZÓN DEL ARCHIVADO:
 * La arquitectura globalSetup de M-268 tenía un fallo arquitectónico fundamental:
 * - storageState solo inyectaba autenticación en el navegador
 * - NO inyectaba en contextos de fetch() del cliente
 * - NO inyectaba en contextos de request() (como teardown)
 * - Resultaba en fallos 401 Unauthorized en llamadas API desde el cliente
 * 
 * SOLUCIÓN M-274:
 * Implementación de inyección híbrida por-test en beforeEach:
 * - Cookie injection: Para servidor/middleware (M-264)
 * - Storage injection: Para cliente/React (useAuth hook)
 * - Ejecución en CADA test para garantizar contexto completo
 * 
 * ARCHIVO DE REEMPLAZO:
 * - e2e/helpers/authHelper.js (authenticateHybrid function)
 * 
 * NO ELIMINAR ESTE ARCHIVO - Conservar para historia arquitectónica
 * 
 * @deprecated M-274
 * @see e2e/helpers/authHelper.js
 */

/**
 * MISIÓN 268 - FASE 1: GLOBAL SETUP CON INTEGRACIÓN REAL
 * 
 * ARQUITECTURA:
 * Este archivo ejecuta UN ÚNICO login de UI real antes de que comience toda la suite.
 * El estado de autenticación resultante (cookies + localStorage) se guarda en un archivo
 * y es reutilizado por TODOS los tests mediante storageState en playwright.config.js.
 * 
 * BENEFICIOS:
 * - Elimina "Conflicto de Realidad" (simulación vs. servicios reales)
 * - Un solo login para toda la suite (eficiencia)
 * - Estado de autenticación real y consistente
 * - Compatible con middleware M-264 server-side
 * 
 * FLUJO:
 * 1. Lanzar navegador Chromium
 * 2. Navegar a /login
 * 3. Rellenar credenciales (CI_USER_EMAIL, CI_USER_PASSWORD)
 * 4. Hacer clic en "Iniciar Sesión"
 * 5. Esperar redirección a /panel-de-control
 * 6. Guardar estado (cookies + localStorage) en .auth/storageState.json
 * 7. Cerrar navegador
 * 
 * @author Mentor Coder
 * @version M-268 - Fase 1
 */

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// ⭐ MISIÓN 268 - FASE 4: Cargar .env.local explícitamente
// Solución: Node.js no carga automáticamente archivos .env
// Next.js solo carga .env.local para su propio proceso, no para scripts externos
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Credenciales desde variables de entorno
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || process.env.CI_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.CI_USER_PASSWORD;
const STORAGE_STATE_PATH = '.auth/storageState.json';

async function globalSetup(config) {
  console.log('\n🚀 [M-268 GlobalSetup] Iniciando login de UI real...');
  console.log(`📧 [M-268] Usuario de CI: ${TEST_USER_EMAIL || '❌ NO CONFIGURADO'}`);
  
  // Validar que las credenciales están configuradas
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error(
      '❌ [M-268 GlobalSetup] FALLO CRÍTICO: Variables de entorno no configuradas.\n' +
      'Requerido: TEST_USER_EMAIL y TEST_USER_PASSWORD (o CI_USER_EMAIL y CI_USER_PASSWORD)'
    );
  }
  
  // Crear directorio .auth si no existe
  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`✅ [M-268] Directorio ${authDir} creado`);
  }
  
  const browser = await chromium.launch({
    headless: !!process.env.CI // Headless en CI, con UI en local
  });
  
  const page = await browser.newPage();
  
  try {
    // PASO 1: Navegar a /login
    console.log('🔄 [M-268] Navegando a /login...');
    await page.goto('http://localhost:3000/login', { timeout: 30000 });
    console.log('✅ [M-268] Navegación a /login exitosa');
    
    // PASO 2: Esperar que el formulario esté listo
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ [M-268] Formulario de login cargado');
    
    // PASO 3: Rellenar credenciales
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    console.log('✅ [M-268] Credenciales rellenadas');
    
    // PASO 4: Hacer clic en botón de login
    // Buscar el botón correcto (puede ser "Iniciar Sesión" o "Acceso Demo Rápido")
    const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Acceso Demo")').first();
    await loginButton.click();
    console.log('✅ [M-268] Botón de login clickeado');
    
    // PASO 5: Esperar redirección a /panel-de-control
    console.log('⏳ [M-268] Esperando redirección a /panel-de-control...');
    await page.waitForURL('**/panel-de-control', { timeout: 15000 });
    console.log('✅ [M-268] Login de UI y redirección exitosos');
    
    // PASO 6: Esperar que el dashboard cargue completamente
    // FIX M-268 FASE 4: Selector corregido según panel-de-control.js actual
    await page.waitForSelector('h1:has-text("Panel de Control Optimizado")', { timeout: 10000 });
    console.log('✅ [M-268] Dashboard verificado - autenticación completa');
    
    // PASO 7: Guardar el estado de autenticación
    await page.context().storageState({ path: STORAGE_STATE_PATH });
    console.log(`✅ [M-268 GlobalSetup] Estado de autenticación guardado en ${STORAGE_STATE_PATH}`);
    
    // Verificar que el archivo se creó correctamente
    if (fs.existsSync(STORAGE_STATE_PATH)) {
      const fileSize = fs.statSync(STORAGE_STATE_PATH).size;
      console.log(`✅ [M-268] Archivo de estado creado (${fileSize} bytes)`);
    }
    
    console.log('\n🎉 [M-268 GlobalSetup] ¡GLOBALSETUP COMPLETADO EXITOSAMENTE!\n');
    
  } catch (error) {
    console.error('\n❌ [M-268 GlobalSetup] FALLO EL LOGIN GLOBAL:', error.message);
    
    // Tomar screenshot para debugging
    try {
      const screenshotPath = `test-results/globalsetup-failure-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 [M-268] Screenshot guardado: ${screenshotPath}`);
    } catch (screenshotError) {
      console.log(`⚠️  [M-268] No se pudo guardar screenshot: ${screenshotError.message}`);
    }
    
    throw new Error('❌ Fallo crítico en globalSetup: no se pudo autenticar el usuario de CI.');
  } finally {
    await browser.close();
    console.log('🔒 [M-268] Navegador cerrado');
  }
}

export default globalSetup;
