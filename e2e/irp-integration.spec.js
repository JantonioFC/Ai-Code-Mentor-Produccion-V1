/**
 * TEST E2E - INTEGRACIÓN IRP (API ROUTE)
 * Misión: Verificar migración de Microservicio a API Next.js
 * 
 * Valida que los nuevos endpoints integrados respondan correctamente
 * en el puerto 3000, reemplazando la funcionalidad del puerto 3001.
 */

const { test, expect } = require('@playwright/test');

test.describe('IRP Integration Tests (Integrated Architecture)', () => {

    // URL base integrada en Next.js (Puerto 3000)
    const BASE_URL = 'http://localhost:3000/api/v1/irp';

    // Token Mock para entornos de test (definido en config.js)
    const MOCK_TOKEN = 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5';

    test('IRP-001: Health Check del servicio integrado', async ({ request }) => {
        console.log('[TEST] Verificando /health...');
        const response = await request.get(`${BASE_URL}/health`, {
            headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.status).toBe('healthy');
        // Verificar que reporte disponibilidad de IA (true o false, pero presente)
        expect(body.aiAvailable).toBeDefined();
        console.log('[TEST] ✅ Health Check OK:', body);
    });

    test('IRP-002: Historial de Revisiones (Endpoint Migrado)', async ({ request }) => {
        console.log('[TEST] Verificando /reviews/history...');
        const response = await request.get(`${BASE_URL}/reviews/history`, {
            headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        // Verificar estructura de respuesta
        expect(Array.isArray(body.reviews)).toBe(true);
        expect(typeof body.total).toBe('number');
        console.log(`[TEST] ✅ Historial obtenido: ${body.reviews.length} revisiones`);
    });

    test('IRP-003: Estadísticas de Administrador (Endpoint Migrado)', async ({ request }) => {
        console.log('[TEST] Verificando /admin/stats...');
        const response = await request.get(`${BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.total_reviews).toBeDefined();
        expect(body.pending_reviews).toBeDefined();
        expect(body.completed_this_week).toBeDefined();
        console.log('[TEST] ✅ Stats obtenidos:', body);
    });

    test('IRP-004: Navegación UI a Peer Review', async ({ page }) => {
        console.log('[TEST] Verificando navegación a /peer-review...');

        // Navegar
        await page.goto('http://localhost:3000/peer-review');

        // Esperar a que cargue
        await page.waitForLoadState('networkidle');

        const url = page.url();
        const title = await page.title();
        console.log(`[TEST] URL actual: ${url}`);
        console.log(`[TEST] Título: ${title}`);

        // Validar que NO estamos en 404
        expect(title).not.toContain('404');
        expect(title).not.toContain('Not Found');

        // Si redirige a login es aceptable (significa que la ruta existe y está protegida)
        if (url.includes('/login')) {
            console.log('[TEST] ℹ️ Redirigido a login (Comportamiento correcto para ruta protegida)');
        } else {
            console.log('[TEST] ✅ Acceso permitido a página Peer Review');
        }
    });

});
