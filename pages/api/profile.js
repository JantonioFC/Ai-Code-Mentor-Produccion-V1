// pages/api/profile.js
// MISIÓN 69.1 FASE 4 - ENDPOINT UNIFICADO CON MIDDLEWARE DE AUTENTICACIÓN
// Combina funcionalidad base (perfil público) con funcionalidad segura (perfil personal)

import { withOptionalAuth, createAdaptiveResponse, logAuthContext } from '../../utils/authMiddleware';
import { getProfile } from '../../core/profileService.js';
import { getAuthenticatedSupabaseFromRequest, supabaseAnon } from '../../lib/supabaseServerAuth.js';

/**
 * API endpoint unificado para gestionar perfil
 * GET /api/profile - Obtener perfil
 * POST /api/profile - Actualizar perfil (solo autenticados)
 * 
 * Autenticación: OPCIONAL
 * - Con autenticación: perfil personal completo del usuario con gestión
 * - Sin autenticación: perfil público básico o plantilla demo
 */
async function profileHandler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ 
      success: false,
      error: 'Método no permitido. Use GET o POST.' 
    });
  }

  try {
    // Log del contexto de autenticación para debugging
    logAuthContext(req, 'PROFILE');
    
    const { isAuthenticated, user, userId } = req.authContext;

    if (req.method === 'POST') {
      // POST requiere autenticación obligatoria
      if (!isAuthenticated) {
        return res.status(401).json({
          success: false,
          error: 'Autenticación requerida para actualizar perfil',
          requireAuth: true
        });
      }

      // LÓGICA POST PARA USUARIOS AUTENTICADOS - Migrada de profile-secure.js
      console.log(`[PROFILE] Actualizando perfil para: ${user.email} (${userId})`);
      
      const updates = req.body;
      const updatedProfile = await updateUserProfile(userId, updates, user, req);
      
      return res.status(200).json({
        success: true,
        authenticated: true,
        message: 'Perfil actualizado exitosamente',
        profile: updatedProfile
      });
    }

    if (req.method === 'GET') {
      if (isAuthenticated) {
        // LÓGICA GET PARA USUARIOS AUTENTICADOS - Migrada de profile-secure.js
        console.log(`[PROFILE] Obteniendo perfil personal para: ${user.email} (${userId})`);

        const profile = await getUserProfile(userId, user, req);
        
        const authenticatedResponse = {
          profile,
          capabilities: [
            'Ver progreso personal',
            'Actualizar información',
            'Gestionar preferencias',
            'Ver estadísticas detalladas'
          ]
        };

        return res.status(200).json(createAdaptiveResponse(req, authenticatedResponse, null));

      } else {
        // LÓGICA GET PARA USUARIOS ANÓNIMOS - Funcionalidad original
        console.log('[PROFILE] Obteniendo perfil público para usuario anónimo');

        // Llamamos al servicio para obtener los datos del perfil público
        const profile = await getProfile();
        
        // Si el perfil no se encuentra por alguna razón, devolvemos un 404.
        if (!profile) {
          return res.status(404).json({ 
            success: false,
            error: 'Perfil de usuario no encontrado.' 
          });
        }

        const anonymousResponse = {
          profile,
          type: 'public',
          note: 'Perfil público. Inicia sesión para gestionar tu perfil personal.',
          limitations: [
            'Solo información básica disponible',
            'Sin progreso personal',
            'Sin capacidad de edición'
          ]
        };

        return res.status(200).json(createAdaptiveResponse(req, null, anonymousResponse));
      }
    }

  } catch (error) {
    console.error('[PROFILE] Error en endpoint unificado:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al gestionar perfil',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'profile-unified'
      } : undefined
    });
  }
}

/**
 * Obtiene el perfil completo de un usuario autenticado
 * Migrado de profile-secure.js
 */
async function getUserProfile(userId, authUser, req) {
  try {
    console.log(`[PROFILE] Obteniendo perfil para ${authUser.email}...`);

    // CORRECCIÓN CRÍTICA: Usar cliente autenticado para políticas RLS
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    // Obtener o crear perfil en la tabla user_profiles
    let { data: profile, error } = await authenticatedSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No existe perfil, crear uno nuevo
      console.log(`[PROFILE] Creando perfil inicial para ${authUser.email}...`);
      
      const newProfile = {
        id: userId,
        email: authUser.email,
        display_name: authUser.email.split('@')[0]
      };

      // INICIO BLOQUE DE DEPURACIÓN RLS
      console.log('--- DEBUG RLS ---');
      console.log('Objeto authUser disponible:', JSON.stringify(authUser, null, 2));
      console.log('Payload de newProfile A INSERTAR:', JSON.stringify(newProfile, null, 2));
      console.log('--- FIN DEBUG RLS ---');
      // FIN BLOQUE DE DEPURACIÓN RLS

      const { data: createdProfile, error: createError } = await authenticatedSupabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      profile = createdProfile;
    } else if (error) {
      throw error;
    }

    // Obtener estadísticas de progreso
    const progressStats = await getUserProgressStats(userId, authenticatedSupabase);

    // Combinar datos del perfil con estadísticas
    const completeProfile = {
      ...profile,
      authData: {
        email: authUser.email,
        emailVerified: authUser.email_confirmed_at ? true : false,
        lastSignIn: authUser.last_sign_in_at,
        createdAt: authUser.created_at
      },
      stats: progressStats
    };

    console.log(`[PROFILE] Perfil obtenido exitosamente para ${authUser.email}`);
    return completeProfile;

  } catch (error) {
    console.error('[PROFILE] Error en getUserProfile:', error);
    throw error;
  }
}

