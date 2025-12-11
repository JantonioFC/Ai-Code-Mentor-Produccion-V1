/**
 * MISIÓN 268 - FASE 2: ENDPOINT DE LIMPIEZA DE ESTADO E2E
 * 
 * PROPÓSITO:
 * Este endpoint limpia el estado del usuario de CI en la base de datos después
 * de que todos los tests E2E han finalizado. Esto resuelve la "Contaminación
 * de Estado" identificada en M-262 causada por el uso de un usuario real.
 * 
 * ARQUITECTURA:
 * - Solo el usuario de CI puede ejecutar este endpoint (validación estricta)
 * - Usa el cliente admin de Supabase para asegurar permisos de borrado
 * - Limpia todas las tablas relacionadas con el usuario (sandbox, progress, etc.)
 * - Protegido con middleware de autenticación M-264
 * 
 * SEGURIDAD:
 * - Requiere autenticación (Bearer Token)
 * - Valida que el email sea exactamente el usuario de CI
 * - Solo método POST permitido
 * - Usa Service Role Key para operaciones privilegiadas
 * 
 * FLUJO:
 * 1. Validar método HTTP (POST)
 * 2. Validar autenticación (middleware M-264)
 * 3. Validar que el usuario es el usuario de CI
 * 4. Limpiar tabla sandbox_generations
 * 5. Limpiar tabla est_progress
 * 6. Retornar éxito
 * 
 * @author Mentor Coder
 * @version M-268 - Fase 2
 */

import { withRequiredAuth } from '../../../utils/authMiddleware';
import { createClient } from '@supabase/supabase-js';

async function handler(req, res) {
  // PASO 1: Validar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method Not Allowed' 
    });
  }

  // PASO 2: El middleware ya validó la autenticación
  // authContext contiene userId y userEmail
  const { userId, userEmail } = req.authContext;

  // PASO 3: Validar que es el usuario de CI
  const ciUserEmail = process.env.TEST_USER_EMAIL || process.env.CI_USER_EMAIL;
  
  if (userEmail !== ciUserEmail) {
    console.log(`⛔ [M-268 Cleanup] Acceso denegado: ${userEmail} no es el usuario de CI`);
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden: No es el usuario de CI' 
    });
  }

  console.log(`🧹 [M-268 Cleanup] Iniciando limpieza de estado para: ${userId} (${userEmail})`);
  
  // Crear cliente admin de Supabase
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // PASO 4: Limpiar tabla sandbox_generations
    console.log('[M-268 Cleanup] Limpiando sandbox_generations...');
    const { error: sandboxError, count: sandboxCount } = await supabaseAdmin
      .from('sandbox_generations')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (sandboxError) {
      throw new Error(`Error limpiando sandbox_generations: ${sandboxError.message}`);
    }
    
    console.log(`✅ [M-268 Cleanup] ${sandboxCount || 0} registros eliminados de sandbox_generations`);

    // PASO 5: Limpiar tabla est_progress
    console.log('[M-268 Cleanup] Limpiando est_progress...');
    const { error: progressError, count: progressCount } = await supabaseAdmin
      .from('est_progress')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (progressError) {
      throw new Error(`Error limpiando est_progress: ${progressError.message}`);
    }
    
    console.log(`✅ [M-268 Cleanup] ${progressCount || 0} registros eliminados de est_progress`);
    
    // PASO 6: Retornar éxito
    console.log(`✅ [M-268 Cleanup] Estado limpiado exitosamente para: ${userId}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Estado de E2E limpiado',
      metadata: {
        userId,
        userEmail,
        deletedRecords: {
          sandboxGenerations: sandboxCount || 0,
          estProgress: progressCount || 0
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [M-268 Cleanup] Error limpiando estado:', error.message);
    
    res.status(500).json({ 
      success: false, 
      message: error.message,
      metadata: {
        userId,
        userEmail,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Exportar con middleware de autenticación
export default withRequiredAuth(handler);
