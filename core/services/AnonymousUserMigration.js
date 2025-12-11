// core/services/AnonymousUserMigration.js
/**
 * 🔄 SERVICIO DE MIGRACIÓN DE USUARIOS ANÓNIMOS
 * 
 * Maneja la conversión de usuarios anónimos a usuarios registrados,
 * preservando todo el progreso y datos de quiz.
 * 
 * Arquitectura: 100% Supabase con funciones PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';

// Cliente con privilegios de servicio para migraciones
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class AnonymousUserMigrationService {
  static ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

  /**
   * 📊 Obtiene estadísticas del usuario anónimo
   * 
   * @returns {Promise<Object>} Estadísticas de progreso anónimo
   */
  static async getAnonymousStats() {
    try {
      console.log('📊 Obteniendo estadísticas de usuario anónimo...');
      
      const { data, error } = await supabaseService
        .rpc('get_anonymous_user_stats', {
          anonymous_user_id: this.ANONYMOUS_USER_ID
        });

      if (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        throw error;
      }

      console.log('✅ Estadísticas obtenidas:', data);
      return {
        success: true,
        stats: data,
        hasData: data?.has_data || false
      };

    } catch (error) {
      console.error('❌ Error en getAnonymousStats:', error);
      return {
        success: false,
        error: error.message,
        stats: null,
        hasData: false
      };
    }
  }

  /**
   * 🔄 Migra todos los datos del usuario anónimo al usuario registrado
   * 
   * @param {string} realUserId - UUID del usuario registrado
   * @returns {Promise<Object>} Resultado de la migración
   */
  static async migrateAnonymousData(realUserId) {
    try {
      console.log('🔄 Iniciando migración de datos anónimos...');
      console.log('📋 Usuario anónimo:', this.ANONYMOUS_USER_ID);
      console.log('📋 Usuario real:', realUserId);

      // Validar UUID del usuario real
      if (!realUserId || !this.isValidUUID(realUserId)) {
        throw new Error('UUID de usuario real inválido');
      }

      // Verificar que hay datos para migrar
      const statsResult = await this.getAnonymousStats();
      if (!statsResult.success || !statsResult.hasData) {
        console.log('ℹ️ No hay datos anónimos para migrar');
        return {
          success: true,
          migration: {
            migrated_lessons: 0,
            migrated_attempts: 0,
            message: 'No había datos para migrar'
          }
        };
      }

      // Ejecutar migración usando función PostgreSQL
      const { data, error } = await supabaseService
        .rpc('migrate_anonymous_data', {
          anonymous_user_id: this.ANONYMOUS_USER_ID,
          real_user_id: realUserId
        });

      if (error) {
        console.error('❌ Error en migración:', error);
        throw error;
      }

      if (data.error) {
        console.error('❌ Error reportado por función:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Migración completada exitosamente:', data);
      
      return {
        success: true,
        migration: data,
        stats: statsResult.stats
      };

    } catch (error) {
      console.error('❌ Error en migrateAnonymousData:', error);
      return {
        success: false,
        error: error.message,
        migration: null
      };
    }
  }

  /**
   * 🎯 Proceso completo de conversión: verificar → migrar → notificar
   * 
   * @param {string} realUserId - UUID del usuario registrado
   * @returns {Promise<Object>} Resultado completo del proceso
   */
  static async convertAnonymousUser(realUserId) {
    try {
      console.log('🎯 Iniciando conversión completa de usuario anónimo...');

      // Paso 1: Obtener estadísticas previas
      const preStats = await this.getAnonymousStats();
      
      if (!preStats.success) {
        throw new Error('No se pudieron obtener estadísticas previas');
      }

      // Paso 2: Ejecutar migración
      const migrationResult = await this.migrateAnonymousData(realUserId);
      
      if (!migrationResult.success) {
        throw new Error(`Migración falló: ${migrationResult.error}`);
      }

      // Paso 3: Verificar migración
      const postStats = await this.getAnonymousStats();

      // Paso 4: Compilar resultado completo
      const result = {
        success: true,
        conversion: {
          userId: realUserId,
          anonymousUserId: this.ANONYMOUS_USER_ID,
          
          // Estadísticas antes de la migración
          beforeMigration: preStats.stats,
          
          // Datos migrados
          migration: migrationResult.migration,
          
          // Estadísticas después (debería ser cero)
          afterMigration: postStats.stats,
          
          // Resumen
          summary: {
            lessonsTransferred: migrationResult.migration.migrated_lessons,
            attemptsTransferred: migrationResult.migration.migrated_attempts,
            hadDataToMigrate: preStats.hasData,
            migrationTimestamp: migrationResult.migration.migration_timestamp
          }
        }
      };

      console.log('🏆 Conversión completada exitosamente:', result.conversion.summary);
      
      return result;

    } catch (error) {
      console.error('❌ Error en convertAnonymousUser:', error);
      return {
        success: false,
        error: error.message,
        conversion: null
      };
    }
  }

  /**
   * ✅ Valida formato UUID
   * 
   * @param {string} uuid - UUID a validar
   * @returns {boolean} True si es válido
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 🧹 Limpia datos residuales del usuario anónimo (solo para testing)
   * 
   * @returns {Promise<Object>} Resultado de la limpieza
   */
  static async clearAnonymousData() {
    try {
      console.log('🧹 Limpiando datos de usuario anónimo (TESTING)...');

      // Eliminar intentos de quiz
      const { error: quizError } = await supabaseService
        .from('quiz_attempts')
        .delete()
        .eq('user_id', this.ANONYMOUS_USER_ID);

      if (quizError) throw quizError;

      // Eliminar progreso de lecciones
      const { error: progressError } = await supabaseService
        .from('lesson_progress')
        .delete()
        .eq('user_id', this.ANONYMOUS_USER_ID);

      if (progressError) throw progressError;

      console.log('✅ Datos anónimos limpiados');
      
      return { success: true };

    } catch (error) {
      console.error('❌ Error limpiando datos:', error);
      return { success: false, error: error.message };
    }
  }
}

export default AnonymousUserMigrationService;

/**
 * 📝 EJEMPLO DE USO:
 * 
 * // En el proceso de registro/login:
 * import AnonymousUserMigrationService from '@/core/services/AnonymousUserMigration';
 * 
 * // Verificar si hay datos anónimos
 * const stats = await AnonymousUserMigrationService.getAnonymousStats();
 * 
 * if (stats.hasData) {
 *   // Mostrar mensaje al usuario sobre migración
 *   const confirm = window.confirm('Tienes progreso anónimo. ¿Transferir a tu cuenta?');
 *   
 *   if (confirm) {
 *     const result = await AnonymousUserMigrationService.convertAnonymousUser(userId);
 *     
 *     if (result.success) {
 *       console.log(`Transferidas ${result.conversion.summary.lessonsTransferred} lecciones`);
 *       console.log(`Transferidos ${result.conversion.summary.attemptsTransferred} intentos`);
 *     }
 *   }
 * }
 */
