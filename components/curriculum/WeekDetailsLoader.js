/**
 * WEEK DETAILS LOADER - MISIÓN 183.2 & 185.3
 * 
 * Componente que gestiona la carga y renderizado de detalles de semana.
 * MISIÓN 185.3: Implementa renderizado condicional para Guía de Estudio Estratégico.
 * 
 * - Si weekDetailsData.guiaEstudio existe: renderiza GuiaEstudio.js
 * - Si no existe: renderiza WeekDetails.js con WeeklySchedule tradicional
 * 
 * @author Mentor Coder
 * @version v2.0 - Incluye soporte para Guía de Estudio
 */

import WeekDetails from './WeekDetails';
import GuiaEstudio from './GuiaEstudio';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Componente loader para detalles de semana con renderizado condicional
 * 
 * MISIÓN 185.3: Implementa lógica condicional para mostrar:
 * - GuiaEstudio: Cuando la semana tiene guiaEstudio (proyectos prácticos)
 * - WeekDetails: Cuando la semana NO tiene guiaEstudio (semanas teóricas)
 * 
 * @param {number} activeWeek - Semana activa seleccionada
 * @param {Object} weekDetailsData - Datos completos de la semana (desde API)
 * @param {Object} weekDetailsData.guiaEstudio - Guía de estudio estratégico (opcional)
 * @param {boolean} loadingWeekDetails - Estado de carga
 * @param {Error} weekDetailsError - Error de carga si existe
 * @param {Function} onRetry - Función para reintentar carga
 */
export default function WeekDetailsLoader({
  activeWeek,
  weekDetailsData,
  loadingWeekDetails,
  weekDetailsError,
  onRetry
}) {
  // Estado de carga
  if (loadingWeekDetails) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Cargando detalles de la Semana {activeWeek.semana}
          </h3>
          <h4 className="text-lg text-indigo-700 mb-1">
            {activeWeek.tituloSemana}
          </h4>
          <p className="text-gray-600 text-sm">
            Obteniendo esquema diario, objetivos y recursos...
          </p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (weekDetailsError) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Error al cargar los detalles
          </h3>
          <p className="text-red-600 text-sm mb-6">
            {weekDetailsError.message || 'Ocurrió un error inesperado.'}
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Reintentar carga
          </button>
        </div>
      </div>
    );
  }

  // Estado con datos completos - MISIÓN 185.3: Lógica condicional para Guía de Estudio
  if (weekDetailsData) {
    // Determinar si la semana tiene guía de estudio estratégico
    const hasGuiaEstudio = weekDetailsData.guiaEstudio && 
      typeof weekDetailsData.guiaEstudio === 'object' &&
      Object.keys(weekDetailsData.guiaEstudio).length > 0;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-b border-green-100">
          <div className="flex items-center justify-between">
            <span className="text-green-800 text-sm font-medium">
              {hasGuiaEstudio ? (
                <span className="flex items-center space-x-2">
                  <span>🗺️ Guía de Estudio Estratégico cargada</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    PROYECTO
                  </span>
                </span>
              ) : (
                '📊 Datos completos cargados desde SQLite'
              )}
            </span>
            <div className="text-xs text-green-600">
              {hasGuiaEstudio ? (
                'Semana de proyecto práctico'
              ) : (
                `Esquema diario: ${weekDetailsData.esquemaDiario?.length || 0} días`
              )}
            </div>
          </div>
        </div>
        
        {/* Renderizado condicional basado en presencia de guía de estudio */}
        {hasGuiaEstudio ? (
          <GuiaEstudio weekData={weekDetailsData} />
        ) : (
          <WeekDetails weekData={weekDetailsData} />
        )}
      </div>
    );
  }

  // Estado por defecto
  return null;
}