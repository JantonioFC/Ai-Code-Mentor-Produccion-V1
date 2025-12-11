/**
 * Sistema de Backups Automatizados para AI Code Mentor
 * Exporta datos locales y configuraciones para respaldo
 * 
 * @module lib/backup/BackupManager
 */

import { storage } from '../storage/StorageManager';

/**
 * Configuración de backups
 */
const BACKUP_CONFIG = {
    autoBackupEnabled: true,
    autoBackupIntervalDays: 7,
    maxBackupsToKeep: 5,
    backupPrefix: 'ai-code-mentor-backup'
};

/**
 * Manager de backups
 */
class BackupManager {
    constructor() {
        this.lastBackupKey = 'lastBackupTimestamp';
    }

    /**
     * Crear backup completo de datos locales
     * @returns {Promise<Object>} - Datos del backup
     */
    async createBackup() {
        console.log('[BackupManager] Iniciando backup...');

        try {
            // Inicializar storage si es necesario
            await storage.init();

            // Exportar todos los datos
            const exportedData = await storage.exportAll();

            // Crear objeto de backup
            const backup = {
                version: '1.0.0',
                createdAt: new Date().toISOString(),
                type: 'full',
                data: {
                    analyses: exportedData.analyses || [],
                    draft: exportedData.draft || null
                },
                metadata: {
                    analysisCount: exportedData.analyses?.length || 0,
                    hasDraft: !!exportedData.draft,
                    exportedAt: exportedData.exportedAt
                }
            };

            // Guardar timestamp del último backup
            await this.saveLastBackupTimestamp();

            console.log(`[BackupManager] Backup creado: ${backup.metadata.analysisCount} análisis`);

            return backup;

        } catch (error) {
            console.error('[BackupManager] Error creando backup:', error);
            throw error;
        }
    }

    /**
     * Descargar backup como archivo JSON
     * @returns {Promise<void>}
     */
    async downloadBackup() {
        const backup = await this.createBackup();

        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const filename = `${BACKUP_CONFIG.backupPrefix}-${Date.now()}.json`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log(`[BackupManager] Backup descargado: ${filename}`);
    }

    /**
     * Restaurar desde backup
     * @param {Object} backupData - Datos del backup
     * @returns {Promise<Object>} - Resultado de la restauración
     */
    async restoreFromBackup(backupData) {
        console.log('[BackupManager] Iniciando restauración...');

        try {
            // Validar formato del backup
            if (!backupData.version || !backupData.data) {
                throw new Error('Formato de backup inválido');
            }

            await storage.init();

            let restoredAnalyses = 0;
            let restoredDraft = false;

            // Restaurar análisis
            if (backupData.data.analyses && Array.isArray(backupData.data.analyses)) {
                for (const analysis of backupData.data.analyses) {
                    await storage.saveAnalysis(analysis);
                    restoredAnalyses++;
                }
            }

            // Restaurar borrador
            if (backupData.data.draft) {
                await storage.saveDraft(
                    backupData.data.draft.code,
                    backupData.data.draft.language
                );
                restoredDraft = true;
            }

            console.log(`[BackupManager] Restauración completada: ${restoredAnalyses} análisis`);

            return {
                success: true,
                restoredAnalyses,
                restoredDraft,
                backupVersion: backupData.version,
                backupDate: backupData.createdAt
            };

        } catch (error) {
            console.error('[BackupManager] Error restaurando backup:', error);
            throw error;
        }
    }

    /**
     * Restaurar desde archivo
     * @param {File} file - Archivo de backup
     * @returns {Promise<Object>}
     */
    async restoreFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    const result = await this.restoreFromBackup(backupData);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(file);
        });
    }

    /**
     * Verificar si es momento de hacer backup automático
     * @returns {Promise<boolean>}
     */
    async shouldAutoBackup() {
        if (!BACKUP_CONFIG.autoBackupEnabled) return false;
        if (typeof window === 'undefined') return false;

        try {
            const lastBackup = localStorage.getItem(this.lastBackupKey);

            if (!lastBackup) return true;

            const lastBackupDate = new Date(lastBackup);
            const daysSinceBackup = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24);

            return daysSinceBackup >= BACKUP_CONFIG.autoBackupIntervalDays;

        } catch {
            return false;
        }
    }

    /**
     * Guardar timestamp del último backup
     */
    async saveLastBackupTimestamp() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.lastBackupKey, new Date().toISOString());
        }
    }

    /**
     * Obtener información del último backup
     * @returns {Object|null}
     */
    getLastBackupInfo() {
        if (typeof window === 'undefined') return null;

        const lastBackup = localStorage.getItem(this.lastBackupKey);

        if (!lastBackup) {
            return { hasBackup: false };
        }

        const lastBackupDate = new Date(lastBackup);
        const daysSinceBackup = Math.floor(
            (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
            hasBackup: true,
            lastBackupDate: lastBackup,
            daysSinceBackup,
            needsBackup: daysSinceBackup >= BACKUP_CONFIG.autoBackupIntervalDays
        };
    }

    /**
     * Ejecutar backup automático si es necesario
     * @returns {Promise<Object|null>}
     */
    async runAutoBackupIfNeeded() {
        const shouldBackup = await this.shouldAutoBackup();

        if (shouldBackup) {
            console.log('[BackupManager] Ejecutando backup automático...');
            return this.createBackup();
        }

        return null;
    }
}

// Exportar instancia singleton
export const backupManager = new BackupManager();
