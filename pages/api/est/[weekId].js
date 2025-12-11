// ================================================================================
// AI CODE MENTOR - MISIÓN 157 FASE 2: API EST PROGRESS
// ================================================================================
// Archivo: /pages/api/est/[weekId].js
// Objetivo: API para persistencia del progreso EST por semana
// Versión: 1.0 - Implementación inicial
// Generado: 2025-09-16 por Mentor Coder según directiva Supervisor
// ================================================================================

import { createServerClient } from '@supabase/ssr';
import { withRequiredAuth } from '../../../utils/authMiddleware.js';

// Configuración de Supabase usando patrón del proyecto
function createSupabaseServer(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          // Para Pages Router, usar res.setHeader para cookies
          const cookieString = [
            `${name}=${value}`,
            'Path=/',
            options.httpOnly ? 'HttpOnly' : '',
            options.secure ? 'Secure' : '',
            `SameSite=${options.sameSite || 'Lax'}`,
            options.maxAge ? `Max-Age=${options.maxAge}` : ''
          ].filter(Boolean).join('; ');
          
          res.setHeader('Set-Cookie', cookieString);
        },
        remove(name, options) {
          res.setHeader('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        }
      }
    }
  );
}

// Estado por defecto del checklist EST
const DEFAULT_CHECKED_STATE = {
  ejercicios: false,
  miniProyecto: false,
  dma: false,
  commits: false
};

// Validador de weekId
function validateWeekId(weekId) {
  const week = parseInt(weekId);
  if (isNaN(week) || week < 1 || week > 100) {
    throw new Error(`WeekId inválido: ${weekId}. Debe estar entre 1-100.`);
  }
  return week;
}

// Validador de checked_state
function validateCheckedState(checkedState) {
  if (!checkedState || typeof checkedState !== 'object') {
    throw new Error('checked_state debe ser un objeto');
  }
  
  const requiredKeys = ['ejercicios', 'miniProyecto', 'dma', 'commits'];
  const receivedKeys = Object.keys(checkedState);
  
  // Verificar que todas las claves requeridas estén presentes
  for (const key of requiredKeys) {
    if (!(key in checkedState)) {
      throw new Error(`Falta la clave requerida: ${key}`);
    }
    if (typeof checkedState[key] !== 'boolean') {
      throw new Error(`El valor de ${key} debe ser boolean`);
    }
  }
  
  // Verificar que no hay claves adicionales no esperadas
  for (const key of receivedKeys) {
    if (!requiredKeys.includes(key)) {
      throw new Error(`Clave no esperada: ${key}`);
    }
  }
  
  return checkedState;
}

// Handler principal de la API con autenticación requerida
async function handler(req, res) {
  // Configurar CORS si es necesario
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  const { weekId } = req.query;

  try {
    // Validar weekId
    const validatedWeekId = validateWeekId(weekId);
    
    // Obtener contexto de autenticación del middleware
    const { isAuthenticated, userId, user } = req.authContext;
    
    // El middleware withRequiredAuth ya verificó la autenticación
    // pero hacemos una verificación adicional por seguridad
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Sesión de usuario requerida para acceder al progreso EST',
        code: 'UNAUTHORIZED'
      });
    }

    // Crear cliente Supabase con contexto de autenticación
    const supabase = createSupabaseServer(req, res);

    // Dispatch por método HTTP
    switch (req.method) {
      case 'GET':
        return await handleGetProgress(res, supabase, userId, validatedWeekId);
      
      case 'POST':
      case 'PUT':
      case 'PATCH':
        return await handleUpdateProgress(req, res, supabase, userId, validatedWeekId);
      
      default:
        return res.status(405).json({ 
          error: 'Método no permitido',
          message: `Método ${req.method} no es compatible con esta API`,
          allowedMethods: ['GET', 'POST', 'PUT', 'PATCH']
        });
    }

  } catch (error) {
    console.error('❌ Error en /api/est/[weekId]:', error);
    
    return res.status(400).json({
      error: 'Solicitud inválida',
      message: error.message,
      code: 'INVALID_REQUEST'
    });
  }
}

