// pages/api/progress/summary.js
// MISIÓN 182.2 - REFACTORIZACIÓN ARQUITECTURA HÍBRIDA v10.0
// Objetivo: Endpoint de progreso usando SQLite + Supabase (eliminando dependencia de archivos JSON)

import { withRequiredAuth } from '../../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../../lib/supabaseServerAuth.js';
import { getCurriculumSummary } from '../../../lib/curriculum-sqlite.js';

/**
 * API endpoint para obtener resumen de analíticas de progreso EST
 * GET /api/progress/summary - Obtener métricas agregadas de progreso
 * 
 * ARQUITECTURA HÍBRIDA v10.0:
 * - Estructura del currículo: SQLite (curriculum.db) 
 * - Progreso del usuario: Supabase (est_progress)
 * - Cálculo: Cruce de datos en memoria
 * 
 * Autenticación: REQUERIDA
 * Devuelve objeto con:
 * - metadata: userId y timestamp de generación
 * - summary: métricas totales de progreso
 * - progresoPorFase: análisis detallado por fase curricular
 */
async function progressSummaryHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Use GET.'
    });
  }

  try {
    const { isAuthenticated, user, userId } = req.authContext;

    console.log(`[PROGRESS-ANALYTICS] Calculando métricas para: ${user.email} (${userId})`);
    console.log(`[PROGRESS-ANALYTICS] Usando arquitectura híbrida SQLite + Supabase`);

    // PASO 1: Obtener estructura completa del currículo desde SQLite
    console.log(`[PROGRESS-ANALYTICS] Consultando estructura del currículo desde SQLite...`);
    const curriculumData = await getCurriculumSummary();

    if (!curriculumData || !curriculumData.curriculum) {
      throw new Error('No se pudo obtener estructura del currículo desde SQLite');
    }

    console.log(`[PROGRESS-ANALYTICS] Currículo cargado desde SQLite: ${curriculumData.totalPhases} fases, ${curriculumData.totalWeeks} semanas`);

    // PASO 2: Consultar progreso del usuario desde Supabase
    console.log(`[PROGRESS-ANALYTICS] Consultando progreso del usuario desde Supabase...`);
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    const { data: estProgressData, error: estError } = await authenticatedSupabase
      .from('est_progress')
      .select('semana_id, checked_state, updated_at')
      .eq('user_id', userId)
      .order('semana_id', { ascending: true });

    if (estError) {
      console.error('[PROGRESS-ANALYTICS] Error obteniendo est_progress:', estError);
      throw estError;
    }

    console.log(`[PROGRESS-ANALYTICS] Registros EST encontrados: ${estProgressData?.length || 0}`);

    // PASO 3: Calcular métricas cruzando datos SQLite + Supabase
    console.log(`[PROGRESS-ANALYTICS] Calculando métricas con arquitectura híbrida...`);
    const metrics = calculateProgressMetrics(estProgressData || [], curriculumData);

    // PASO 4: Estructurar respuesta según contrato de datos exacto
    const analyticsResponse = {
      metadata: {
        userId: userId,
        generatedAt: new Date().toISOString(),
        architecture: 'hybrid-v10.0',
        dataSources: {
          curriculum: 'sqlite',
          progress: 'supabase'
        }
      },
      summary: {
        totalSemanasIniciadas: metrics.totalSemanasIniciadas,
        totalSemanasCompletadas: metrics.totalSemanasCompletadas,
        porcentajeTotalCompletado: metrics.porcentajeTotalCompletado,
        totalWeeksAvailable: curriculumData.totalWeeks,
        totalPhasesAvailable: curriculumData.totalPhases
      },
      progresoPorFase: metrics.progresoPorFase
    };

    console.log(`[PROGRESS-ANALYTICS] Métricas calculadas para ${user.email}:`, {
      iniciadas: metrics.totalSemanasIniciadas,
      completadas: metrics.totalSemanasCompletadas,
      fases: metrics.progresoPorFase.length,
      dataSource: 'SQLite + Supabase'
    });

    return res.status(200).json(analyticsResponse);

  } catch (error) {
    console.error('[PROGRESS-ANALYTICS] Error en endpoint (arquitectura híbrida):', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al calcular analíticas de progreso',
      architecture: 'hybrid-v10.0',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'progress/summary',
        mission: '182.2'
      } : undefined
    });
  }
}

/**
 * Función principal para calcular métricas de progreso usando arquitectura híbrida
 * MISIÓN 182.2 - SQLite (estructura) + Supabase (progreso)
 * @param {Array} estProgressData - Registros de est_progress del usuario (Supabase)
 * @param {Object} curriculumData - Estructura del currículo (SQLite via getCurriculumSummary)
 * @returns {Object} Métricas calculadas
 */
