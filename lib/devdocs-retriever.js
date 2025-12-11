/**
 * DEVDOCS RETRIEVER - Sistema de Recuperación Autónomo para IRP
 * MISIÓN 191 - FASE 3: Autonomía Operacional y Resiliencia
 * MISIÓN 191.6 - FALLBACK: Compatibilidad con documentación fallback generada
 * 
 * Este módulo implementa el componente de recuperación (Retrieve) del motor RAG
 * para el Sistema de Informe de Revisión por Pares (IRP) automatizado,
 * utilizando EXCLUSIVAMENTE datos locales sincronizados.
 * 
 * CAMBIO ARQUITECTÓNICO FASE 3:
 * - Eliminada dependencia de red a DevDocs.io
 * - Lectura desde sistema de archivos local (/data/devdocs)
 * - Operación completamente autónoma
 * - Gemini API es la única dependencia de red restante
 * 
 * COMPATIBILIDAD FALLBACK FASE 191.6:
 * - Soporte para documentación oficial y fallback
 * - Degradación elegante cuando API oficial no disponible
 * - Generación automática de contenido básico funcional
 * 
 * Funcionalidades principales:
 * - Carga del índice maestro desde archivo local
 * - Búsqueda de tecnologías en datos sincronizados
 * - Obtención de documentación desde archivos locales
 * - Identificación automática de entidades en código fuente
 * 
 * Principios implementados:
 * - 3.8: Procesamiento Defensivo de Datos No Estructurados
 * - 4.3: Principio de "Falla Rápido" (validación estricta de entrada)
 * - NUEVO: Autonomía Operacional (sin dependencias de red)
 * - NUEVO: Degradación Elegante (fallback operacional)
 * 
 * @author Mentor Coder
 * @version 3.1.0 - FASE 3 + FALLBACK: Autonomía Total con Degradación Elegante
 * @fecha 2025-09-28
 * @referencia ADR-001-DevDocs-IRP-Automatizado.md + Misión 191.6 Fallback
 */

const fs = require('fs').promises;
const path = require('path');

// Cache en memoria para optimizar rendimiento local
const localDataCache = {
  masterIndex: null,
  technologyIndexes: new Map(),
  contentCache: new Map(),
  lastLoaded: null,
  ttl: 1000 * 60 * 60 // 1 hora TTL para datos locales
};

// Configuración de datos locales
const LOCAL_CONFIG = {
  dataDir: path.join(__dirname, '..', 'data', 'devdocs'),
  masterIndexPath: path.join(__dirname, '..', 'data', 'devdocs', 'master', 'docs.json'),
  technologiesDir: path.join(__dirname, '..', 'data', 'devdocs', 'technologies'),
  contentDir: path.join(__dirname, '..', 'data', 'devdocs', 'content'),
  fallbackUrl: 'https://devdocs.io', // Solo para URLs de referencia, NO para peticiones
};

/**
 * FUNCIÓN 1.1: Obtiene el índice maestro desde archivo local
 * 
 * Esta función carga el índice maestro desde el sistema de archivos local,
 * eliminando completamente la dependencia de red de DevDocs.io.
 * 
 * @returns {Promise<Array>} Array con todas las documentaciones disponibles
 * @throws {Error} Si el archivo local no existe o no es válido
 * 
 * @example
 * const docs = await getMasterIndex();
 * console.log(docs.length); // Número de documentaciones disponibles
 * console.log(docs[0]); // { name: "JavaScript", slug: "javascript", ... }
 */
