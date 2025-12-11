/**
 * API endpoint for system reset
 * POST /api/reset-system
 * Handles data archival and system reset for new curriculum cycles
 */

import { db, getProjectDashboard, getRecentEntries, getAllModules } from '../../lib/database';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { resetType, config } = req.body;

    // Step 1: Pre-reset export if enabled
    let preResetExport = null;
    if (config.exportBeforeReset) {
      preResetExport = await performPreResetExport();
    }

    // Step 2: Data archival if enabled
    let archiveResult = null;
    if (config.archiveData) {
      archiveResult = await archiveCurrentCycle();
    }

    // Step 3: Process reset based on type
    const resetResult = await processReset(resetType, config);

    // Step 4: Initialize new cycle
    const newCycleResult = await initializeNewCycle(config);

    return res.status(200).json({
      success: true,
      resetType,
      archiveUrl: archiveResult?.downloadUrl || null,
      preResetExportUrl: preResetExport?.downloadUrl || null,
      newCycleId: newCycleResult.cycleId,
      message: `System reset completed successfully (${resetType})`,
      metadata: {
        dataArchived: !!archiveResult,
        preResetExported: !!preResetExport,
        newCycleStarted: true,
        resetDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('System reset error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during system reset'
    });
  }
}

// Real pre-reset export function
async function performPreResetExport() {
  try {
    // Get current data for export
    const dashboardData = await getProjectDashboard();
    const allEntries = await getRecentEntries(null, 1000); // Get all entries
    const allModules = await getAllModules();

    // Create export package
    const exportData = {
      exportDate: new Date().toISOString(),
      dashboard: dashboardData,
      entries: allEntries,
      modules: allModules,
      metadata: {
        totalEntries: allEntries?.length || 0,
        totalModules: allModules?.length || 0,
        exportReason: 'pre-reset-backup'
      }
    };

    // Create ZIP with exported data
    const zip = new JSZip();
    zip.file('backup-data.json', JSON.stringify(exportData, null, 2));
    zip.file('README.md', generateBackupReadme(exportData.metadata));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = `data:application/zip;base64,${Buffer.from(await zipBlob.arrayBuffer()).toString('base64')}`;

    return {
      downloadUrl,
      metadata: {
        size: zipBlob.size,
        files: 2
      }
    };
  } catch (error) {
    console.error('Pre-reset export error:', error);
    throw new Error('Failed to create pre-reset export');
  }
}

// Real data archival function
async function archiveCurrentCycle() {
  try {
    // Get all current data
    const archiveData = {
      archiveDate: new Date().toISOString(),
      cycleId: `cycle_${Date.now()}`,
      projectEntries: await getAllProjectEntries(),
      modules: await getAllModules(),
      competencies: await getAllCompetencies(),
      metadata: generateArchiveMetadata()
    };

    // Create comprehensive archive
    const zip = new JSZip();
    
    // Add data files
    zip.file('project-entries.json', JSON.stringify(archiveData.projectEntries, null, 2));
    zip.file('modules.json', JSON.stringify(archiveData.modules, null, 2));
    zip.file('competencies.json', JSON.stringify(archiveData.competencies, null, 2));
    zip.file('archive-metadata.json', JSON.stringify(archiveData.metadata, null, 2));
    
    // Add documentation
    zip.file('README.md', generateArchiveReadme(archiveData.metadata));
    zip.file('RESTORE.md', generateRestoreInstructions(archiveData.cycleId));

    // Generate archive blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = `data:application/zip;base64,${Buffer.from(await zipBlob.arrayBuffer()).toString('base64')}`;

    // Store archive reference in database for future access
    await storeArchiveReference(archiveData.cycleId, archiveData.metadata);

    return {
      downloadUrl,
      cycleId: archiveData.cycleId,
      metadata: {
        size: zipBlob.size,
        files: 6,
        totalEntries: archiveData.projectEntries?.length || 0
      }
    };
  } catch (error) {
    console.error('Data archival error:', error);
    throw new Error('Failed to archive current cycle data');
  }
}

