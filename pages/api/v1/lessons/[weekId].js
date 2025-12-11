/**
 * ENDPOINT API v1.0 - GET /api/v1/lessons/{weekId}
 * MISIÓN 181 - FASE 2: Refactorización Backend SQLite
 * 
 * Implementa el endpoint principal del Contrato de API v1.0 para obtener
 * contenido de lecciones desde curriculum.db (SQLite).
 * 
 * Reemplaza la arquitectura federada JSON por acceso directo a SQLite,
 * manteniendo compatibilidad total con frontend y ARM.
 * 
 * @author Mentor Coder
 * @version v1.0
 * @arquitectura SQLite v9.0
 * @contrato API v1.0 - FIDELIDAD TOTAL
 */

const { getWeekData, getWeekBasicData, validateDatabase } = require('../../../../lib/curriculum-sqlite');
const { fetchRawHTML } = require('../../../../lib/arm/retriever');

/**
 * Handler principal del endpoint GET /api/v1/lessons/{weekId}
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
    const { weekId } = req.query;
    
    // Validación de entrada según contrato API v1.0
    const weekNumber = parseInt(weekId);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'weekId debe ser un entero entre 1 y 100'
      });
    }

    console.log(`🎯 [API-v1] Procesando solicitud para semana ${weekNumber}...`);

    // Validar integridad de base de datos
    const dbValidation = await validateDatabase();
    if (!dbValidation.isValid) {
      console.error('❌ [API-v1] Base de datos no válida:', dbValidation);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error de integridad en la base de datos'
      });
    }

    // Obtener datos completos de la semana desde SQLite
    const weekData = await getWeekData(weekNumber);
    
    if (!weekData) {
      console.warn(`⚠️ [API-v1] Semana ${weekNumber} no encontrada`);
      return res.status(404).json({
        error: 'Not Found',
        message: `La semana con ID ${weekNumber} no fue encontrada.`
      });
    }

    console.log(`✅ [API-v1] Datos de semana ${weekNumber} obtenidos: "${weekData.titulo}"`);

    // Procesar fuentes ARM (Active Recovery Module)
    let armSources = [];
    if (weekData.official_sources && weekData.official_sources.length > 0) {
      console.log(`🔍 [ARM] Procesando ${weekData.official_sources.length} fuentes oficiales...`);
      
      armSources = await processARMSources(weekData.official_sources, weekNumber);
    }

    // Construir respuesta según Contrato API v1.0
    const apiResponse = {
      // Campos principales requeridos por el contrato
      week: weekData.semana,
      title: weekData.titulo,
      phaseFile: `fase-${weekData.fase}.json`, // Compatibilidad con arquitectura anterior
      
      // Contenido de la lección estructurado
      lessonContent: {
        summary: weekData.tematica || '',
        objectives: weekData.objetivos || [],
        topics: extractTopicsFromContent(weekData),
        activities: weekData.actividades || [],
        deliverables: weekData.entregables || 'Sin entregables especificados',
        resources: weekData.recursos || [],
        exercises: weekData.ejercicios || [],
        dailySchema: weekData.esquemaDiario || []
      },
      
      // Fuentes ARM procesadas
      armSources: armSources,
      
      // Metadatos de contexto
      phase: {
        phase: weekData.fase,
        title: weekData.tituloFase,
        duration: weekData.duracionMeses,
        purpose: weekData.proposito
      },
      
      module: {
        module: weekData.modulo,
        title: weekData.tituloModulo
      },
      
      // Metadatos de la respuesta
      metadata: {
        apiVersion: '1.0',
        dataSource: 'sqlite',
        retrievedAt: new Date().toISOString(),
        architecture: 'SQLite v9.0'
      }
    };

    console.log(`🚀 [API-v1] Respuesta preparada para semana ${weekNumber} con ${armSources.length} fuentes ARM`);

    return res.status(200).json(apiResponse);

  } catch (error) {
    console.error('❌ [API-v1] Error interno:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error interno del servidor'
    });
  }
}

/**
 * Procesa las fuentes oficiales usando el ARM (Active Recovery Module)
 * 
 * @param {Array<string>} officialSources - URLs de fuentes oficiales
 * @param {number} weekNumber - Número de semana para logging
 * @returns {Promise<Array>} Array de objetos con contenido ARM procesado
 */
async function processARMSources(officialSources, weekNumber) {
  const armResults = [];
  
  // Procesar máximo 3 fuentes para mantener performance
  const sourcesToProcess = officialSources.slice(0, 3);
  
  for (const sourceUrl of sourcesToProcess) {
    try {
      console.log(`🔍 [ARM] Procesando fuente: ${sourceUrl}`);
      
      // Usar ARM retriever para obtener contenido
      const content = await fetchRawHTML(sourceUrl);
      
      // Extraer contenido relevante (simplificado por ahora)
      const extractedContent = extractRelevantContent(content);
      
      armResults.push({
        url: sourceUrl,
        content: extractedContent,
        cachedAt: new Date().toISOString(),
        contentLength: content.length,
        status: 'success'
      });
      
      console.log(`✅ [ARM] Fuente procesada: ${sourceUrl} (${content.length} chars)`);
      
    } catch (error) {
      console.warn(`⚠️ [ARM] Error procesando ${sourceUrl}: ${error.message}`);
      
      // Incluir error en respuesta para transparencia
      armResults.push({
        url: sourceUrl,
        content: '',
        cachedAt: new Date().toISOString(),
        status: 'error',
        error: error.message
      });
    }
  }
  
  return armResults;
}

/**
 * Extrae contenido relevante de HTML crudo (implementación simplificada)
 * 
 * @param {string} htmlContent - Contenido HTML crudo
 * @returns {string} Contenido extraído y limpio
 */
function extractRelevantContent(htmlContent) {
  // Implementación básica - en el futuro se puede usar el extractor ARM completo
  if (!htmlContent) return '';
  
  // Remover tags HTML básicos y obtener texto
  const textContent = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remover scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remover estilos
    .replace(/<[^>]+>/g, ' ')                          // Remover tags HTML
    .replace(/\s+/g, ' ')                              // Normalizar espacios
    .trim();
  
  // Limitar tamaño para respuesta API
  return textContent.length > 2000 ? textContent.substring(0, 2000) + '...' : textContent;
}

/**
 * Extrae tópicos principales del contenido de la semana
 * 
 * @param {Object} weekData - Datos completos de la semana
 * @returns {Array<string>} Array de tópicos principales
 */
function extractTopicsFromContent(weekData) {
  const topics = [];
  
  // Agregar tópicos basados en objetivos
  if (weekData.objetivos && Array.isArray(weekData.objetivos)) {
    topics.push(...weekData.objetivos.slice(0, 3)); // Máximo 3 objetivos como tópicos
  }
  
  // Agregar temática como tópico si no está en objetivos
  if (weekData.tematica && !topics.includes(weekData.tematica)) {
    topics.push(weekData.tematica);
  }
  
  // Agregar tópicos del esquema diario
  if (weekData.esquemaDiario && Array.isArray(weekData.esquemaDiario)) {
    weekData.esquemaDiario.forEach(dia => {
      if (dia.concepto && !topics.includes(dia.concepto)) {
        topics.push(dia.concepto);
      }
    });
  }
  
  return topics.slice(0, 5); // Máximo 5 tópicos
}
