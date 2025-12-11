// components/dashboard/PhaseProgressBar.js
// MISIÓN 159 FASE 1 - COMPONENTE DE BARRA DE PROGRESO POR FASE
// Objetivo: Renderizar el progreso individual de cada fase del Ecosistema 360

import React from 'react';

/**
 * Componente para mostrar una barra de progreso individual de una fase
 * @param {Object} props - Propiedades del componente
 * @param {number} props.faseId - ID de la fase (1-6)
 * @param {string} props.tituloFase - Título descriptivo de la fase
 * @param {number} props.semanasEnFase - Total de semanas en la fase
 * @param {number} props.semanasCompletadas - Semanas completadas en la fase
 * @param {number} props.porcentajeCompletado - Porcentaje de completado (0-100)
 */
export default function PhaseProgressBar({ 
  faseId, 
  tituloFase, 
  semanasEnFase, 
  semanasCompletadas, 
  porcentajeCompletado 
}) {
  
  // Determinar color de la barra según el porcentaje
  const getProgressColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-300';
    if (percentage < 25) return 'bg-red-400';
    if (percentage < 50) return 'bg-yellow-400';
    if (percentage < 75) return 'bg-blue-400';
    if (percentage < 100) return 'bg-green-400';
    return 'bg-green-500';
  };

  // Determinar icono según el estado de progreso
  const getPhaseIcon = (percentage) => {
    if (percentage === 0) return '⚪';
    if (percentage < 100) return '🔄';
    return '✅';
  };

  // Determinar clase de texto según el estado
  const getTextColorClass = (percentage) => {
    if (percentage === 0) return 'text-gray-600';
    if (percentage < 100) return 'text-blue-600';
    return 'text-green-600';
  };

  const progressColorClass = getProgressColor(porcentajeCompletado);
  const phaseIcon = getPhaseIcon(porcentajeCompletado);
  const textColorClass = getTextColorClass(porcentajeCompletado);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header de la fase */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-lg mr-2">{phaseIcon}</span>
          <div>
            <h4 className="font-semibold text-gray-800">
              Fase {faseId}: {tituloFase}
            </h4>
            <p className="text-sm text-gray-600">
              {semanasCompletadas} de {semanasEnFase} semanas completadas
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${textColorClass}`}>
            {porcentajeCompletado}%
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className={`${progressColorClass} h-3 rounded-full transition-all duration-500 ease-out relative`}
          style={{ width: `${Math.min(porcentajeCompletado, 100)}%` }}
        >
          {/* Efecto de brillo para progreso activo */}
          {porcentajeCompletado > 0 && porcentajeCompletado < 100 && (
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {porcentajeCompletado === 0 ? 'No iniciada' : 
           porcentajeCompletado < 100 ? 'En progreso' : 'Completada'}
        </span>
        <span>
          {semanasEnFase - semanasCompletadas} semanas restantes
        </span>
      </div>

      {/* Indicador de fase actual */}
      {porcentajeCompletado > 0 && porcentajeCompletado < 100 && (
        <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-center">
          🎯 Fase actual en progreso
        </div>
      )}
    </div>
  );
}
