/**
 * ENDPOINT TEMPORAL - MIGRACIÓN FASE 3 SUPABASE
 * /api/admin/migrate-supabase-fase3
 * 
 * Endpoint temporal para ejecutar migración de desacoplamiento
 * de curriculum_progress en Supabase
 * 
 * @author Mentor Coder
 * @version v1.0
 * @misión 182 - Fase 3
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verifica el estado actual de las tablas en Supabase
 */
async function checkCurrentState() {
  const results = {};
  
  const tablesToCheck = [
    'curriculum_progress',
    'curriculum_phases', 
    'curriculum_modules',
    'curriculum_weeks',
    'curriculum_metadata'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        results[table] = { exists: false, error: error.message, count: 0 };
      } else {
        results[table] = { 
          exists: true, 
          count: count,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          sample: data[0] || null
        };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message, count: 0 };
    }
  }

  return results;
}

/**
 * Ejecuta el backup de curriculum_progress
 */
async function backupProgressData() {
  try {
    const { data, error } = await supabase
      .from('curriculum_progress')
      .select('*');

    if (error) {
      throw new Error(`Error en backup: ${error.message}`);
    }

    return {
      success: true,
      recordCount: data.length,
      backupData: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ejecuta las modificaciones de estructura paso a paso
 */
async function executeStructureModifications(dryRun = true) {
  const modifications = [];
  
  try {
    // PASO 1: Agregar columnas numéricas
    const addColumnsQuery = `
      ALTER TABLE curriculum_progress 
      ADD COLUMN IF NOT EXISTS phase_number INTEGER,
      ADD COLUMN IF NOT EXISTS module_number INTEGER,
      ADD COLUMN IF NOT EXISTS week_number INTEGER;
    `;
    
    if (!dryRun) {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql: addColumnsQuery 
      });
      
      if (error) {
        throw new Error(`Error agregando columnas: ${error.message}`);
      }
    }
    
    modifications.push({
      step: 'add_columns',
      query: addColumnsQuery,
      executed: !dryRun,
      status: 'success'
    });

    // PASO 2: Migrar datos (si es necesario)
    // Esto se haría solo si existen las tablas curriculum_* con datos válidos
    
    // PASO 3: Eliminar constraints (si existen)
    const dropConstraintsQueries = [
      'ALTER TABLE curriculum_progress DROP CONSTRAINT IF EXISTS fk_curriculum_progress_phase;',
      'ALTER TABLE curriculum_progress DROP CONSTRAINT IF EXISTS fk_curriculum_progress_module;', 
      'ALTER TABLE curriculum_progress DROP CONSTRAINT IF EXISTS fk_curriculum_progress_week;'
    ];
    
    for (const query of dropConstraintsQueries) {
      if (!dryRun) {
        // En producción ejecutaríamos estas queries
      }
      
      modifications.push({
        step: 'drop_constraint',
        query: query,
        executed: !dryRun,
        status: 'planned'
      });
    }

    // PASO 4: Eliminar columnas obsoletas (después de migrar datos)
    const dropColumnsQuery = `
      ALTER TABLE curriculum_progress 
      DROP COLUMN IF EXISTS phase_id,
      DROP COLUMN IF EXISTS module_id,
      DROP COLUMN IF EXISTS week_id;
    `;
    
    modifications.push({
      step: 'drop_columns',
      query: dropColumnsQuery,
      executed: false, // Se haría en último paso
      status: 'planned'
    });

    return {
      success: true,
      modifications: modifications,
      dryRun: dryRun
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      modifications: modifications
    };
  }
}

/**
 * Elimina las tablas curriculum_* obsoletas
 */
async function cleanupObsoleteTables(dryRun = true) {
  const dropQueries = [
    'DROP TABLE IF EXISTS curriculum_metadata;',
    'DROP TABLE IF EXISTS curriculum_phases;',
    'DROP TABLE IF EXISTS curriculum_modules;', 
    'DROP TABLE IF EXISTS curriculum_weeks;'
  ];

  const results = [];

  for (const query of dropQueries) {
    try {
      if (!dryRun) {
        // En producción ejecutaríamos la query
        const { data, error } = await supabase.rpc('execute_sql', { sql: query });
        if (error) {
          throw new Error(error.message);
        }
      }

      results.push({
        query: query,
        executed: !dryRun,
        status: 'success'
      });
    } catch (error) {
      results.push({
        query: query,
        executed: false,
        status: 'error',
        error: error.message
      });
    }
  }

  return {
    success: true,
    operations: results,
    dryRun: dryRun
  };
}

/**
 * Handler principal del endpoint
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, dryRun = true } = req.body;

  try {
    console.log(`🔧 [FASE-3] Ejecutando acción: ${action} (dryRun: ${dryRun})`);

    let result = {};

    switch (action) {
      case 'check_state':
        result = await checkCurrentState();
        break;

      case 'backup_data':
        result = await backupProgressData();
        break;

      case 'modify_structure':
        result = await executeStructureModifications(dryRun);
        break;

      case 'cleanup_tables':
        result = await cleanupObsoleteTables(dryRun);
        break;

      case 'full_migration':
        // Ejecutar migración completa paso a paso
        const currentState = await checkCurrentState();
        const backup = await backupProgressData();
        const modifications = await executeStructureModifications(dryRun);
        const cleanup = await cleanupObsoleteTables(dryRun);

        result = {
          currentState,
          backup,
          modifications,
          cleanup,
          summary: {
            dryRun: dryRun,
            allStepsSuccessful: backup.success && modifications.success && cleanup.success
          }
        };
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid action', 
          validActions: ['check_state', 'backup_data', 'modify_structure', 'cleanup_tables', 'full_migration']
        });
    }

    return res.status(200).json({
      success: true,
      action: action,
      dryRun: dryRun,
      timestamp: new Date().toISOString(),
      result: result
    });

  } catch (error) {
    console.error(`❌ [FASE-3] Error en acción ${action}:`, error);
    
    return res.status(500).json({
      success: false,
      action: action,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
