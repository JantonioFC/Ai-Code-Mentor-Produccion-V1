// pages/api/progress-summary.js
// MISIÓN 145 FASE 1 - ENDPOINT DE RESUMEN DE PROGRESO DEL ESTUDIANTE
// Objetivo: Agregar datos de progreso para dashboard del estudiante

import { withRequiredAuth } from '../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../lib/supabaseServerAuth.js';

/**
 * API endpoint para obtener resumen de progreso del estudiante
 * GET /api/progress-summary - Obtener resumen agregado de progreso
 * 
 * Autenticación: REQUERIDA
 * Devuelve objeto con:
 * - totalPomodorosCompleted: Conteo total de actividades completadas
 * - lastCompletedBlock: Último bloque completado (más reciente)
 * - currentBlock: Siguiente bloque a completar
 * - phaseCompletionPercentage: % de completitud de fase actual
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

    console.log(`[PROGRESS-SUMMARY] Obteniendo resumen para: ${user.email} (${userId})`);

    // Usar cliente autenticado para políticas RLS
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    // Obtener datos de progreso de lecciones
    const { data: lessonProgress, error: lessonError } = await authenticatedSupabase
      .from('user_lesson_progress')
      .select('lesson_id, completed, completed_at, progress_percentage, time_spent_seconds')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (lessonError) {
      console.error('[PROGRESS-SUMMARY] Error obteniendo progreso de lecciones:', lessonError);
      throw lessonError;
    }

    // Obtener datos de progreso de ejercicios
    const { data: exerciseProgress, error: exerciseError } = await authenticatedSupabase
      .from('user_exercise_progress')
      .select('exercise_id, lesson_id, completed, completed_at, attempts_count, best_score, time_spent_seconds')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (exerciseError) {
      console.error('[PROGRESS-SUMMARY] Error obteniendo progreso de ejercicios:', exerciseError);
      throw exerciseError;
    }

    // Calcular métricas agregadas
    const completedLessons = lessonProgress?.filter(l => l.completed) || [];
    const completedExercises = exerciseProgress?.filter(e => e.completed) || [];
    
    // Total de "Pomodoros" (actividades completadas)
    const totalPomodorosCompleted = completedLessons.length + completedExercises.length;

    // Último bloque completado (actividad más reciente)
    const allCompletedActivities = [
      ...completedLessons.map(l => ({
        type: 'lesson',
        id: l.lesson_id,
        completed_at: l.completed_at,
        time_spent: l.time_spent_seconds
      })),
      ...completedExercises.map(e => ({
        type: 'exercise', 
        id: e.exercise_id,
        lesson_id: e.lesson_id,
        completed_at: e.completed_at,
        time_spent: e.time_spent_seconds,
        score: e.best_score,
        attempts: e.attempts_count
      }))
    ].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const lastCompletedBlock = allCompletedActivities.length > 0 ? allCompletedActivities[0] : null;

    // Determinar bloque actual (siguiente a completar)
    // Por simplicidad, usamos un cálculo basado en progreso total
    const currentBlock = calculateCurrentBlock(totalPomodorosCompleted);

    // Calcular porcentaje de completitud de fase
    const phaseCompletionPercentage = calculatePhaseCompletion(totalPomodorosCompleted);

    // Estadísticas adicionales útiles
    const stats = {
      totalLessonsStarted: lessonProgress?.length || 0,
      totalLessonsCompleted: completedLessons.length,
      totalExercisesStarted: exerciseProgress?.length || 0,
      totalExercisesCompleted: completedExercises.length,
      averageTimePerActivity: calculateAverageTime(allCompletedActivities),
      totalTimeSpent: allCompletedActivities.reduce((total, activity) => total + (activity.time_spent || 0), 0)
    };

    // Construir respuesta
    const progressSummary = {
      totalPomodorosCompleted,
      lastCompletedBlock,
      currentBlock,
      phaseCompletionPercentage,
      stats,
      lastUpdated: new Date().toISOString()
    };

    console.log(`[PROGRESS-SUMMARY] Resumen calculado para ${user.email}:`, {
      pomodoros: totalPomodorosCompleted,
      lessons: completedLessons.length,
      exercises: completedExercises.length,
      phase: phaseCompletionPercentage
    });

    return res.status(200).json({
      success: true,
      data: progressSummary
    });

  } catch (error) {
    console.error('[PROGRESS-SUMMARY] Error en endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener resumen de progreso',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'progress-summary'
      } : undefined
    });
  }
}

/**
 * Calcula el bloque actual basado en progreso total
 */
function calculateCurrentBlock(totalCompleted) {
  // Lógica simplificada: cada fase tiene ~20 actividades
  const activitiesPerPhase = 20;
  const currentPhase = Math.floor(totalCompleted / activitiesPerPhase) + 1;
  const currentWeek = Math.floor((totalCompleted % activitiesPerPhase) / 4) + 1;
  const currentDay = (totalCompleted % 4) + 1;

  return {
    phase: Math.min(currentPhase, 7), // Máximo 7 fases según curriculum
    week: currentWeek,
    day: currentDay,
    description: `Fase ${Math.min(currentPhase, 7)}, Semana ${currentWeek}, Día ${currentDay}`
  };
}

/**
 * Calcula el porcentaje de completitud de la fase actual
 */
function calculatePhaseCompletion(totalCompleted) {
  const activitiesPerPhase = 20;
  const currentPhaseProgress = totalCompleted % activitiesPerPhase;
  return Math.round((currentPhaseProgress / activitiesPerPhase) * 100);
}

/**
 * Calcula el tiempo promedio por actividad
 */
function calculateAverageTime(activities) {
  if (activities.length === 0) return 0;
  
  const totalTime = activities.reduce((sum, activity) => sum + (activity.time_spent || 0), 0);
  return Math.round(totalTime / activities.length);
}

// Aplicar middleware de autenticación requerida
export default withRequiredAuth(progressSummaryHandler);