async function getMasterIndex() {
  console.log('[DEVDOCS-RETRIEVER] Cargando índice maestro desde datos locales...');

  // Verificar cache válido
  if (localDataCache.masterIndex && localDataCache.lastLoaded) {
    const cacheAge = Date.now() - localDataCache.lastLoaded;
    if (cacheAge < localDataCache.ttl) {
      console.log(`[DEVDOCS-RETRIEVER] Usando índice maestro desde cache (${Math.round(cacheAge/1000)}s de antigüedad)`);
      return localDataCache.masterIndex;
    }
  }

  try {
    console.log(`[DEVDOCS-RETRIEVER] Leyendo índice maestro desde: ${LOCAL_CONFIG.masterIndexPath}`);

    // Verificar que el archivo existe
    try {
      await fs.access(LOCAL_CONFIG.masterIndexPath);
    } catch (error) {
      throw new Error(`DEVDOCS-RETRIEVER-NO-LOCAL-DATA: Archivo de índice maestro no encontrado. Ejecute 'node scripts/sync-devdocs.js' para sincronizar datos locales.`);
    }

    const indexContent = await fs.readFile(LOCAL_CONFIG.masterIndexPath, 'utf8');
    const indexData = JSON.parse(indexContent);

    // Validación defensiva de datos locales (Principio 3.8)
    if (!Array.isArray(indexData)) {
      throw new Error('DEVDOCS-RETRIEVER-FORMAT: Índice maestro local no es un array válido');
    }

    if (indexData.length === 0) {
      throw new Error('DEVDOCS-RETRIEVER-EMPTY: Índice maestro local está vacío');
    }

    // Validar estructura básica de elementos
    const sampleDoc = indexData[0];
    if (!sampleDoc.name || !sampleDoc.slug) {
      throw new Error('DEVDOCS-RETRIEVER-STRUCTURE: Estructura de documentación local inválida');
    }

    // Actualizar cache
    localDataCache.masterIndex = indexData;
    localDataCache.lastLoaded = Date.now();

    console.log(`✅ [DEVDOCS-RETRIEVER] Índice maestro cargado: ${indexData.length} documentaciones disponibles localmente`);
    console.log(`📊 [DEVDOCS-RETRIEVER] Ejemplos: ${indexData.slice(0, 3).map(d => d.name).join(', ')}`);

    return indexData;

  } catch (error) {
    if (error.message.includes('ENOENT')) {
      console.error(`[DEVDOCS-RETRIEVER] Error: Datos locales no encontrados`);
      throw new Error(`DEVDOCS-RETRIEVER-MISSING-LOCAL: Datos locales no sincronizados. Ejecute 'node scripts/sync-devdocs.js' para sincronizar.`);
    } else if (error.message.startsWith('DEVDOCS-RETRIEVER-')) {
      console.error(`[DEVDOCS-RETRIEVER] Error controlado: ${error.message}`);
      throw error;
    } else {
      console.error(`[DEVDOCS-RETRIEVER] Error inesperado: ${error.message}`);
      throw new Error(`DEVDOCS-RETRIEVER-UNEXPECTED: Error inesperado leyendo índice maestro local - ${error.message}`);
    }
  }
}

/**
 * FUNCIÓN 1.2: Encuentra tecnología y carga su índice desde archivos locales
 * MISIÓN 191.6 - FALLBACK: Implementa degradación elegante cuando índices específicos no están disponibles
 * 
 * Esta función busca una tecnología específica en el índice maestro y carga
 * su índice detallado desde el sistema de archivos local. Si el índice específico
 * no está disponible, genera un índice fallback básico para permitir operación limitada.
 * 
 * @param {string} technology - Nombre de la tecnología (ej: "Python 3.11", "JavaScript")
 * @returns {Promise<Object>} Objeto con slug y entries de la tecnología (oficial o fallback)
 * @throws {Error} Solo si la tecnología no se encuentra en el índice maestro
 * 
 * @example
 * const pythonIndex = await getTechnologyIndex("Python 3.11");
 * console.log(pythonIndex.slug); // "python~3.11"
 * console.log(pythonIndex.entries.length); // Número de entradas (oficial o fallback)
 */
