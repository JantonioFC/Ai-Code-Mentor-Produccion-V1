// pages/api/v1/sandbox/history.js
// MISIÓN 216.0 FASE 2 - ENDPOINT PARA HISTORIAL DE SANDBOX
// MISIÓN 217.0 - Añadido: Endpoint DELETE para eliminación de generaciones
// Objetivo: Guardar, recuperar y eliminar historial de generaciones del sandbox por usuario

import { withRequiredAuth } from '../../../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../../../lib/supabaseServerAuth.js';

/**
 * Genera un título a partir del contenido del usuario
 * Toma las primeras 5-7 palabras del contenido
 * @param {string} content - Contenido del usuario
 * @returns {string} - Título generado (máximo 100 caracteres)
 */
function generateTitle(content) {
  if (!content || typeof content !== 'string') {
    return 'Sin título';
  }

  // Limpiar el contenido
  const cleanContent = content.trim();
  
  // Dividir en palabras
  const words = cleanContent.split(/\s+/);
  
  // Tomar las primeras 5-7 palabras
  const wordCount = Math.min(7, words.length);
  const titleWords = words.slice(0, wordCount);
  
  // Unir y limitar a 100 caracteres
  let title = titleWords.join(' ');
  
  if (title.length > 97) {
    title = title.substring(0, 97) + '...';
  } else if (words.length > wordCount) {
    title = title + '...';
  }
  
  return title;
}

/**
 * API endpoint para historial de sandbox
 * 
 * POST /api/v1/sandbox/history - Guardar nueva generación
 * GET /api/v1/sandbox/history - Obtener historial del usuario
 * DELETE /api/v1/sandbox/history/:id - Eliminar generación (MISIÓN 217.0)
 * 
 * Autenticación: REQUERIDA
 * Seguridad: RLS de Supabase garantiza que usuarios solo pueden eliminar sus propias generaciones
 */
async function sandboxHistoryHandler(req, res) {
  const { method } = req;
  const { isAuthenticated, user, userId } = req.authContext;

  console.log(`[SANDBOX-HISTORY] ${method} request from user: ${user.email}`);

  // Cliente autenticado de Supabase (respeta RLS)
  const supabase = getAuthenticatedSupabaseFromRequest(req);

  try {
    // ========================================
    // POST: Guardar nueva generación
    // ========================================
    if (method === 'POST') {
      const { customContent, generatedLesson, metadata } = req.body;

      // Validaciones
      if (!customContent || typeof customContent !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'El campo customContent es requerido y debe ser un string',
          code: 'MISSING_CUSTOM_CONTENT',
          metadata: {
            apiVersion: '1.7',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (!generatedLesson || typeof generatedLesson !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'El campo generatedLesson es requerido y debe ser un objeto',
          code: 'MISSING_GENERATED_LESSON',
          metadata: {
            apiVersion: '1.7',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Validación de longitud
      if (customContent.length > 50000) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'El contenido excede el límite máximo de 50,000 caracteres',
          code: 'CONTENT_TOO_LARGE',
          metadata: {
            apiVersion: '1.7',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Generar título automáticamente
      const title = generateTitle(customContent);

      console.log(`[SANDBOX-HISTORY] Guardando generación con título: "${title}"`);

      // Insertar en la base de datos
      // El trigger automático limpiará generaciones antiguas si excede 20
      const { data: savedGeneration, error: insertError } = await supabase
        .from('sandbox_generations')
        .insert({
          user_id: userId,
          custom_content: customContent,
          title: title,
          generated_lesson: generatedLesson,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (insertError) {
        console.error('[SANDBOX-HISTORY] Error insertando generación:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Error guardando la generación en el historial',
          code: 'DATABASE_ERROR',
          metadata: {
            apiVersion: '1.7',
            timestamp: new Date().toISOString()
          },
          details: process.env.NODE_ENV === 'development' ? {
            dbError: insertError.message
          } : undefined
        });
      }

      console.log(`[SANDBOX-HISTORY] Generación guardada exitosamente: ${savedGeneration.id}`);

      // Respuesta exitosa
      return res.status(201).json({
        success: true,
        data: {
          id: savedGeneration.id,
          title: savedGeneration.title,
          created_at: savedGeneration.created_at
        },
        message: 'Generación guardada exitosamente en el historial',
        metadata: {
          apiVersion: '1.7',
          timestamp: new Date().toISOString(),
          userId: userId
        }
      });
    }

    // ========================================
    // GET: Obtener historial del usuario
    // ========================================
    if (method === 'GET') {
      // Parámetros de paginación (para futuro)
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      console.log(`[SANDBOX-HISTORY] Obteniendo historial (limit: ${limit}, offset: ${offset})`);

      // Consultar historial del usuario (ordenado por fecha DESC)
      const { data: generations, error: selectError, count } = await supabase
        .from('sandbox_generations')
        .select('id, title, custom_content, generated_lesson, created_at, updated_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (selectError) {
        console.error('[SANDBOX-HISTORY] Error obteniendo historial:', selectError);
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Error obteniendo el historial de generaciones',
          code: 'DATABASE_ERROR',
          metadata: {
            apiVersion: '1.7',
            timestamp: new Date().toISOString()
          },
          details: process.env.NODE_ENV === 'development' ? {
            dbError: selectError.message
          } : undefined
        });
      }

      console.log(`[SANDBOX-HISTORY] Encontradas ${generations.length} generaciones (total: ${count})`);

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        data: {
          generations: generations,
          count: generations.length,
          total: count,
          hasMore: count > (offset + limit)
        },
        metadata: {
          apiVersion: '1.7',
          timestamp: new Date().toISOString(),
          userId: userId,
          userEmail: user.email,
          pagination: {
            limit: limit,
            offset: offset,
            total: count
          }
        }
      });
    }

    // ========================================
    // DELETE: Eliminar generación (MISIÓN 217.0)
    // ========================================
    if (method === 'DELETE') {
      // Extraer ID de la query string
      // URL esperada: /api/v1/sandbox/history?id=xxx o /api/v1/sandbox/history/xxx (manejado por Next.js)
      const generationId = req.query.id;

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

      console.log(`[SANDBOX-HISTORY] Eliminando generación: ${generationId}`);

      // Ejecutar DELETE con RLS
      // RLS garantiza que solo se eliminan generaciones del usuario autenticado
      const { error: deleteError } = await supabase
        .from('sandbox_generations')
        .delete()
        .eq('id', generationId);

      if (deleteError) {
        console.error('[SANDBOX-HISTORY] Error eliminando generación:', deleteError);
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
            dbError: deleteError.message
          } : undefined
        });
      }

      console.log(`[SANDBOX-HISTORY] Generación eliminada exitosamente: ${generationId}`);

      // Respuesta exitosa (204 No Content o 200 OK con mensaje)
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
    }

    // ========================================
    // Método no permitido
    // ========================================
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: `El método ${method} no está permitido. Use POST, GET o DELETE.`,
      code: 'METHOD_NOT_ALLOWED',
      metadata: {
        apiVersion: '1.7',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[SANDBOX-HISTORY] Error inesperado:', error);
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
export default withRequiredAuth(sandboxHistoryHandler);