// Real reset processing function
async function processReset(resetType, config) {
  try {
    const transaction = db.transaction(() => {
      switch (resetType) {
        case 'soft':
          // Reset counters but keep data structure
          if (config.resetCompetencies) {
            db.prepare('DELETE FROM competency_log').run();
          }
          if (config.resetPhaseProgress) {
            db.prepare('UPDATE progress SET completed_lessons = 0, completed_exercises = 0').run();
          }
          // Keep project entries but mark as archived
          db.prepare(`
            UPDATE project_entries 
            SET metadata = json_set(metadata, '$.archived', 'true', '$.archive_date', ?)
          `).run(new Date().toISOString());
          break;

        case 'selective':
          // Reset only selected components
          if (config.resetCompetencies) {
            db.prepare('DELETE FROM competency_log').run();
          }
          if (config.resetPhaseProgress) {
            db.prepare('UPDATE progress SET completed_lessons = 0, completed_exercises = 0').run();
          }
          // Keep templates but reset modules if specified
          if (config.resetModules) {
            db.prepare('DELETE FROM modules').run();
          }
          break;

        case 'hard':
          // Complete reset - delete all data
          db.prepare('DELETE FROM project_entries').run();
          db.prepare('DELETE FROM competency_log').run();
          db.prepare('DELETE FROM modules').run();
          db.prepare('DELETE FROM lessons').run();
          db.prepare('DELETE FROM exercises').run();
          db.prepare('DELETE FROM progress').run();
          break;

        default:
          throw new Error(`Unknown reset type: ${resetType}`);
      }
    });

    // Execute the transaction
    transaction();

    return {
      success: true,
      resetType,
      affectedTables: getAffectedTables(resetType),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Reset processing error:', error);
    throw new Error(`Failed to process ${resetType} reset: ${error.message}`);
  }
}

// Real new cycle initialization function
async function initializeNewCycle(config) {
  try {
    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize new cycle metadata
    const newCycleData = {
      cycleId,
      startDate: config.newCycleStartDate || new Date().toISOString(),
      phase: 1,
      phaseName: 'Fundamentos',
      competencyLevel: 1,
      competencyName: 'Principiante',
      curriculum: '24 meses • 6 fases • Andamiaje Decreciente',
      methodology: 'Ecosistema 360'
    };

    // Store cycle initialization in a metadata table
    const initStmt = db.prepare(`
      INSERT OR REPLACE INTO project_entries (
        id, entry_type, content, template_used, metadata, date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    initStmt.run(
      `cycle_init_${cycleId}`,
      'cycle_initialization',
      `Nuevo ciclo curricular iniciado: ${newCycleData.curriculum}`,
      'cycle_management_template',
      JSON.stringify(newCycleData),
      newCycleData.startDate
    );

    // Initialize baseline progress if preserving structure
    if (config.preserveSettings) {
      const progressStmt = db.prepare(`
        INSERT OR IGNORE INTO progress (module_id, total_lessons, completed_lessons, total_exercises, completed_exercises)
        VALUES ('baseline', 0, 0, 0, 0)
      `);
      progressStmt.run();
    }

    return {
      success: true,
      cycleId,
      startDate: newCycleData.startDate,
      phase: newCycleData.phase,
      competencyLevel: newCycleData.competencyLevel
    };
  } catch (error) {
    console.error('New cycle initialization error:', error);
    throw new Error('Failed to initialize new cycle');
  }
}

// Helper functions
async function getAllProjectEntries() {
  try {
    const stmt = db.prepare('SELECT * FROM project_entries ORDER BY date DESC');
    return stmt.all();
  } catch (error) {
    console.error('Error getting project entries:', error);
    return [];
  }
}

async function getAllCompetencies() {
  try {
    const stmt = db.prepare('SELECT * FROM competency_log ORDER BY achieved_date DESC');
    return stmt.all();
  } catch (error) {
    console.error('Error getting competencies:', error);
    return [];
  }
}

function generateArchiveMetadata() {
  return {
    archiveDate: new Date().toISOString(),
    archiveVersion: '1.0',
    systemVersion: 'AI Code Mentor v1.0',
    methodology: 'Ecosistema 360',
    curriculum: '24 meses • 6 fases • Andamiaje Decreciente',
    description: 'Complete curriculum cycle archive with all evidences and competencies'
  };
}

async function storeArchiveReference(cycleId, metadata) {
  try {
    const stmt = db.prepare(`
      INSERT INTO project_entries (
        id, entry_type, content, template_used, metadata, date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      `archive_ref_${cycleId}`,
      'archive_reference',
      `Archivo del ciclo ${cycleId} creado exitosamente`,
      'archive_management_template',
      JSON.stringify(metadata),
      new Date().toISOString()
    );
  } catch (error) {
    console.error('Error storing archive reference:', error);
    // Not critical, continue without storing reference
  }
}

function getAffectedTables(resetType) {
  switch (resetType) {
    case 'soft':
      return ['competency_log', 'progress', 'project_entries (metadata updated)'];
    case 'selective':
      return ['competency_log', 'progress', 'modules (conditional)'];
    case 'hard':
      return ['project_entries', 'competency_log', 'modules', 'lessons', 'exercises', 'progress'];
    default:
      return [];
  }
}

function generateBackupReadme(metadata) {
  return `# Pre-Reset Backup

Este archivo contiene un backup completo de los datos antes del reset del sistema.

## Contenido

- **backup-data.json**: Datos completos del dashboard, entradas y módulos
- **Total de entradas**: ${metadata.totalEntries}
- **Total de módulos**: ${metadata.totalModules}
- **Fecha de backup**: ${new Date().toLocaleDateString('es-ES')}

## Restauración

Este backup puede ser usado para restaurar los datos si es necesario después del reset.

Generado por: AI Code Mentor - Ecosistema 360
`;
}

function generateArchiveReadme(metadata) {
  return `# Archivo de Ciclo Curricular - Ecosistema 360

Este archivo contiene un ciclo completo de 24 meses del curriculum Ecosistema 360.

## Metodología

- **Sistema**: ${metadata.systemVersion}
- **Metodología**: ${metadata.methodology}  
- **Curriculum**: ${metadata.curriculum}
- **Fecha de archivo**: ${new Date(metadata.archiveDate).toLocaleDateString('es-ES')}

## Contenido

- **project-entries.json**: Todas las entradas de templates educativas
- **modules.json**: Módulos procesados y lecciones generadas
- **competencies.json**: Log de competencias desarrolladas
- **archive-metadata.json**: Metadatos del archivo

## Valor Educativo

Este archivo representa evidencia concreta del desarrollo de competencias siguiendo principios de:
- Simbiosis Crítica Humano-IA
- Andamiaje Decreciente  
- Portfolio Basado en Evidencias

## Restauración

Ver RESTORE.md para instrucciones de restauración si es necesario.

---
Generado por: AI Code Mentor - Ecosistema 360 Learning Management Platform
`;
}

function generateRestoreInstructions(cycleId) {
  return `# Instrucciones de Restauración

## Ciclo ID: ${cycleId}

### Proceso de Restauración

1. **Backup actual**: Antes de restaurar, crear backup del estado actual
2. **Importar datos**: Usar los archivos JSON para restaurar las tablas
3. **Verificar integridad**: Comprobar que todos los datos se importaron correctamente
4. **Reiniciar aplicación**: Restart para aplicar los cambios

### Archivos a Restaurar

- \`project-entries.json\` → tabla \`project_entries\`
- \`modules.json\` → tabla \`modules\` 
- \`competencies.json\` → tabla \`competency_log\`

### Contacto

Para soporte técnico en la restauración, consultar la documentación técnica del proyecto.

---
AI Code Mentor - Ecosistema 360
`;
}