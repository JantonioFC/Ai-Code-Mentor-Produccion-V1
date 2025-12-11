// pages/api/achievements.js
// MISIÓN 160 FASE 2 - ENDPOINT PARA OBTENER LOGROS DEL USUARIO
// Objetivo: Devolver lista de logros ya obtenidos por el usuario actual

import { withRequiredAuth } from '../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../lib/supabaseServerAuth.js';
import { getUserAchievements } from '../../lib/achievements/engine.js';

/**
 * API endpoint para obtener logros del usuario
 * GET /api/achievements - Obtener lista de logros ya obtenidos
 * 
 * Autenticación: REQUERIDA
 * Devuelve objeto con:
 * - success: boolean del resultado
 * - achievements: array de logros con detalles completos
 * - count: número total de logros obtenidos
 * - metadata: información adicional del usuario y timestamp
 */
async function achievementsHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Método no permitido. Use GET.' 
    });
  }

  try {
    const { isAuthenticated, user, userId } = req.authContext;

    console.log(`[ACHIEVEMENTS-GET] Obteniendo logros para: ${user.email} (${userId})`);

    // Usar cliente autenticado para políticas RLS
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    // PASO 1: Obtener logros del usuario usando motor de achievements
    const achievementsResult = await getUserAchievements(userId, authenticatedSupabase);

    if (!achievementsResult.success) {
      console.error('[ACHIEVEMENTS-GET] Error obteniendo logros:', achievementsResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error interno obteniendo logros del usuario',
        details: process.env.NODE_ENV === 'development' ? {
          message: achievementsResult.error,
          endpoint: 'achievements'
        } : undefined
      });
    }

    // PASO 2: Log para debugging
    console.log(`[ACHIEVEMENTS-GET] Usuario ${user.email} tiene ${achievementsResult.count} logros`);

    // PASO 3: Obtener también estadísticas de todos los logros disponibles
    const { data: allAchievements, error: allAchievementsError } = await authenticatedSupabase
      .from('achievements')
      .select('id, name')
      .order('name');

    if (allAchievementsError) {
      console.warn('[ACHIEVEMENTS-GET] No se pudieron obtener stats de todos los logros:', allAchievementsError);
    }

    // PASO 4: Estructurar respuesta para frontend
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      userId: userId,
      achievements: achievementsResult.achievements,
      count: achievementsResult.count,
      metadata: {
        userEmail: user.email,
        totalAchievementsAvailable: allAchievements?.length || 0,
        completionPercentage: allAchievements?.length > 0 
          ? parseFloat(((achievementsResult.count / allAchievements.length) * 100).toFixed(1))
          : 0,
        hasAnyAchievements: achievementsResult.count > 0
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[ACHIEVEMENTS-GET] Error en endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener logros',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'achievements'
      } : undefined
    });
  }
}

// Aplicar middleware de autenticación requerida
export default withRequiredAuth(achievementsHandler);
