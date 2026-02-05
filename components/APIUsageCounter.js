/**
 * API USAGE COUNTER - Componente Visual de Monitoreo
 * Refactored Round 3: Radix UI Dialog & Stitch Design
 */

import React, { useState, useEffect } from 'react';
import { useAPITracking } from '../contexts/APITrackingContext';
import * as Dialog from '@radix-ui/react-dialog';

// Fix for Radix UI Import (NEXT.js / Bundler Issue)
// Deconstruct manually if needed, or use named imports if available.
// NOTE: Radix primitives usually export named components. 
// Using named imports to avoid "Root is not a function" error.
import {
  Root as DialogRoot,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  Close as DialogClose
} from '@radix-ui/react-dialog';

const APIUsageCounter = ({ position = 'top-right', expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    callHistory
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

  const getPositionClasses = () => {
    if (position === 'sidebar') return 'relative z-10';
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left': return `${baseClasses} top-4 left-4`;
      case 'top-right': return `${baseClasses} top-4 right-4`;
      case 'bottom-left': return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right': return `${baseClasses} bottom-4 right-4`;
      default: return `${baseClasses} top-4 right-4`;
    }
  };

  // Compact View
  const CompactView = () => (
    <div
      className={`
        ${getPositionClasses()}
        bg-blue-600 text-white
        rounded-lg shadow-lg border-2 border-blue-400
        px-3 py-2 cursor-pointer transition-all duration-300
        hover:scale-105 hover:shadow-xl
        backdrop-blur-sm bg-opacity-95
      `}
      onClick={() => setIsExpanded(true)}
      title={`Modelo: ${currentModel} • Uso Comunitario Responsable`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">💎</span>
        <div className="flex flex-col">
          <div className="font-bold text-sm leading-tight">
            Fair Use
          </div>
          <div className="text-xs opacity-90 leading-tight text-blue-100">
            {currentModel.split('-').pop().toUpperCase()} Optimized
          </div>
        </div>
      </div>
    </div>
  );

  // Expanded View
  const ExpandedView = () => (
    <div
      className={`
        ${getPositionClasses()}
        glass-panel bg-white/90 dark:bg-gray-800/90
        rounded-xl p-4 min-w-[320px] max-w-[400px]
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🚀</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">Motor de Inteligencia</h3>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Estado de Infraestructura</span>
          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            OPTIMIZADO - FREE TIER
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className="h-3 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
        <div className="text-[10px] text-gray-500 leading-tight">
          AI Code Mentor es 100% gratuito. Usamos el modelo más potente disponible de forma gratuita para maximizar el acceso a la educación.
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 text-xs">
        <div className="flex justify-between mb-1">
          <span>Modelo Activo:</span> <span className="font-mono text-blue-600">{currentModel}</span>
        </div>
        <div className="flex justify-between">
          <span>Política:</span> <span className="text-purple-600 font-semibold">Uso Comunitario Responsable</span>
        </div>
      </div>

      <div className="flex justify-between text-xs">
        <button onClick={() => setShowDetails(!showDetails)} className="text-blue-500 hover:underline">
          {showDetails ? 'Ocultar historial de llamadas' : 'Ver actividad reciente'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 max-h-32 overflow-y-auto space-y-2">
          {callHistory.slice(-5).reverse().map((call, i) => (
            <div key={i} className="text-[10px] flex justify-between text-gray-400">
              <span>{call.operation}</span>
              <span className={call.success ? 'text-green-500' : 'text-red-500'}>{call.success ? 'Activa' : 'Error'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isExpanded ? <ExpandedView /> : <CompactView />}

      {/* Radix Dialog for Warning - Using Named Imports */}
      <DialogRoot open={showWarning} onOpenChange={(open) => !open && dismissWarning()}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300" />
          <DialogContent
            className="
               fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[101]
               glass-panel bg-white/10 p-6 rounded-2xl w-[90vw] max-w-md
               focus:outline-none shadow-2xl border border-red-500/30
            "
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 text-4xl animate-bounce">⚠️</div>

              <DialogTitle className="text-xl font-bold text-white mb-2">
                Advertencia de Uso de API
              </DialogTitle>

              <DialogDescription className="text-gray-300 mb-6 leading-relaxed">
                {alertLevel === 'critical' ?
                  `Solo quedan ${remainingCalls} llamadas de tu límite diario.` :
                  `Has alcanzado el ${usagePercentage.toFixed(0)}% de tu cuota diaria.`
                }
                <br />
                <span className="text-sm opacity-70 mt-2 block">
                  El contador se reinicia en {timeUntilReset}.
                </span>
              </DialogDescription>

              <div className="flex gap-3 w-full">
                <DialogClose asChild>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">
                    Entendido
                  </button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </>
  );
};

export default APIUsageCounter;
