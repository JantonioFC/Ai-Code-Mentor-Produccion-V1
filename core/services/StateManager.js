/**
 * StateManager.js - Sistema Unificado de Gestión de Estado
 * Controlador central para todos los estados, progreso y tracking del proyecto
 * AI Code Mentor v5 - Unified Registry Architecture
 */

import fs from 'fs/promises';
import path from 'path';

class StateManager {
  constructor() {
    this.projectPath = process.cwd();
    this.stateDirectory = path.join(this.projectPath, 'data');
    this.unifiedStateFile = path.join(this.stateDirectory, 'unified-state.json');
    this.backupDirectory = path.join(this.stateDirectory, 'backups');
    
    // Estado en memoria
    this.state = {
      project: {
        name: 'AI Code Mentor v5',
        version: '5.0.0',
        lastUpdated: new Date().toISOString(),
        environment: 'development'
      },
      missions: {},
      tests: {},
      progress: {},
      templates: {},
      components: {},
      meta: {
        totalEntries: 0,
        lastBackup: null,
        systemHealth: 'healthy'
      }
    };
    
    this.initialized = false;
  }

  /**
   * Inicializar el StateManager
   */
  async initialize() {
    try {
      await this.ensureDirectories();
      await this.loadExistingState();
      await this.migrateFromLegacyFiles();
      await this.saveState();
      
      this.initialized = true;
      console.log('✅ StateManager inicializado exitosamente');
      return { success: true, message: 'StateManager initialized' };
    } catch (error) {
      console.error('❌ Error inicializando StateManager:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear directorios necesarios
   */
  async ensureDirectories() {
    const directories = [this.stateDirectory, this.backupDirectory];
    
    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      }
    }
  }

  /**
   * Cargar estado existente desde archivo unificado
   */
  async loadExistingState() {
    try {
      const stateContent = await fs.readFile(this.unifiedStateFile, 'utf8');
      const savedState = JSON.parse(stateContent);
      
      // Merge con estado por defecto
      this.state = {
        ...this.state,
        ...savedState,
        meta: {
          ...this.state.meta,
          ...savedState.meta,
          lastLoaded: new Date().toISOString()
        }
      };
      
      console.log('📥 Estado unificado cargado exitosamente');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('⚠️ Error cargando estado unificado:', error.message);
      }
      console.log('🆕 Iniciando con estado limpio');
    }
  }

