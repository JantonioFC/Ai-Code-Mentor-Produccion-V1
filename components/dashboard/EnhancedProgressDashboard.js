// components/dashboard/EnhancedProgressDashboard.js
// FASE 4 - GRÁFICOS AVANZADOS Y VISUALIZACIONES
// Dashboard mejorado con visualizaciones interactivas usando Chart.js
// ACTUALIZADO MISIÓN 210.0: Componentes de gráficos consolidados en common/charts
// ⭐ MISIÓN 225.1: Importación dinámica de Chart.js para evitar carga voraz

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PhaseProgressBar from './PhaseProgressBar';

// ⭐ MISIÓN 225.1: Lazy loading de componentes de gráficos
// Esto asegura que Chart.js NO se carga hasta que este componente se renderiza
const TrendChart = dynamic(() => import('../common/charts/TrendChart'), { ssr: false });
const QualityGauge = dynamic(() => import('../common/charts/QualityGauge'), { ssr: false });
const ComparisonBar = dynamic(() => import('../common/charts/ComparisonBar'), { ssr: false });
const TimelineChart = dynamic(() => import('../common/charts/TimelineChart'), { ssr: false });

export default function EnhancedProgressDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook de efecto para cargar datos del API
  useEffect(() => {
    const fetchProgressSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ENHANCED-DASHBOARD] Llamando a /api/progress/summary...');

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
        console.log('[ENHANCED-DASHBOARD] Datos recibidos:', result);

        setData(result);
      } catch (err) {
        console.error('[ENHANCED-DASHBOARD] Error cargando datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressSummary();
  }, []);

  // Función para preparar datos de tendencia
  const prepareTrendData = (progresoPorFase) => {
    if (!progresoPorFase || progresoPorFase.length === 0) return [];

    return progresoPorFase.map(fase => ({
      label: `Fase ${fase.faseId}`,
      value: fase.porcentajeCompletado
    }));
  };

  // Función para preparar datos de timeline
  const prepareTimelineData = (progresoPorFase) => {
    if (!progresoPorFase || progresoPorFase.length === 0) return [];

    return progresoPorFase
      .filter(fase => fase.semanasCompletadas > 0)
      .map(fase => ({
        label: fase.tituloFase.length > 30
          ? fase.tituloFase.substring(0, 30) + '...'
          : fase.tituloFase,
        count: fase.semanasCompletadas,
        date: `Fase ${fase.faseId}`
      }));
  };

  // Calcular promedio para comparación
  const calculateAverage = (progresoPorFase) => {
    if (!progresoPorFase || progresoPorFase.length === 0) return 0;

    const totalProgress = progresoPorFase.reduce((sum, fase) => sum + fase.porcentajeCompletado, 0);
    return Math.round(totalProgress / progresoPorFase.length);
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg"></div>
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

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No hay datos de progreso disponibles</p>
      </div>
    );
  }

  const { metadata, summary, progresoPorFase } = data;
  const trendData = prepareTrendData(progresoPorFase);
  const timelineData = prepareTimelineData(progresoPorFase);
  const averageProgress = calculateAverage(progresoPorFase);

  return (
    <div className="space-y-6">
      {/* Contenedor principal */}
      <div className="glass-subtle rounded-2xl p-6 stagger-1">

        {/* Resumen del Progreso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Semanas Completadas */}
          <div className="stat-card-subtle relative overflow-hidden rounded-xl p-5 gradient-border-teal stagger-2">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-white to-teal-50/30"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Semanas Completadas</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">{summary.totalSemanasCompletadas}</p>
                <p className="text-sm text-teal-600 mt-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-teal-500 rounded-full"></span>
                  de {summary.totalSemanasIniciadas} iniciadas
                </p>
              </div>
              <div className="icon-container-teal rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card Progreso Total */}
          <div className="stat-card-subtle relative overflow-hidden rounded-xl p-5 stagger-3" style={{ borderLeft: '3px solid #0d9488' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Progreso Total</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">{summary.porcentajeTotalCompletado}%</p>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-teal-500 rounded-full"></span>
                  del programa completo
                </p>
              </div>
              <div className="icon-container-dark rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Gráficos Avanzados */}
      <div className="glass-subtle rounded-2xl p-6 stagger-2">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-gray-700">
            📈 Análisis Visual
          </span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Tendencia */}
          <div className="glass-card rounded-xl p-4 hover-lift transition-smooth-ui">
            <TrendChart
              data={trendData}
              title="Tendencia de Progreso por Fase"
              label="% Completado"
              color="#3b82f6"
              showArea={true}
              loading={false}
            />
          </div>

          {/* Quality Gauge */}
          <div className="glass-card rounded-xl p-4 hover-lift transition-smooth-ui">
            <QualityGauge
              score={summary.porcentajeTotalCompletado}
              title="Quality Score General"
              loading={false}
            />
          </div>

          {/* Comparación con Objetivo */}
          <div className="glass-card rounded-xl p-4 hover-lift transition-smooth-ui">
            <ComparisonBar
              userValue={summary.porcentajeTotalCompletado}
              averageValue={100}
              title="Tu Progreso vs Objetivo"
              metric="Progreso"
              unit="%"
              maxValue={100}
              loading={false}
            />
          </div>

          {/* Timeline de Actividad */}
          <div className="glass-card rounded-xl p-4 hover-lift transition-smooth-ui">
            <TimelineChart
              data={timelineData}
              title="Semanas Completadas por Fase"
              color="#8b5cf6"
              loading={false}
            />
          </div>
        </div>
      </div>

      {/* Progreso Detallado por Fase */}
      <div className="glass-subtle rounded-2xl p-6 stagger-3">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-gray-700">
            🎯 Progreso Detallado por Fase
          </span>
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
              Comienza tu primer módulo del Ecosistema 360
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
