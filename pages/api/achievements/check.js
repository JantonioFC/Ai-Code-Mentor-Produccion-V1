// pages/api/achievements/check.js
// MISIÓN 160 FASE 2 - ENDPOINT PARA EJECUTAR MOTOR DE LOGROS
// Objetivo: Evaluar progreso del usuario y otorgar nuevos logros automáticamente

import { withRequiredAuth } from '../../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../../lib/supabaseServerAuth.js';
import { checkAndAwardAchievements } from '../../../lib/achievements/engine.js';

/**
 * API endpoint para ejecutar motor de logros
 * POST /api/achievements/check - Evaluar y otorgar logros para usuario actual
 * 
 * Autenticación: REQUERIDA
 * Devuelve objeto con:
 * - success: boolean del resultado
 * - summary: resumen de evaluación (total evaluados, ya desbloqueados, nuevos)
 * - newlyUnlockedAchievements: array de logros recién otorgados
 * - progressSummary: contexto del progreso del usuario
 */
async function achievementsCheckHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Método no permitido. Use POST.' 
    });
  }

  try {
    const { isAuthenticated, user, userId } = req.authContext;

    console.log(`[ACHIEVEMENTS-CHECK] Ejecutando motor de logros para: ${user.email} (${userId})`);

    // Usar cliente autenticado para políticas RLS
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    // PASO 1: Ejecutar motor de logros principal
    const achievementResult = await checkAndAwardAchievements(userId, authenticatedSupabase);

    if (!achievementResult.success) {
      console.error('[ACHIEVEMENTS-CHECK] Error en motor de logros:', achievementResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error interno en motor de logros',
        details: process.env.NODE_ENV === 'development' ? {
          message: achievementResult.error,
          endpoint: 'achievements/check'
        } : undefined
      });
    }

    // PASO 2: Log de resultados para debugging
    console.log(`[ACHIEVEMENTS-CHECK] Evaluación completada para ${user.email}:`, {
      totalEvaluados: achievementResult.summary.totalAchievementsEvaluated,
      yaDesbloqueados: achievementResult.summary.alreadyUnlocked,
      nuevosLogros: achievementResult.summary.newlyUnlocked,
      semanasCompletadas: achievementResult.progressSummary.totalSemanasCompletadas,
      porcentajeProgreso: achievementResult.progressSummary.porcentajeTotalCompletado
    });

    // PASO 3: Estructurar respuesta para frontend
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      userId: userId,
      summary: {
        totalAchievementsEvaluated: achievementResult.summary.totalAchievementsEvaluated,
        alreadyUnlocked: achievementResult.summary.alreadyUnlocked,
        newlyUnlocked: achievementResult.summary.newlyUnlocked,
        hasNewAchievements: achievementResult.summary.newlyUnlocked > 0
      },
      newlyUnlockedAchievements: achievementResult.newlyUnlockedAchievements,
      progressContext: {
        totalSemanasCompletadas: achievementResult.progressSummary.totalSemanasCompletadas,
        porcentajeTotalCompletado: achievementResult.progressSummary.porcentajeTotalCompletado,
        fasesCompletadas: achievementResult.progressSummary.fasesCompletadas
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[ACHIEVEMENTS-CHECK] Error en endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al evaluar logros',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'achievements/check'
      } : undefined
    });
  }
}

// Aplicar middleware de autenticación requerida
export default withRequiredAuth(achievementsCheckHandler);
