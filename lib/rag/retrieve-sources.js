/**
 * MOTOR RAG CORE - retrieve_sources() + ARM EXTERNO + ARQUITECTURA FEDERADA
 * 
 * MISIÓN 177: INTEGRACIÓN ARQUITECTURA FEDERADA v8.1.0
 * 
 * Función núcleo del Motor RAG que recupera fuentes de verdad 
 * para una semana específica del currículum Ecosistema 360.
 * 
 * EVOLUCIÓN v3.0: Migración a arquitectura de datos federada
 * - Abandona curriculum_rag_v3.json monolítico
 * - Usa sistema federado: index.json + fase-N.json
 * - Mantiene integración completa con ARM (Módulo de Recuperación Activa)
 * - Mejora de rendimiento: 52% según Spike 175.5
 * 
 * Implementación basada en ARQUITECTURA_VIVA_v8.0.md
 * 
 * @author Mentor Coder
 * @version v3.0 - Arquitectura Federada + ARM Externo Integrado
 * @fecha 2025-09-21
 * @misión 177 - Integración de la Lógica Federada en el Backend
 */

const fs = require('fs').promises;
const path = require('path');

// MISIÓN 166: Importar ARM Externo
const { enrichRAGWithExternalSources } = require('../arm/external-retriever.js');

// MISIÓN 177: Importar Router Federado v8.1.0 - CORREGIDO MISIÓN 176
// 🚀 MISIÓN 176: Import dinámico para compatibilidad ES modules
// const { getWeekDataFederated, validateFederatedSystem } = require('../federated/federated-router.js');

/**
 * CONFIGURACIÓN DEL SISTEMA RAG - ARQUITECTURA FEDERADA v8.1.0
 */
const RAG_CONFIG = {
  // MISIÓN 177: Migración a arquitectura federada
  DATA_SOURCE: 'federated_system_v8.1.0',
  CONTEXT_VERSION: 'v8.1.0',
  SOURCE_AUTHORITY: 'data/federated/index.json + fase-N.json',
  MAX_PREREQUISITES: 3,
  PHASE_COUNT: 8 // Fases 0-7
};

/**
 * MISIÓN 177: Cache removido - Sistema federado maneja su propio caché
 * 
 * El Router Federado (federated-router.js) implementa su propio sistema
 * de caché para index.json optimizado para la arquitectura federada.
 */
// Cache removido - ver federated-router.js

/**
 * FUNCIÓN PRINCIPAL DEL MOTOR RAG + ARM EXTERNO
 * Recupera fuentes de verdad para una semana específica del currículum
 * 
 * NOVEDAD v2.0: Integra ARM Externo para enriquecer con fuentes oficiales
 * 
 * @param {number} weekId - ID de la semana (1-100)
 * @param {boolean} includeExternalSources - Si incluir ARM externo (default: true)
 * @returns {Promise<Object>} Contexto curricular enriquecido para prompt augmentation
 * @throws {Error} Si weekId es inválido o semana no encontrada
 */
