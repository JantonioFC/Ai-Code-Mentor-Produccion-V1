/**
 * API USAGE COUNTER - Componente Visual de Monitoreo
 * MISIÓN CRÍTICA: Visualización en Tiempo Real del Consumo de API
 * 
 * Componente que muestra:
 * - Contador visual de llamadas restantes
 * - Tiempo hasta el próximo reseteo
 * - Alertas de proximidad al límite
 * - Estado actual del modelo Gemini
 * 
 * @author Mentor Coder
 * @version 1.0.0 - Implementación Inicial
 * @fecha 2025-09-27
 */

import React, { useState } from 'react';
import { useAPITracking } from '../contexts/APITrackingContext';

const APIUsageCounter = ({ position = 'top-right', expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showDetails, setShowDetails] = useState(false);

  const {
    remainingCalls,
    dailyLimit,
    callsToday,
    sessionCalls,
    timeUntilReset,
    currentModel,
    alertLevel,
    showWarning,
    dismissWarning,
    getUsagePercentage,
    isNearLimit,
    canMakeCall,
    callHistory,
    averageCallsPerHour,
    estimatedExhaustionTime
  } = useAPITracking();

  // Configuración de estilos según el nivel de alerta
  const getAlertStyles = () => {
    switch (alertLevel) {
      case 'exhausted':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          border: 'border-red-500',
          pulse: 'animate-pulse',
          icon: '🚫'
        };
      case 'critical':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          border: 'border-orange-400',
          pulse: 'animate-pulse',
          icon: '⚠️'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          text: 'text-gray-900',
          border: 'border-yellow-400',
          pulse: '',
          icon: '⚡'
        };
      default:
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-400',
          pulse: '',
          icon: '✅'
        };
    }
  };

  const alertStyles = getAlertStyles();
  const usagePercentage = getUsagePercentage();

  // Posicionamiento del componente
  const getPositionClasses = () => {
    // Modo sidebar: sin posición fixed, se integra en el flujo del documento
    if (position === 'sidebar') {
      return 'relative z-10';
    }

    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  // Formatear tiempo estimado de agotamiento
  const formatEstimatedExhaustion = () => {
    if (!estimatedExhaustionTime || alertLevel === 'exhausted') return null;

    const now = new Date();
    const exhaustion = new Date(estimatedExhaustionTime);
    const diff = exhaustion - now;

    if (diff <= 0) return "Próximamente";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `~${days}d`;
    } else if (hours > 0) {
      return `~${hours}h`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `~${minutes}m`;
    }
  };

  // Componente compacto (minimizado)
  const CompactView = () => (
    <div
      className={`
        ${getPositionClasses()}
        ${alertStyles.bg} ${alertStyles.text} ${alertStyles.pulse}
        rounded-lg shadow-lg border-2 ${alertStyles.border}
        px-3 py-2 cursor-pointer transition-all duration-300
        hover:scale-105 hover:shadow-xl
        backdrop-blur-sm bg-opacity-95
      `}
      onClick={() => setIsExpanded(true)}
      title={`${remainingCalls} llamadas restantes • Reset en ${timeUntilReset}`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{alertStyles.icon}</span>
        <div className="flex flex-col">
          <div className="font-bold text-sm leading-tight">
            {remainingCalls.toLocaleString()}
          </div>
          <div className="text-xs opacity-90 leading-tight">
            / {dailyLimit.toLocaleString()}
          </div>
        </div>
        <div className="hidden sm:block text-xs opacity-90">
          {timeUntilReset}
        </div>
      </div>
    </div>
  );

  // Componente expandido (detallado)
  const ExpandedView = () => (
    <div
      className={`
        ${getPositionClasses()}
        bg-white dark:bg-gray-800 
        rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
        p-4 min-w-[320px] max-w-[400px]
        backdrop-blur-sm bg-opacity-95
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{alertStyles.icon}</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            API Usage Monitor
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Minimizar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Barra de progreso principal */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Llamadas Restantes
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {remainingCalls.toLocaleString()} / {dailyLimit.toLocaleString()}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${alertLevel === 'exhausted' ? 'bg-red-500' :
                alertLevel === 'critical' ? 'bg-orange-500' :
                  alertLevel === 'warning' ? 'bg-yellow-500' :
                    'bg-green-500'
              }`}
            style={{ width: `${Math.max(0, 100 - usagePercentage)}%` }}
          />
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {usagePercentage.toFixed(1)}% usado • {callsToday} llamadas hoy • {sessionCalls} en sesión
        </div>
      </div>

      {/* Información del modelo */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Modelo Activo
          </span>
          <span className="text-sm font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            {currentModel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Reset:</span> {timeUntilReset}
          </div>
          <div>
            <span className="font-medium">Promedio:</span> {averageCallsPerHour.toFixed(1)}/h
          </div>
        </div>

        {formatEstimatedExhaustion() && (
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            ⏱️ Agotamiento estimado: {formatEstimatedExhaustion()}
          </div>
        )}
      </div>

      {/* Acciones y detalles */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </button>

        <div className="flex space-x-1">
          {!canMakeCall() && (
            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
              Límite alcanzado
            </span>
          )}
          {isNearLimit() && canMakeCall() && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              Cerca del límite
            </span>
          )}
        </div>
      </div>

      {/* Panel de detalles expandible */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Historial Reciente
          </h4>

          <div className="max-h-32 overflow-y-auto space-y-1">
            {callHistory.slice(-5).reverse().map((call, index) => (
              <div key={index} className="text-xs bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {call.operation} {call.success ? '✅' : '❌'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {call.responseTime && (
                  <div className="text-gray-500 dark:text-gray-400 mt-1">
                    Tiempo: {call.responseTime}ms
                  </div>
                )}
              </div>
            ))}
          </div>

          {callHistory.length === 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              No hay llamadas registradas
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Warning modal
  const WarningModal = () => {
    if (!showWarning) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advertencia de Uso de API
            </h3>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {alertLevel === 'critical' ?
              `Solo quedan ${remainingCalls} llamadas de tu límite diario de ${dailyLimit}.` :
              `Has usado el ${usagePercentage.toFixed(0)}% de tu límite diario.`
            }
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Reset en: {timeUntilReset} • Modelo: {currentModel}
          </p>

          <div className="flex space-x-3">
            <button
              onClick={dismissWarning}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isExpanded ? <ExpandedView /> : <CompactView />}
      <WarningModal />
    </>
  );
};

export default APIUsageCounter;