async function getTechnologyIndex(technology) {
  // Validación de entrada - Fail Fast (Principio 4.3)
  if (!technology || typeof technology !== 'string' || technology.trim().length === 0) {
    throw new Error('DEVDOCS-RETRIEVER-INPUT: Tecnología debe ser una cadena no vacía');
  }

  const normalizedTech = technology.trim();
  console.log(`[DEVDOCS-RETRIEVER] Buscando índice local para tecnología: "${normalizedTech}"`);

  // Verificar cache de tecnología
  if (localDataCache.technologyIndexes.has(normalizedTech)) {
    const cached = localDataCache.technologyIndexes.get(normalizedTech);
    const cacheAge = Date.now() - cached.cachedAt;
    if (cacheAge < localDataCache.ttl) {
      console.log(`[DEVDOCS-RETRIEVER] Usando índice de tecnología desde cache`);
      return cached.data;
    }
  }

  try {
    // Obtener índice maestro
    const masterIndex = await getMasterIndex();

    // Buscar tecnología en el índice maestro
    const matchedDoc = findTechnologyInIndex(masterIndex, normalizedTech);
    if (!matchedDoc) {
      const availableTechs = masterIndex.slice(0, 10).map(d => d.name).join(', ');
      throw new Error(`DEVDOCS-RETRIEVER-NOT-FOUND: Tecnología "${normalizedTech}" no encontrada. Disponibles: ${availableTechs}...`);
    }

    console.log(`✅ [DEVDOCS-RETRIEVER] Tecnología encontrada: ${matchedDoc.name} (slug: ${matchedDoc.slug})`);

    // Cargar índice específico desde archivo local
    const techIndexPath = path.join(LOCAL_CONFIG.technologiesDir, `${matchedDoc.slug}.json`);
    console.log(`[DEVDOCS-RETRIEVER] Intentando cargar índice específico desde: ${techIndexPath}`);

    try {
      await fs.access(techIndexPath);
      
      // Archivo existe - cargar índice oficial
      const techContent = await fs.readFile(techIndexPath, 'utf8');
      const techIndex = JSON.parse(techContent);

      // Validación defensiva del índice de tecnología local
      if (!techIndex.entries || !Array.isArray(techIndex.entries)) {
        throw new Error(`DEVDOCS-RETRIEVER-TECH-FORMAT: Índice local de ${matchedDoc.name} no tiene formato válido`);
      }

      const result = {
        slug: techIndex.slug || matchedDoc.slug,
        name: techIndex.name || matchedDoc.name,
        entries: techIndex.entries,
        version: techIndex.version || 'latest',
        syncedAt: techIndex.syncedAt,
        syncMethod: techIndex.syncMetadata?.syncMethod || 'official'
      };

      console.log(`✅ [DEVDOCS-RETRIEVER] Documentación oficial cargada para ${matchedDoc.name} - funcionalidad completa`);
      console.log(`✅ [DEVDOCS-RETRIEVER] Índice oficial de ${matchedDoc.name} cargado: ${techIndex.entries.length} entradas`);

      // Cachear resultado
      localDataCache.technologyIndexes.set(normalizedTech, {
        data: result,
        cachedAt: Date.now()
      });

      return result;
      
    } catch (error) {
      // MISIÓN 191.6 - FALLBACK: Archivo no existe, generar índice fallback
      console.log(`🔄 [DEVDOCS-RETRIEVER] Índice específico no disponible, activando modo fallback...`);
      console.log(`📋 [DEVDOCS-RETRIEVER] Generando índice básico para ${matchedDoc.name} usando solo índice maestro`);
      
      const fallbackIndex = generateFallbackTechnologyIndex(matchedDoc, normalizedTech);
      
      console.log(`🔄 [DEVDOCS-RETRIEVER] Documentación fallback generada para ${matchedDoc.name} - funcionalidad limitada`);
      console.log(`📊 [DEVDOCS-RETRIEVER] Índice fallback de ${matchedDoc.name} generado: ${fallbackIndex.entries.length} entradas básicas`);
      
      // Cachear resultado fallback
      localDataCache.technologyIndexes.set(normalizedTech, {
        data: fallbackIndex,
        cachedAt: Date.now()
      });

      return fallbackIndex;
    }

  } catch (error) {
    if (error.message.startsWith('DEVDOCS-RETRIEVER-')) {
      throw error;
    } else {
      console.error(`[DEVDOCS-RETRIEVER] Error inesperado buscando tecnología: ${error.message}`);
      throw new Error(`DEVDOCS-RETRIEVER-TECH-ERROR: Error cargando índice local de ${normalizedTech} - ${error.message}`);
    }
  }
}

/**
 * FUNCIÓN 1.3: Función principal - Recupera documentación desde archivos locales
 * 
 * Esta es la función principal del retriever que recibe código fuente,
 * identifica entidades relevantes y recupera la documentación correspondiente
 * desde archivos locales para alimentar el motor RAG.
 * 
 * @param {string} codeSnippet - Fragmento de código a analizar
 * @param {string} technology - Tecnología/lenguaje del código (opcional, se detecta automáticamente)
 * @returns {Promise<Array>} Array de objetos con documentación recuperada
 * @throws {Error} Si el código es inválido o no se puede procesar
 * 
 * @example
 * const docs = await retrieveDocumentationForCode(`
 *   const arr = [1, 2, 3];
 *   const doubled = arr.map(x => x * 2);
 * `, "JavaScript");
 * 
 * console.log(docs[0].entity); // "Array.prototype.map"
 * console.log(docs[0].content); // Documentación procesada
 */