async function retrieve_sources(weekId, includeExternalSources = true) {
  // VALIDACIÓN DE ENTRADA
  if (!weekId || typeof weekId !== 'number' || weekId < 1 || weekId > 100) {
    throw new Error(`WeekId inválido: ${weekId}. Debe estar entre 1-100.`);
  }

  // MISIÓN 177: RECUPERACIÓN FEDERADA DE CURRICULUM CORE
  console.log(`🚀 [RAG FEDERADO] Recuperando datos para semana ${weekId} usando arquitectura federada...`);
  
  // 🚀 MISIÓN 176: CORRECCIÓN CRÍTICA - Import dinámico para compatibilidad ES module
  const { getWeekDataFederated } = await import('../federated/federated-router.js');
  const weekData = await getWeekDataFederated(weekId);
  
  if (!weekData) {
    throw new Error(`Semana ${weekId} no encontrada en sistema federado`);
  }
  
  console.log(`✅ [RAG FEDERADO] Semana ${weekId} cargada desde ${weekData.sourceFile}`);
  console.log(`   📚 Título: "${weekData.tituloSemana}"`);
  console.log(`   🏇 Fase: ${weekData.fase} - ${weekData.tituloFase}`);
  console.log(`   📁 Módulo: ${weekData.modulo} - ${weekData.tituloModulo}`);

  // ENRIQUECIMIENTO CONTEXTUAL BÁSICO
  const basicContext = {
    // CONTEXTO CURRICULAR BÁSICO
    weekId: weekId,
    weekTitle: weekData.tituloSemana,
    phase: weekData.fase,
    phaseTitle: weekData.tituloFase,
    module: weekData.modulo,
    moduleTitle: weekData.tituloModulo,
    
    // OBJETIVOS PEDAGÓGICOS
    objectives: weekData.objetivos || [],
    mainTopic: weekData.tematica || '',
    activities: weekData.actividades || [],
    deliverables: weekData.entregables || '',
    
    // RECURSOS ESPECÍFICOS
    resources: weekData.recursos || [],
    exercises: weekData.ejercicios || [],
    
    // CONTEXTO METODOLÓGICO
    pedagogicalApproach: determinePedagogicalApproach(weekData.fase),
    difficultyLevel: calculateDifficultyLevel(weekId, weekData.fase),
    prerequisites: await getPrerequisites(weekId), // MISIÓN 177: Ahora usa sistema federado
    
    // METADATOS RAG
    retrievalTimestamp: new Date().toISOString(),
    sourceAuthority: RAG_CONFIG.SOURCE_AUTHORITY,
    contextVersion: RAG_CONFIG.CONTEXT_VERSION
  };

  // MISIÓN 166: ENRIQUECIMIENTO CON ARM EXTERNO
  if (includeExternalSources) {
    try {
      console.log(`🚀 [RAG+ARM] Enriqueciendo contexto con fuentes externas...`);
      const enrichedContext = await enrichRAGWithExternalSources(basicContext);
      console.log(`✅ [RAG+ARM] Contexto enriquecido: ${enrichedContext.externalSources?.length || 0} fuentes externas`);
      return enrichedContext;
    } catch (armError) {
      console.error(`❌ [RAG+ARM] Error en ARM externo: ${armError.message}`);
      console.warn(`🔄 [RAG+ARM] Fallback: Devolviendo contexto básico sin fuentes externas`);
      return {
        ...basicContext,
        externalSources: [],
        armStatus: 'error',
        armError: armError.message
      };
    }
  }

  return basicContext;
}

/**
 * FUNCIONES DE SOPORTE RAG
 */

/**
 * DEPRECATED - MISIÓN 177: Función deprecada tras migración a arquitectura federada
 * 
 * Anteriormente obtenía los datos del curriculum desde archivo monolítico.
 * Ahora el sistema usa getWeekDataFederated() del router federado.
 * 
 * @deprecated Usar getWeekDataFederated() en su lugar
 * @returns {Promise<Object>} Datos del curriculum completos
 */
async function getCurriculumData() {
  throw new Error('DEPRECATED: getCurriculumData() ha sido reemplazada por sistema federado. Usar getWeekDataFederated().');
}

/**
 * DEPRECATED - MISIÓN 168: Función comentada tras corrección adherencia temática
 * 
 * Extiende el curriculum real con datos simulados para testing
 * @param {Object} realCurriculum - Curriculum real con 3 semanas
 * @returns {Object} Curriculum extendido hasta semana 100
 * 
 * NOTA: Ya no se usa porque curriculum.json contiene datos reales completos 1-100
 */
