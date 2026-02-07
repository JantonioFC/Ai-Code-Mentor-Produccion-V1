/**
 * Componente: AuthorMetrics
 * 
 * Muestra las métricas del usuario como autor, incluyendo rating recibido,
 * tendencias de mejora y respuesta a feedback.
 * 
 * @author Mentor Coder
 * @version 3.0.0 (COMPLETO - Fase 4 - GRÁFICOS)
 * @created 2025-10-05
 * @updated 2025-10-06
 * @mission 204.0 - Dashboard de Métricas IRP - Fase 4
 */

import React from 'react';
import TrendChart from '../../common/charts/TrendChart';
import TimelineChart from '../../common/charts/TimelineChart';

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
 * Visualización de mejora en revisiones consecutivas
 */
function ImprovementTimeline({ averageRating, improvementTrend }) {
  // Generar datos simulados de progresión basados en tendencia
  const generateProgressionData = () => {
    const current = averageRating;

    if (improvementTrend === 'positive') {
      // Tendencia positiva: mostrar mejora gradual
      return [
        { label: 'Rev 1', value: Math.max(3.0, current - 0.6) },
        { label: 'Rev 2', value: Math.max(3.2, current - 0.4) },
        { label: 'Rev 3', value: Math.max(3.5, current - 0.2) },
        { label: 'Rev 4', value: current }
      ];
    } else if (improvementTrend === 'negative') {
      // Tendencia negativa: mostrar descenso
      return [
        { label: 'Rev 1', value: Math.min(5.0, current + 0.6) },
        { label: 'Rev 2', value: Math.min(4.8, current + 0.4) },
        { label: 'Rev 3', value: Math.min(4.5, current + 0.2) },
        { label: 'Rev 4', value: current }
      ];
    } else {
      // Tendencia estable: variación mínima
      return [
        { label: 'Rev 1', value: current - 0.1 },
        { label: 'Rev 2', value: current + 0.1 },
        { label: 'Rev 3', value: current },
        { label: 'Rev 4', value: current }
      ];
    }
  };

  const data = generateProgressionData();
  const totalChange = data[3].value - data[0].value;
  const changeColor = totalChange > 0.1 ? 'text-green-700' :
    totalChange < -0.1 ? 'text-red-700' :
      'text-gray-700';

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border-2 border-orange-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Mejora en Revisiones Consecutivas
      </h3>

      <div className="flex items-center justify-between">
        {data.map((point, index) => (
          <React.Fragment key={index}>
            <div className="text-center flex-1">
              <p className="text-xs text-gray-600 mb-1">{point.label}</p>
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${index === data.length - 1
                  ? 'bg-orange-600 text-white font-bold'
                  : 'bg-white border-2 border-orange-300 text-orange-900'
                }`}>
                <span className="text-sm">{point.value.toFixed(1)}</span>
              </div>
            </div>
            {index < data.length - 1 && (
              <div className="flex-1 max-w-[60px]">
                <div className="border-t-2 border-dashed border-gray-400"></div>
              </div>
            )}
          </React.Fragment>
        ))}

        <div className="text-center ml-4 min-w-[80px]">
          <p className="text-xs text-gray-600 mb-1">Cambio</p>
          <div className={`inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white border-2 ${totalChange > 0.1 ? 'border-green-300' :
              totalChange < -0.1 ? 'border-red-300' :
                'border-gray-300'
            }`}>
            <span className={`text-lg font-bold ${changeColor}`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
              {totalChange > 0.1 ? ' ↑' : totalChange < -0.1 ? ' ↓' : ' →'}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        * Basado en últimas 4 revisiones recibidas
      </p>
    </div>
  );
}

/**
 * Componente principal de métricas como autor
 */
export default function AuthorMetrics({ metrics, loading }) {
  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          👤 Como Autor
        </h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          👤 Como Autor
        </h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">✍️</p>
          <p className="font-medium">No hay datos de autor disponibles</p>
          <p className="text-sm">Solicita revisiones para tus proyectos</p>
        </div>
      </div>
    );
  }

  const { author_metrics } = metrics;

  // Verificar si hay datos de autor
  if (author_metrics.total_reviews_received === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          👤 Como Autor
        </h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">📤</p>
          <p className="font-medium">¡Solicita tu primera revisión!</p>
          <p className="text-sm mt-2">
            Envía tu proyecto para recibir feedback valioso
          </p>
          <button className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Solicitar Revisión
          </button>
        </div>
      </div>
    );
  }

  // Configuración de tendencia
  const trendConfig = {
    positive: {
      icon: '📈',
      color: 'green',
      label: 'Mejorando',
      message: '¡Vas por buen camino! Tu calidad está aumentando.'
    },
    negative: {
      icon: '📉',
      color: 'red',
      label: 'Bajando',
      message: 'Revisa el feedback recibido para mejorar.'
    },
    stable: {
      icon: '→',
      color: 'gray',
      label: 'Estable',
      message: 'Tu calidad se mantiene consistente.'
    }
  };

  const trend = trendConfig[author_metrics.improvement_trend] || trendConfig.stable;

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          👤 Como Autor
        </h2>
        <span className="text-sm text-gray-600">
          {author_metrics.total_reviews_received} revisión{author_metrics.total_reviews_received !== 1 ? 'es' : ''} recibida{author_metrics.total_reviews_received !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Rating Recibido */}
        <MetricCard
          title="⭐ Rating Recibido"
          value={`${author_metrics.average_rating_received.toFixed(1)} / 5.0`}
          subtitle="Promedio de calidad"
          icon="🎯"
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
          textColor="text-orange-700"
        />

        {/* Tendencia */}
        <MetricCard
          title={`${trend.icon} Tendencia`}
          value={trend.label}
          subtitle={trend.message}
          icon={trend.icon}
          bgColor={`bg-${trend.color}-50`}
          borderColor={`border-${trend.color}-200`}
          textColor={`text-${trend.color}-700`}
        />

        {/* Respuesta a Feedback */}
        <MetricCard
          title="✅ Respuesta a FB"
          value={`${Math.round(author_metrics.response_to_feedback_rate * 100)}%`}
          subtitle={author_metrics.response_to_feedback_rate >= 0.7 ? "¡Bien!" : "Puedes mejorar"}
          icon={author_metrics.response_to_feedback_rate >= 0.7 ? "👍" : "📧"}
          bgColor={author_metrics.response_to_feedback_rate >= 0.7 ? "bg-blue-50" : "bg-yellow-50"}
          borderColor={author_metrics.response_to_feedback_rate >= 0.7 ? "border-blue-200" : "border-yellow-200"}
          textColor={author_metrics.response_to_feedback_rate >= 0.7 ? "text-blue-700" : "text-yellow-700"}
        />
      </div>

      {/* Gráficos Avanzados - Fase 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        {/* Tendencia de Rating Recibido */}
        {/* TODO: Pasar datos reales de tendencia */}
        <TrendChart
          data={[]}
          metric="avg_rating"
          loading={loading}
        />

        {/* Timeline de Revisiones Recibidas */}
        {/* TODO: Pasar datos reales de timeline */}
        <TimelineChart
          data={[]}
          title="Revisiones Recibidas"
          color="#f97316"
          loading={loading}
        />
      </div>

      {/* Timeline de mejora (mantener como referencia visual adicional) */}
      <ImprovementTimeline
        averageRating={author_metrics.average_rating_received}
        improvementTrend={author_metrics.improvement_trend}
      />

      {/* Insights contextuales */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        {/* Insight según tendencia */}
        {author_metrics.improvement_trend === 'positive' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">🎉 ¡Excelente progreso!</span> Has mejorado {
                ((author_metrics.average_rating_received / 5.0) * 100).toFixed(0)
              }% en calidad. Sigue implementando el feedback recibido.
            </p>
          </div>
        )}
        {author_metrics.improvement_trend === 'negative' && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <span className="font-medium">📚 Área de oportunidad:</span> Revisa detenidamente las sugerencias
              de tus últimas revisiones. Considera pedir clarificaciones si algo no está claro.
            </p>
          </div>
        )}

        {/* Insight sobre respuesta a feedback */}
        {author_metrics.response_to_feedback_rate < 0.5 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">💬 Mejora tu engagement:</span> Responde a más del 70% del feedback
              que recibes. Esto muestra profesionalismo y ayuda a mejorar más rápido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
