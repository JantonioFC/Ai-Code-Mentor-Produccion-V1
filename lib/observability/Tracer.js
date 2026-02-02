/**
 * Tracer - Sistema de trazabilidad de requests
 * Permite debugging y análisis de rendimiento.
 */
import { v4 as uuidv4 } from 'uuid';

export class Tracer {
    constructor() {
        this.activeSpans = new Map();
        this.completedSpans = [];
        this.maxCompletedSpans = 1000;
    }

    /**
     * Inicia un nuevo span de trazabilidad.
     * @param {string} name - Nombre del span
     * @param {Object} metadata - Metadata inicial
     * @returns {string} spanId
     */
    startSpan(name, metadata = {}) {
        const spanId = uuidv4();
        const span = {
            id: spanId,
            name,
            startTime: Date.now(),
            metadata,
            events: [],
            children: []
        };

        this.activeSpans.set(spanId, span);
        console.log(`[Tracer] Started span: ${name} (${spanId.substring(0, 8)})`);

        return spanId;
    }

    /**
     * Añade un evento al span.
     * @param {string} spanId 
     * @param {string} event 
     * @param {Object} data 
     */
    addEvent(spanId, event, data = {}) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.events.push({
                event,
                timestamp: Date.now(),
                data
            });
        }
    }

    /**
     * Finaliza un span.
     * @param {string} spanId 
     * @param {Object} result - Resultado o error
     * @returns {Object} Span completado
     */
    endSpan(spanId, result = {}) {
        const span = this.activeSpans.get(spanId);
        if (!span) {
            console.warn(`[Tracer] Span not found: ${spanId}`);
            return null;
        }

        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.result = result;

        this.activeSpans.delete(spanId);
        this.completedSpans.push(span);

        // Mantener límite de spans guardados
        if (this.completedSpans.length > this.maxCompletedSpans) {
            this.completedSpans.shift();
        }

        console.log(`[Tracer] Ended span: ${span.name} (${span.duration}ms)`);

        return span;
    }

    /**
     * Crea un wrapper para funciones que las trace automáticamente.
     * @param {string} name 
     * @param {Function} fn 
     * @returns {Function}
     */
    trace(name, fn) {
        const tracer = this;
        return async function (...args) {
            const spanId = tracer.startSpan(name, { argsCount: args.length });
            try {
                const result = await fn.apply(this, args);
                tracer.endSpan(spanId, { success: true });
                return result;
            } catch (error) {
                tracer.endSpan(spanId, { success: false, error: error.message });
                throw error;
            }
        };
    }

    /**
     * Obtiene spans recientes.
     * @param {number} limit 
     * @returns {Array}
     */
    getRecentSpans(limit = 50) {
        return this.completedSpans.slice(-limit).reverse();
    }

    /**
     * Obtiene estadísticas de spans por nombre.
     * @returns {Object}
     */
    getStats() {
        const statsByName = {};

        for (const span of this.completedSpans) {
            if (!statsByName[span.name]) {
                statsByName[span.name] = {
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0,
                    errors: 0
                };
            }

            statsByName[span.name].count++;
            statsByName[span.name].totalDuration += span.duration || 0;
            if (span.result?.success === false) {
                statsByName[span.name].errors++;
            }
        }

        // Calcular promedios
        for (const name in statsByName) {
            statsByName[name].avgDuration = Math.round(
                statsByName[name].totalDuration / statsByName[name].count
            );
        }

        return statsByName;
    }

    /**
     * Limpia todos los spans.
     */
    clear() {
        this.activeSpans.clear();
        this.completedSpans = [];
    }
}

// Exportar singleton
export const tracer = new Tracer();
