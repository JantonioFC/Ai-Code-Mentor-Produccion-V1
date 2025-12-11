/**
 * Manejo de Errores para AI Code Mentor
 * Clases de error personalizadas y mensajes amigables al usuario
 * 
 * @module lib/utils/errorHandler
 */

/**
 * Error de proveedor de IA (genérico)
 */
export class AIProviderError extends Error {
    constructor(provider, originalError) {
        super(`Error en proveedor ${provider}: ${originalError.message}`);
        this.name = 'AIProviderError';
        this.provider = provider;
        this.originalError = originalError;
        this.severity = 'high';
        this.recoverable = true;
    }
}

/**
 * Error de límite de tasa alcanzado
 */
export class RateLimitError extends Error {
    constructor(provider, retryAfter = 60) {
        super(`Rate limit alcanzado en ${provider}. Reintenta en ${retryAfter}s`);
        this.name = 'RateLimitError';
        this.provider = provider;
        this.retryAfter = retryAfter;
        this.severity = 'medium';
        this.recoverable = true;
    }
}

/**
 * Error de respuesta inválida de la IA
 */
export class InvalidResponseError extends Error {
    constructor(provider, response) {
        super(`Respuesta inválida de ${provider}`);
        this.name = 'InvalidResponseError';
        this.provider = provider;
        this.response = response;
        this.severity = 'high';
        this.recoverable = true;
    }
}

/**
 * Error cuando todos los modelos fallaron
 */
export class AllModelsFailedError extends Error {
    constructor(attemptedModels, errors) {
        super('Todos los modelos de IA fallaron');
        this.name = 'AllModelsFailedError';
        this.attemptedModels = attemptedModels;
        this.errors = errors;
        this.severity = 'critical';
        this.recoverable = false;
    }
}

/**
 * Error de modelo no disponible
 */
export class ModelNotAvailableError extends Error {
    constructor(modelName, reason) {
        super(`Modelo ${modelName} no disponible: ${reason}`);
        this.name = 'ModelNotAvailableError';
        this.modelName = modelName;
        this.reason = reason;
        this.severity = 'medium';
        this.recoverable = true;
    }
}

/**
 * Manejador central de errores de IA
 * Clasifica errores y los convierte a clases apropiadas
 * 
 * @param {Error} error - Error original
 * @param {Object} context - Contexto del error
 * @returns {Error} - Error clasificado
 */
export function handleAIError(error, context = {}) {
    const errorMessage = error.message?.toLowerCase() || '';

    // Rate limit
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('quota')) {
        return new RateLimitError(context.provider || 'unknown', 60);
    }

    // Respuesta inválida
    if (errorMessage.includes('invalid') ||
        errorMessage.includes('parse') ||
        errorMessage.includes('json')) {
        return new InvalidResponseError(context.provider || 'unknown', context.response);
    }

    // Modelo no disponible
    if (errorMessage.includes('not found') ||
        errorMessage.includes('deprecated') ||
        errorMessage.includes('unavailable')) {
        return new ModelNotAvailableError(
            context.model || 'unknown',
            error.message
        );
    }

    // Todos los modelos fallaron
    if (context.attemptedModels && context.attemptedModels.length > 1) {
        return new AllModelsFailedError(
            context.attemptedModels,
            context.errors || [error]
        );
    }

    // Error genérico de proveedor
    return new AIProviderError(context.provider || 'unknown', error);
}

/**
 * Generar mensaje de error amigable para el usuario
 * 
 * @param {Error} error - Error a convertir
 * @returns {string} - Mensaje amigable
 */
export function getUserFriendlyMessage(error) {
    if (error instanceof RateLimitError) {
        return `Has alcanzado el límite de consultas temporalmente. Por favor espera ${error.retryAfter} segundos e intenta de nuevo.`;
    }

    if (error instanceof AllModelsFailedError) {
        return 'No pudimos procesar tu consulta en este momento. Por favor verifica tu conexión a internet e intenta nuevamente.';
    }

    if (error instanceof InvalidResponseError) {
        return 'La respuesta de la IA fue inesperada. Por favor intenta de nuevo.';
    }

    if (error instanceof ModelNotAvailableError) {
        return `El modelo de IA solicitado no está disponible actualmente. Intentando con alternativa...`;
    }

    if (error instanceof AIProviderError) {
        return 'Ocurrió un error al procesar tu consulta. Por favor intenta de nuevo en unos momentos.';
    }

    // Error genérico
    return 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
}

/**
 * Verificar si un error es recuperable
 * 
 * @param {Error} error - Error a verificar
 * @returns {boolean} - true si es recuperable
 */
export function isRecoverable(error) {
    return error.recoverable === true;
}

/**
 * Obtener severidad del error
 * 
 * @param {Error} error - Error a verificar
 * @returns {string} - 'low' | 'medium' | 'high' | 'critical'
 */
export function getSeverity(error) {
    return error.severity || 'unknown';
}