async function retrieveDocumentationForCode(codeSnippet, technology = null) {
  // Validación de entrada - Fail Fast
  if (!codeSnippet || typeof codeSnippet !== 'string' || codeSnippet.trim().length === 0) {
    throw new Error('DEVDOCS-RETRIEVER-CODE-INPUT: Código debe ser una cadena no vacía');
  }

  const normalizedCode = codeSnippet.trim();
  console.log(`[DEVDOCS-RETRIEVER] Analizando código para extraer entidades (${normalizedCode.length} caracteres)`);

  try {
    // Detectar tecnología si no se proporciona
    const detectedTechnology = technology || detectTechnologyFromCode(normalizedCode);
    console.log(`[DEVDOCS-RETRIEVER] Tecnología detectada/especificada: ${detectedTechnology}`);

    // Identificar entidades en el código
    const entities = identifyCodeEntities(normalizedCode, detectedTechnology);
    console.log(`[DEVDOCS-RETRIEVER] Entidades identificadas: ${entities.length}`);
    console.log(`[DEVDOCS-RETRIEVER] Entidades: ${entities.slice(0, 5).join(', ')}${entities.length > 5 ? '...' : ''}`);

    if (entities.length === 0) {
      console.warn(`[DEVDOCS-RETRIEVER] No se encontraron entidades en el código`);
      return [];
    }

    // Obtener índice de la tecnología desde datos locales
    const techIndex = await getTechnologyIndex(detectedTechnology);

    // Buscar documentación local para cada entidad (MEJORADO 191.6 - FALLBACK)
    const documentationResults = [];
    const maxEntities = Math.min(entities.length, 5); // Limitar a 5 entidades para performance

    for (let i = 0; i < maxEntities; i++) {
      const entity = entities[i];
      try {
        const docEntry = findEntityInTechnologyIndex(entity, techIndex);
        if (docEntry) {
          const docContent = await fetchLocalEntityDocumentation(entity, techIndex.slug);
          
          // Construir URL de referencia (sin hacer petición HTTP)
          const referenceUrl = `${LOCAL_CONFIG.fallbackUrl}/${techIndex.slug}/${docEntry.path}`;
          
          documentationResults.push({
            entity: entity,
            url: referenceUrl,
            title: docEntry.name || entity,
            content: docContent,
            technology: techIndex.name,
            retrievedAt: new Date().toISOString(),
            source: docEntry.fallback ? 'fallback-generated' : 'local-file',
            fallback: docEntry.fallback || false
          });
          console.log(`✅ [DEVDOCS-RETRIEVER] Documentación obtenida para: ${entity} ${docEntry.fallback ? '(fallback)' : '(oficial)'}`);
        } else {
          // MISIÓN 191.6 - FALLBACK: Generar documentación incluso si no se encuentra la entidad
          console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Entidad no encontrada en índice, generando documentación básica para: ${entity}`);
          
          const fallbackContent = generateFallbackDocumentation(entity, techIndex.slug);
          const fallbackUrl = `${LOCAL_CONFIG.fallbackUrl}/${techIndex.slug}/${entity.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
          
          documentationResults.push({
            entity: entity,
            url: fallbackUrl,
            title: `${entity} (Fallback)`,
            content: fallbackContent,
            technology: techIndex.name,
            retrievedAt: new Date().toISOString(),
            source: 'fallback-generated',
            fallback: true
          });
          console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Documentación básica generada para: ${entity}`);
        }
      } catch (entityError) {
        console.warn(`⚠️ [DEVDOCS-RETRIEVER] Error obteniendo documentación para ${entity}: ${entityError.message}`);
        // MISIÓN 191.6 - FALLBACK: Incluso en caso de error, generar algo básico
        try {
          const emergencyContent = generateFallbackDocumentation(entity, techIndex.slug);
          documentationResults.push({
            entity: entity,
            url: `${LOCAL_CONFIG.fallbackUrl}/${techIndex.slug}/`,
            title: `${entity} (Emergency Fallback)`,
            content: emergencyContent,
            technology: techIndex.name,
            retrievedAt: new Date().toISOString(),
            source: 'emergency-fallback',
            fallback: true,
            error: entityError.message
          });
          console.log(`🊆 [DEVDOCS-RETRIEVER] [EMERGENCY] Documentación de emergencia generada para: ${entity}`);
        } catch (emergencyError) {
          console.error(`❌ [DEVDOCS-RETRIEVER] [CRITICAL] Fallo crítico para entidad ${entity}: ${emergencyError.message}`);
        }
      }
    }

    console.log(`🎯 [DEVDOCS-RETRIEVER] [FALLBACK] Proceso completado: ${documentationResults.length}/${entities.length} entidades documentadas`);
    
    // Reportar estadísticas de fallback para 191.6
    const officialCount = documentationResults.filter(doc => !doc.fallback).length;
    const fallbackCount = documentationResults.filter(doc => doc.fallback).length;
    
    console.log(`📊 [DEVDOCS-RETRIEVER] [STATS] Oficial: ${officialCount}, Fallback: ${fallbackCount}`);
    
    if (fallbackCount > 0) {
      console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Sistema operando en modo degradación elegante`);
      console.log(`ℹ️ [DEVDOCS-RETRIEVER] [FALLBACK] Para funcionalidad completa: sync tecnologías faltantes`);
    }

    return documentationResults;

  } catch (error) {
    if (error.message.startsWith('DEVDOCS-RETRIEVER-')) {
      // MISIÓN 191.6 - FALLBACK: No fallar completamente, intentar generar algo básico
      if (error.message.includes('NOT-FOUND') || error.message.includes('TECH-NOT-SYNCED')) {
        console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Error controlado, intentando fallback genérico...`);
        
        // Generar respuesta mínima usando solo entidades identificadas
        const entities = identifyCodeEntities(normalizedCode, detectedTechnology);
        if (entities.length > 0) {
          const fallbackResults = entities.slice(0, 3).map(entity => ({
            entity: entity,
            url: `https://devdocs.io/${detectedTechnology.toLowerCase()}/`,
            title: `${entity} (Generic Fallback)`,
            content: `Entidad ${entity} identificada en código ${detectedTechnology}. Para documentación completa, consulte: https://devdocs.io/`,
            technology: detectedTechnology,
            retrievedAt: new Date().toISOString(),
            source: 'generic-fallback',
            fallback: true
          }));
          
          console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Respuesta genérica generada con ${fallbackResults.length} entidades`);
          return fallbackResults;
        }
      }
      throw error;
    } else {
      console.error(`[DEVDOCS-RETRIEVER] Error inesperado procesando código: ${error.message}`);
      throw new Error(`DEVDOCS-RETRIEVER-CODE-ERROR: Error procesando código - ${error.message}`);
    }
  }
}

/**
 * FUNCIONES AUXILIARES DE PROCESAMIENTO LOCAL
 */

/**
 * Busca una tecnología en el índice maestro usando fuzzy matching
 */
function findTechnologyInIndex(masterIndex, technology) {
  const normalizedSearch = technology.toLowerCase();

  // Búsqueda exacta por nombre
  let match = masterIndex.find(doc => doc.name.toLowerCase() === normalizedSearch);
  if (match) return match;

  // Búsqueda por nombre que contiene la tecnología
  match = masterIndex.find(doc => doc.name.toLowerCase().includes(normalizedSearch));
  if (match) return match;

  // Búsqueda por palabras clave comunes
  const keywordMatches = {
    'python': ['python'],
    'javascript': ['javascript', 'js'],
    'java': ['openjdk'],
    'react': ['react'],
    'node': ['node.js'],
    'html': ['html'],
    'css': ['css']
  };

  for (const [keyword, variations] of Object.entries(keywordMatches)) {
    if (normalizedSearch.includes(keyword)) {
      for (const variation of variations) {
        match = masterIndex.find(doc => doc.name.toLowerCase().includes(variation));
        if (match) return match;
      }
    }
  }

  return null;
}

/**
 * Detecta la tecnología/lenguaje del código fuente
 */
function detectTechnologyFromCode(code) {
  const patterns = {
    'JavaScript': [
      /\bconst\b|\blet\b|\bvar\b/,
      /=>/,
      /\bfunction\b/,
      /\.map\(|\.filter\(|\.reduce\(/,
      /console\.log/
    ],
    'Python': [
      /\bdef\b|\bclass\b/,
      /\bimport\b|\bfrom\b.*\bimport\b/,
      /\bprint\(/,
      /:\s*$/m,
      /\bif\b.*:/
    ],
    'Java': [
      /\bpublic\b|\bprivate\b|\bprotected\b/,
      /\bclass\b.*\{/,
      /\bSystem\.out\.println/,
      /\bstatic\b.*\bmain\b/
    ],
    'HTML': [
      /<[^>]+>/,
      /<!DOCTYPE/i,
      /<html|<head|<body/i
    ],
    'CSS': [
      /\{[^}]*\}/,
      /[.#][a-zA-Z]/,
      /:\s*[^;]+;/
    ]
  };

  for (const [tech, patterns_list] of Object.entries(patterns)) {
    const matchCount = patterns_list.filter(pattern => pattern.test(code)).length;
    if (matchCount >= 2) {
      return tech;
    }
  }

  return 'JavaScript'; // Default fallback
}

/**
 * Identifica entidades importantes en el código
 */
function identifyCodeEntities(code, technology) {
  const entities = new Set();

  if (technology === 'JavaScript') {
    // Métodos de arrays
    const arrayMethods = code.match(/\.(map|filter|reduce|forEach|find|some|every|includes|indexOf|slice|splice|push|pop|shift|unshift)\(/g);
    if (arrayMethods) {
      arrayMethods.forEach(method => {
        const methodName = method.slice(1, -1); // Remover . y (
        entities.add(`Array.prototype.${methodName}`);
      });
    }

    // Funciones de objeto
    const objectMethods = code.match(/Object\.(keys|values|entries|assign|freeze|seal)\(/g);
    if (objectMethods) {
      objectMethods.forEach(method => {
        entities.add(method.slice(0, -1)); // Remover (
      });
    }

    // APIs del DOM
    const domMethods = code.match(/document\.(getElementById|querySelector|querySelectorAll|createElement)/g);
    if (domMethods) {
      domMethods.forEach(method => {
        entities.add(method);
      });
    }

    // Promises y async/await
    if (/\basync\b|\bawait\b/.test(code)) {
      entities.add('async/await');
      entities.add('Promise');
    }

  } else if (technology === 'Python') {
    // Funciones built-in
    const builtins = code.match(/\b(len|range|enumerate|zip|map|filter|list|dict|set|tuple)\(/g);
    if (builtins) {
      builtins.forEach(builtin => {
        entities.add(builtin.slice(0, -1));
      });
    }

    // Métodos de string
    const stringMethods = code.match(/\.(split|join|replace|strip|lower|upper|format)\(/g);
    if (stringMethods) {
      stringMethods.forEach(method => {
        entities.add(`str${method.slice(0, -1)}`);
      });
    }
  }

  return Array.from(entities);
}

/**
 * Busca una entidad específica en el índice de tecnología
 */
function findEntityInTechnologyIndex(entity, techIndex) {
  // Búsqueda exacta
  let match = techIndex.entries.find(entry => entry.name === entity);
  if (match) return match;

  // Búsqueda por nombre que contiene la entidad
  match = techIndex.entries.find(entry => entry.name.includes(entity));
  if (match) return match;

  // Búsqueda en el path
  match = techIndex.entries.find(entry => entry.path && entry.path.includes(entity.toLowerCase()));
  if (match) return match;

  return null;
}

/**
 * Obtiene documentación desde archivo local (NUEVA FUNCIÓN FASE 3 + FALLBACK 191.6)
 * MISIÓN 191.6 - FALLBACK: Mejorada para generar contenido cuando archivos locales no existen
 */
async function fetchLocalEntityDocumentation(entity, technologySlug) {
  // Normalizar nombre de entidad para nombre de archivo
  const safeEntityName = entity.replace(/[^a-zA-Z0-9.-]/g, '_');
  const contentPath = path.join(LOCAL_CONFIG.contentDir, technologySlug, `${safeEntityName}.md`);
  
  try {
    console.log(`[DEVDOCS-RETRIEVER] Buscando contenido local: ${contentPath}`);

    // Verificar si existe el archivo de contenido específico
    try {
      await fs.access(contentPath);
      const contentFile = await fs.readFile(contentPath, 'utf8');
      const contentData = JSON.parse(contentFile);
      
      if (contentData.content && contentData.content.length > 0) {
        console.log(`✅ [DEVDOCS-RETRIEVER] Contenido local encontrado: ${contentData.content.length} caracteres`);
        return contentData.content;
      }
    } catch (accessError) {
      console.log(`[DEVDOCS-RETRIEVER] [FALLBACK] Contenido específico no encontrado, activando modo fallback...`);
    }

    // MISIÓN 191.6 - FALLBACK: Generar contenido básico basado en la entidad
    const fallbackContent = generateFallbackDocumentation(entity, technologySlug);
    console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Documentación generada para: ${entity}`);
    
    return fallbackContent;

  } catch (error) {
    console.warn(`⚠️ [DEVDOCS-RETRIEVER] Error leyendo contenido local para ${entity}: ${error.message}`);
    console.log(`🔄 [DEVDOCS-RETRIEVER] [FALLBACK] Generando documentación de emergencia...`);
    return generateFallbackDocumentation(entity, technologySlug);
  }
}