// Handler para GET: Recuperar progreso EST
async function handleGetProgress(res, supabase, userId, weekId) {
  try {
    console.log(`🔍 GET /api/est/${weekId} - Usuario: ${userId.substring(0, 8)}...`);

    // Consultar progreso existente
    const { data: progress, error: queryError } = await supabase
      .from('est_progress')
      .select('checked_state, updated_at')
      .eq('user_id', userId)
      .eq('semana_id', weekId)
      .maybeSingle(); // maybeSingle() permite null si no existe

    if (queryError) {
      console.error('❌ Error consultando progreso EST:', queryError);
      throw new Error(`Error de base de datos: ${queryError.message}`);
    }

    if (progress) {
      // CASO 1: Progreso encontrado - devolver estado guardado
      console.log(`✅ Progreso EST encontrado para semana ${weekId}`);
      
      return res.status(200).json({
        success: true,
        weekId: weekId,
        checkedState: progress.checked_state,
        lastUpdated: progress.updated_at,
        fromDatabase: true,
        message: 'Progreso EST recuperado exitosamente'
      });
      
    } else {
      // CASO 2: Progreso no encontrado - devolver estado por defecto
      console.log(`📭 No hay progreso EST para semana ${weekId}, devolviendo estado por defecto`);
      
      return res.status(200).json({
        success: true,
        weekId: weekId,
        checkedState: DEFAULT_CHECKED_STATE,
        lastUpdated: null,
        fromDatabase: false,
        message: 'Estado por defecto - no hay progreso guardado para esta semana'
      });
    }

  } catch (error) {
    console.error('❌ Error en handleGetProgress:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo recuperar el progreso EST',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
}

// Handler para POST/PUT/PATCH: Actualizar progreso EST
async function handleUpdateProgress(req, res, supabase, userId, weekId) {
  try {
    console.log(`💾 ${req.method} /api/est/${weekId} - Usuario: ${userId.substring(0, 8)}...`);

    // Validar payload
    const { checkedState } = req.body;
    
    if (!checkedState) {
      return res.status(400).json({
        error: 'Datos faltantes',
        message: 'El campo checkedState es requerido en el body',
        code: 'MISSING_CHECKED_STATE'
      });
    }

    // Validar estructura del checkedState
    const validatedCheckedState = validateCheckedState(checkedState);

    // Realizar UPSERT (insert si no existe, update si ya existe)
    const { data: result, error: upsertError } = await supabase
      .from('est_progress')
      .upsert(
        {
          user_id: userId,
          semana_id: weekId,
          checked_state: validatedCheckedState,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,semana_id', // Columnas del UNIQUE constraint
          ignoreDuplicates: false // Hacer update si existe
        }
      )
      .select('id, checked_state, updated_at')
      .single();

    if (upsertError) {
      console.error('❌ Error en UPSERT progreso EST:', upsertError);
      throw new Error(`Error de base de datos: ${upsertError.message}`);
    }

    console.log(`✅ Progreso EST guardado exitosamente para semana ${weekId}`);

    // Calcular estadísticas del progreso
    const checkedCount = Object.values(validatedCheckedState).filter(Boolean).length;
    const totalCount = Object.keys(validatedCheckedState).length;
    const completionPercentage = Math.round((checkedCount / totalCount) * 100);

    return res.status(200).json({
      success: true,
      weekId: weekId,
      checkedState: result.checked_state,
      lastUpdated: result.updated_at,
      savedToDatabase: true,
      statistics: {
        completedTasks: checkedCount,
        totalTasks: totalCount,
        completionPercentage: completionPercentage
      },
      message: `Progreso EST actualizado exitosamente (${completionPercentage}% completado)`
    });

  } catch (error) {
    console.error('❌ Error en handleUpdateProgress:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo guardar el progreso EST',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
}

// ================================================================================
// API EST PROGRESS - ESPECIFICACIONES TÉCNICAS
// ================================================================================
// 
// ENDPOINT: GET /api/est/[weekId]
// • Recupera el estado guardado del checklist para user_id + semana_id
// • Si no existe registro, devuelve estado por defecto (todos false)
// • Requiere autenticación (JWT token)
// • Response: { checkedState, lastUpdated, fromDatabase }
//
// ENDPOINT: POST/PUT/PATCH /api/est/[weekId] 
// • Realiza UPSERT del estado del checklist
// • Body: { checkedState: { ejercicios, miniProyecto, dma, commits } }
// • Todos los valores deben ser boolean
// • Response: { checkedState, lastUpdated, statistics }
//
// SEGURIDAD:
// • RLS policies garantizan acceso solo al propio progreso
// • Validación exhaustiva de datos de entrada
// • Logs detallados para debugging
//
// PERFORMANCE:
// • Consultas optimizadas con índice compuesto (user_id, semana_id)
// • UPSERT eficiente para evitar duplicados
// • Respuestas estructuradas con metadatos útiles
//
// ERROR HANDLING:
// • Validación de weekId (1-100)
// • Validación de estructura checkedState
// • Manejo de errores de base de datos
// • Respuestas HTTP apropiadas con códigos de error
//
// COMPATIBLE CON: WeeklySchedule.js estado actual
// READY FOR: Fase 3 Frontend Integration
// ================================================================================

// Aplicar middleware de autenticación requerida
export default withRequiredAuth(handler);