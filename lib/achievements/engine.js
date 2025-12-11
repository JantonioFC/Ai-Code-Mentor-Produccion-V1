// lib/achievements/engine.js
// MISIÓN 160 FASE 2 - MOTOR DE LOGROS (ACHIEVEMENTS ENGINE)
// Objetivo: Evaluar progreso del estudiante y otorgar logros automáticamente

import { getAuthenticatedSupabaseFromRequest } from '../supabaseServerAuth.js';
import { getCurriculumSummary } from '../curriculum-sqlite.js';

/**
 * Motor principal de logros - Evalúa progreso y otorga achievements
 * @param {string} userId - UUID del usuario autenticado
 * @param {Object} authenticatedSupabase - Cliente Supabase autenticado con RLS
 * @returns {Object} Resultado de la evaluación con logros otorgados
 */
export async function checkAndAwardAchievements(userId, authenticatedSupabase) {
  try {
    console.log(`[ACHIEVEMENTS-ENGINE] Evaluando logros para usuario: ${userId}`);

    // PASO 1: Obtener resumen de progreso del usuario (reutilizar lógica Misión 158)
    const progressSummary = await getUserProgressSummary(userId, authenticatedSupabase);
    
    // PASO 2: Obtener todos los logros definidos en el sistema
    const { data: allAchievements, error: achievementsError } = await authenticatedSupabase
      .from('achievements')
      .select('id, name, description, icon, criteria')
      .order('name');

    if (achievementsError) {
      throw new Error(`Error obteniendo achievements: ${achievementsError.message}`);
    }

    // PASO 3: Obtener logros ya obtenidos por el usuario
    const { data: userAchievements, error: userAchievementsError } = await authenticatedSupabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (userAchievementsError) {
      throw new Error(`Error obteniendo user_achievements: ${userAchievementsError.message}`);
    }

    const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

    // PASO 4: Evaluar criterios de logros pendientes
    const newlyUnlockedAchievements = [];
    
    for (const achievement of allAchievements) {
      // Skip si el usuario ya tiene este logro
      if (unlockedAchievementIds.has(achievement.id)) {
        continue;
      }

      // Evaluar si el usuario cumple el criterio
      const meetsRequirement = evaluateAchievementCriteria(achievement.criteria, progressSummary);
      
      if (meetsRequirement) {
        // PASO 5: Otorgar el logro insertando en user_achievements
        const { error: insertError } = await authenticatedSupabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });

        if (insertError) {
          console.error(`[ACHIEVEMENTS-ENGINE] Error otorgando logro ${achievement.name}:`, insertError);
          // Continuar con otros logros en caso de error individual
        } else {
          console.log(`[ACHIEVEMENTS-ENGINE] 🎉 Logro otorgado: ${achievement.name}`);
          newlyUnlockedAchievements.push({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            criteria: achievement.criteria
          });
        }
      }
    }

    return {
      success: true,
      summary: {
        totalAchievementsEvaluated: allAchievements.length,
        alreadyUnlocked: unlockedAchievementIds.size,
        newlyUnlocked: newlyUnlockedAchievements.length
      },
      newlyUnlockedAchievements,
      progressSummary: {
        totalSemanasCompletadas: progressSummary.totalSemanasCompletadas,
        porcentajeTotalCompletado: progressSummary.porcentajeTotalCompletado,
        fasesCompletadas: progressSummary.progresoPorFase.filter(f => f.porcentajeCompletado === 100).length
      }
    };

  } catch (error) {
    console.error('[ACHIEVEMENTS-ENGINE] Error en motor de logros:', error);
    return {
      success: false,
      error: error.message,
      newlyUnlockedAchievements: []
    };
  }
}

/**
 * Obtener resumen de progreso del usuario (reutiliza lógica de Misión 158)
 * @param {string} userId - UUID del usuario
 * @param {Object} authenticatedSupabase - Cliente Supabase autenticado
 * @returns {Object} Resumen de progreso con métricas calculadas
 */
async function getUserProgressSummary(userId, authenticatedSupabase) {
  // PASO 1: Consultar registros de est_progress del usuario
  const { data: estProgressData, error: estError } = await authenticatedSupabase
    .from('est_progress')
    .select('semana_id, checked_state, updated_at')
    .eq('user_id', userId)
    .order('semana_id', { ascending: true });

  if (estError) {
    throw new Error(`Error obteniendo est_progress: ${estError.message}`);
  }

  // PASO 2: Obtener estructura del curriculum desde SQLite (Arquitectura v9.0)
  console.log('[ACHIEVEMENTS-ENGINE] Consultando estructura de curriculum desde SQLite...');
  const curriculumData = await getCurriculumSummary();

  // PASO 3: Calcular métricas (misma lógica que Misión 158)
  return calculateProgressMetrics(estProgressData || [], curriculumData);
}

/**
 * Calcular métricas de progreso (función reutilizada de Misión 158)
 * @param {Array} estProgressData - Registros de progreso del usuario
 * @param {Object} curriculumData - Estructura del curriculum
 * @returns {Object} Métricas calculadas
 */
