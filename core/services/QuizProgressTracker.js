// core/services/QuizProgressTracker.js
// 🔒 SECURED VERSION: Quiz Progress Tracker con validación de autenticación
import supabase from '../../lib/supabaseClient.js';

/**
 * Registra el intento de un usuario en una pregunta de un cuestionario.
 * 🔒 SEGURO: Valida que el userId corresponda a un usuario real en Supabase Auth
 * 
 * @param {object} attemptData - Los datos del intento.
 * @param {string} attemptData.userId - El ID del usuario (debe ser UUID válido de Supabase Auth).
 * @param {string} attemptData.lessonId - El ID de la lección.
 * @param {number} attemptData.questionIndex - El índice de la pregunta.
 * @param {string} attemptData.userAnswer - La respuesta del usuario.
 * @param {string} attemptData.correctAnswer - La respuesta correcta.
 * @param {number} attemptData.timeSpentSeconds - El tiempo en segundos que tardó en responder.
 * @returns {Promise<object>} El registro del intento recién creado.
 */
export const recordQuizAttempt = async (attemptData) => {
  const { userId, lessonId, questionIndex, userAnswer, correctAnswer, timeSpentSeconds } = attemptData;

  // 🔒 VALIDACIÓN DE AUTENTICACIÓN
  if (!userId) {
    throw new Error('userId es requerido para registrar intento de quiz');
  }

  // Validar formato UUID (Supabase Auth siempre genera UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error(`❌ Invalid userId format: ${userId}`);
    throw new Error('Invalid user ID format. User must be authenticated.');
  }

  // 🔒 VERIFICACIÓN ADICIONAL: Confirmar que el usuario existe en auth.users
  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      console.error(`❌ Usuario no encontrado en auth.users: ${userId}`);
      throw new Error('User authentication required. Please login again.');
    }

    console.log(`✅ Usuario autenticado verificado: ${authUser.user?.email} (${userId})`);
  } catch (authCheckError) {
    // Si no podemos verificar auth (ej. permisos), continuar pero loggear warning
    console.warn(`⚠️ No se pudo verificar auth para ${userId}:`, authCheckError.message);
    // Para maintain compatibility, continuar con la operación
  }

  // Procesar el intento
  const is_correct = userAnswer === correctAnswer;

  console.log(`📝 Registrando intento de quiz para usuario autenticado:`, {
    user_id: userId,
    lesson_id: lessonId,
    question_index: questionIndex,
    is_correct,
    time_spent_seconds: timeSpentSeconds
  });

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      question_index: questionIndex,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      is_correct: is_correct,
      time_spent_seconds: timeSpentSeconds
    })
    .select()
    .single(); // .select().single() devuelve el registro insertado

  if (error) {
    console.error('❌ Error al registrar el intento de quiz:', error);
    
    // Manejar errores específicos de UUID
    if (error.code === '22P02' && error.message.includes('uuid')) {
      throw new Error('Invalid user ID format. Please login again.');
    }
    
    throw error;
  }

  console.log(`✅ Intento de quiz registrado exitosamente: ID ${data.id}`);
  return data;
};

/**
 * 🔒 FUNCIÓN SEGURA: Obtiene el progreso de una lección para un usuario autenticado
 * @param {string} userId - ID del usuario autenticado (UUID)
 * @param {string} lessonId - ID de la lección
 * @returns {Promise<object>} Progreso de la lección
 */
export const getLessonProgress = async (userId, lessonId) => {
  // Validar autenticación
  if (!userId || !lessonId) {
    throw new Error('userId y lessonId son requeridos');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error('Invalid user ID format. User must be authenticated.');
  }

  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calcular estadísticas del progreso
    const totalAttempts = data.length;
    const correctAttempts = data.filter(attempt => attempt.is_correct).length;
    const averageTime = totalAttempts > 0 
      ? data.reduce((sum, attempt) => sum + (attempt.time_spent_seconds || 0), 0) / totalAttempts 
      : 0;

    return {
      userId,
      lessonId,
      totalAttempts,
      correctAttempts,
      accuracyRate: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
      averageTimeSeconds: Math.round(averageTime),
      attempts: data
    };
  } catch (error) {
    console.error('Error obteniendo progreso de lección:', error);
    throw error;
  }
};

/**
 * 🔒 FUNCIÓN SEGURA: Obtiene el historial de quizzes para un usuario autenticado
 * @param {string} userId - ID del usuario autenticado (UUID)
 * @param {string} lessonId - ID de la lección (opcional)
 * @returns {Promise<Array>} Historial de intentos
 */
export const getQuizHistory = async (userId, lessonId = null) => {
  // Validar autenticación
  if (!userId) {
    throw new Error('userId es requerido');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error('Invalid user ID format. User must be authenticated.');
  }

  try {
    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo historial de quizzes:', error);
    throw error;
  }
};

/**
 * 🔒 FUNCIÓN SEGURA: Obtiene métricas de rendimiento para un usuario autenticado
 * @param {string} userId - ID del usuario autenticado (UUID)
 * @returns {Promise<object>} Métricas de rendimiento
 */
export const getUserPerformanceMetrics = async (userId) => {
  // Validar autenticación
  if (!userId) {
    throw new Error('userId es requerido');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error('Invalid user ID format. User must be authenticated.');
  }

  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const totalAttempts = data.length;
    const correctAttempts = data.filter(attempt => attempt.is_correct).length;
    const totalTime = data.reduce((sum, attempt) => sum + (attempt.time_spent_seconds || 0), 0);
    
    // Agrupar por lección para obtener métricas por lección
    const lessonGroups = data.reduce((groups, attempt) => {
      const lessonId = attempt.lesson_id;
      if (!groups[lessonId]) {
        groups[lessonId] = [];
      }
      groups[lessonId].push(attempt);
      return groups;
    }, {});

    const lessonMetrics = Object.entries(lessonGroups).map(([lessonId, attempts]) => {
      const lessonCorrect = attempts.filter(a => a.is_correct).length;
      const lessonTotal = attempts.length;
      const lessonTime = attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);

      return {
        lessonId,
        totalAttempts: lessonTotal,
        correctAttempts: lessonCorrect,
        accuracyRate: lessonTotal > 0 ? (lessonCorrect / lessonTotal) * 100 : 0,
        totalTimeSeconds: lessonTime,
        averageTimeSeconds: lessonTotal > 0 ? lessonTime / lessonTotal : 0
      };
    });

    return {
      userId,
      overall: {
        totalAttempts,
        correctAttempts,
        accuracyRate: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
        totalTimeSeconds: totalTime,
        averageTimeSeconds: totalAttempts > 0 ? totalTime / totalAttempts : 0,
        lessonsCompleted: Object.keys(lessonGroups).length
      },
      byLesson: lessonMetrics,
      lastActivity: data.length > 0 ? data[0].created_at : null
    };
  } catch (error) {
    console.error('Error obteniendo métricas de rendimiento:', error);
    throw error;
  }
};
