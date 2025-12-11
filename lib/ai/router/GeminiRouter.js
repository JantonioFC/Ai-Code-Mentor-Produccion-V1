/**
 * Router de IA Google con Fallback Automático
 * Orquesta modelos Gemini con reintentos y cache
 * 
 * @module lib/ai/router/GeminiRouter
 */

import { GeminiProvider } from '../providers/GeminiProvider.js';
import { modelDiscovery } from '../discovery/ModelDiscovery.js';
import { logger } from '../../utils/logger.js';
import {
    handleAIError,
    AllModelsFailedError,
    getUserFriendlyMessage
} from '../../utils/errorHandler.js';

/**
 * Configuración de reintentos
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000
};

/**
 * Router principal de IA Google
 */
export class GeminiRouter {
    constructor() {
        this.providers = new Map();
        this.cache = new Map();
        this.cacheExpiryMs = 60 * 60 * 1000; // 1 hora
    }

    /**
     * Inicializar el router con modelos disponibles
     */
    async initialize() {
        const models = await modelDiscovery.discover();

        for (const model of models) {
            if (!this.providers.has(model.name)) {
                this.providers.set(model.name, new GeminiProvider(model.name));
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
        const { code, language, phase, userId } = request;

        // Verificar cache
        const cacheKey = this.generateCacheKey(code, language, phase);
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

        // Intentar con cada modelo
        for (const modelName of modelsToTry) {
            try {
                const result = await this.tryModel(modelName, request);

                // Éxito - guardar en cache y retornar
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
            severity: 'critical'
        });

        throw finalError;
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
            provider = new GeminiProvider(modelName);
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
    generateCacheKey(code, language, phase) {
        // Hash simple del código + parámetros
        const content = `${code}-${language}-${phase}`;
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
        return {
            loadedProviders: Array.from(this.providers.keys()),
            cacheSize: this.cache.size,
            cacheExpiryMs: this.cacheExpiryMs
        };
    }
}

// Exportar instancia singleton
export const geminiRouter = new GeminiRouter();
