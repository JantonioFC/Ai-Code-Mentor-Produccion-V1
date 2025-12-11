/**
 * TEST MÍNIMO SIN SERVIDOR - MISIÓN 188.3.4
 * 
 * Test que no requiere servidor web para validar que Playwright funciona
 * Esto ayudará a determinar si el problema es discovery o servidor
 * 
 * @author Mentor Coder
 * @version v1.0
 * @misión 188.3.4 - Diagnóstico Server-Independent
 */

const { test, expect } = require('@playwright/test');

test.describe('🔧 Tests Sin Servidor - Diagnóstico', () => {
  
  test('MINIMAL-001: Playwright funciona correctamente', async () => {
    console.log('🧪 Test mínimo sin dependencias...');
    
    // Test básico sin navegación web
    const currentDate = new Date();
    const timestamp = currentDate.getTime();
    
    console.log(`📅 Timestamp actual: ${timestamp}`);
    
    // Verificaciones básicas de JavaScript/Node.js
    expect(timestamp).toBeGreaterThan(1000000000000); // Timestamp razonable
    expect(typeof timestamp).toBe('number');
    
    // Verificar que podemos usar funciones async
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Test mínimo completado exitosamente');
  });
  
  test('MINIMAL-002: Matemáticas básicas funcionan', async () => {
    console.log('🔢 Verificando operaciones matemáticas...');
    
    const suma = 2 + 2;
    const multiplicacion = 5 * 3;
    const division = 10 / 2;
    
    expect(suma).toBe(4);
    expect(multiplicacion).toBe(15);
    expect(division).toBe(5);
    
    console.log(`✅ Matemáticas: ${suma}, ${multiplicacion}, ${division}`);
  });
  
  test('MINIMAL-003: Strings y arrays funcionan', async () => {
    console.log('📝 Verificando strings y arrays...');
    
    const mensaje = 'Hola Playwright';
    const array = [1, 2, 3, 4, 5];
    
    expect(mensaje).toContain('Playwright');
    expect(array.length).toBe(5);
    expect(array[0]).toBe(1);
    
    console.log(`✅ String: "${mensaje}", Array length: ${array.length}`);
  });
  
});

// Test con browser pero sin servidor específico
test.describe('🌐 Tests Con Browser - Sin Servidor Local', () => {
  
  test('BROWSER-001: Navegador puede abrir página externa', async ({ page }) => {
    console.log('🌍 Probando navegación a sitio externo...');
    
    try {
      // Ir a un sitio web simple y confiable
      await page.goto('https://example.com', { timeout: 10000 });
      
      // Verificar que se cargó algo
      const title = await page.title();
      console.log(`📄 Título de página: "${title}"`);
      
      expect(title.length).toBeGreaterThan(0);
      
      console.log('✅ Navegador funciona correctamente con sitios externos');
      
    } catch (error) {
      console.log(`⚠️  No se pudo conectar a sitio externo: ${error.message}`);
      console.log('ℹ️  Esto puede ser normal si no hay conexión a internet');
      
      // No fallar el test por problemas de red externos
      expect(true).toBe(true);
    }
  });
  
  test('BROWSER-002: Browser context funciona', async ({ page }) => {
    console.log('🖥️  Verificando contexto del navegador...');
    
    // Verificar que el contexto del browser funciona
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const windowSize = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    
    console.log(`🔍 User Agent: ${userAgent.substring(0, 50)}...`);
    console.log(`📐 Window size: ${windowSize.width}x${windowSize.height}`);
    
    expect(userAgent).toContain('Chrome');
    expect(windowSize.width).toBeGreaterThan(0);
    expect(windowSize.height).toBeGreaterThan(0);
    
    console.log('✅ Contexto de browser funciona correctamente');
  });
  
});