/*
function extendCurriculumForTesting(realCurriculum) {
  const extended = JSON.parse(JSON.stringify(realCurriculum));
  
  // Generar semanas 4-100 para completar el rango de testing
  for (let semana = 4; semana <= 100; semana++) {
    const fase = Math.floor((semana - 1) / 12); // ~12 semanas por fase
    const modulo = Math.floor((semana - 1) / 6) + 1; // ~6 semanas por módulo
    
    const semanaData = {
      semana: semana,
      tituloSemana: `Semana de Prueba ${semana}`,
      objetivos: [`Objetivo test ${semana}`, `Segundo objetivo test ${semana}`],
      tematica: `Temática de prueba para semana ${semana}`,
      actividades: [`Actividad test ${semana}`],
      entregables: `Entregable test semana ${semana}`,
      recursos: [], // Recursos vacíos por defecto
      ejercicios: [] // Ejercicios vacíos por defecto
    };

    // Agregar recursos específicos para algunas semanas (para tests)
    if (semana % 10 === 5) { // Cada 10 semanas, agregar recursos
      semanaData.recursos = [{
        nombre: `Recurso Test ${semana}`,
        url: `https://test.com/recurso-${semana}`
      }];
    }

    // Agregar a la fase apropiada
    if (!extended.curriculum[fase]) {
      extended.curriculum[fase] = {
        fase: fase,
        tituloFase: getFaseTitleByIndex(fase),
        duracionMeses: "Variable Test",
        proposito: `Propósito test fase ${fase}`,
        modulos: []
      };
    }

    // Agregar al módulo apropiado
    const targetModuleIndex = extended.curriculum[fase].modulos.findIndex(m => m.modulo === modulo);
    if (targetModuleIndex === -1) {
      extended.curriculum[fase].modulos.push({
        modulo: modulo,
        tituloModulo: `Módulo Test ${modulo}`,
        semanas: [semanaData]
      });
    } else {
      extended.curriculum[fase].modulos[targetModuleIndex].semanas.push(semanaData);
    }
  }
  
  return extended;
}
*/

/**
 * Obtiene el título de fase según especificación ARQUITECTURA_VIVA_v5.0
 * @param {number} faseIndex - Índice de la fase (0-7)
 * @returns {string} Título de la fase
 */
function getFaseTitleByIndex(faseIndex) {
  const faseTitles = {
    0: "La Cimentación del Arquitecto",
    1: "Fundamentos de Programación y Metodología", 
    2: "Desarrollo Web Frontend",
    3: "Desarrollo Backend Profesional",
    4: "DevOps y Cloud Computing",
    5: "Ciencia de Datos e IA",
    6: "Integración y Preparación Profesional",
    7: "Profesionalización y Crecimiento"
  };
  return faseTitles[faseIndex] || `Fase Test ${faseIndex}`;
}

/**
 * DEPRECATED - MISIÓN 177: Función deprecada tras migración a arquitectura federada
 * 
 * Anteriormente buscaba una semana en la estructura monolítica del curriculum.
 * Ahora el sistema usa getWeekDataFederated() que maneja esto internamente.
 * 
 * @deprecated Usar getWeekDataFederated() en su lugar
 * @param {Object} curriculumData - Datos completos del curriculum
 * @param {number} weekId - ID de la semana a buscar
 * @returns {Object|null} Datos de la semana o null si no encontrada
 */
function findWeekInCurriculum(curriculumData, weekId) {
  throw new Error('DEPRECATED: findWeekInCurriculum() ha sido reemplazada por sistema federado. Usar getWeekDataFederated().');
}

/**
 * Determina el enfoque pedagógico según la fase curricular
 * @param {number} phase - Número de fase (0-7)
 * @returns {string} Enfoque pedagógico correspondiente
 */
function determinePedagogicalApproach(phase) {
  const approaches = {
    0: "Cimentación y Fundamentos",
    1: "Programación Estructurada",
    2: "Desarrollo Frontend",
    3: "Arquitectura Backend", 
    4: "Operaciones y Escalabilidad",
    5: "Ciencia de Datos",
    6: "Integración Professional",
    7: "Crecimiento Continuo"
  };
  return approaches[phase] || "Enfoque General";
}

/**
 * Calcula el nivel de dificultad basado en progresión curricular
 * @param {number} weekId - Semana del curriculum
 * @param {number} phase - Fase curricular
 * @returns {string} Nivel de dificultad
 */
