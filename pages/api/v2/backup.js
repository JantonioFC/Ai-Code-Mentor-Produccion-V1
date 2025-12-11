/**
 * API Endpoint para Backups del Sistema
 * Permite crear y descargar backups via API
 * 
 * @version 1.0.0
 */

import { logger } from '../../../lib/utils/logger';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        // Obtener información de backups
        return handleGetBackupInfo(req, res);
    }

    if (req.method === 'POST') {
        // Crear backup de datos del servidor
        return handleCreateServerBackup(req, res);
    }

    return res.status(405).json({ error: 'Método no permitido' });
}

/**
 * Obtener información de backups y logs recientes
 */
async function handleGetBackupInfo(req, res) {
    try {
        // Obtener reporte de uso
        const usageReport = await logger.getDailyReport();

        // Obtener logs recientes
        const recentSuccessLogs = await logger.getRecentLogs('success.log', 20);
        const recentErrorLogs = await logger.getRecentLogs('errors.log', 10);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            usage: usageReport,
            logs: {
                success: recentSuccessLogs,
                errors: recentErrorLogs
            },
            backup: {
                serverLogsAvailable: true,
                clientDataBackupVia: 'BackupManager (client-side)'
            }
        });

    } catch (error) {
        console.error('[Backup API] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Crear backup de logs del servidor
 */
async function handleCreateServerBackup(req, res) {
    try {
        const successLogs = await logger.getRecentLogs('success.log', 1000);
        const errorLogs = await logger.getRecentLogs('errors.log', 1000);

        const backup = {
            version: '1.0.0',
            type: 'server-logs',
            createdAt: new Date().toISOString(),
            data: {
                successLogs,
                errorLogs
            },
            metadata: {
                successLogCount: successLogs.length,
                errorLogCount: errorLogs.length
            }
        };

        res.json({
            success: true,
            backup
        });

    } catch (error) {
        console.error('[Backup API] Error creating backup:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