/**
 * Genera documentación básica como fallback (NUEVA FUNCIÓN FASE 3 + 191.6)
 * MISIÓN 191.6 - FALLBACK: Mejorada con más entidades y mejor estructuración
 */
function generateFallbackDocumentation(entity, technologySlug) {
  // Contenido básico estructurado por tecnología (expandido para 191.6)
  const fallbackTemplates = {
    'javascript': {
      'Array.prototype.map': 'El método map() crea un nuevo array con los resultados de la llamada a la función indicada aplicados a cada uno de sus elementos.',
      'Array.prototype.filter': 'El método filter() crea un nuevo array con todos los elementos que cumplan la condición implementada por la función dada.',
      'Array.prototype.reduce': 'El método reduce() ejecuta una función reductora sobre cada elemento de un array, devolviendo como resultado un único valor.',
      'Array.prototype.forEach': 'El método forEach() ejecuta la función indicada una vez por cada elemento del array.',
      'console.log': 'El método console.log() muestra un mensaje en la consola web (o del intérprete JavaScript).',
      'document.getElementById': 'El método getElementById() devuelve una referencia al elemento cuyo ID coincide con la cadena especificada.',
      'Promise': 'El objeto Promise representa la eventual finalización (o falla) de una operación asíncrona y su valor resultante.',
      'async/await': 'La sintaxis async/await permite escribir código asíncrono que se ve y se comporta más como código síncrono.',
      'Object.keys': 'El método Object.keys() devuelve un array de las propiedades names de un objeto.',
      'JSON.parse': 'El método JSON.parse() analiza una cadena de texto como JSON y construye el valor JavaScript descrito por dicha cadena.'
    },
    'python': {
      'len': 'La función len() devuelve la longitud (número de elementos) de un objeto.',
      'range': 'La función range() devuelve una secuencia de números, comenzando desde 0 por defecto.',
      'print': 'La función print() imprime el texto especificado en la pantalla.',
      'list': 'Una lista es una colección que es ordenada y modificable. Permite miembros duplicados.',
      'dict': 'Un diccionario es una colección que es ordenada, modificable y no permite duplicados.',
      'str.split': 'El método split() divide una cadena en una lista usando un separador especificado.',
      'str.join': 'El método join() toma todos los elementos de un iterable y los une en una cadena.',
      'open': 'La función open() abre un archivo y devuelve el objeto archivo correspondiente.',
      'enumerate': 'La función enumerate() devuelve un objeto enumerate, que contiene pares de (contador, valor).',
      'zip': 'La función zip() devuelve un objeto zip, que es un iterador de tuplas.'
    },
    'react': {
      'useState': 'El Hook useState permite agregar estado local React a componentes funcionales.',
      'useEffect': 'El Hook useEffect permite realizar efectos secundarios en componentes funcionales.',
      'Component': 'La clase Component es la clase base para componentes React definidos como clases ES6.',
      'createElement': 'React.createElement() crea y devuelve un nuevo elemento React del tipo dado.',
      'Fragment': 'React.Fragment permite agrupar una lista de hijos sin agregar nodos extra al DOM.'
    },
    'html': {
      'div': 'El elemento HTML <div> es un contenedor genérico para contenido de flujo.',
      'span': 'El elemento HTML <span> es un contenedor genérico en línea para contenido de frases.',
      'img': 'El elemento HTML <img> incrusta una imagen en el documento.',
      'a': 'El elemento HTML <a> crea un hipervínculo a páginas web, archivos, direcciones de email, ubicaciones en la misma página, o cualquier otra cosa que una URL pueda direccionar.',
      'form': 'El elemento HTML <form> representa una sección de documento que contiene controles interactivos para enviar información.'
    },
    'css': {
      'display': 'La propiedad CSS display establece si un elemento se trata como un bloque o elemento en línea.',
      'color': 'La propiedad CSS color establece el color del texto y decoraciones de texto.',
      'margin': 'La propiedad CSS margin establece el área de margen en los cuatro lados de un elemento.',
      'padding': 'La propiedad CSS padding establece el área de relleno en los cuatro lados de un elemento.',
      'background': 'La propiedad CSS background es una forma abreviada para establecer valores de fondo individuales.'
    }
  };

  const techTemplates = fallbackTemplates[technologySlug] || {};
  const specificDoc = techTemplates[entity];

  if (specificDoc) {
    return `### ${entity}

${specificDoc}

**🔄 Fuente:** Documentación básica fallback - Funcionalidad limitada pero operacional

**🔗 Referencia Oficial:** https://devdocs.io/${technologySlug}/${entity.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}

**ℹ️ Nota:** Para documentación completa, ejecute: \`node scripts/sync-devdocs.js --tech ${technologySlug}\``;
  }

  // Documentación genérica mejorada para 191.6
  return `### ${entity}

Entidad de **${technologySlug}** identificada en el código del estudiante.

**🔄 Estado:** Modo fallback activo - documentación específica no disponible localmente.

**🔗 Referencia Oficial:** https://devdocs.io/${technologySlug}/

**📚 Recomendaciones para el estudiante:**
- Consulte la documentación oficial en el enlace anterior
- Revise ejemplos de uso de esta entidad en proyectos similares
- Practique con ejemplos básicos para comprender su funcionamiento

**⚙️ Tipo:** Función/Método/Entidad de ${technologySlug}

**🔍 Para administradores:** Ejecute \`node scripts/sync-devdocs.js --tech ${technologySlug}\` para sincronizar documentación completa.`;
}

