/**
 * Componente: MetricsSummary
 * 
 * Muestra las tarjetas de resumen de métricas clave (hero cards)
 * en la parte superior del dashboard.
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-10-05
 * @mission 204.0 - Dashboard de Métricas IRP
 */

import React from 'react';

/**
 * Componente de tarjeta individual de métrica
 */
function MetricCard({ title, value, subtitle, trend, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  const trendColor = trend && trend.direction === 'up' ? 'text-green-600' : 
                     trend && trend.direction === 'down' ? 'text-red-600' : 
                     'text-gray-600';

  const trendIcon = trend && trend.direction === 'up' ? '↑' : 
                    trend && trend.direction === 'down' ? '↓' : 
                    '→';

  return (
    <div className={`rounded-lg border-2 p-6 transition-all hover:shadow-lg ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-1">{title}</p>
          <p className="text-3xl font-bold mb-2">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-60">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trendColor}`}>
              {trendIcon} {trend.value} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-4xl opacity-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente principal de resumen de métricas
 */
export default function MetricsSummary({ metrics, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 mb-8">
        <p className="text-red-700 font-medium">Error cargando métricas</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 mb-8">
        <p className="text-gray-600">No hay métricas disponibles</p>
      </div>
    );
  }

  const { reviewer_metrics, author_metrics, peer_points } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Quality Score */}
      <MetricCard
        title="Quality Score"
        value={`⭐ ${reviewer_metrics.quality_score.toFixed(1)}`}
        subtitle="Promedio de calidad"
        trend={{
          direction: 'up', // TODO: Calcular tendencia real
          value: '+0.3',
          label: 'vs mes anterior'
        }}
        color="blue"
      />

      {/* Revisiones Completadas */}
      <MetricCard
        title="Revisiones"
        value={reviewer_metrics.total_reviews_completed}
        subtitle="Completadas"
        trend={{
          direction: 'up',
          value: '+2',
          label: 'este mes'
        }}
        color="green"
      />

      {/* Puntualidad */}
      <MetricCard
        title="Puntualidad"
        value={`${Math.round(reviewer_metrics.punctuality_rate * 100)}%`}
        subtitle="A tiempo"
        trend={{
          direction: 'up',
          value: '+5%',
          label: 'mejora'
        }}
        color="yellow"
      />

      {/* Peer Points */}
      <MetricCard
        title="Peer Points"
        value={peer_points.total_earned}
        subtitle={peer_points.current_level}
        trend={{
          direction: 'up',
          value: '+10',
          label: 'ganados'
        }}
        color="purple"
      />

      {/* Rating Recibido */}
      <MetricCard
        title="Como Autor"
        value={`${author_metrics.average_rating_received.toFixed(1)} / 5.0`}
        subtitle="Rating recibido"
        trend={{
          direction: author_metrics.improvement_trend === 'positive' ? 'up' : 
                     author_metrics.improvement_trend === 'negative' ? 'down' : 
                     'neutral',
          value: author_metrics.improvement_trend === 'positive' ? '+0.2' : 
                 author_metrics.improvement_trend === 'negative' ? '-0.1' : 
                 '0.0',
          label: 'tendencia'
        }}
        color="orange"
      />
    </div>
  );
}
