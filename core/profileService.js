// core/profileService.js
// MISIÓN 104.0 - Eliminación de dependencia fantasma userProfile.json
// Refactorización para manejo robusto de usuarios anónimos

/**
 * Lee y devuelve el perfil del usuario.
 * Para usuarios anónimos, retorna un perfil estándar sin acceso al sistema de archivos.
 * @param {string} userId - ID del usuario (opcional para usuarios anónimos)
 * @returns {Promise<object>} El objeto del perfil del usuario.
 */
export const getProfile = async (userId = null) => {
  // Lógica para usuarios anónimos - sin dependencia del sistema de archivos
  if (!userId) {
    console.log('[PROFILE] Retornando perfil anónimo estándar.');
    return {
      isAuthenticated: false,
      user: null,
      error: 'No active session',
      type: 'anonymous',
      profile: {
        displayName: 'Usuario Anónimo',
        bio: 'Perfil público de demostración',
        stats: {
          modulesCompleted: 0,
          totalProgress: 0,
          streak: 0
        }
      }
    };
  }

  // Lógica para usuarios autenticados se manejará por el endpoint /api/profile
  // Este servicio se enfoca en proporcionar perfiles anónimos robustos
  console.log(`[PROFILE] Servicio solicitado para usuario: ${userId}`);
  return {
    isAuthenticated: true,
    user: { id: userId },
    error: null,
    type: 'authenticated',
    note: 'Para usuarios autenticados, usar endpoint /api/profile'
  };
};

/**
 * Actualiza el perfil del usuario con nuevos datos.
 * DEPRECATED: Para usuarios autenticados, usar endpoint /api/profile con POST
 * @param {object} updatedData - Un objeto con las claves a actualizar.
 * @returns {Promise<object>} El perfil actualizado.
 */
export const updateProfile = async (updatedData) => {
  console.warn('[PROFILE] updateProfile está deprecado. Usar endpoint /api/profile para actualizaciones.');
  
  // Para mantener compatibilidad, retornar datos simulados
  return {
    success: false,
    error: 'Función deprecada. Usar /api/profile para actualizaciones.',
    suggestion: 'POST /api/profile con datos de actualización'
  };
};

/**
 * Función auxiliar para obtener un perfil público/demo para usuarios anónimos
 * @returns {object} Perfil público estándar
 */
export const getPublicProfile = () => {
  console.log('[PROFILE] Proporcionando perfil público estándar.');
  return {
    displayName: 'Demostración AI Code Mentor',
    bio: 'Perfil de demostración para explorar las funcionalidades',
    stats: {
      modulesAvailable: 10,
      lessonsAvailable: 50,
      exercisesAvailable: 200,
      publicProgress: 'Inicia sesión para ver tu progreso personal'
    },
    capabilities: [
      'Explorar módulos públicos',
      'Ver contenido de demostración',
      'Acceder a tutoriales básicos'
    ],
    limitations: [
      'Sin progreso personal',
      'Sin estadísticas personalizadas',
      'Sin guardado de preferencias'
    ]
  };
};
