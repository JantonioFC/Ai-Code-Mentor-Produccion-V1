/**
 * API TRACKING CONTEXT - Sistema de Monitoreo de Llamadas Gemini
 * MISIÓN CRÍTICA: Control de Costos durante Testing Intensivo
 * 
 * Este context proporciona tracking en tiempo real de:
 * - Llamadas API realizadas vs límite diario
 * - Tiempo restante hasta el reseteo (medianoche Pacific Time)
 * - Estado de alerta cuando se acerca al límite
 * - Historial de llamadas por sesión
 * 
 * @author Mentor Coder
 * @version 1.0.0 - Implementación Inicial
 * @fecha 2025-09-27
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Configuración de límites por modelo Gemini
const GEMINI_LIMITS = {
  'gemini-2.5-flash': {
    dailyLimit: 1500,
    resetTime: 'medianoche hora local',
    resetTimezone: 'local'
  },
  'gemini-2.5-pro': {
    dailyLimit: 25,
    resetTime: 'medianoche hora local',
    resetTimezone: 'local'
  },
  'gemini-1.5-flash': {
    dailyLimit: 1500,
    resetTime: 'medianoche hora local',
    resetTimezone: 'local'
  }
};

// Estados del sistema de tracking
const initialState = {
  // Contadores principales
  callsToday: 0,
  dailyLimit: 1500, // Por defecto gemini-2.5-flash
  remainingCalls: 1500,

  // Configuración actual
  currentModel: 'gemini-2.5-flash',
  lastResetDate: null,

  // Tracking de sesión
  sessionCalls: 0,
  callHistory: [],

  // Estados de alerta
  alertLevel: 'safe', // 'safe', 'warning', 'critical', 'exhausted'
  showWarning: false,

  // Tiempo y reseteo
  nextResetTime: null,
  timeUntilReset: null,

  // Estado del sistema
  isTracking: true,
  lastCallTime: null,

  // Métricas adicionales
  averageCallsPerHour: 0,
  estimatedExhaustionTime: null
};

// Actions para el reducer
const API_TRACKING_ACTIONS = {
  INITIALIZE: 'INITIALIZE',
  RECORD_API_CALL: 'RECORD_API_CALL',
  UPDATE_MODEL: 'UPDATE_MODEL',
  RESET_DAILY_COUNTER: 'RESET_DAILY_COUNTER',
  UPDATE_TIME_METRICS: 'UPDATE_TIME_METRICS',
  SET_ALERT_LEVEL: 'SET_ALERT_LEVEL',
  DISMISS_WARNING: 'DISMISS_WARNING',
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA'
};

// Reducer para gestionar el estado
function apiTrackingReducer(state, action) {
  switch (action.type) {
    case API_TRACKING_ACTIONS.INITIALIZE:
      return {
        ...state,
        currentModel: action.model,
        dailyLimit: GEMINI_LIMITS[action.model]?.dailyLimit || 1500,
        remainingCalls: (GEMINI_LIMITS[action.model]?.dailyLimit || 1500) - state.callsToday
      };

    case API_TRACKING_ACTIONS.RECORD_API_CALL:
      const newCallsToday = state.callsToday + 1;
      const newSessionCalls = state.sessionCalls + 1;
      const newRemainingCalls = state.dailyLimit - newCallsToday;

      const newCallHistory = [
        ...state.callHistory.slice(-49), // Mantener últimas 50 llamadas
        {
          timestamp: new Date().toISOString(),
          model: state.currentModel,
          operation: action.operation || 'generateIRP',
          success: action.success !== false,
          responseTime: action.responseTime || null
        }
      ];

      const newAlertLevel = calculateAlertLevel(newRemainingCalls, state.dailyLimit);

      return {
        ...state,
        callsToday: newCallsToday,
        sessionCalls: newSessionCalls,
        remainingCalls: newRemainingCalls,
        callHistory: newCallHistory,
        lastCallTime: new Date().toISOString(),
        alertLevel: newAlertLevel,
        showWarning: newAlertLevel !== 'safe' && state.alertLevel === 'safe'
      };

    case API_TRACKING_ACTIONS.UPDATE_MODEL:
      const newLimit = GEMINI_LIMITS[action.model]?.dailyLimit || 1500;
      return {
        ...state,
        currentModel: action.model,
        dailyLimit: newLimit,
        remainingCalls: newLimit - state.callsToday
      };

    case API_TRACKING_ACTIONS.RESET_DAILY_COUNTER:
      return {
        ...state,
        callsToday: 0,
        remainingCalls: state.dailyLimit,
        lastResetDate: new Date().toISOString(),
        alertLevel: 'safe',
        showWarning: false,
        callHistory: state.callHistory.filter(call => {
          const callDate = new Date(call.timestamp);
          const resetDate = new Date();
          return callDate.toDateString() === resetDate.toDateString();
        })
      };

    case API_TRACKING_ACTIONS.UPDATE_TIME_METRICS:
      return {
        ...state,
        nextResetTime: action.nextResetTime,
        timeUntilReset: action.timeUntilReset,
        averageCallsPerHour: action.averageCallsPerHour,
        estimatedExhaustionTime: action.estimatedExhaustionTime
      };

    case API_TRACKING_ACTIONS.SET_ALERT_LEVEL:
      return {
        ...state,
        alertLevel: action.level,
        showWarning: action.showWarning !== undefined ? action.showWarning : state.showWarning
      };

    case API_TRACKING_ACTIONS.DISMISS_WARNING:
      return {
        ...state,
        showWarning: false
      };

    case API_TRACKING_ACTIONS.LOAD_PERSISTED_DATA:
      return {
        ...state,
        ...action.data,
        sessionCalls: 0 // Reset session calls al cargar
      };

    default:
      return state;
  }
}

// Funciones auxiliares
function calculateAlertLevel(remainingCalls, dailyLimit) {
  const usagePercentage = ((dailyLimit - remainingCalls) / dailyLimit) * 100;

  if (remainingCalls <= 0) return 'exhausted';
  if (usagePercentage >= 90) return 'critical';
  if (usagePercentage >= 75) return 'warning';
  return 'safe';
}

function calculateNextResetTime() {
  const now = new Date();

  // Calcular medianoche local del próximo día (00:00 hora local)
  const nextReset = new Date(now);
  nextReset.setDate(nextReset.getDate() + 1);
  nextReset.setHours(0, 0, 0, 0);

  return nextReset;
}

function formatTimeUntilReset(resetTime) {
  const now = new Date();
  const diff = resetTime - now;

  if (diff <= 0) return "Reseteando...";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Context
const APITrackingContext = createContext();

// Provider Component
export function APITrackingProvider({ children }) {
  const [state, dispatch] = useReducer(apiTrackingReducer, initialState);

  // Inicializar con modelo de las variables de entorno
  useEffect(() => {
    const initializeTracking = () => {
      // Cargar datos persistidos con manejo defensivo
      try {
        const savedData = localStorage.getItem('api-tracking-data');
        if (savedData && savedData.trim() !== '') {
          // Manejo defensivo: validar formato antes de parsear
          let parsed;
          try {
            parsed = JSON.parse(savedData);
          } catch (parseError) {
            console.warn('[API-TRACKING] Datos corruptos en localStorage, reseteando:', parseError.message);
            localStorage.removeItem('api-tracking-data');
            dispatch({ type: API_TRACKING_ACTIONS.RESET_DAILY_COUNTER });
            return;
          }

          // Verificar si necesita reset diario (basado en fecha local)
          const lastReset = new Date(parsed.lastResetDate || 0);
          const now = new Date();

          // Comparar solo la fecha local (ignorando hora)
          if (lastReset.toLocaleDateString() !== now.toLocaleDateString()) {
            // Necesita reset
            dispatch({ type: API_TRACKING_ACTIONS.RESET_DAILY_COUNTER });
          } else {
            // Cargar datos existentes
            dispatch({ type: API_TRACKING_ACTIONS.LOAD_PERSISTED_DATA, data: parsed });
          }
        }
      } catch (error) {
        console.warn('[API-TRACKING] Error cargando datos persistidos:', error);
      }

      // Detectar modelo actual desde variables de entorno (cliente side)
      const currentModel = process.env.NEXT_PUBLIC_GEMINI_MODEL_NAME || 'gemini-2.5-flash';
      dispatch({ type: API_TRACKING_ACTIONS.INITIALIZE, model: currentModel });
    };

    initializeTracking();
  }, []);

  // Actualizar métricas de tiempo cada minuto
  useEffect(() => {
    const updateTimeMetrics = () => {
      const nextResetTime = calculateNextResetTime();
      const timeUntilReset = formatTimeUntilReset(nextResetTime);

      // Calcular promedio de llamadas por hora (últimas 24h)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentCalls = state.callHistory.filter(call =>
        new Date(call.timestamp) > oneDayAgo
      );
      const averageCallsPerHour = recentCalls.length / 24;

      // Estimar tiempo de agotamiento
      let estimatedExhaustionTime = null;
      if (averageCallsPerHour > 0 && state.remainingCalls > 0) {
        const hoursToExhaustion = state.remainingCalls / averageCallsPerHour;
        estimatedExhaustionTime = new Date(now.getTime() + hoursToExhaustion * 60 * 60 * 1000);
      }

      dispatch({
        type: API_TRACKING_ACTIONS.UPDATE_TIME_METRICS,
        nextResetTime: nextResetTime.toISOString(),
        timeUntilReset,
        averageCallsPerHour: Math.round(averageCallsPerHour * 10) / 10,
        estimatedExhaustionTime: estimatedExhaustionTime?.toISOString() || null
      });
    };

    updateTimeMetrics();
    const interval = setInterval(updateTimeMetrics, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [state.callHistory, state.remainingCalls]);

  // Persistir datos en localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        callsToday: state.callsToday,
        lastResetDate: state.lastResetDate,
        callHistory: state.callHistory,
        currentModel: state.currentModel
      };
      localStorage.setItem('api-tracking-data', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('[API-TRACKING] Error guardando datos:', error);
    }
  }, [state.callsToday, state.lastResetDate, state.callHistory, state.currentModel]);

  // Métodos del context
  const recordAPICall = (operation = 'generateIRP', success = true, responseTime = null) => {
    dispatch({
      type: API_TRACKING_ACTIONS.RECORD_API_CALL,
      operation,
      success,
      responseTime
    });
  };

  const updateModel = (newModel) => {
    dispatch({ type: API_TRACKING_ACTIONS.UPDATE_MODEL, model: newModel });
  };

  const dismissWarning = () => {
    dispatch({ type: API_TRACKING_ACTIONS.DISMISS_WARNING });
  };

  const resetDailyCounter = () => {
    dispatch({ type: API_TRACKING_ACTIONS.RESET_DAILY_COUNTER });
  };

  const contextValue = {
    // Estado
    ...state,

    // Métodos
    recordAPICall,
    updateModel,
    dismissWarning,
    resetDailyCounter,

    // Utilidades
    getUsagePercentage: () => ((state.dailyLimit - state.remainingCalls) / state.dailyLimit) * 100,
    isNearLimit: () => state.remainingCalls <= Math.max(10, state.dailyLimit * 0.1),
    canMakeCall: () => state.remainingCalls > 0,

    // Configuración del modelo actual
    currentModelConfig: GEMINI_LIMITS[state.currentModel] || GEMINI_LIMITS['gemini-2.5-flash']
  };

  return (
    <APITrackingContext.Provider value={contextValue}>
      {children}
    </APITrackingContext.Provider>
  );
}

// Hook personalizado
export function useAPITracking() {
  const context = useContext(APITrackingContext);

  if (!context) {
    throw new Error('useAPITracking debe ser usado dentro de un APITrackingProvider');
  }

  return context;
}

export default APITrackingContext;
