/**
 * ⚠️ ARCHIVO OBSOLETO - MISIÓN 274
 * 
 * Este archivo fue archivado como parte de la Misión M-274: Inyección Híbrida Verdadera
 * 
 * RAZÓN DEL ARCHIVADO:
 * La arquitectura globalTeardown de M-268 tenía los mismos problemas que globalSetup:
 * - request.newContext con storageState NO inyectaba cookies en peticiones fetch
 * - Resultaba en fallos 401 Unauthorized al intentar limpiar estado
 * - El teardown dependía de globalSetup que fue eliminado
 * 
 * SOLUCIÓN M-274:
 * La limpieza de estado ahora se hace por-test en el beforeEach:
 * - authenticateHybrid limpia storage y cookies al inicio
 * - Cada test comienza con estado limpio
 * - No se requiere teardown global
 * 
 * ARCHIVO DE REEMPLAZO:
 * - e2e/helpers/authHelper.js (authenticateHybrid function)
 * - La función incluye limpieza inicial que reemplaza este teardown
 * 
 * NO ELIMINAR ESTE ARCHIVO - Conservar para historia arquitectónica
 * 
 * @deprecated M-274
 * @see e2e/helpers/authHelper.js
 */

/**
 * MISIÓN 268 - FASE 2: GLOBAL TEARDOWN CON LIMPIEZA DE ESTADO
 * 
 * ARQUITECTURA:
 * Este archivo se ejecuta UNA VEZ después de que TODOS los tests han finalizado.
 * Llama al endpoint /api/e2e/cleanup-state para limpiar el estado del usuario de CI,
 * previniendo "Contaminación de Estado" identificada en M-262.
 * 
 * BENEFICIOS:
 * - Limpieza automática después de cada ejecución del pipeline
 * - Estado consistente para la próxima ejecución
 * - No afecta a tests individuales (cleanup al final)
 * - Previene acumulación de datos de test en la base de datos
 * 
 * FLUJO:
 * 1. Crear contexto de request con estado de autenticación guardado
 * 2. Llamar a POST /api/e2e/cleanup-state
 * 3. Verificar respuesta exitosa
 * 4. Loggear resultado
 * 5. No lanzar error si la limpieza falla (para no fallar el pipeline)
 * 
 * @author Mentor Coder
 * @version M-268 - Fase 2
 */

import { request } from '@playwright/test';

const STORAGE_STATE_PATH = '.auth/storageState.json';

async function globalTeardown(config) {
  console.log('\n🧹 [M-268 GlobalTeardown] Iniciando limpieza de estado del pipeline...\n');
  
  try {
    // PASO 1: Crear contexto de request con autenticación
    const context = await request.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    
    console.log('✅ [M-268] Contexto de request creado con autenticación');
    
    // PASO 2: Llamar al endpoint de limpieza
    console.log('🔄 [M-268] Llamando a POST /api/e2e/cleanup-state...');
    const response = await context.post('http://localhost:3000/api/e2e/cleanup-state');
    
    // PASO 3: Verificar respuesta
    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`Fallo al llamar a cleanup-state: ${response.status()} - ${errorBody}`);
    }
    
    // PASO 4: Loggear resultado
    const responseBody = await response.json();
    console.log('\n✅ [M-268 GlobalTeardown] Limpieza de estado completada exitosamente');
    console.log('📊 [M-268] Registros eliminados:', responseBody.metadata?.deletedRecords);
    console.log('\n🎉 [M-268 GlobalTeardown] ¡GLOBALTEARDOWN COMPLETADO EXITOSAMENTE!\n');
    
  } catch (error) {
    // PASO 5: No lanzar error para no fallar el pipeline
    console.error('\n❌ [M-268 GlobalTeardown] FALLO LA LIMPIEZA:', error.message);
    console.warn('⚠️  [M-268] El pipeline continuará, pero el estado puede estar contaminado');
    console.warn('⚠️  [M-268] Considere limpiar manualmente la base de datos del usuario de CI\n');
    // No lanzar error aquí para no fallar el pipeline si la limpieza falla
  }
}

export default globalTeardown;
