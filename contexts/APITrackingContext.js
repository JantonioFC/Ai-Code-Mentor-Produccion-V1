/**
 * API TRACKING CONTEXT - Sistema de Monitoreo de Llamadas Gemini
 * MISIÓN CRÍTICA: Control de Costos durante Testing Intensivo
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '../lib/auth/useAuth'; // Standard import

// Configuración de límites por modelo Gemini
const GEMINI_LIMITS = {
  'gemini-2.5-flash': {
    dailyLimit: 'Ilimitado',
    resetTime: 'Uso Comunitario Responsable',
    resetTimezone: 'local'
  },
  'gemini-2.5-pro': {
    dailyLimit: 'Prioritario',
    resetTime: 'Uso Comunitario Responsable',
    resetTimezone: 'local'
  },
  'gemini-1.5-flash': {
    dailyLimit: 'Ilimitado',
    resetTime: 'Uso Comunitario Responsable',
    resetTimezone: 'local'
  }
};

// Estados del sistema de tracking
const initialState = {
  // Contadores principales
  callsToday: 0,
  dailyLimit: 0, // No longer used for restriction
  remainingCalls: 9999, // Visual only placeholder

  // Configuración actual
  currentModel: 'gemini-2.5-flash',
  lastResetDate: null,

  // Tracking de sesión
  sessionCalls: 0,
  callHistory: [],

  // Estados de alerta (Ahora puramente informativos)
  alertLevel: 'safe',
  showWarning: false,

  // Tiempo y reseteo
  nextResetTime: null,
  timeUntilReset: null,
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
  if (!state) return initialState; // Defensive Coding

  switch (action.type) {
    case API_TRACKING_ACTIONS.RECORD_API_CALL:
      const newCallsToday = (state.callsToday || 0) + 1;
      const newSessionCalls = (state.sessionCalls || 0) + 1;

      const newCallHistory = [
        ...(state.callHistory || []).slice(-49),
        {
          timestamp: new Date().toISOString(),
          model: state.currentModel,
          operation: action.operation || 'generateIRP',
          success: action.success !== false,
          responseTime: action.responseTime || null
        }
      ];

      return {
        ...state,
        callsToday: newCallsToday,
        sessionCalls: newSessionCalls,
        callHistory: newCallHistory,
        lastCallTime: new Date().toISOString(),
        alertLevel: 'safe' // Always safe in Fair Use model
      };

    case API_TRACKING_ACTIONS.LOAD_PERSISTED_DATA:
      const safeData = action.data || {};
      return {
        ...state,
        callsToday: typeof safeData.callsToday === 'number' ? safeData.callsToday : (state.callsToday || 0),
        callHistory: Array.isArray(safeData.callHistory) ? safeData.callHistory : (state.callHistory || []),
        sessionCalls: 0
      };

    default:
      return state;
  }
}

// Context
const APITrackingContext = createContext();

// Provider Component
export function APITrackingProvider({ children }) {
  const [state, dispatch] = useReducer(apiTrackingReducer, initialState);

  const { isAuthenticated } = useAuth();

  // Fetch initial stats
  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      // Only fetch if authenticated to avoid 401 errors
      if (!isAuthenticated) return;

      try {
        const res = await fetch('/api/usage/stats');
        if (res.ok && mounted) {
          const data = await res.json();
          dispatch({
            type: API_TRACKING_ACTIONS.LOAD_PERSISTED_DATA,
            data: {
              callsToday: data.callsToday,
              callHistory: data.history
            }
          });
        }
      } catch (err) {
        console.error('Failed to load usage stats:', err);
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const recordAPICall = async (operation = 'generateIRP', success = true, responseTime = null) => {
    dispatch({
      type: API_TRACKING_ACTIONS.RECORD_API_CALL,
      operation,
      success,
      responseTime
    });

    try {
      await fetch('/api/usage/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.currentModel,
          operation,
          success,
          responseTime
        })
      });
    } catch (err) {
      console.error('Failed to sync API call:', err);
    }
  };

  const contextValue = {
    ...state,
    recordAPICall,
    updateModel: (model) => dispatch({ type: API_TRACKING_ACTIONS.UPDATE_MODEL, model }),
    dismissWarning: () => dispatch({ type: API_TRACKING_ACTIONS.DISMISS_WARNING }),
    getUsagePercentage: () => 0, // Always 0 usage in Fair Use UI
    isNearLimit: () => false,
    canMakeCall: () => true, // Always true!
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
