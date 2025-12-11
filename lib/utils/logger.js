/**
 * Sistema de Logging para AI Code Mentor
 * Registra interacciones con IA, errores y métricas de uso
 * 
 * @module lib/utils/logger
 */

import fs from 'fs';
import path from 'path';

class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDir();
    }

    /**
     * Crear directorio de logs si no existe
     */
    ensureLogDir() {
        if (typeof window === 'undefined' && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Registrar una interacción exitosa con la IA
     * @param {Object} data - Datos de la interacción
     */
    logSuccess(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'success',
            model: data.model,
            phase: data.phase,
            language: data.language,
            tokensUsed: data.tokensUsed || 0,
            latency: data.latency,
            cacheHit: data.cacheHit || false
        };

        this.writeToFile('success.log', logEntry);
    }

    /**
     * Registrar un error
     * @param {Object} data - Datos del error
     */
    logError(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'error',
            model: data.model,
            errorMessage: data.error,
            attemptedModels: data.attemptedModels,
            severity: data.severity || 'unknown'
        };

        this.writeToFile('errors.log', logEntry);

        // En desarrollo, también loguear a consola
        if (process.env.NODE_ENV === 'development') {
            console.error('[AI Logger Error]', logEntry);
        }
    }

    /**
     * Escribir a archivo de forma asíncrona
     * @param {string} filename - Nombre del archivo de log
     * @param {Object} data - Datos a escribir
     */
    writeToFile(filename, data) {
        // Solo escribir a archivo en server-side
        if (typeof window !== 'undefined') {
            console.log(`[Logger] ${filename}:`, data);
            return;
        }

        const filepath = path.join(this.logDir, filename);
        const line = JSON.stringify(data) + '\n';

        fs.appendFile(filepath, line, (err) => {
            if (err) {
                console.error('Error escribiendo log:', err);
            }
        });
    }

    /**
     * Obtener últimos N logs de un archivo
     * @param {string} filename - Nombre del archivo
     * @param {number} count - Cantidad de logs a obtener
     * @returns {Promise<Array>} - Logs recientes
     */
    async getRecentLogs(filename, count = 50) {
        if (typeof window !== 'undefined') {
            return [];
        }

        const filepath = path.join(this.logDir, filename);

        if (!fs.existsSync(filepath)) {
            return [];
        }

        const content = fs.readFileSync(filepath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        const recentLines = lines.slice(-count);

        return recentLines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return { raw: line };
            }
        });
    }

    /**
     * Generar reporte de uso del último día
     * @returns {Promise<Object>} - Reporte con métricas
     */
    async getDailyReport() {
        const successLogs = await this.getRecentLogs('success.log', 1000);
        const errorLogs = await this.getRecentLogs('errors.log', 1000);

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        const recentSuccess = successLogs.filter(
            (log) => new Date(log.timestamp).getTime() > oneDayAgo
        );

        const recentErrors = errorLogs.filter(
            (log) => new Date(log.timestamp).getTime() > oneDayAgo
        );

        const totalRequests = recentSuccess.length + recentErrors.length;
        const successRate =
            totalRequests > 0
                ? ((recentSuccess.length / totalRequests) * 100).toFixed(2)
                : 0;

        const modelUsage = recentSuccess.reduce((acc, log) => {
            acc[log.model] = (acc[log.model] || 0) + 1;
            return acc;
        }, {});

        const avgLatency =
            recentSuccess.length > 0
                ? (
                    recentSuccess.reduce((sum, log) => sum + (log.latency || 0), 0) /
                    recentSuccess.length
                ).toFixed(0)
                : 0;

        return {
            period: '24 horas',
            totalRequests,
            successfulRequests: recentSuccess.length,
            failedRequests: recentErrors.length,
            successRate: `${successRate}%`,
            modelUsage,
            averageLatency: `${avgLatency}ms`,
            recentErrors: recentErrors.slice(-5).map((e) => ({
                timestamp: e.timestamp,
                model: e.model,
                error: e.errorMessage
            }))
        };
    }

    /**
     * Limpiar logs antiguos
     * @param {number} daysToKeep - Días a mantener
     */
    async cleanOldLogs(daysToKeep = 30) {
        // Implementación futura para limpieza automática
        console.log(`[Logger] Limpieza de logs > ${daysToKeep} días pendiente`);
    }
}

// Exportar instancia singleton
export const logger = new Logger();
