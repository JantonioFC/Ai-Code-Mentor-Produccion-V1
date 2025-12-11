// pages/api/v1/sandbox/history/[id].js
// MISIÓN 217.0 - ENDPOINT DELETE PARA ELIMINACIÓN DE GENERACIÓN ESPECÍFICA
// Objetivo: Eliminar una generación específica del historial por su ID
// Seguridad: RLS de Supabase garantiza que usuarios solo pueden eliminar sus propias generaciones

import { withRequiredAuth } from '../../../../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../../../../lib/supabaseServerAuth.js';

/**
 * API endpoint para eliminar generación específica del sandbox
 * 
 * DELETE /api/v1/sandbox/history/:id - Eliminar generación por ID
 * 
 * Autenticación: REQUERIDA
 * Seguridad: RLS automático - usuarios solo pueden eliminar sus propias generaciones
 */
async function deleteGenerationHandler(req, res) {
  const { method } = req;
  const { isAuthenticated, user, userId } = req.authContext;
  const { id: generationId } = req.query;

  console.log(`[SANDBOX-DELETE] ${method} request from user: ${user.email} for generation: ${generationId}`);

  // Solo permitir DELETE
  if (method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: `El método ${method} no está permitido en este endpoint. Use DELETE.`,
      code: 'METHOD_NOT_ALLOWED',
      metadata: {
        apiVersion: '1.7',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validación del ID
  if (!generationId) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'El ID de la generación es requerido',
      code: 'MISSING_GENERATION_ID',
      metadata: {
        apiVersion: '1.7',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Cliente autenticado de Supabase (respeta RLS)
  const supabase = getAuthenticatedSupabaseFromRequest(req);

  try {
    console.log(`[SANDBOX-DELETE] Eliminando generación: ${generationId}`);

    // Ejecutar DELETE con RLS
    // RLS garantiza que solo se eliminan generaciones del usuario autenticado
    // No necesitamos .eq('user_id', userId) porque RLS lo maneja automáticamente
    const { data, error: deleteError, count } = await supabase
      .from('sandbox_generations')
      .delete({ count: 'exact' })
      .eq('id', generationId);

    if (deleteError) {
      console.error('[SANDBOX-DELETE] Error eliminando generación:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Error eliminando la generación',
        code: 'DATABASE_ERROR',
        metadata: {
          apiVersion: '1.7',
          timestamp: new Date().toISOString()
        },
        details: process.env.NODE_ENV === 'development' ? {
          dbError: deleteError.message,
          dbCode: deleteError.code
        } : undefined
      });
    }

    // Si count es 0, significa que la generación no existe o no pertenece al usuario
    if (count === 0) {
      console.warn(`[SANDBOX-DELETE] Generación no encontrada o sin permisos: ${generationId}`);
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Generación no encontrada o no tienes permisos para eliminarla',
        code: 'GENERATION_NOT_FOUND',
        metadata: {
          apiVersion: '1.7',
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`[SANDBOX-DELETE] ✅ Generación eliminada exitosamente: ${generationId}`);

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Generación eliminada exitosamente',
      metadata: {
        apiVersion: '1.7',
        timestamp: new Date().toISOString(),
        userId: userId,
        deletedId: generationId
      }
    });

  } catch (error) {
    console.error('[SANDBOX-DELETE] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error interno del servidor',
      code: 'UNEXPECTED_ERROR',
      metadata: {
        apiVersion: '1.7',
        timestamp: new Date().toISOString()
      },
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
}

// Aplicar middleware de autenticación requerida
export default withRequiredAuth(deleteGenerationHandler);