function calculateDifficultyLevel(weekId, phase) {
  if (weekId <= 20) return "Básico";
  if (weekId <= 50) return "Intermedio";
  if (weekId <= 80) return "Avanzado";
  return "Experto";
}

/**
 * Obtiene las semanas prerequisite para una semana dada usando sistema federado
 * MISIÓN 177: Refactorizada para usar arquitectura federada
 * 
 * @param {number} weekId - Semana objetivo
 * @returns {Promise<Array>} Lista de prerequisitos (máximo 3)
 */
async function getPrerequisites(weekId) {
  if (weekId <= 1) return [];
  
  const prerequisites = [];
  const startWeek = Math.max(1, weekId - RAG_CONFIG.MAX_PREREQUISITES);
  
  // 🚀 MISIÓN 176: CORRECCIÓN CRÍTICA - Import dinámico para compatibilidad ES module
  const { getWeekDataFederated } = await import('../federated/federated-router.js');
  
  for (let i = startWeek; i < weekId; i++) {
    try {
      const prevWeek = await getWeekDataFederated(i);
      if (prevWeek) {
        prerequisites.push({
          weekId: i,
          title: prevWeek.tituloSemana,
          keyTopics: prevWeek.objetivos ? prevWeek.objetivos.slice(0, 2) : []
        });
      }
    } catch (error) {
      // Si no se encuentra una semana prerequisito, continuar con las demás
      console.warn(`⚠️ [RAG FEDERADO] No se pudo cargar prerequisito semana ${i}:`, error.message);
    }
  }
  
  return prerequisites;
}

/**
 * EXPORTACIONES - MISIÓN 177: Actualizadas para arquitectura federada
 */
module.exports = {
  // Función principal
  retrieve_sources,
  
  // Funciones auxiliares activas (para testing)
  determinePedagogicalApproach,
  calculateDifficultyLevel,
  getPrerequisites,
  
  // DEPRECATED - Mantenidas solo para compatibilidad de tests existentes
  getCurriculumData, // DEPRECATED: Lanza error sugiriendo getWeekDataFederated
  findWeekInCurriculum // DEPRECATED: Lanza error sugiriendo getWeekDataFederated
};

/**
 * NOTAS DE IMPLEMENTACIÓN - VERSIÓN FEDERADA v3.0
 * 
 * 1. ARQUITECTURA FEDERADA:
 *    - Migración completa desde curriculum_rag_v3.json monolítico
 *    - Usa sistema federado: index.json + 8 archivos fase-N.json
 *    - Mejora de rendimiento: 52% según validación Spike 175.5
 *    - Carga granular: solo datos necesarios por semana
 * 
 * 2. PERFORMANCE OPTIMIZADA:
 *    - Cache federado en federated-router.js (index.json cacheado)
 *    - Carga bajo demanda de archivos de fase específicos
 *    - Reducción significativa en uso de memoria
 *    - Factor de aceleración 2.08x validado
 * 
 * 3. ROBUSTEZ Y COMPATIBILIDAD:
 *    - Validación estricta de parámetros de entrada
 *    - Manejo de errores con mensajes descriptivos
 *    - Funciones legacy deprecadas con sugerencias de migración
 *    - Integración completa con ARM (Módulo de Recuperación Activa)
 * 
 * 4. EXTENSIBILIDAD FEDERADA:
 *    - Configuración centralizada en RAG_CONFIG actualizada
 *    - Estructura modular preparada para escalabilidad horizontal
 *    - Router federado independiente para reutilización
 *    - Preparado para futura distribución o CDN
 * 
 * 5. CONFORMIDAD ARQUITECTÓNICA:
 *    - Implementa ARQUITECTURA_VIVA_v8.0.md completamente
 *    - Metadatos RAG actualizados (v8.1.0)
 *    - Estructura de respuesta preservada para compatibilidad
 *    - Integración ARM mantenida sin cambios
 */
