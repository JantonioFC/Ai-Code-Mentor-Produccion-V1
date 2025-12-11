/**
 * GEMINI API WRAPPER - Interceptor Universal para Tracking de Uso
 * MISIÓN CRÍTICA: Monitoreo automático de todas las llamadas a Gemini API
 * 
 * Este módulo proporciona un wrapper universal que:
 * - Intercepta TODAS las llamadas a la API de Gemini en la aplicación
 * - Registra automáticamente el uso en el contador global
 * - Mantiene compatibilidad completa con el código existente
 * - Proporciona métricas de performance y error handling
 * 
 * @author Mentor Coder
 * @version 1.0.0 - Implementación Inicial
 * @fecha 2025-09-27
 */

// Configuración de límites por modelo Gemini (sincronizada con APITrackingContext)
const GEMINI_LIMITS = {
  'gemini-2.5-flash': {
    dailyLimit: 1500,
    resetTime: 'medianoche Pacific Time',
    resetTimezone: 'America/Los_Angeles'
  },
  'gemini-2.5-pro': {
    dailyLimit: 25,
    resetTime: 'medianoche Pacific Time', 
    resetTimezone: 'America/Los_Angeles'
  },
  'gemini-1.5-flash': {
    dailyLimit: 1500,
    resetTime: 'medianoche Pacific Time',
    resetTimezone: 'America/Los_Angeles'
  }
};

/**
 * WRAPPER UNIVERSAL PARA LLAMADAS A GEMINI API
 * 
 * Intercepta y registra automáticamente todas las llamadas a la API de Gemini,
 * manteniendo compatibilidad total con el código existente.
 * 
 * @param {string} url - URL de la API de Gemini
 * @param {object} fetchOptions - Opciones para fetch (method, headers, body)
 * @param {object} trackingOptions - Opciones adicionales para tracking
 * @returns {Promise<Response>} - Response de la API de Gemini
 */
async function geminiAPIWrapper(url, fetchOptions = {}, trackingOptions = {}) {
  const startTime = Date.now();
  const operation = trackingOptions.operation || extractOperationFromUrl(url);
  const model = extractModelFromUrl(url);
  
  console.log(`[GEMINI-WRAPPER] 🚀 Iniciando llamada a ${model} para operación: ${operation}`);
  
  try {
    // Verificar si estamos en el lado del servidor (tiene window definido significa cliente)
    if (typeof window !== 'undefined') {
      // LADO CLIENTE: Usar el hook de tracking
      const { recordAPICall, canMakeCall, remainingCalls } = window.__apiTrackingContext || {};
      
      if (recordAPICall && canMakeCall && remainingCalls !== undefined) {
        // Verificar límites antes de hacer la llamada
        if (!canMakeCall()) {
          const error = new Error(`API_LIMIT_EXCEEDED: No quedan llamadas disponibles (límite diario alcanzado)`);
          error.code = 'API_LIMIT_EXCEEDED';
          error.remainingCalls = remainingCalls;
          throw error;
        }
        
        console.log(`[GEMINI-WRAPPER] 📊 Llamadas restantes antes: ${remainingCalls}`);
      }
    }
    
    // Realizar la llamada a la API de Gemini
    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;
    
    console.log(`[GEMINI-WRAPPER] 📡 Respuesta recibida: ${response.status} ${response.statusText} en ${responseTime}ms`);
    
    // Registrar la llamada exitosa
    await recordAPICallSafely(operation, true, responseTime, model);
    
    return response;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`[GEMINI-WRAPPER] ❌ Error en llamada a ${model}: ${error.message} (${responseTime}ms)`);
    
    // Registrar la llamada fallida
    await recordAPICallSafely(operation, false, responseTime, model);
    
    // Re-throw el error para mantener compatibilidad
    throw error;
  }
}

/**
 * VERSIÓN PARA SERVIDOR - Sin dependencia del contexto React
 * 
 * Para uso en API routes y funciones del servidor donde no hay contexto React.
 * Utiliza localStorage/persistencia directa para el tracking.
 * 
 * @param {string} url - URL de la API de Gemini
 * @param {object} fetchOptions - Opciones para fetch
 * @param {object} trackingOptions - Opciones adicionales para tracking
 * @returns {Promise<Response>} - Response de la API de Gemini
 */
