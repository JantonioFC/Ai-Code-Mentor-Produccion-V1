/**
 * Router de IA Google con Fallback Automático
 * Orquesta modelos Gemini con reintentos y cache
 * 
 * @module lib/ai/router/GeminiRouter
 */

import { ProviderFactory } from '../providers/ProviderFactory.js';
import { modelDiscovery } from '../discovery/ModelDiscovery.js';
import { logger } from '../../utils/logger.js';
import {
    handleAIError,
    AllModelsFailedError,
    getUserFriendlyMessage
} from '../../utils/errorHandler.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Configuración de Circuit Breaker
 */
const CIRCUIT_CONFIG = {
    failureThreshold: 3, // Número de fallos para abrir circuito
    resetTimeoutMs: 30000 // Tiempo de espera (30s) antes de reintentar
};

/**
 * Configuración de Reintentos con Backoff Exponencial
 */
const RETRY_CONFIG = {
    maxRetries: 3,     // Máximo 3 reintentos
    baseDelayMs: 1000,  // Delay base de 1 segundo
    maxDelayMs: 10000   // Delay máximo de 10 segundos
};

/**
 * Router principal de IA Google (Smart Router)
 */
export class GeminiRouter {
    constructor() {
        this.providers = new Map();
        this.cache = new Map();
        this.cacheExpiryMs = 60 * 60 * 1000; // 1 hora

        // Estado del Circuit Breaker por modelo
        this.circuitState = new Map(); // Map<modelName, { failures, nextTry, state }>
    }

    /**
     * Inicializar el router con modelos disponibles
     */
    async initialize() {
        const models = await modelDiscovery.discover();

        for (const model of models) {
            if (!this.providers.has(model.name)) {
                // Use Factory to create proper provider
                const provider = ProviderFactory.getProvider('gemini', { modelName: model.name });
                this.providers.set(model.name, provider);

                // Inicializar estado de circuito
                this.circuitState.set(model.name, {
                    failures: 0,
                    nextTry: 0,
                    state: 'CLOSED'
                });
            }
        }

        console.log(`[GeminiRouter] Inicializado con ${this.providers.size} modelos`);
        return models;
    }

    /**
     * Punto de entrada principal para análisis de código
     * @param {Object} request - Solicitud de análisis
     * @returns {Promise<Object>} - Resultado del análisis
     */
    async analyze(request) {
        const { code, language, phase, userId, messages } = request;

        // Verificar cache
        const cacheKey = this.generateCacheKey(code, language, phase, messages);
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
            console.log('[GeminiRouter] Respuesta obtenida de cache');
            logger.logSuccess({
                model: cachedResult.metadata.model,
                phase,
                language,
                latency: 0,
                cacheHit: true
            });
            return cachedResult;
        }

        // Obtener modelos disponibles ordenados por prioridad
        const models = await modelDiscovery.discover();
        const modelsToTry = models.map(m => m.name);
        const errors = [];
        let circuitBreakerTrippedFor = 0;

        // Intentar con cada modelo
        for (const modelName of modelsToTry) {
            // Verificar estado del Circuito
            const circuit = this.getCircuitState(modelName);
            const now = Date.now();

            if (circuit.state === 'OPEN') {
                if (now < circuit.nextTry) {
                    // Circuito abierto, saltar modelo (Fail Fast)
                    console.warn(`[GeminiRouter] Circuito ABIERTO para ${modelName}. Saltando...`);
                    circuitBreakerTrippedFor++;
                    continue;
                } else {
                    // Tiempo cumplido, probar (Half-Open)
                    console.log(`[GeminiRouter] Circuito HALF-OPEN para ${modelName}. Probando...`);
                    circuit.state = 'HALF-OPEN';
                }
            }

            try {
                const result = await this.tryModel(modelName, request);

                // Éxito - Cerrar circuito y guardar cache
                this.resetCircuit(modelName);
                this.setCache(cacheKey, result);

                logger.logSuccess({
                    model: modelName,
                    phase,
                    language,
                    tokensUsed: result.metadata.tokensUsed,
                    latency: result.metadata.latency,
                    cacheHit: false
                });

                return result;

            } catch (error) {
                console.warn(`[GeminiRouter] ${modelName} falló:`, error.message);
                errors.push({ model: modelName, error: error.message });

                // Registrar fallo en circuito
                this.recordFailure(modelName);

                // Continuar con siguiente modelo
                continue;
            }
        }

