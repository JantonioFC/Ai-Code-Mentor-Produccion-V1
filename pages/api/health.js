/**
 * MISIÓN 268 - FASE 3: ENDPOINT DE HEALTH CHECK
 * 
 * PROPÓSITO:
 * Provee un endpoint simple de health check para validar que el servicio principal
 * está operativo. Este endpoint es utilizado por el test BASIC-003.
 * 
 * CARACTERÍSTICAS:
 * - No requiere autenticación
 * - Responde con código 200 OK
 * - Retorna información básica del estado del servicio
 * 
 * @author Mentor Coder
 * @version M-268 - Fase 3
 */

export default function handler(req, res) {
  console.warn('[DEPRECATION] pages/api/health.js is deprecated. Please use /api/v2/health instead.');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'main-app',
    version: '1.0.0',
    uptime: process.uptime()
  });
}