async function geminiAPIWrapperServer(url, fetchOptions = {}, trackingOptions = {}) {
  const startTime = Date.now();
  const operation = trackingOptions.operation || extractOperationFromUrl(url);
  const model = extractModelFromUrl(url);
  
  console.log(`[GEMINI-WRAPPER-SERVER] 🚀 Iniciando llamada servidor a ${model} para operación: ${operation}`);
  
  try {
    // Verificar límites usando persistencia directa
    const usageData = await getServerUsageData();
    
    if (!canMakeCallServer(usageData, model)) {
      const error = new Error(`API_LIMIT_EXCEEDED: No quedan llamadas disponibles para ${model} (límite diario: ${GEMINI_LIMITS[model]?.dailyLimit || 1500})`);
      error.code = 'API_LIMIT_EXCEEDED';
      error.remainingCalls = calculateRemainingCalls(usageData, model);
      throw error;
    }
    
    console.log(`[GEMINI-WRAPPER-SERVER] 📊 Llamadas restantes: ${calculateRemainingCalls(usageData, model)}`);
    
    // Realizar la llamada a la API de Gemini
    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;
    
    console.log(`[GEMINI-WRAPPER-SERVER] 📡 Respuesta recibida: ${response.status} ${response.statusText} en ${responseTime}ms`);
    
    // Registrar la llamada exitosa en persistencia del servidor
    await recordAPICallServer(operation, true, responseTime, model);
    
    return response;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`[GEMINI-WRAPPER-SERVER] ❌ Error en llamada a ${model}: ${error.message} (${responseTime}ms)`);
    
    // Registrar la llamada fallida
    await recordAPICallServer(operation, false, responseTime, model);
    
    // Re-throw el error para mantener compatibilidad
    throw error;
  }
}

/**
 * FUNCIONES AUXILIARES
 */

// Extraer operación desde la URL
function extractOperationFromUrl(url) {
  if (url.includes('generateContent')) return 'generateContent';
  if (url.includes('embedContent')) return 'embedContent';
  if (url.includes('countTokens')) return 'countTokens';
  return 'unknown';
}

// Extraer modelo desde la URL
function extractModelFromUrl(url) {
  const match = url.match(/models\/([^:\/]+)/);
  return match ? match[1] : 'unknown';
}

// Registrar llamada de forma segura (no romper si no hay contexto)
async function recordAPICallSafely(operation, success, responseTime, model) {
  try {
    if (typeof window !== 'undefined' && window.__apiTrackingContext) {
      const { recordAPICall } = window.__apiTrackingContext;
      if (recordAPICall) {
        recordAPICall(operation, success, responseTime);
        console.log(`[GEMINI-WRAPPER] ✅ Llamada registrada en contexto cliente`);
      }
    } else {
      // Fallback: intentar registrar en el servidor
      await recordAPICallServer(operation, success, responseTime, model);
    }
  } catch (error) {
    console.warn(`[GEMINI-WRAPPER] ⚠️ Error registrando llamada (no crítico): ${error.message}`);
  }
}

// Obtener datos de uso del servidor (persistencia)
async function getServerUsageData() {
  try {
    // En el servidor, usar variables de entorno o archivos temporales
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `gemini_usage_${today}`;
    
    // Intentar leer del cache en memoria (simple fallback)
    if (global.__geminiUsageCache && global.__geminiUsageCache[cacheKey]) {
      return global.__geminiUsageCache[cacheKey];
    }
    
    // Inicializar datos si no existen
    const defaultData = {
      date: today,
      totalCalls: 0,
      callsByModel: {},
      callHistory: []
    };
    
    // Cachear en memoria para esta sesión
    if (!global.__geminiUsageCache) {
      global.__geminiUsageCache = {};
    }
    global.__geminiUsageCache[cacheKey] = defaultData;
    
    return defaultData;
    
  } catch (error) {
    console.warn(`[GEMINI-WRAPPER-SERVER] ⚠️ Error obteniendo datos de uso: ${error.message}`);
    return {
      date: new Date().toISOString().split('T')[0],
      totalCalls: 0,
      callsByModel: {},
      callHistory: []
    };
  }
}