        // Todos los modelos fallaron
        const finalError = new AllModelsFailedError(modelsToTry, errors);

        logger.logError({
            model: modelsToTry.join(', '),
            error: finalError.message,
            attemptedModels: modelsToTry,
            severity: 'critical',
            circuitBreakers: circuitBreakerTrippedFor
        });

        throw finalError;
    }

    getCircuitState(modelName) {
        if (!this.circuitState.has(modelName)) {
            this.circuitState.set(modelName, { failures: 0, nextTry: 0, state: 'CLOSED' });
        }
        return this.circuitState.get(modelName);
    }

    recordFailure(modelName) {
        const circuit = this.getCircuitState(modelName);
        circuit.failures++;

        if (circuit.failures >= CIRCUIT_CONFIG.failureThreshold) {
            circuit.state = 'OPEN';
            circuit.nextTry = Date.now() + CIRCUIT_CONFIG.resetTimeoutMs;
            console.error(`💥 [GeminiRouter] Circuito ABIERTO para ${modelName} por ${CIRCUIT_CONFIG.resetTimeoutMs}ms`);
        }
    }

    resetCircuit(modelName) {
        const circuit = this.getCircuitState(modelName);
        if (circuit.failures > 0 || circuit.state !== 'CLOSED') {
            console.log(`✅ [GeminiRouter] Circuito CERRADO/Restaurado para ${modelName}`);
            circuit.failures = 0;
            circuit.state = 'CLOSED';
            circuit.nextTry = 0;
        }
    }

    /**
     * Intentar análisis con un modelo específico
     * @param {string} modelName - Nombre del modelo
     * @param {Object} request - Solicitud
     * @returns {Promise<Object>} - Resultado
     */
    async tryModel(modelName, request) {
        let provider = this.providers.get(modelName);

        if (!provider) {
            provider = ProviderFactory.getProvider('gemini', { modelName });
            this.providers.set(modelName, provider);
        }

        if (!provider.isAvailable()) {
            throw new Error(`Modelo ${modelName} no disponible (API key faltante)`);
        }

        // Ejecutar con reintentos
        return this.retryWithBackoff(
            () => provider.analyze(request),
            RETRY_CONFIG
        );
    }

    /**
     * Ejecutar función con reintentos y backoff exponencial
     * @param {Function} fn - Función a ejecutar
     * @param {Object} config - Configuración de reintentos
     * @returns {Promise<*>} - Resultado de la función
     */
    async retryWithBackoff(fn, config) {
        const { maxRetries, baseDelayMs, maxDelayMs } = config;
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // No reintentar errores de rate limit
                if (error.message?.includes('rate limit') || error.message?.includes('429')) {
                    throw error;
                }

                // Calcular delay con backoff exponencial + jitter
                const delay = Math.min(
                    baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
                    maxDelayMs
                );

                console.log(`[GeminiRouter] Reintento ${attempt + 1}/${maxRetries} en ${delay}ms`);
                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    /**
     * Dormir por un tiempo
     * @param {number} ms - Milisegundos
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generar clave de cache
     * @param {string} code - Código
     * @param {string} language - Lenguaje
     * @param {string} phase - Fase
     * @returns {string} - Clave de cache
     */
    generateCacheKey(code, language, phase, messages) {
        // Hash simple del código + parámetros + mensajes
        let content = `${code}-${language}-${phase}`;

        if (messages && messages.length > 0) {
            content += JSON.stringify(messages);
        }

        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `cache_${Math.abs(hash).toString(16)}`;
    }

    /**
     * Obtener del cache
     * @param {string} key - Clave
     * @returns {Object|null}
     */
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Verificar expiración
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Guardar en cache
     * @param {string} key - Clave
     * @param {Object} data - Datos
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.cacheExpiryMs
        });

        // Limpiar cache antiguo (máximo 100 entradas)
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Limpiar todo el cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[GeminiRouter] Cache limpiado');
    }

    /**
     * Obtener estadísticas del router
     * @returns {Object}
     */
    getStats() {
        // Mapear estado de circuitos para la UI/Logs
        const circuits = Object.fromEntries(
            Array.from(this.circuitState.entries()).map(([k, v]) => [k, v.state])
        );

        return {
            loadedProviders: Array.from(this.providers.keys()),
            cacheSize: this.cache.size,
            cacheExpiryMs: this.cacheExpiryMs,
            circuits
        };
    }
}

// Exportar instancia singleton
export const geminiRouter = new GeminiRouter();