/**
 * Actualiza el perfil de un usuario autenticado
 * Migrado de profile-secure.js
 */
async function updateUserProfile(userId, updates, authUser, req) {
  try {
    console.log(`[PROFILE] Actualizando perfil para ${authUser.email}...`);

    // CORRECCIÓN CRÍTICA: Usar cliente autenticado para políticas RLS
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    // Validar y limpiar updates
    const allowedFields = [
      'display_name', 
      'bio', 
      'learning_goals', 
      'preferences'
    ];

    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        cleanUpdates[key] = value;
      }
    }

    // Añadir timestamp de actualización
    cleanUpdates.updated_at = new Date().toISOString();

    // Actualizar perfil
    const { data: updatedProfile, error } = await authenticatedSupabase
      .from('user_profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`[PROFILE] Perfil actualizado exitosamente para ${authUser.email}`);
    return updatedProfile;

  } catch (error) {
    console.error('[PROFILE] Error en updateUserProfile:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de progreso para el perfil
 * Migrado de profile-secure.js
 */
async function getUserProgressStats(userId, authenticatedSupabase) {
  try {
    // Estadísticas de quiz
    const { data: quizData, error: quizError } = await authenticatedSupabase
      .from('quiz_attempts')
      .select('is_correct, created_at')
      .eq('user_id', userId);

    if (quizError) throw quizError;

    // Estadísticas de lecciones
    const { data: lessonData, error: lessonError } = await authenticatedSupabase
      .from('user_lesson_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true);

    if (lessonError) throw lessonError;

    // Estadísticas de ejercicios
    const { data: exerciseData, error: exerciseError } = await authenticatedSupabase
      .from('user_exercise_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true);

    if (exerciseError) throw exerciseError;

    // Calcular estadísticas
    const quizStats = {
      total: quizData?.length || 0,
      correct: quizData?.filter(q => q.is_correct).length || 0,
      accuracy: quizData?.length > 0 
        ? Math.round((quizData.filter(q => q.is_correct).length / quizData.length) * 100) 
        : 0
    };

    const progressStats = {
      lessonsCompleted: lessonData?.length || 0,
      exercisesCompleted: exerciseData?.length || 0,
      totalActivities: quizStats.total + (lessonData?.length || 0) + (exerciseData?.length || 0)
    };

    // Calcular racha de actividad
    const allDates = [
      ...(quizData || []).map(q => q.created_at),
      ...(lessonData || []).map(l => l.completed_at),
      ...(exerciseData || []).map(e => e.completed_at)
    ].filter(date => date).sort((a, b) => new Date(b) - new Date(a));

    const streak = calculateActivityStreak(allDates);

    return {
      quiz: quizStats,
      progress: progressStats,
      streak: streak,
      lastActivity: allDates.length > 0 ? allDates[0] : null,
      joinedDate: allDates.length > 0 ? allDates[allDates.length - 1] : null
    };

  } catch (error) {
    console.error('[PROFILE] Error en getUserProgressStats:', error);
    return {
      quiz: { total: 0, correct: 0, accuracy: 0 },
      progress: { lessonsCompleted: 0, exercisesCompleted: 0, totalActivities: 0 },
      streak: 0,
      lastActivity: null,
      joinedDate: null
    };
  }
}

/**
 * Calcula la racha de actividad del usuario
 * Migrado de profile-secure.js
 */
function calculateActivityStreak(sortedDates) {
  if (sortedDates.length === 0) return 0;

  const today = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  let streak = 0;
  let currentDate = today;

  for (const dateStr of sortedDates) {
    const activityDate = new Date(dateStr);
    const daysDiff = Math.floor((currentDate - activityDate) / oneDayMs);

    if (daysDiff <= 1) {
      streak++;
      currentDate = activityDate;
    } else {
      break;
    }
  }

  return streak;
}

// Aplicar middleware de autenticación opcional al handler
export default withOptionalAuth(profileHandler);