// Verificar si se puede hacer una llamada en el servidor
function canMakeCallServer(usageData, model) {
  const limit = GEMINI_LIMITS[model]?.dailyLimit || 1500;
  const currentUsage = usageData.callsByModel[model] || 0;
  return currentUsage < limit;
}

// Calcular llamadas restantes en el servidor
function calculateRemainingCalls(usageData, model) {
  const limit = GEMINI_LIMITS[model]?.dailyLimit || 1500;
  const currentUsage = usageData.callsByModel[model] || 0;
  return Math.max(0, limit - currentUsage);
}

// Registrar llamada en el servidor
async function recordAPICallServer(operation, success, responseTime, model) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `gemini_usage_${today}`;
    
    // Obtener datos actuales
    if (!global.__geminiUsageCache) {
      global.__geminiUsageCache = {};
    }
    
    if (!global.__geminiUsageCache[cacheKey]) {
      global.__geminiUsageCache[cacheKey] = {
        date: today,
        totalCalls: 0,
        callsByModel: {},
        callHistory: []
      };
    }
    
    const usageData = global.__geminiUsageCache[cacheKey];
    
    // Incrementar contadores
    usageData.totalCalls++;
    usageData.callsByModel[model] = (usageData.callsByModel[model] || 0) + 1;
    
    // Agregar al historial (mantener últimas 100)
    usageData.callHistory.push({
      timestamp: new Date().toISOString(),
      operation,
      success,
      responseTime,
      model
    });
    
    if (usageData.callHistory.length > 100) {
      usageData.callHistory = usageData.callHistory.slice(-100);
    }
    
    console.log(`[GEMINI-WRAPPER-SERVER] ✅ Llamada registrada: ${model} (${usageData.callsByModel[model]}/${GEMINI_LIMITS[model]?.dailyLimit || 1500})`);
    
  } catch (error) {
    console.warn(`[GEMINI-WRAPPER-SERVER] ⚠️ Error registrando llamada: ${error.message}`);
  }
}

/**
 * WRAPPER PARA RETROCOMPATIBILIDAD
 * 
 * Función que reemplaza directamente fetch para URLs de Gemini.
 * Detecta automáticamente si es una llamada a Gemini y aplica el wrapper.
 */
function createGeminiFetch() {
  const originalFetch = global.fetch || fetch;
  
  return async function wrappedFetch(url, options = {}) {
    // Detectar si es una llamada a Gemini
    if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
      // Usar el wrapper de Gemini
      if (typeof window !== 'undefined') {
        return geminiAPIWrapper(url, options);
      } else {
        return geminiAPIWrapperServer(url, options);
      }
    } else {
      // Llamada normal, usar fetch original
      return originalFetch(url, options);
    }
  };
}

/**
 * HOOK PARA INTEGRACIÓN CON REACT CONTEXT (LADO CLIENTE)
 */
function setupClientTracking(apiTrackingContext) {
  if (typeof window !== 'undefined') {
    window.__apiTrackingContext = apiTrackingContext;
    console.log('[GEMINI-WRAPPER] ✅ Contexto de tracking configurado en cliente');
  }
}

/**
 * EXPORTACIONES
 */
module.exports = {
  // Wrappers principales
  geminiAPIWrapper,
  geminiAPIWrapperServer,
  
  // Wrapper de fetch automático
  createGeminiFetch,
  
  // Utilidades
  setupClientTracking,
  extractModelFromUrl,
  extractOperationFromUrl,
  
  // Constantes
  GEMINI_LIMITS
};

// Para uso en ES modules
if (typeof exports !== 'undefined') {
  exports.geminiAPIWrapper = geminiAPIWrapper;
  exports.geminiAPIWrapperServer = geminiAPIWrapperServer;
  exports.createGeminiFetch = createGeminiFetch;
  exports.setupClientTracking = setupClientTracking;
  exports.GEMINI_LIMITS = GEMINI_LIMITS;
}
