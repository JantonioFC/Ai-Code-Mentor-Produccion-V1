/**
 * ENDPOINT API v1.0 - GET /api/v1/curriculum/index
 * MISIÓN 181 - FASE 2: Refactorización Backend SQLite
 * 
 * Implementa el endpoint de metadatos del currículo según Contrato de API v1.0.
 * Reemplaza el index.json federado por datos dinámicos desde curriculum.db.
 * 
 * @author Mentor Coder
 * @version v1.2 - Corrección definitiva
 * @arquitectura SQLite v9.0
 * @contrato API v1.0 - FIDELIDAD TOTAL
 */

const { getCurriculumIndex, validateDatabase } = require('../../../../lib/curriculum-sqlite');

/**
 * Handler principal del endpoint GET /api/v1/curriculum/index
 * 
 * @param {Object} req - Request object de Next.js
 * @param {Object} res - Response object de Next.js
 */
export default async function handler(req, res) {
  // Verificar método HTTP según contrato
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo acepta solicitudes GET'
    });
  }

  try {
    console.log('📊 [API-v1] Procesando solicitud de índice del currículo...');

    // Validar integridad de base de datos
    const dbValidation = await validateDatabase();
    if (!dbValidation.isValid) {
      console.error('❌ [API-v1] Base de datos no válida:', dbValidation);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error de integridad en la base de datos'
      });
    }

    // Obtener índice desde SQLite
    const curriculumIndex = await getCurriculumIndex();
    
    if (!curriculumIndex) {
      console.error('❌ [API-v1] No se pudo obtener índice del currículo');
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error obteniendo índice del currículo'
      });
    }

    // Construir respuesta según Contrato API v1.0
    const apiResponse = {
      // Campos requeridos por el contrato
      version: curriculumIndex.version || '9.0.0-sqlite',
      totalPhases: curriculumIndex.totalPhases,
      totalWeeks: curriculumIndex.totalWeeks,
      
      // Mapeo de fases compatible con arquitectura federada anterior
      phaseMapping: curriculumIndex.phaseMapping.map(phase => ({
        fase: phase.fase,
        fileName: `fase-${phase.fase}.json`, // Compatibilidad con arquitectura anterior
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        title: phase.titulo,
        weekCount: phase.weekCount
      })),
      
      // Información adicional de fases
      phases: curriculumIndex.fases,
      
      // Metadatos de la respuesta
      metadata: {
        apiVersion: '1.0',
        dataSource: 'sqlite',
        architecture: 'SQLite v9.0',
        generatedAt: curriculumIndex.generatedAt || new Date().toISOString(),
        databaseValidation: {
          isValid: dbValidation.isValid,
          validatedAt: dbValidation.timestamp
        }
      }
    };

    console.log(`✅ [API-v1] Índice generado: ${apiResponse.totalPhases} fases, ${apiResponse.totalWeeks} semanas`);

    // NOTA: Este endpoint NO requiere autenticación según el contrato
    return res.status(200).json(apiResponse);

  } catch (error) {
    console.error('❌ [API-v1] Error interno en curriculum/index:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error interno del servidor'
    });
  }
}