/**
 * FUNCIÓN FALLBACK: Genera un índice de tecnología básico usando solo el índice maestro
 * MISIÓN 191.6 - FASE 1: Implementación de degradación elegante para sistemas IRP
 * 
 * Esta función crea un índice de tecnología mínimo cuando el índice específico
 * no está disponible, permitiendo que el sistema continúe operando con funcionalidad
 * limitada pero estable.
 * 
 * @param {Object} matchedDoc - Documento de tecnología desde el índice maestro
 * @param {string} technologyName - Nombre de la tecnología solicitada
 * @returns {Object} Índice fallback con entradas básicas
 */
function generateFallbackTechnologyIndex(matchedDoc, technologyName) {
  console.log(`[DEVDOCS-RETRIEVER] [FALLBACK] Generando índice básico para ${matchedDoc.name}...`);
  
  // Entidades comunes por tecnología que se pueden identificar en código
  const commonEntitiesByTech = {
    'javascript': [
      { name: 'Array.prototype.map', path: 'global_objects/array/map', type: 'method' },
      { name: 'Array.prototype.filter', path: 'global_objects/array/filter', type: 'method' },
      { name: 'Array.prototype.reduce', path: 'global_objects/array/reduce', type: 'method' },
      { name: 'Array.prototype.forEach', path: 'global_objects/array/foreach', type: 'method' },
      { name: 'console.log', path: 'api/console/log', type: 'method' },
      { name: 'document.getElementById', path: 'api/document/getelementbyid', type: 'method' },
      { name: 'Promise', path: 'global_objects/promise', type: 'object' },
      { name: 'async/await', path: 'statements/async_function', type: 'statement' },
      { name: 'Object.keys', path: 'global_objects/object/keys', type: 'method' },
      { name: 'JSON.parse', path: 'global_objects/json/parse', type: 'method' }
    ],
    'python': [
      { name: 'len', path: 'library/functions/len', type: 'builtin' },
      { name: 'range', path: 'library/functions/range', type: 'builtin' },
      { name: 'print', path: 'library/functions/print', type: 'builtin' },
      { name: 'list', path: 'library/stdtypes/list', type: 'type' },
      { name: 'dict', path: 'library/stdtypes/dict', type: 'type' },
      { name: 'str.split', path: 'library/stdtypes/str/split', type: 'method' },
      { name: 'str.join', path: 'library/stdtypes/str/join', type: 'method' },
      { name: 'open', path: 'library/functions/open', type: 'builtin' },
      { name: 'enumerate', path: 'library/functions/enumerate', type: 'builtin' },
      { name: 'zip', path: 'library/functions/zip', type: 'builtin' }
    ],
    'react': [
      { name: 'useState', path: 'reference/react/usestate', type: 'hook' },
      { name: 'useEffect', path: 'reference/react/useeffect', type: 'hook' },
      { name: 'Component', path: 'reference/react/component', type: 'class' },
      { name: 'createElement', path: 'reference/react/createelement', type: 'function' },
      { name: 'Fragment', path: 'reference/react/fragment', type: 'component' }
    ],
    'html': [
      { name: 'div', path: 'element/div', type: 'element' },
      { name: 'span', path: 'element/span', type: 'element' },
      { name: 'img', path: 'element/img', type: 'element' },
      { name: 'a', path: 'element/a', type: 'element' },
      { name: 'form', path: 'element/form', type: 'element' }
    ],
    'css': [
      { name: 'display', path: 'display', type: 'property' },
      { name: 'color', path: 'color', type: 'property' },
      { name: 'margin', path: 'margin', type: 'property' },
      { name: 'padding', path: 'padding', type: 'property' },
      { name: 'background', path: 'background', type: 'property' }
    ]
  };
  
  // Detectar tipo de tecnología basándose en el slug o nombre
  const techType = detectTechnologyType(matchedDoc.slug, matchedDoc.name);
  const commonEntities = commonEntitiesByTech[techType] || [];
  
  console.log(`[DEVDOCS-RETRIEVER] [FALLBACK] Tipo detectado: ${techType}, entidades comunes: ${commonEntities.length}`);
  
  // Generar entradas básicas
  const fallbackEntries = commonEntities.map(entity => ({
    name: entity.name,
    path: entity.path,
    type: entity.type || 'unknown',
    fallback: true // Marcar como entrada fallback
  }));
  
  // Agregar entrada genérica adicional
  fallbackEntries.push({
    name: `${matchedDoc.name} Documentation`,
    path: 'index',
    type: 'documentation',
    fallback: true
  });
  
  const fallbackIndex = {
    slug: matchedDoc.slug,
    name: matchedDoc.name,
    entries: fallbackEntries,
    version: 'fallback',
    syncedAt: new Date().toISOString(),
    syncMethod: 'fallback',
    fallbackInfo: {
      generatedAt: new Date().toISOString(),
      reason: 'Índice específico no disponible - degradación elegante activada',
      recommendation: `Ejecute 'node scripts/sync-devdocs.js --tech ${technologyName.toLowerCase()}' para documentación completa`,
      originalTech: technologyName,
      detectedType: techType
    }
  };
  
  console.log(`[DEVDOCS-RETRIEVER] [FALLBACK] Índice fallback completado con ${fallbackEntries.length} entradas básicas`);
  
  return fallbackIndex;
}

