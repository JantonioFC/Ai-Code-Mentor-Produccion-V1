/**
 * ENDPOINT API v1.0 - GET /api/v1/curriculum/index (SIMPLIFICADO)
 * Versión simplificada para diagnóstico inicial
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo acepta solicitudes GET'
    });
  }

  try {
    console.log('📊 [API-v1] Procesando solicitud de índice del currículo...');

    // Respuesta simplificada para test inicial
    const apiResponse = {
      version: '9.0.0-sqlite-test',
      totalPhases: 8,
      totalWeeks: 100,
      phaseMapping: [
        {
          fase: 0,
          fileName: 'fase-0.json',
          startWeek: 1,
          endWeek: 9,
          title: 'Fundamentos',
          weekCount: 9
        }
      ],
      metadata: {
        apiVersion: '1.0',
        dataSource: 'test',
        architecture: 'SQLite v9.0',
        generatedAt: new Date().toISOString(),
        mode: 'diagnostic'
      }
    };

    console.log('✅ [API-v1] Respuesta de diagnóstico generada');
    return res.status(200).json(apiResponse);

  } catch (error) {
    console.error('❌ [API-v1] Error interno en curriculum/index:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error interno del servidor',
      details: error.message
    });
  }
}
