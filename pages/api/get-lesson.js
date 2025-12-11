// AI CODE MENTOR - Get Generated Lesson Endpoint
// MISIÓN 146.5 FASE 2: Recuperar lecciones persistidas de Supabase
// Endpoint para obtener contenido educativo previamente generado por IA

import { withOptionalAuth } from '../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../lib/supabaseServerAuth.js';

// Handler principal para recuperar lecciones
async function handler(req, res) {
  // Verificar método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método no permitido',
      message: 'Este endpoint solo acepta solicitudes GET' 
    });
  }

  try {
    const { semanaId, dia, diaIndex, pomodoroIndex } = req.query;
    
    // Compatibilidad: Aceptar tanto 'dia' como 'diaIndex'
    const diaFinal = dia || (diaIndex !== undefined ? parseInt(diaIndex) + 1 : null);
    const { isAuthenticated, userId } = req.authContext;

    // Verificar autenticación - este endpoint requiere usuario autenticado
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Autenticación requerida',
        message: 'Debe iniciar sesión para acceder a contenido guardado',
        requireAuth: true
      });
    }

    // Validar parámetros requeridos
    if (!semanaId || !diaFinal || pomodoroIndex === undefined) {
      return res.status(400).json({
        error: 'Parámetros faltantes',
        message: 'semanaId, dia (o diaIndex) y pomodoroIndex son requeridos',
        received: { semanaId, dia, diaIndex, diaFinal, pomodoroIndex }
      });
    }

    // Validar tipos y rangos de parámetros
    const semanaNum = parseInt(semanaId);
    const diaNum = parseInt(diaFinal);
    const pomodoroNum = parseInt(pomodoroIndex);

    if (isNaN(semanaNum) || semanaNum < 1) {
      return res.status(400).json({
        error: 'semanaId inválido',
        message: 'semanaId debe ser un entero positivo'
      });
    }

    if (isNaN(diaNum) || diaNum < 1 || diaNum > 5) {
      return res.status(400).json({
        error: 'dia inválido',
        message: 'dia debe ser un entero entre 1 y 5 (1-based)'
      });
    }

    if (isNaN(pomodoroNum) || pomodoroNum < 0 || pomodoroNum > 3) {
      return res.status(400).json({
        error: 'pomodoroIndex inválido',
        message: 'pomodoroIndex debe ser un entero entre 0 y 3'
      });
    }

    // Convertir dia (1-based) a diaIndex (0-based) para la base de datos
    const diaIndexForDB = diaNum - 1;
    
    console.log(`🔍 Buscando lección guardada para usuario ${userId}: semana ${semanaNum}, día ${diaNum} (índice ${diaIndexForDB}), pomodoro ${pomodoroNum}`);

    // Obtener cliente autenticado para consultar BD con RLS
    const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);

    // Buscar contenido en la base de datos (usando diaIndex 0-based)
    const { data: savedContent, error: fetchError } = await authenticatedSupabase
      .from('generated_content')
      .select('*')
      .eq('user_id', userId)
      .eq('semana_id', semanaNum)
      .eq('dia_index', diaIndexForDB) // BD usa índices 0-based
      .eq('pomodoro_index', pomodoroNum)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('❌ Error consultando BD:', fetchError);
      return res.status(500).json({
        error: 'Error de base de datos',
        message: 'No se pudo consultar el contenido guardado'
      });
    }

    // Verificar si se encontró contenido
    if (!savedContent || savedContent.length === 0) {
      console.log(`📭 No se encontró lección para semana ${semanaNum}, día ${diaNum} (índice ${diaIndexForDB}), pomodoro ${pomodoroNum}`);
      
      return res.status(404).json({
        error: 'Contenido no encontrado',
        message: 'No existe lección generada para esta ubicación',
        location: {
          semanaId: semanaNum,
          dia: diaNum,
          diaIndex: diaIndexForDB,
          pomodoroIndex: pomodoroNum
        },
        suggestion: 'Genere una nueva lección para esta ubicación'
      });
    }

    const contentRecord = savedContent[0];
    const lessonContent = contentRecord.content;

    // Enriquecer respuesta con metadatos
    const enrichedResponse = {
      ...lessonContent,
      // Metadatos de recuperación
      contentId: contentRecord.id,
      retrievedAt: new Date().toISOString(),
      originallyCreatedAt: contentRecord.created_at,
      fromDatabase: true,
      location: {
        semanaId: semanaNum,
        dia: diaNum,
        diaIndex: diaIndexForDB,
        pomodoroIndex: pomodoroNum
      }
    };

    console.log(`✅ Lección recuperada exitosamente: "${lessonContent.title || 'Sin título'}" (ID: ${contentRecord.id})`);

    return res.status(200).json(enrichedResponse);

  } catch (error) {
    console.error('❌ Error interno en get-lesson:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado al recuperar la lección'
    });
  }
}

// Aplicar middleware de autenticación opcional
export default withOptionalAuth(handler);