function calculateProgressMetrics(estProgressData, curriculumData) {
  console.log(`[PROGRESS-CALC] Iniciando cálculo con ${estProgressData.length} registros de progreso`);
  console.log(`[PROGRESS-CALC] Estructura currículo: ${curriculumData.totalPhases} fases, ${curriculumData.totalWeeks} semanas`);

  // MÉTRICA 1: totalSemanasIniciadas - Recuento de semanas únicas en est_progress
  const semanasIniciadas = new Set(estProgressData.map(record => record.semana_id));
  const totalSemanasIniciadas = semanasIniciadas.size;

  // MÉTRICA 2: totalSemanasCompletadas - Semanas donde TODOS los entregables están marcados como true
  const totalSemanasCompletadas = estProgressData.filter(record => {
    const checkedState = record.checked_state;
    // Verificar que todos los valores del checked_state son true
    return checkedState.ejercicios === true &&
      checkedState.miniProyecto === true &&
      checkedState.dma === true &&
      checkedState.commits === true;
  }).length;

  // MÉTRICA 3: progresoPorFase - Análisis detallado por fase usando datos de SQLite
  const progresoPorFase = calculatePhaseProgress(estProgressData, curriculumData);

  // MÉTRICA 4: porcentajeTotalCompletado - Porcentaje basado en total de semanas del programa
  const totalWeeks = curriculumData.totalWeeks || 100;
  const porcentajeTotalCompletado = parseFloat(
    ((totalSemanasCompletadas / totalWeeks) * 100).toFixed(2)
  );

  console.log(`[PROGRESS-CALC] Métricas calculadas:`, {
    iniciadas: totalSemanasIniciadas,
    completadas: totalSemanasCompletadas,
    porcentaje: porcentajeTotalCompletado,
    fasesAnalizadas: progresoPorFase.length
  });

  return {
    totalSemanasIniciadas,
    totalSemanasCompletadas,
    porcentajeTotalCompletado,
    progresoPorFase
  };
}

/**
 * Calcula progreso detallado por cada fase que el usuario haya iniciado
 * MISIÓN 182.2 - Adaptado para estructura SQLite (getCurriculumSummary)
 * @param {Array} estProgressData - Registros de progreso del usuario (Supabase)
 * @param {Object} curriculumData - Estructura del currículo (SQLite)
 * @returns {Array} Array de objetos con progreso por fase
 */
function calculatePhaseProgress(estProgressData, curriculumData) {
  console.log(`[PHASE-CALC] Calculando progreso por fase con datos SQLite...`);

  const faseProgressMap = new Map();

  // Crear mapa de semana_id → fase para búsqueda eficiente
  // NOTA: Adaptado para estructura SQLite (titulo_fase vs tituloFase)
  const semanaToFaseMap = new Map();

  curriculumData.curriculum.forEach(fase => {
    fase.modulos.forEach(modulo => {
      modulo.semanas.forEach(semana => {
        semanaToFaseMap.set(semana.semana, {
          faseId: fase.fase,
          tituloFase: fase.titulo_fase // ← Campo SQLite: titulo_fase
        });
      });
    });
  });

  // Calcular total de semanas por fase
  const semanasEnFaseMap = new Map();
  curriculumData.curriculum.forEach(fase => {
    let totalSemanas = 0;
    fase.modulos.forEach(modulo => {
      totalSemanas += modulo.semanas.length;
    });
    semanasEnFaseMap.set(fase.fase, totalSemanas);
  });

  console.log(`[PHASE-CALC] Mapas creados: ${semanaToFaseMap.size} semanas mapeadas, ${semanasEnFaseMap.size} fases`);

  // Analizar progreso del usuario por fase
  estProgressData.forEach(record => {
    const semanaInfo = semanaToFaseMap.get(record.semana_id);
    if (!semanaInfo) {
      console.warn(`[PHASE-CALC] Semana ${record.semana_id} no encontrada en currículo SQLite`);
      return; // Skip si no se encuentra la semana en el curriculum
    }

    const { faseId, tituloFase } = semanaInfo;

    if (!faseProgressMap.has(faseId)) {
      faseProgressMap.set(faseId, {
        faseId,
        tituloFase,
        semanasEnFase: semanasEnFaseMap.get(faseId) || 0,
        semanasCompletadas: 0,
        semanasIniciadas: 0
      });
    }

    const faseProgress = faseProgressMap.get(faseId);
    faseProgress.semanasIniciadas++;

    // Verificar si esta semana está completada (todos los entregables true)
    const checkedState = record.checked_state;
    if (checkedState.ejercicios === true &&
      checkedState.miniProyecto === true &&
      checkedState.dma === true &&
      checkedState.commits === true) {
      faseProgress.semanasCompletadas++;
    }
  });

  // Convertir a array y calcular porcentajes
  const progresoPorFase = Array.from(faseProgressMap.values()).map(fase => ({
    faseId: fase.faseId,
    tituloFase: fase.tituloFase,
    semanasEnFase: fase.semanasEnFase,
    semanasCompletadas: fase.semanasCompletadas,
    porcentajeCompletado: parseFloat(
      fase.semanasEnFase > 0
        ? ((fase.semanasCompletadas / fase.semanasEnFase) * 100).toFixed(2)
        : 0.0
    )
  }));

  // Ordenar por faseId para respuesta consistente
  progresoPorFase.sort((a, b) => a.faseId - b.faseId);

  console.log(`[PHASE-CALC] Progreso calculado para ${progresoPorFase.length} fases iniciadas`);
  progresoPorFase.forEach(fase => {
    console.log(`[PHASE-CALC]   Fase ${fase.faseId}: ${fase.semanasCompletadas}/${fase.semanasEnFase} (${fase.porcentajeCompletado}%)`);
  });

  return progresoPorFase;
}

// Aplicar middleware de autenticación requerida
export default withRequiredAuth(progressSummaryHandler);
