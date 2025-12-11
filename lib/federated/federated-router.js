/**
 * ROUTER FEDERADO - Arquitectura v8.1.0
 * 
 * Módulo central para enrutamiento en sistema de datos federado.
 * Implementa función findPhaseFile() según ARQUITECTURA_VIVA_v8.0.md
 * 
 * @author Mentor Coder
 * @version v1.1
 * @misión 177 - Integración Arquitectura Federada
 * @misión CORRECTIVA - Inclusión crítica de esquemaDiario
 * 
 * CHANGELOG v1.1:
 * - ✅ CORRECCIÓN CRÍTICA: findWeekInPhase() ahora incluye TODAS las propiedades
 * - ✅ Solución: Uso de spread operator para preservar esquemaDiario
 * - ✅ Bug resuelto: Error 500 en generación de lecciones granulares
 */

const fs = require('fs').promises;
const path = require('path');

// Configuración del sistema federado
const FEDERATED_CONFIG = {
  INDEX_FILE: path.join(process.cwd(), 'data', 'federated', 'index.json'),
  FEDERATED_DIR: path.join(process.cwd(), 'data', 'federated'),
  CACHE_TTL: 5 * 60 * 1000 // 5 minutos
};

// Cache en memoria para performance
let indexCache = null;
let cacheTimestamp = null;

/**
 * Función principal de enrutamiento federado
 * Determina qué archivo de fase contiene los datos de una semana específica
 * 
 * @param {number} weekId - ID de la semana (1-100)
 * @returns {Promise<string|null>} Nombre del archivo de fase o null si no se encuentra
 */
