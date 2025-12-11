/**
 * CAPA DE ACCESO A DATOS SQLite - MISIÓN 181
 * 
 * Módulo de acceso a datos para curriculum.db (SQLite)
 * Reemplaza la arquitectura federada de archivos JSON
 * Implementa el esquema definido en ARQUITECTURA_VIVA_v9.0.md
 * 
 * @author Mentor Coder  
 * @version v1.0
 * @arquitectura SQLite v9.0
 * @fuente_verdad curriculum.db
 */

const Database = require('better-sqlite3');
const path = require('path');

// Configuración de la base de datos
const DB_CONFIG = {
  dbPath: path.join(process.cwd(), 'database', 'sqlite', 'curriculum.db'),
  options: {
    readonly: false,
    fileMustExist: true,
    timeout: 5000,
    verbose: null // Cambiar a console.log para debugging
  }
};

// Instancia de conexión singleton
let dbInstance = null;

/**
 * Obtiene la conexión singleton a la base de datos
 * @returns {Database} Instancia de conexión SQLite
 */
function getDatabase() {
  if (!dbInstance) {
    try {
      dbInstance = new Database(DB_CONFIG.dbPath, DB_CONFIG.options);
      console.log(`✅ [SQLITE] Conexión establecida a curriculum.db`);
      
      // Configurar optimizaciones de performance
      dbInstance.pragma('journal_mode = WAL');
      dbInstance.pragma('synchronous = NORMAL');
      dbInstance.pragma('cache_size = 10000');
      dbInstance.pragma('temp_store = MEMORY');
      
    } catch (error) {
      console.error(`❌ [SQLITE] Error conectando a curriculum.db:`, error.message);
      throw new Error(`No se pudo conectar a la base de datos: ${error.message}`);
    }
  }
  return dbInstance;
}

/**
 * Obtiene los datos completos de una semana específica
 * @param {number} weekId - ID de la semana (1-100)
 * @returns {Object|null} Datos completos de la semana o null
 */
