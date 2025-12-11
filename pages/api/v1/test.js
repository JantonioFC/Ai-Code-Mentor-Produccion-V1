/**
 * ENDPOINT DIAGNÓSTICO - API v1.0
 * Test básico para verificar que la estructura v1 funciona
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = {
      status: 'OK',
      message: 'API v1.0 endpoint funcionando',
      timestamp: new Date().toISOString(),
      path: '/api/v1/test'
    };

    console.log('🔍 [TEST] Endpoint de diagnóstico ejecutado');
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ [TEST] Error en endpoint de diagnóstico:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
