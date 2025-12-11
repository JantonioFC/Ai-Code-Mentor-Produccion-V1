/**
 * ENDPOINT API v1.0 - GET /api/v1/phases/{phaseId}/modules
 * MISIÓN 213.0 - OPTIMIZACIÓN DE PERFORMANCE
 * 
 * Provee módulos y semanas de una fase específica para lazy loading.
 * Reduce el payload inicial de /curriculum/summary.
 * 
 * @author Mentor Coder
 * @version v1.0
 * @arquitectura SQLite v9.0 - Modelo Híbrido + Lazy Loading
 * @performance Optimizado para carga incremental
 */

const { getDatabase } = require('../../../../../lib/curriculum-sqlite');

/**
 * Handler para GET /api/v1/phases/{phaseId}/modules
 * 
 * Devuelve módulos y semanas de una fase específica cuando el usuario
 * expande la fase en la UI, implementando lazy loading.
 * 
 * @param {Object} req - Request object de Next.js
 * @param {Object} res - Response object de Next.js
 */
export default async function handler(req, res) {
  // Verificar método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo acepta solicitudes GET'
    });
  }

  const { phaseId } = req.query;

  // Validar phaseId - conversión a número
  const phaseNumber = parseInt(phaseId, 10);
  if (isNaN(phaseNumber) || phaseNumber < 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'El phaseId debe ser un número válido mayor o igual a 0'
    });
  }

  try {
    console.log(`📊 [API-v1] Cargando módulos de fase ${phaseNumber}...`);

    const db = getDatabase();

    // Validar que la fase existe en la base de datos
    const phaseExists = db.prepare('SELECT COUNT(*) as count FROM fases WHERE fase = ?').get(phaseNumber);
    
    if (!phaseExists || phaseExists.count === 0) {
      console.warn(`⚠️ [API-v1] Fase ${phaseNumber} no existe en la base de datos`);
      return res.status(404).json({
        error: 'Not Found',
        message: `La fase ${phaseNumber} no existe en el currículo`
      });
    }

    // Query optimizada: obtener solo módulos y semanas de la fase solicitada
    const modulesQuery = `
      SELECT 
        m.modulo,
        m.titulo_modulo,
        s.semana,
        s.titulo_semana,
        s.tematica
      FROM modulos m
      JOIN semanas s ON m.id = s.modulo_id
      JOIN fases f ON m.fase_id = f.id
      WHERE f.fase = ?
      ORDER BY m.modulo, s.semana
    `;

    const rawData = db.prepare(modulesQuery).all(phaseNumber);

    if (!rawData || rawData.length === 0) {
      console.warn(`⚠️ [API-v1] No se encontraron módulos para fase ${phaseNumber}`);
      return res.status(404).json({
        error: 'Not Found',
        message: `No se encontraron módulos para la fase ${phaseNumber}`
      });
    }

    // Organizar datos en estructura jerárquica: módulos → semanas
    const modulesMap = new Map();

    rawData.forEach(row => {
      const moduloKey = row.modulo;

      // Inicializar módulo si no existe
      if (!modulesMap.has(moduloKey)) {
        modulesMap.set(moduloKey, {
          modulo: row.modulo,
          tituloModulo: row.titulo_modulo,
          weeks: []
        });
      }

      // Agregar semana al módulo
      modulesMap.get(moduloKey).weeks.push({
        semana: row.semana,
        tituloSemana: row.titulo_semana,
        tematica: row.tematica || 'Sin tema definido'
      });
    });

    // Convertir Map a Array
    const modulos = Array.from(modulesMap.values());

    const response = {
      phaseId: phaseNumber,
      totalModules: modulos.length,
      totalWeeks: rawData.length,
      modulos,
      metadata: {
        apiVersion: '1.0',
        dataSource: 'sqlite',
        optimizedFor: 'lazy-loading',
        mission: '213.0',
        generatedAt: new Date().toISOString()
      }
    };

    console.log(`✅ [API-v1] Fase ${phaseNumber}: ${modulos.length} módulos, ${rawData.length} semanas cargadas`);

    return res.status(200).json(response);

  } catch (error) {
    console.error(`❌ [API-v1] Error obteniendo módulos de fase ${phaseNumber}:`, error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error interno del servidor'
    });
  }
}
