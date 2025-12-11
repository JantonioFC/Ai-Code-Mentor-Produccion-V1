/**
 * Componente: ReviewerMetrics
 * 
 * Muestra las métricas del usuario como revisor, incluyendo placeholder
 * para gráficos de tendencia (se implementarán en Fase 4).
 * 
 * @author Mentor Coder
 * @version 3.0.0 (COMPLETO - Fase 4 - GRÁFICOS)
 * @created 2025-10-05
 * @updated 2025-10-06
 * @mission 204.0 - Dashboard de Métricas IRP - Fase 4
 */

import React from 'react';
import { TrendChart, QualityGauge, ComparisonBar } from './index';

/**
 * Componente de tarjeta de métrica individual
 */
function MetricCard({ title, value, subtitle, icon, bgColor, borderColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border-2 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${textColor.replace('text-', 'text-').replace('-700', '-900')}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs ${textColor} mt-1 opacity-75`}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <span className="text-3xl opacity-50">{icon}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder para gráfico de tendencia (Fase 4)
 */
function TrendChartPlaceholder({ qualityScore }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-4 border-2 border-blue-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Evolución de Quality Score
      </h3>
      
      <div className="relative h-48">
        {/* Ejes del gráfico simulados */}
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
          {/* Barras simuladas de tendencia ascendente */}
          <div className="flex items-end h-full w-full gap-2">
            {[3.2, 3.5, 3.8, 4.0, 4.1, qualityScore].map((score, index) => {
              const height = (score / 5.0) * 100;
              const isLast = index === 5;
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                  <div 
                    className={`w-full ${isLast ? 'bg-blue-600' : 'bg-blue-400'} rounded-t transition-all hover:opacity-80`}
                    style={{ height: `${height}%` }}
                  >
                    <div className="text-center pt-2">
                      {isLast && (
                        <span className="text-xs font-bold text-white">
                          {score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-1">
                    {isLast ? 'Actual' : `M-${6-index}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Línea de referencia (4.0) */}
        <div className="absolute left-0 right-0" style={{ bottom: '80%' }}>
          <div className="border-t-2 border-dashed border-gray-400 opacity-30"></div>
          <span className="text-xs text-gray-500 absolute right-0 -top-4">4.0</span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
        <span className="inline-block w-3 h-3 bg-blue-400 rounded"></span>
        <span>Histórico</span>
        <span className="inline-block w-3 h-3 bg-blue-600 rounded ml-4"></span>
        <span>Actual</span>
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-3">
        💡 Gráfico interactivo se implementará en Fase 4 con Recharts
      </p>
    </div>
  );
}

/**
 * Componente principal de métricas como revisor
 */
export default function ReviewerMetrics({ metrics, loading }) {
  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📊 Como Revisor
        </h2>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📊 Como Revisor
        </h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">👁️</p>
          <p className="font-medium">No hay datos de revisor disponibles</p>
          <p className="text-sm">Comienza a revisar proyectos para ver tus métricas</p>
        </div>
      </div>
    );
  }

  const { reviewer_metrics } = metrics;

  // Verificar si hay datos de revisor
  if (reviewer_metrics.total_reviews_completed === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📊 Como Revisor
        </h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">🚀</p>
          <p className="font-medium">¡Empieza tu carrera como revisor!</p>
          <p className="text-sm mt-2">
            Completa tu primera revisión para ver tus métricas aquí
          </p>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ver Proyectos Disponibles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          📊 Como Revisor
        </h2>
        <span className="text-sm text-gray-600">
          {reviewer_metrics.total_reviews_completed} revisión{reviewer_metrics.total_reviews_completed !== 1 ? 'es' : ''} completada{reviewer_metrics.total_reviews_completed !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Gráficos Avanzados - Fase 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quality Score Gauge */}
        <QualityGauge
          score={reviewer_metrics.quality_score}
          maxScore={5.0}
          title="Quality Score Actual"
          loading={loading}
        />

        {/* Comparación con Promedio */}
        {/* TODO: Obtener promedio del backend */}
        <ComparisonBar
          userValue={reviewer_metrics.quality_score}
          averageValue={3.8}
          title="Tu Quality Score vs Promedio"
          metric="Score"
          unit=""
          maxValue={5.0}
          loading={loading}
        />
      </div>

      {/* Tendencia Temporal */}
      {/* TODO: Pasar datos reales de tendencia */}
      <div className="mb-6">
        <TrendChart
          data={[]}
          metric="quality_score"
          loading={loading}
        />
      </div>

      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tiempo Promedio */}
        <MetricCard
          title="⏱️ Tiempo Promedio"
          value={`${reviewer_metrics.average_review_time_hours.toFixed(1)}h`}
          subtitle="Por revisión"
          icon="⏰"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          textColor="text-blue-700"
        />

        {/* Rating Promedio Dado */}
        <MetricCard
          title="⭐ Rating Dado"
          value={`${reviewer_metrics.average_rating_given.toFixed(1)} / 5.0`}
          subtitle="A otros estudiantes"
          icon="🎯"
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
          textColor="text-purple-700"
        />

        {/* Puntualidad */}
        <MetricCard
          title="📅 Puntualidad"
          value={`${Math.round(reviewer_metrics.punctuality_rate * 100)}%`}
          subtitle={reviewer_metrics.punctuality_rate >= 0.8 ? "¡Excelente!" : "Puedes mejorar"}
          icon={reviewer_metrics.punctuality_rate >= 0.8 ? "✅" : "⏳"}
          bgColor={reviewer_metrics.punctuality_rate >= 0.8 ? "bg-green-50" : "bg-yellow-50"}
          borderColor={reviewer_metrics.punctuality_rate >= 0.8 ? "border-green-200" : "border-yellow-200"}
          textColor={reviewer_metrics.punctuality_rate >= 0.8 ? "text-green-700" : "text-yellow-700"}
        />
      </div>

      {/* Insights rápidos basados en métricas */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Insight de velocidad */}
        {reviewer_metrics.average_review_time_hours < 2.0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">⚡ Revisor Eficiente:</span> Tu velocidad está por encima del promedio
            </p>
          </div>
        )}
        {reviewer_metrics.average_review_time_hours > 4.0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">💡 Tip:</span> Considera usar plantillas para agilizar tus revisiones
            </p>
          </div>
        )}

        {/* Insight de calidad */}
        {reviewer_metrics.quality_score >= 4.5 && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-800">
              <span className="font-medium">🌟 Top Reviewer:</span> Tu calidad está en el top 10%
            </p>
          </div>
        )}
        {reviewer_metrics.quality_score < 3.5 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <span className="font-medium">📚 Mejora:</span> Revisa ejemplos de feedback de alta calidad
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
