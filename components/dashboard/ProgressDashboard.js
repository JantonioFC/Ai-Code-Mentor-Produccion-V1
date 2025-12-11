// components/dashboard/ProgressDashboard.js
// MISIÓN 159 FASE 1 & 2 - DASHBOARD DE PROGRESO DEL ESTUDIANTE
// Objetivo: Consumir endpoint /api/progress/summary y presentar visualización clara del progreso

import { useState, useEffect } from 'react';
import PhaseProgressBar from './PhaseProgressBar';

export default function ProgressDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook de efecto para cargar datos del API
  useEffect(() => {
    const fetchProgressSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[PROGRESS-DASHBOARD] Llamando a /api/progress/summary...');

        const response = await fetch('/api/progress/summary', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[PROGRESS-DASHBOARD] Datos recibidos:', result);
        
        // El endpoint /api/progress/summary devuelve directamente los datos estructurados
        setData(result);
      } catch (err) {
        console.error('[PROGRESS-DASHBOARD] Error cargando datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressSummary();
  }, []);

  // Estado de carga con skeleton loaders
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
          </div>
          
          {/* Tarjetas de resumen skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
          
          {/* Progress bars skeleton */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-48 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center text-red-600 mb-4">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium">Error cargando progreso</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recargar datos
        </button>
      </div>
    );
  }

  // Estado sin datos
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No hay datos de progreso disponibles</p>
      </div>
    );
  }

  const { metadata, summary, progresoPorFase } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Título Principal */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          📊 Resumen de Progreso
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Última actualización: {new Date(metadata.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Tarjeta: Total Semanas Completadas */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Semanas Completadas</p>
              <p className="text-3xl font-bold text-green-900">{summary.totalSemanasCompletadas}</p>
              <p className="text-xs text-green-600 mt-1">
                de {summary.totalSemanasIniciadas} semanas iniciadas
              </p>
            </div>
            <div className="bg-green-200 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tarjeta: Porcentaje Total Completado */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Porcentaje Total Completado</p>
              <p className="text-3xl font-bold text-blue-900">{summary.porcentajeTotalCompletado}%</p>
              <p className="text-xs text-blue-600 mt-1">
                progreso global del programa
              </p>
            </div>
            <div className="bg-blue-200 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso por Fase */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          🎯 Progreso por Fase del Ecosistema 360
        </h3>
        
        {progresoPorFase && progresoPorFase.length > 0 ? (
          <div className="space-y-4">
            {progresoPorFase.map((fase) => (
              <PhaseProgressBar
                key={fase.faseId}
                faseId={fase.faseId}
                tituloFase={fase.tituloFase}
                semanasEnFase={fase.semanasEnFase}
                semanasCompletadas={fase.semanasCompletadas}
                porcentajeCompletado={fase.porcentajeCompletado}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 font-medium">No hay fases iniciadas aún</p>
            <p className="text-gray-500 text-sm mt-1">
              Comienza tu primer módulo del Ecosistema 360 para ver tu progreso aquí
            </p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Dashboard actualizado desde la API de progreso • 
          ID de usuario: {metadata.userId.slice(0, 8)}... • 
          Sistema operativo bajo ARQUITECTURA_VIVA v360.0
        </div>
      </div>
    </div>
  );
}
