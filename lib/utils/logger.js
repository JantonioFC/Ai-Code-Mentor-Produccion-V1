/**
 * Sistema de Logging para AI Code Mentor
 * Registra interacciones con IA, errores y métricas de uso
 * 
 * @module lib/utils/logger
 */

// Módulos nativos (solo carga en servidor)
let fs = null;
let path = null;

if (typeof window === 'undefined') {
    fs = require('fs');
    path = require('path');
}

class Logger {
    constructor() {
        if (typeof window === 'undefined' && path) {
            try {
                // process.cwd() is only available in Node.js, not Edge Runtime
                this.rootPath = typeof process.cwd === 'function' ? process.cwd() : '/';
                this.logDir = path.join(this.rootPath, 'logs');
                this.ensureLogDir();
            } catch (e) {
                console.warn('[Logger] Could not initialize log directory (possibly non-Node environment):', e.message);
            }
        }
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
     * Registrar mensaje informativo
     * @param {string} message - Mensaje
     * @param {Object} context - Datos adicionales
     */
    info(message, context = {}) {
        this.log('info', message, context);
    }

    /**
     * Registrar advertencia
     * @param {string} message - Mensaje
     * @param {Object} context - Datos adicionales
     */
    warn(message, context = {}) {
        this.log('warn', message, context);
    }

    /**
     * Registrar error
     * @param {string} message - Mensaje
     * @param {Object} error - Objeto de error o contexto
     */
    error(message, error = {}) {
        const errorData = error instanceof Error
            ? { message: error.message, stack: error.stack, ...error }
            : error;

        this.log('error', message, errorData);
    }

    /**
     * Método interno de logging genérico
     */
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...data
        };

        // En desarrollo, también loguear a consola con colores
        if (process.env.NODE_ENV !== 'production') {
            const prefix = `[${level.toUpperCase()}]`;
            if (level === 'error') console.error(prefix, message, data);
            else if (level === 'warn') console.warn(prefix, message, data);
            else console.log(prefix, message, data);
        }

        this.writeToFile(`${level}.log`, logEntry);
    }

    /**
     * Registrar una interacción exitosa con la IA
     * @param {Object} data - Datos de la interacción
     */
    logSuccess(data) {
        this.info('AI Interaction Success', {
            type: 'ai_success',
            ...data
        });
    }

    /**
     * Registrar un error (legacy wrapper)
     * @param {Object} data - Datos del error
     */
    logError(data) {
        this.error(data.error || 'Unknown Error', {
            type: 'ai_error',
            ...data
        });
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
const logger = new Logger();

// Niveles de log para uso externo
const LogLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug'
};

module.exports = {
    logger,
    LogLevel
};