function getWeekData(weekId) {
  // Validación de entrada
  if (!weekId || typeof weekId !== 'number' || weekId < 1 || weekId > 100) {
    console.error(`❌ [SQLITE] weekId inválido: ${weekId}. Debe estar entre 1-100.`);
    return null;
  }

  const db = getDatabase();
  
  try {
    console.log(`🔍 [SQLITE] Consultando datos para semana ${weekId}...`);
    
    // Query principal: obtener datos de semana con información de módulo y fase
    const query = `
      SELECT 
        s.*,
        m.modulo,
        m.titulo_modulo,
        f.fase,
        f.titulo_fase,
        f.duracion_meses,
        f.proposito
      FROM semanas s
      JOIN modulos m ON s.modulo_id = m.id  
      JOIN fases f ON m.fase_id = f.id
      WHERE s.semana = ?
    `;
    
    const weekData = db.prepare(query).get(weekId);
    
    if (!weekData) {
      console.warn(`⚠️ [SQLITE] Semana ${weekId} no encontrada`);
      return null;
    }
    
    // Obtener esquema diario de la semana
    const esquemaDiarioQuery = `
      SELECT dia, concepto, pomodoros
      FROM esquema_diario 
      WHERE semana_id = ?
      ORDER BY dia
    `;
    
    const esquemaDiario = db.prepare(esquemaDiarioQuery).all(weekData.id);
    
    // Parsear campos JSON
    const parsedData = {
      // Información básica de la semana
      semana: weekData.semana,
      numero: weekData.semana, // Alias para compatibilidad
      titulo: weekData.titulo_semana,
      tituloSemana: weekData.titulo_semana, // Alias para compatibilidad
      objetivos: weekData.objetivos ? JSON.parse(weekData.objetivos) : [],
      tematica: weekData.tematica,
      actividades: weekData.actividades ? JSON.parse(weekData.actividades) : [],
      entregables: weekData.entregables,
      recursos: weekData.recursos ? JSON.parse(weekData.recursos) : [],
      official_sources: weekData.official_sources ? JSON.parse(weekData.official_sources) : [],
      ejercicios: weekData.ejercicios ? JSON.parse(weekData.ejercicios) : [],
      
      // Información del módulo
      modulo: weekData.modulo,
      tituloModulo: weekData.titulo_modulo,
      
      // Información de la fase
      fase: weekData.fase,
      tituloFase: weekData.titulo_fase,
      duracionMeses: weekData.duracion_meses,
      proposito: weekData.proposito,
      
      // Esquema diario procesado
      esquemaDiario: esquemaDiario.map(dia => ({
        dia: dia.dia,
        concepto: dia.concepto,
        pomodoros: dia.pomodoros ? JSON.parse(dia.pomodoros) : []
      })),
      
      // Metadatos
      sourceType: 'sqlite',
      dataSource: 'curriculum.db',
      queryTime: new Date().toISOString()
    };
    
    console.log(`✅ [SQLITE] Semana ${weekId} cargada: "${parsedData.titulo}"`);
    console.log(`   📚 Fase: ${parsedData.fase} - ${parsedData.tituloFase}`);
    console.log(`   📂 Módulo: ${parsedData.modulo} - ${parsedData.tituloModulo}`);
    console.log(`   📝 Esquema diario: ${parsedData.esquemaDiario.length} días`);
    console.log(`   🌐 Fuentes oficiales: ${parsedData.official_sources.length}`);
    
    return parsedData;
    
  } catch (error) {
    console.error(`❌ [SQLITE] Error obteniendo datos de semana ${weekId}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene información de índice/mapeo del currículo
 * @returns {Object} Información de estructura del currículo
 */
function getCurriculumIndex() {
  const db = getDatabase();
  
  try {
    console.log(`🔍 [SQLITE] Consultando índice del currículo...`);
    
    // Obtener información de fases
    const fasesQuery = `
      SELECT f.*, COUNT(m.id) as total_modulos, COUNT(s.id) as total_semanas
      FROM fases f
      LEFT JOIN modulos m ON f.id = m.fase_id
      LEFT JOIN semanas s ON m.id = s.modulo_id
      GROUP BY f.id
      ORDER BY f.fase
    `;
    
    const fases = db.prepare(fasesQuery).all();
    
    // Obtener rangos de semanas por fase
    const rangesQuery = `
      SELECT 
        f.fase,
        f.titulo_fase,
        MIN(s.semana) as start_week,
        MAX(s.semana) as end_week,
        COUNT(s.semana) as week_count
      FROM fases f
      JOIN modulos m ON f.id = m.fase_id  
      JOIN semanas s ON m.id = s.modulo_id
      GROUP BY f.fase, f.titulo_fase
      ORDER BY f.fase
    `;
    
    const phaseMapping = db.prepare(rangesQuery).all().map(row => ({
      fase: row.fase,
      titulo: row.titulo_fase,
      startWeek: row.start_week,
      endWeek: row.end_week,
      weekCount: row.week_count
    }));
    
    const totalSemanasQuery = `SELECT COUNT(*) as total FROM semanas`;
    const totalResult = db.prepare(totalSemanasQuery).get();
    
    const indexData = {
      version: '9.0.0-sqlite',
      sourceType: 'sqlite',
      dataSource: 'curriculum.db',
      totalPhases: fases.length,
      totalWeeks: totalResult.total,
      phaseMapping,
      fases: fases.map(fase => ({
        fase: fase.fase,
        titulo: fase.titulo_fase,
        duracion: fase.duracion_meses,
        proposito: fase.proposito,
        totalModulos: fase.total_modulos,
        totalSemanas: fase.total_semanas
      })),
      generatedAt: new Date().toISOString()
    };
    
    console.log(`✅ [SQLITE] Índice generado: ${indexData.totalPhases} fases, ${indexData.totalWeeks} semanas`);
    return indexData;
    
  } catch (error) {
    console.error(`❌ [SQLITE] Error obteniendo índice del currículo:`, error.message);
    throw error;
  }
}

/**
 * Obtiene solo las fases del currículo (sin módulos ni semanas)
 * MISIÓN 213.0 - Optimización de Performance - Lazy Loading
 * @returns {Object} Solo fases con metadata básica
 */
function getPhasesOnly() {
  const db = getDatabase();
  
  try {
    console.log(`🔍 [SQLITE] Consultando solo fases del currículo...`);
    
    // Query simple: solo fases
    const phasesQuery = `
      SELECT 
        fase,
        titulo_fase,
        duracion_meses,
        proposito
      FROM fases
      ORDER BY fase
    `;
    
    const phases = db.prepare(phasesQuery).all();
    
    if (!phases || phases.length === 0) {
      throw new Error('No se encontraron fases en el currículo');
    }
    
    // Obtener totales para metadata
    const totalsQuery = `
      SELECT 
        COUNT(DISTINCT f.id) as total_phases,
        COUNT(DISTINCT m.id) as total_modules,
        COUNT(DISTINCT s.id) as total_weeks
      FROM fases f
      LEFT JOIN modulos m ON f.id = m.fase_id
      LEFT JOIN semanas s ON m.id = s.modulo_id
    `;
    
    const totals = db.prepare(totalsQuery).get();
    
    const phasesData = {
      version: '9.0.0-sqlite',
      sourceType: 'sqlite',
      dataSource: 'curriculum.db',
      totalPhases: totals.total_phases,
      totalModules: totals.total_modules,
      totalWeeks: totals.total_weeks,
      curriculum: phases.map(phase => ({
        fase: phase.fase,
        tituloFase: phase.titulo_fase,
        duracionMeses: phase.duracion_meses,
        proposito: phase.proposito,
        // NO incluir módulos aquí - se cargarán con lazy loading
        modulos: [] // Vacío inicialmente
      })),
      metadata: {
        optimizedFor: 'lazy-loading',
        generatedAt: new Date().toISOString(),
        mission: '213.0',
        loadingStrategy: 'phases-only-initial'
      }
    };
    
    console.log(`✅ [SQLITE] Solo fases cargadas: ${phases.length} fases`);
    console.log(`   📊 Total en BD: ${totals.total_modules} módulos, ${totals.total_weeks} semanas`);
    console.log(`   🚀 Lazy loading habilitado para módulos`);
    
    return phasesData;
    
  } catch (error) {
    console.error(`❌ [SQLITE] Error obteniendo solo fases:`, error.message);
    throw error;
  }
}

/**
 * Obtiene estructura completa del currículo para vista de navegación
 * MISIÓN 182.1 - Función específica para endpoint /curriculum/summary
 * @returns {Object} Estructura anidada completa: fases → módulos → semanas
 */
function getCurriculumSummary() {
  const db = getDatabase();
  
  try {
    console.log(`🔍 [SQLITE] Consultando resumen completo del currículo...`);
    
    // Query para obtener estructura completa anidada
    const summaryQuery = `
      SELECT 
        f.fase,
        f.titulo_fase,
        f.duracion_meses,
        f.proposito,
        m.modulo,
        m.titulo_modulo,
        s.semana,
        s.titulo_semana,
        s.tematica
      FROM fases f
      JOIN modulos m ON f.id = m.fase_id
      JOIN semanas s ON m.id = s.modulo_id
      ORDER BY f.fase, m.modulo, s.semana
    `;
    
    const rawData = db.prepare(summaryQuery).all();
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No se encontraron datos del currículo');
    }
    
    // Organizar datos en estructura jerárquica
    const fasesMap = new Map();
    
    rawData.forEach(row => {
      const faseKey = row.fase;
      const moduloKey = row.modulo;
      
      // Inicializar fase si no existe
      if (!fasesMap.has(faseKey)) {
        fasesMap.set(faseKey, {
          fase: row.fase,
          titulo_fase: row.titulo_fase,
          duracion_meses: row.duracion_meses,
          proposito: row.proposito,
          modulos: new Map()
        });
      }
      
      const faseObj = fasesMap.get(faseKey);
      
      // Inicializar módulo si no existe
      if (!faseObj.modulos.has(moduloKey)) {
        faseObj.modulos.set(moduloKey, {
          modulo: row.modulo,
          titulo_modulo: row.titulo_modulo,
          semanas: []
        });
      }
      
      // Agregar semana al módulo
      faseObj.modulos.get(moduloKey).semanas.push({
        semana: row.semana,
        titulo_semana: row.titulo_semana,
        tematica: row.tematica || 'Sin tema definido'
      });
    });
    
    // Convertir Maps a Arrays y construir estructura final
    const curriculum = Array.from(fasesMap.values()).map(fase => ({
      fase: fase.fase,
      titulo_fase: fase.titulo_fase,
      duracion_meses: fase.duracion_meses,
      proposito: fase.proposito,
      modulos: Array.from(fase.modulos.values())
    }));
    
    // Obtener estadísticas
    const totalPhases = curriculum.length;
    const totalModules = curriculum.reduce((acc, fase) => acc + fase.modulos.length, 0);
    const totalWeeks = curriculum.reduce((acc, fase) => 
      acc + fase.modulos.reduce((modAcc, mod) => modAcc + mod.semanas.length, 0), 0
    );
    
    const summaryData = {
      version: '9.0.0-sqlite',
      sourceType: 'sqlite',
      dataSource: 'curriculum.db',
      totalPhases,
      totalModules,
      totalWeeks,
      curriculum,
      metadata: {
        optimizedFor: 'navigation',
        generatedAt: new Date().toISOString(),
        mission: '182.1'
      }
    };
    
    console.log(`✅ [SQLITE] Resumen completo generado:`);
    console.log(`   📊 ${totalPhases} fases, ${totalModules} módulos, ${totalWeeks} semanas`);
    console.log(`   🏗️ Estructura anidada: fases → módulos → semanas`);
    
    return summaryData;
    
  } catch (error) {
    console.error(`❌ [SQLITE] Error obteniendo resumen del currículo:`, error.message);
    throw error;
  }
}

/**
 * Obtiene datos completos de una semana específica para lazy loading
 * MISIÓN 183.2 - Específica para endpoint /api/v1/weeks/{weekId}/details
 * @param {number} weekNumber - Número de la semana (1-100)
 * @returns {Object|null} Datos completos de la semana o null
 */
function getWeekDetails(weekNumber) {
  // Validación de entrada
  if (!weekNumber || typeof weekNumber !== 'number' || weekNumber < 1 || weekNumber > 100) {
    console.error(`❌ [SQLITE] weekNumber inválido: ${weekNumber}. Debe estar entre 1-100.`);
    return null;
  }

  const db = getDatabase();
  
  try {
    console.log(`🔍 [SQLITE] Obteniendo detalles completos para semana ${weekNumber}...`);
    
    // Query principal: obtener datos completos de semana con información de módulo y fase
    // MISIÓN 185.2: Agregada columna guia_estudio para exposición en API
    const query = `
      SELECT 
        s.semana,
        s.titulo_semana,
        s.objetivos,
        s.tematica,
        s.actividades,
        s.entregables,
        s.recursos,
        s.official_sources,
        s.ejercicios,
        s.guia_estudio,
        m.modulo as modulo_numero,
        m.titulo_modulo,
        f.fase as fase_numero,
        f.titulo_fase
      FROM semanas s
      JOIN modulos m ON s.modulo_id = m.id  
      JOIN fases f ON m.fase_id = f.id
      WHERE s.semana = ?
    `;
    
    const weekData = db.prepare(query).get(weekNumber);
    
    if (!weekData) {
      console.warn(`⚠️ [SQLITE] Semana ${weekNumber} no encontrada en getWeekDetails`);
      return null;
    }
    
    // Obtener esquema diario de la semana
    const esquemaDiarioQuery = `
      SELECT dia, concepto, pomodoros
      FROM esquema_diario 
      WHERE semana_id = (
        SELECT id FROM semanas WHERE semana = ?
      )
      ORDER BY dia
    `;
    
    const esquemaDiarioRaw = db.prepare(esquemaDiarioQuery).all(weekNumber);
    
    // Procesar esquema diario
    const esquema_diario = esquemaDiarioRaw.map(dia => ({
      dia: dia.dia,
      concepto: dia.concepto,
      pomodoros: dia.pomodoros ? JSON.parse(dia.pomodoros) : []
    }));
    
    console.log(`✅ [SQLITE] Detalles de semana ${weekNumber} obtenidos:`);  
    console.log(`   📝 Título: "${weekData.titulo_semana}"`);
    console.log(`   📂 Módulo: ${weekData.modulo_numero} - ${weekData.titulo_modulo}`);
    console.log(`   📚 Fase: ${weekData.fase_numero} - ${weekData.titulo_fase}`);
    console.log(`   📅 Esquema diario: ${esquema_diario.length} días`);
    
    return {
      // Información básica
      semana: weekData.semana,
      titulo_semana: weekData.titulo_semana,
      tematica: weekData.tematica,
      
      // Datos detallados (JSON fields)
      objetivos: weekData.objetivos,
      actividades: weekData.actividades, 
      entregables: weekData.entregables,
      recursos: weekData.recursos,
      official_sources: weekData.official_sources,
      ejercicios: weekData.ejercicios,
      
      // MISIÓN 185.2: Guía de Estudio Estratégico
      guia_estudio: weekData.guia_estudio,
      
      // Esquema diario procesado
      esquema_diario,
      
      // Información del contexto
      modulo_numero: weekData.modulo_numero,
      modulo_titulo: weekData.titulo_modulo,
      fase_numero: weekData.fase_numero,
      fase_titulo: weekData.titulo_fase
    };
    
  } catch (error) {
    console.error(`❌ [SQLITE] Error obteniendo detalles de semana ${weekNumber}:`, error.message);
    throw error;
  }
}

/**
 * Valida la integridad de la base de datos
 * @returns {Object} Resultado de la validación
 */
function validateDatabase() {
  const db = getDatabase();
  
  try {
    console.log(`🔍 [SQLITE] Validando integridad de curriculum.db...`);
    
    const validations = {
      totalSemanas: db.prepare('SELECT COUNT(*) as count FROM semanas').get().count,
      rangoSemanas: db.prepare('SELECT MIN(semana) as min, MAX(semana) as max FROM semanas').get(),
      totalFases: db.prepare('SELECT COUNT(*) as count FROM fases').get().count,
      totalModulos: db.prepare('SELECT COUNT(*) as count FROM modulos').get().count,
      totalEsquemasDiarios: db.prepare('SELECT COUNT(*) as count FROM esquema_diario').get().count
    };
    
    const isValid = validations.totalSemanas === 100 && 
                   validations.rangoSemanas.min === 1 && 
                   validations.rangoSemanas.max === 100;
    
    console.log(`📊 [SQLITE] Validación completada:`);
    console.log(`   • Semanas: ${validations.totalSemanas}/100`);
    console.log(`   • Rango: ${validations.rangoSemanas.min}-${validations.rangoSemanas.max}`);
    console.log(`   • Fases: ${validations.totalFases}`);
    console.log(`   • Módulos: ${validations.totalModulos}`);
    console.log(`   • Esquemas diarios: ${validations.totalEsquemasDiarios}`);
    console.log(`   • Estado: ${isValid ? '✅ VÁLIDA' : '❌ PROBLEMAS DETECTADOS'}`);
    
    return {
      isValid,
      validations,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ [SQLITE] Error validando base de datos:`, error.message);
    throw error;
  }
}

/**
 * Cierra la conexión a la base de datos
 */
function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
      dbInstance = null;
      console.log(`🔒 [SQLITE] Conexión cerrada exitosamente`);
    } catch (error) {
      console.error(`❌ [SQLITE] Error cerrando conexión:`, error.message);
    }
  }
}

// Manejo de cierre limpio del proceso
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

// Exportaciones
module.exports = {
  // Funciones principales
  getWeekData,
  getWeekDetails, // MISIÓN 183.2 - Nueva función para lazy loading
  getCurriculumIndex,
  getCurriculumSummary,
  getPhasesOnly, // MISIÓN 213.0 - Solo fases para lazy loading
  
  // Funciones de utilidad
  validateDatabase,
  getDatabase,
  closeDatabase,
  
  // Configuración (para testing)
  DB_CONFIG
};
