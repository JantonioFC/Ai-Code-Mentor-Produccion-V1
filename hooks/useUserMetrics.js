/**
 * Custom Hook: useUserMetrics
 * 
 * Maneja la lógica de negocio para obtener y gestionar las métricas
 * de usuario del sistema IRP con conexión a API integrada.
 * 
 * @author Mentor Coder
 * @version 2.1.0 (Integrado - Sin microservicio)
 * @created 2025-10-05
 * @updated 2025-12-07
 */

import { useState, useEffect, useCallback } from 'react';

// URL base del API IRP (ahora integrada en Next.js)
const IRP_BASE_URL = '/api/v1/irp';

/**
 * Hook principal para métricas de usuario
 * 
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de configuración
 * @param {string} options.period - Período: 'week' | 'month' | 'quarter' | 'year' | 'all'
 * @param {boolean} options.autoRefresh - Si debe refrescar automáticamente
 * @param {number} options.refreshInterval - Intervalo de refresco en ms (default: 300000 = 5min)
 * @param {string} options.token - Token JWT para autenticación (opcional)
 * @returns {Object} Estado y funciones de métricas
 */
export function useUserMetrics(userId, options = {}) {
  const {
    period = 'month',
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutos
    token = null
  } = options;

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Función para obtener métricas del backend
   */
  const fetchMetrics = useCallback(async () => {
    if (!userId) {
      setError(new Error('User ID es requerido'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construir URL con parámetros
      const params = new URLSearchParams({ period });
      const url = `${IRP_BASE_URL}/reviews/metrics/${userId}?${params}`;

      console.log('🔄 [useUserMetrics] Fetching metrics:', url);

      // Realizar petición al microservicio IRP
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        // Manejar códigos de error específicos
        if (response.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver estas métricas.');
        } else if (response.status === 404) {
          throw new Error('Usuario no encontrado.');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta de nuevo más tarde.');
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      console.log('✅ [useUserMetrics] Metrics loaded successfully:', data);

      setMetrics(data);
      setLastUpdated(new Date());
      setError(null); // ✅ Limpiar error cuando se cargan datos exitosamente
      setLoading(false);
    } catch (err) {
      console.error('❌ [useUserMetrics] Error fetching metrics:', err);

      // Manejar errores de red específicos
      if (err.name === 'AbortError') {
        setError(new Error('Timeout: La petición tardó demasiado.'));
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError(new Error('Error de conexión. Verifica tu conexión a internet.'));
      } else {
        setError(err);
      }

      setLoading(false);
    }
  }, [userId, period, token]);

  /**
   * Efecto para carga inicial y auto-refresh
   */
  useEffect(() => {
    fetchMetrics();

    // Configurar auto-refresh si está habilitado
    if (autoRefresh) {
      const intervalId = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchMetrics, autoRefresh, refreshInterval]);

  /**
   * Función para refrescar manualmente
   */
  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

/**
 * Hook para historial de revisiones
 * 
 * @param {Object} filters - Filtros de historial
 * @param {string} filters.role - 'author' | 'reviewer' | 'both'
 * @param {string} filters.status - 'pending' | 'completed' | 'all'
 * @param {number} filters.phase - Fase del proyecto
 * @param {string} filters.sortBy - 'date' | 'rating' | 'project'
 * @param {string} filters.sortOrder - 'asc' | 'desc'
 * @param {number} filters.limit - Número de resultados
 * @param {string} filters.token - Token JWT para autenticación (opcional)
 * @returns {Object} Estado y funciones de historial
 */
export function useReviewHistory(filters = {}) {
  const {
    role = 'both',
    status = 'all',
    phase = null,
    sortBy = 'date',
    sortOrder = 'desc',
    limit = 10,
    token = null
  } = filters;

  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Función para obtener historial del backend
   */
  const fetchHistory = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Construir URL con parámetros
      const params = new URLSearchParams({
        role,
        status,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (phase !== null) {
        params.append('phase', phase.toString());
      }

      const url = `${IRP_BASE_URL}/reviews/history?${params}`;

      console.log('🔄 [useReviewHistory] Fetching history:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver este historial.');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta de nuevo más tarde.');
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      console.log('✅ [useReviewHistory] History loaded successfully:', data);

      setHistory(data.reviews || []);
      setPagination(data.pagination || null);
      setError(null); // ✅ Limpiar error cuando se cargan datos exitosamente
      setLoading(false);
    } catch (err) {
      console.error('❌ [useReviewHistory] Error fetching history:', err);

      if (err.name === 'AbortError') {
        setError(new Error('Timeout: La petición tardó demasiado.'));
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError(new Error('Error de conexión. Verifica tu conexión a internet.'));
      } else {
        setError(err);
      }

      setLoading(false);
    }
  }, [role, status, phase, sortBy, sortOrder, limit, token]);

  /**
   * Efecto para carga inicial
   */
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /**
   * Función para cargar página siguiente
   */
  const loadNextPage = useCallback(() => {
    if (pagination && pagination.has_next) {
      fetchHistory(pagination.offset + pagination.limit);
    }
  }, [pagination, fetchHistory]);

  /**
   * Función para cargar página anterior
   */
  const loadPrevPage = useCallback(() => {
    if (pagination && pagination.has_prev) {
      fetchHistory(Math.max(0, pagination.offset - pagination.limit));
    }
  }, [pagination, fetchHistory]);

  /**
   * Función para refrescar
   */
  const refresh = useCallback(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  return {
    history,
    pagination,
    loading,
    error,
    loadNextPage,
    loadPrevPage,
    refresh
  };
}

/**
 * Hook para generar insights pedagógicos
 * 
 * @param {Object} metrics - Métricas del usuario
 * @returns {Array} Array de insights con tipo y mensaje
 */
export function useInsights(metrics) {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!metrics) {
      setInsights([]);
      return;
    }

    const generatedInsights = [];
    const { reviewer_metrics, author_metrics } = metrics;

    // Validar que existan las métricas
    if (!reviewer_metrics || !author_metrics) {
      setInsights([]);
      return;
    }

    // Insight 1: Quality Score
    if (reviewer_metrics.quality_score < 4.0) {
      generatedInsights.push({
        type: 'warning',
        category: 'quality',
        message: 'Tu quality score está por debajo de 4.0. Intenta dar feedback más específico y constructivo.',
        action: 'Revisa ejemplos de revisiones de alta calidad'
      });
    } else if (reviewer_metrics.quality_score >= 4.5) {
      generatedInsights.push({
        type: 'success',
        category: 'quality',
        message: '¡Excelente! Tu quality score es superior a 4.5. Sigue así.',
        action: null
      });
    }

    // Insight 2: Tiempo de revisión
    if (reviewer_metrics.average_review_time_hours > 3.0) {
      generatedInsights.push({
        type: 'info',
        category: 'efficiency',
        message: 'Tu tiempo promedio de revisión es alto (>3h). Considera usar plantillas para agilizar.',
        action: 'Optimiza tu proceso de revisión'
      });
    }

    // Insight 3: Puntualidad
    if (reviewer_metrics.punctuality_rate < 0.80) {
      generatedInsights.push({
        type: 'warning',
        category: 'punctuality',
        message: 'Tu tasa de puntualidad está por debajo del 80%. Intenta entregar revisiones a tiempo.',
        action: 'Gestiona mejor tu tiempo'
      });
    }

    // Insight 4: Mejora como autor
    if (author_metrics.improvement_trend === 'positive') {
      generatedInsights.push({
        type: 'success',
        category: 'improvement',
        message: '¡Felicitaciones! Estás mostrando mejora continua en tus proyectos.',
        action: null
      });
    } else if (author_metrics.improvement_trend === 'negative') {
      generatedInsights.push({
        type: 'warning',
        category: 'improvement',
        message: 'Tus calificaciones han bajado recientemente. Revisa el feedback recibido.',
        action: 'Implementa sugerencias de mejora'
      });
    }

    // Insight 5: Respuesta a feedback
    if (author_metrics.response_to_feedback_rate < 0.70) {
      generatedInsights.push({
        type: 'info',
        category: 'engagement',
        message: 'Responde a más del 70% del feedback que recibes para mostrar engagement.',
        action: 'Incrementa tu tasa de respuesta'
      });
    }

    setInsights(generatedInsights);
  }, [metrics]);

  return insights;
}

export default {
  useUserMetrics,
  useReviewHistory,
  useInsights
};