async function findPhaseFile(weekId) {
  // Validación de entrada
  if (!weekId || typeof weekId !== 'number' || weekId < 1 || weekId > 100) {
    console.error(`❌ [FEDERATED] weekId inválido: ${weekId}. Debe estar entre 1-100.`);
    return null;
  }

  try {
    // Cargar índice maestro (con cache)
    const indexData = await getIndexData();
    
    // Buscar mapeo de fase correspondiente
    const mapping = indexData.phaseMapping.find(map => 
      weekId >= map.startWeek && weekId <= map.endWeek
    );
    
    if (mapping) {
      console.log(`🎯 [FEDERATED] Semana ${weekId} → ${mapping.fileName} (Fase ${mapping.fase})`);
      return mapping.fileName;
    } else {
      console.error(`❌ [FEDERATED] No se encontró mapeo para semana ${weekId}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ [FEDERATED] Error en findPhaseFile para semana ${weekId}:`, error.message);
    return null;
  }
}

/**
 * Carga los datos del índice maestro con sistema de caché
 * @returns {Promise<Object>} Datos del index.json
 */
async function getIndexData() {
  const now = Date.now();
  
  // Verificar caché válido
  if (indexCache && cacheTimestamp && (now - cacheTimestamp) < FEDERATED_CONFIG.CACHE_TTL) {
    return indexCache;
  }

  try {
    // Cargar index.json desde disco
    const indexContent = await fs.readFile(FEDERATED_CONFIG.INDEX_FILE, 'utf8');
    const indexData = JSON.parse(indexContent);
    
    // Validar estructura del índice
    if (!indexData.phaseMapping || !Array.isArray(indexData.phaseMapping)) {
      throw new Error('Estructura de index.json inválida: falta phaseMapping');
    }
    
    // Actualizar caché
    indexCache = indexData;
    cacheTimestamp = now;
    
    console.log(`✅ [FEDERATED] Index.json cargado: v${indexData.version}, ${indexData.totalPhases} fases`);
    return indexData;
    
  } catch (error) {
    throw new Error(`Error cargando index.json: ${error.message}`);
  }
}

/**
 * Carga los datos de una fase específica
 * @param {string} phaseFileName - Nombre del archivo de fase (ej: "fase-2.json")
 * @returns {Promise<Object>} Datos de la fase
 */
async function loadPhaseData(phaseFileName) {
  if (!phaseFileName) {
    throw new Error('Nombre de archivo de fase requerido');
  }

  try {
    const phaseFilePath = path.join(FEDERATED_CONFIG.FEDERATED_DIR, phaseFileName);
    const phaseContent = await fs.readFile(phaseFilePath, 'utf8');
    const phaseData = JSON.parse(phaseContent);
    
    console.log(`📄 [FEDERATED] Fase cargada: ${phaseFileName} (Fase ${phaseData.fase?.numero || phaseData.fase || 'N/A'})`);
    return phaseData;
    
  } catch (error) {
    throw new Error(`Error cargando archivo de fase ${phaseFileName}: ${error.message}`);
  }
}

/**
 * Obtiene los datos de una semana específica usando el sistema federado
 * @param {number} weekId - ID de la semana (1-100) 
 * @returns {Promise<Object|null>} Datos de la semana o null si no se encuentra
 */
async function getWeekDataFederated(weekId) {
  try {
    // PASO 1: Determinar archivo de fase
    const phaseFileName = await findPhaseFile(weekId);
    if (!phaseFileName) {
      return null;
    }
    
    // PASO 2: Cargar datos de la fase
    const phaseData = await loadPhaseData(phaseFileName);
    
    // PASO 3: Buscar semana específica en la fase
    const weekData = findWeekInPhase(phaseData, weekId);
    
    if (weekData) {
      console.log(`✅ [FEDERATED] Semana ${weekId} encontrada: "${weekData.tituloSemana}"`);
      return {
        ...weekData,
        // Enriquecer con metadatos de fase
        fase: phaseData.fase?.numero || phaseData.fase || 0,
        tituloFase: phaseData.fase?.titulo || phaseData.tituloFase || 'Fase sin título',
        sourceFile: phaseFileName
      };
    } else {
      console.warn(`⚠️ [FEDERATED] Semana ${weekId} no encontrada en ${phaseFileName}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ [FEDERATED] Error obteniendo datos de semana ${weekId}:`, error.message);
    return null;
  }
}

/**
 * Busca una semana específica dentro de los datos de una fase
 * @param {Object} phaseData - Datos completos de la fase
 * @param {number} weekId - ID de la semana a buscar
 * @returns {Object|null} Datos de la semana o null
 */
function findWeekInPhase(phaseData, weekId) {
  // MISIÓN 178: CORRECCIÓN - Buscar directamente en phaseData.semanas
  // Los datos federados tienen estructura: phaseData.semanas[] no phaseData.modulos[].semanas[]
  for (const semana of phaseData.semanas || []) {
    // MISIÓN 178: CORRECCIÓN - Campo se llama 'numero' no 'semana'
    if (semana.numero === weekId) {
      // Encontrar módulo correspondiente para metadatos
      let moduloData = null;
      for (const modulo of phaseData.modulos || []) {
        if (modulo.semanas && modulo.semanas.includes(weekId)) {
          moduloData = {
            modulo: modulo.numero,
            tituloModulo: modulo.titulo
          };
          break;
        }
      }
      
      // 🚀 MISIÓN: CORRECCIÓN CRÍTICA ESQUEMA DIARIO
      // SOLUCIÓN K.I.S.S.: Incluir TODAS las propiedades usando spread operator
      return {
        ...semana, // ✅ Incluir TODAS las propiedades (incluyendo esquemaDiario)
        semana: semana.numero, // Normalizar campo para compatibilidad
        // Metadatos de módulo si se encuentra
        ...(moduloData || { modulo: semana.modulo, tituloModulo: 'Módulo no especificado' })
      };
    }
  }
  return null;
}

/**
 * Valida la integridad del sistema federado
 * @returns {Promise<boolean>} true si el sistema está íntegro
 */
async function validateFederatedSystem() {
  try {
    console.log('🔍 [FEDERATED] Validando integridad del sistema federado...');
    
    // Verificar index.json
    const indexData = await getIndexData();
    console.log(`✅ index.json válido: v${indexData.version}`);
    
    // Verificar archivos de fase
    for (const mapping of indexData.phaseMapping) {
      const phaseFilePath = path.join(FEDERATED_CONFIG.FEDERATED_DIR, mapping.fileName);
      try {
        await fs.access(phaseFilePath);
        console.log(`✅ ${mapping.fileName} existe`);
      } catch (error) {
        console.error(`❌ ${mapping.fileName} no encontrado`);
        return false;
      }
    }
    
    console.log('✅ [FEDERATED] Sistema federado íntegro');
    return true;
    
  } catch (error) {
    console.error(`❌ [FEDERATED] Error validando sistema:`, error.message);
    return false;
  }
}

// Exportaciones
module.exports = {
  // Función principal
  findPhaseFile,
  
  // Funciones de carga de datos
  getIndexData,
  loadPhaseData,
  getWeekDataFederated,
  
  // Funciones auxiliares
  findWeekInPhase,
  validateFederatedSystem,
  
  // Configuración (para testing)
  FEDERATED_CONFIG
};