function calculateProgressMetrics(estProgressData, curriculumData) {
  // MÉTRICA 1: totalSemanasIniciadas
  const semanasIniciadas = new Set(estProgressData.map(record => record.semana_id));
  const totalSemanasIniciadas = semanasIniciadas.size;

  // MÉTRICA 2: totalSemanasCompletadas
  const totalSemanasCompletadas = estProgressData.filter(record => {
    const checkedState = record.checked_state;
    return checkedState.ejercicios === true &&
           checkedState.miniProyecto === true &&
           checkedState.dma === true &&
           checkedState.commits === true;
  }).length;

  // MÉTRICA 3: progresoPorFase
  const progresoPorFase = calculatePhaseProgress(estProgressData, curriculumData);

  // MÉTRICA 4: porcentajeTotalCompletado
  const porcentajeTotalCompletado = parseFloat(
    totalSemanasIniciadas > 0 
      ? ((totalSemanasCompletadas / totalSemanasIniciadas) * 100).toFixed(2)
      : 0.0
  );

  return {
    totalSemanasIniciadas,
    totalSemanasCompletadas,
    porcentajeTotalCompletado,
    progresoPorFase
  };
}

/**
 * Calcular progreso por fase (función reutilizada de Misión 158)
 * @param {Array} estProgressData - Registros de progreso del usuario
 * @param {Object} curriculumData - Estructura del curriculum
 * @returns {Array} Progreso por fase
 */
function calculatePhaseProgress(estProgressData, curriculumData) {
  const faseProgressMap = new Map();
  const semanaToFaseMap = new Map();
  
  // Crear mapas de referencia (Adaptado para Arquitectura SQLite v9.0)
  curriculumData.curriculum.forEach(fase => {
    fase.modulos.forEach(modulo => {
      modulo.semanas.forEach(semana => {
        semanaToFaseMap.set(semana.semana, {
          faseId: fase.fase,
          tituloFase: fase.titulo_fase // Campo adaptado de SQLite
        });
      });
    });
  });

  const semanasEnFaseMap = new Map();
  curriculumData.curriculum.forEach(fase => {
    let totalSemanas = 0;
    fase.modulos.forEach(modulo => {
      totalSemanas += modulo.semanas.length;
    });
    semanasEnFaseMap.set(fase.fase, totalSemanas);
  });

  // Analizar progreso del usuario
  estProgressData.forEach(record => {
    const semanaInfo = semanaToFaseMap.get(record.semana_id);
    if (!semanaInfo) return;

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

  progresoPorFase.sort((a, b) => a.faseId - b.faseId);
  return progresoPorFase;
}

/**
 * Evalúa si un usuario cumple el criterio de un logro específico
 * @param {Object} criteria - Criterio JSONB del logro
 * @param {Object} progressSummary - Resumen de progreso del usuario
 * @returns {boolean} True si cumple el criterio
 */
function evaluateAchievementCriteria(criteria, progressSummary) {
  try {
    const { type, value } = criteria;

    switch (type) {
      case 'COMPLETE_WEEKS':
        // Logros: "Primer Paso" (1 semana), "Persistente" (5 semanas)
        return progressSummary.totalSemanasCompletadas >= value;
      
      case 'COMPLETE_PHASE':
        // Logro: "Explorador de Fase" (fase 1 completada)
        const targetPhase = progressSummary.progresoPorFase.find(fase => fase.faseId === value);
        return targetPhase && targetPhase.porcentajeCompletado === 100;
      
      case 'PROGRESS_PERCENTAGE':
        // Logro: "Progresivo" (50% de progreso total)
        return progressSummary.porcentajeTotalCompletado >= value;
      
      default:
        console.warn(`[ACHIEVEMENTS-ENGINE] Tipo de criterio desconocido: ${type}`);
        return false;
    }
  } catch (error) {
    console.error(`[ACHIEVEMENTS-ENGINE] Error evaluando criterio:`, error);
    return false;
  }
}

/**
 * Obtener logros ya obtenidos por un usuario
 * @param {string} userId - UUID del usuario
 * @param {Object} authenticatedSupabase - Cliente Supabase autenticado
 * @returns {Array} Lista de logros con detalles
 */
export async function getUserAchievements(userId, authenticatedSupabase) {
  try {
    console.log(`[ACHIEVEMENTS-ENGINE] Obteniendo logros para usuario: ${userId}`);

    const { data: userAchievements, error } = await authenticatedSupabase
      .from('user_achievements')
      .select(`
        unlocked_at,
        achievements (
          id,
          name,
          description,
          icon,
          criteria
        )
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo logros del usuario: ${error.message}`);
    }

    // Formatear respuesta para el frontend
    const formattedAchievements = userAchievements.map(ua => ({
      id: ua.achievements.id,
      name: ua.achievements.name,
      description: ua.achievements.description,
      icon: ua.achievements.icon,
      criteria: ua.achievements.criteria,
      unlockedAt: ua.unlocked_at
    }));

    console.log(`[ACHIEVEMENTS-ENGINE] Usuario tiene ${formattedAchievements.length} logros`);

    return {
      success: true,
      achievements: formattedAchievements,
      count: formattedAchievements.length
    };

  } catch (error) {
    console.error('[ACHIEVEMENTS-ENGINE] Error obteniendo logros de usuario:', error);
    return {
      success: false,
      error: error.message,
      achievements: [],
      count: 0
    };
  }
}