/**
 * Detecta el tipo de tecnología para seleccionar entidades comunes apropiadas
 */
function detectTechnologyType(slug, name) {
  const lowerSlug = slug.toLowerCase();
  const lowerName = name.toLowerCase();
  
  if (lowerSlug.includes('javascript') || lowerName.includes('javascript')) return 'javascript';
  if (lowerSlug.includes('python') || lowerName.includes('python')) return 'python';
  if (lowerSlug.includes('react') || lowerName.includes('react')) return 'react';
  if (lowerSlug.includes('html') || lowerName.includes('html')) return 'html';
  if (lowerSlug.includes('css') || lowerName.includes('css')) return 'css';
  if (lowerSlug.includes('node') || lowerName.includes('node')) return 'javascript';
  if (lowerSlug.includes('django') || lowerName.includes('django')) return 'python';
  if (lowerSlug.includes('angular') || lowerName.includes('angular')) return 'javascript';
  if (lowerSlug.includes('vue') || lowerName.includes('vue')) return 'javascript';
  
  // Fallback genérico
  return 'generic';
}

// Exportar funciones principales
module.exports = {
  getMasterIndex,
  getTechnologyIndex,
  retrieveDocumentationForCode,
  // Exportar funciones de fallback para testing
  generateFallbackTechnologyIndex,
  detectTechnologyType
};