  /**
   * Migrar datos de archivos legacy
   */
  async migrateFromLegacyFiles() {
    const legacyFiles = [
      'progress.json',
      'mission-a21-progress.json',
      'mission-a22-progress.json',
      'mission-b1-progress.json'
    ];

    for (const filename of legacyFiles) {
      try {
        const filePath = path.join(this.stateDirectory, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Extraer ID de misión del nombre de archivo
        const missionId = filename.replace('.json', '').replace('-progress', '');
        
        // Migrar datos
        this.state.missions[missionId] = {
          ...data,
          migratedFrom: filename,
          migratedAt: new Date().toISOString()
        };
        
        console.log(`🔄 Migrado: ${filename} -> missions.${missionId}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`⚠️ Error migrando ${filename}:`, error.message);
        }
      }
    }
  }

  /**
   * Guardar estado unificado
   */
  async saveState() {
    try {
      // Actualizar metadatos
      this.state.meta.lastUpdated = new Date().toISOString();
      this.state.meta.totalEntries = this.calculateTotalEntries();
      
      // Guardar con formato legible
      const stateJson = JSON.stringify(this.state, null, 2);
      await fs.writeFile(this.unifiedStateFile, stateJson, 'utf8');
      
      console.log('💾 Estado unificado guardado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error guardando estado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear backup del estado actual
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDirectory, `state-backup-${timestamp}.json`);
      
      const stateJson = JSON.stringify(this.state, null, 2);
      await fs.writeFile(backupFile, stateJson, 'utf8');
      
      this.state.meta.lastBackup = new Date().toISOString();
      
      console.log(`🔄 Backup creado: ${backupFile}`);
      return { success: true, backupFile };
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar misión
   */
  async updateMission(missionId, missionData) {
    if (!this.initialized) {
      throw new Error('StateManager no inicializado');
    }

    // Crear backup antes de cambios importantes
    if (missionData.status === 'COMPLETADA') {
      await this.createBackup();
    }

    this.state.missions[missionId] = {
      ...this.state.missions[missionId],
      ...missionData,
      lastUpdated: new Date().toISOString()
    };

    await this.saveState();
    
    return {
      success: true,
      missionId,
      status: this.state.missions[missionId].status
    };
  }

  /**
   * Registrar resultado de test
   */
  async recordTest(testId, testResult) {
    if (!this.initialized) {
      throw new Error('StateManager no inicializado');
    }

    this.state.tests[testId] = {
      ...testResult,
      recordedAt: new Date().toISOString(),
      testId
    };

    await this.saveState();
    
    return { success: true, testId };
  }

  /**
   * Actualizar progreso general
   */
  async updateProgress(component, progressData) {
    if (!this.initialized) {
      throw new Error('StateManager no inicializado');
    }

    this.state.progress[component] = {
      ...this.state.progress[component],
      ...progressData,
      updatedAt: new Date().toISOString()
    };

    await this.saveState();
    
    return { success: true, component };
  }

  /**
   * Obtener estado completo
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Obtener estado de una misión específica
   */
  getMission(missionId) {
    return this.state.missions[missionId] || null;
  }

  /**
   * Obtener todas las misiones
   */
  getAllMissions() {
    return { ...this.state.missions };
  }

  /**
   * Obtener tests
   */
  getTests() {
    return { ...this.state.tests };
  }

  /**
   * Obtener progreso
   */
  getProgress() {
    return { ...this.state.progress };
  }

  /**
   * Calcular total de entradas
   */
  calculateTotalEntries() {
    let total = 0;
    
    total += Object.keys(this.state.missions).length;
    total += Object.keys(this.state.tests).length;
    total += Object.keys(this.state.progress).length;
    total += Object.keys(this.state.templates).length;
    
    return total;
  }

  /**
   * Obtener estadísticas del sistema
   */
  getSystemStats() {
    return {
      totalMissions: Object.keys(this.state.missions).length,
      completedMissions: Object.values(this.state.missions).filter(m => m.status === 'COMPLETADA').length,
      totalTests: Object.keys(this.state.tests).length,
      passedTests: Object.values(this.state.tests).filter(t => t.success === true).length,
      totalProgress: Object.keys(this.state.progress).length,
      lastUpdate: this.state.meta.lastUpdated,
      systemHealth: this.state.meta.systemHealth
    };
  }

  /**
   * Limpiar tests antiguos (más de 30 días)
   */
  async cleanupOldTests(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let cleaned = 0;
    for (const [testId, test] of Object.entries(this.state.tests)) {
      const testDate = new Date(test.recordedAt);
      if (testDate < cutoffDate) {
        delete this.state.tests[testId];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveState();
      console.log(`🧹 Limpiados ${cleaned} tests antiguos`);
    }

    return { cleaned };
  }

  /**
   * Validar integridad del estado
   */
  validateState() {
    const issues = [];

    // Verificar estructura básica
    if (!this.state.project || !this.state.meta) {
      issues.push('Estructura básica incompleta');
    }

    // Verificar misiones
    for (const [missionId, mission] of Object.entries(this.state.missions)) {
      if (!mission.status || !mission.timestamp) {
        issues.push(`Misión ${missionId} incompleta`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      totalChecks: 1 + Object.keys(this.state.missions).length
    };
  }
}

// Crear instancia singleton
const stateManager = new StateManager();

export default stateManager;

// Funciones de utilidad para compatibilidad
export const initializeState = () => stateManager.initialize();
export const getState = () => stateManager.getState();
export const updateMission = (id, data) => stateManager.updateMission(id, data);
export const recordTest = (id, result) => stateManager.recordTest(id, result);
export const updateProgress = (component, data) => stateManager.updateProgress(component, data);
export const getSystemStats = () => stateManager.getSystemStats();