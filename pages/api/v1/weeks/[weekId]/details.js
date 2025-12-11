/**
 * ENDPOINT API v1.0 - GET /api/v1/weeks/{weekId}/details
 * MISIÓN 183.2 - Lazy Loading de Datos de Detalle de Semana
 * MISIÓN 185.2 - Exposición de Guía de Estudio Estratégico
 * 
 * Provee datos completos de una semana específica optimizada para
 * carga diferida (lazy loading) cuando el usuario expande una semana.
 * Incluye la Guía de Estudio Estratégico cuando está disponible.
 * 
 * @author Mentor Coder
 * @version v1.1 - Incluye guiaEstudio
 * @arquitectura SQLite v9.0 - Lazy Loading Pattern
 * @contrato API v1.0 - FIDELIDAD TOTAL
 */

const { getWeekDetails, validateDatabase } = require('../../../../../lib/curriculum-sqlite');

/**
 * Handler principal del endpoint GET /api/v1/weeks/{weekId}/details
 * 
 * Devuelve datos completos de una semana específica incluyendo:
 * - Información básica de la semana
 * - Esquema diario completo con pomodoros
 * - Objetivos, actividades, recursos
 * - Entregables y ejercicios
 * - Guía de Estudio Estratégico (cuando disponible)
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
    // Extraer weekId de la URL
    const { weekId } = req.query;
    
    if (!weekId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El parámetro weekId es requerido'
      });
    }

    // Convertir a número y validar rango
    const weekNumber = parseInt(weekId, 10);
    
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'weekId debe ser un número entre 1 y 100'
      });
    }

    console.log(`📊 [API-v1] Obteniendo detalles de semana ${weekNumber}...`);

    // Validar integridad de base de datos
    const dbValidation = await validateDatabase();
    if (!dbValidation.isValid) {
      console.error('❌ [API-v1] Base de datos no válida:', dbValidation);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error de integridad en la base de datos'
      });
    }

    // Obtener detalles completos de la semana desde SQLite
    const weekDetails = await getWeekDetails(weekNumber);
    
    if (!weekDetails) {
      console.log(`❌ [API-v1] Semana ${weekNumber} no encontrada`);
      return res.status(404).json({
        error: 'Not Found',
        message: `La semana ${weekNumber} no fue encontrada`
      });
    }

    // Construir respuesta optimizada para WeekDetails + WeeklySchedule
    const detailsResponse = {
      // Información básica de la semana
      semana: weekDetails.semana,
      tituloSemana: weekDetails.titulo_semana,
      tematica: weekDetails.tematica,
      
      // Datos para WeekDetails
      objetivos: weekDetails.objetivos ? JSON.parse(weekDetails.objetivos) : [],
      actividades: weekDetails.actividades ? JSON.parse(weekDetails.actividades) : [],
      entregables: weekDetails.entregables || null,
      recursos: weekDetails.recursos ? JSON.parse(weekDetails.recursos) : [],
      ejercicios: weekDetails.ejercicios ? JSON.parse(weekDetails.ejercicios) : [],
      
      // Datos para WeeklySchedule
      esquemaDiario: weekDetails.esquema_diario || [],
      officialSources: weekDetails.official_sources ? JSON.parse(weekDetails.official_sources) : [],
      
      // Información del módulo y fase (contexto)
      modulo: {
        numero: weekDetails.modulo_numero,
        titulo: weekDetails.modulo_titulo
      },
      fase: {
        numero: weekDetails.fase_numero,
        titulo: weekDetails.fase_titulo
      }
    };

    // MISIÓN 185.2: Procesar Guía de Estudio Estratégico
    // Si la semana tiene guía de estudio, parsear el JSON y añadir a la respuesta
    if (weekDetails.guia_estudio && weekDetails.guia_estudio.trim() !== '') {
      try {
        const guiaEstudioParsed = JSON.parse(weekDetails.guia_estudio);
        detailsResponse.guiaEstudio = guiaEstudioParsed;
        console.log(`✅ [API-v1] Guía de estudio incluida para semana ${weekNumber}`);
      } catch (parseError) {
        console.warn(`⚠️ [API-v1] Error parseando guia_estudio para semana ${weekNumber}:`, parseError.message);
        // No agregar guiaEstudio si hay error de parsing
      }
    } else {
      console.log(`📄 [API-v1] Semana ${weekNumber} no tiene guía de estudio`);
    }

    // Añadir metadatos de la respuesta
    detailsResponse.metadata = {
        apiVersion: '1.0',
        dataSource: 'sqlite',
        architecture: 'SQLite v9.0 - Lazy Loading',
        optimizedFor: 'weekDetails',
        mission: '185.2', // Actualizada para reflejar la misión actual
        generatedAt: new Date().toISOString(),
        databaseValidation: {
          isValid: dbValidation.isValid,
          validatedAt: dbValidation.timestamp
        },
        sourceFunction: 'getWeekDetails',
        lazyLoadingPattern: true,
        guiaEstudioIncluida: !!detailsResponse.guiaEstudio
      };

    console.log(`✅ [API-v1] Detalles de semana ${weekNumber} generados`);
    console.log(`📊 [API-v1] Esquema diario: ${weekDetails.esquema_diario ? weekDetails.esquema_diario.length : 0} días`);
    console.log(`📊 [API-v1] Objetivos: ${detailsResponse.objetivos.length}`);
    console.log(`📊 [API-v1] Actividades: ${detailsResponse.actividades.length}`);

    // Este endpoint requiere autenticación para acceso a datos detallados
    return res.status(200).json(detailsResponse);

  } catch (error) {
    console.error('❌ [API-v1] Error interno en weeks/details:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error interno del servidor'
    });
  }
}
