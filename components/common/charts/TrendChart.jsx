/**
 * Componente: TrendChart
 * 
 * Gráfico de líneas que muestra tendencias temporales de métricas
 * de revisión por pares a lo largo del tiempo.
 * 
 * COMPONENTE COMÚN - Usado por múltiples dashboards del Ecosistema 360
 * 
 * @author Mentor Coder
 * @version 1.0.0 (FASE 4 - GRÁFICOS)
 * @created 2025-10-06
 * @refactored 2025-10-06 (MISIÓN 210.0 - Consolidación)
 * @mission 204.0 - Dashboard de Métricas IRP - Fase 4
 * @mission 210.0 - Realineación del Dashboard IRP
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Componente principal de gráfico de tendencias
 * 
 * @param {Object} props
 * @param {Array} props.data - Datos de tendencia temporal
 * @param {string} props.metric - Métrica a mostrar ('quality_score' | 'reviews_completed' | 'avg_rating')
 * @param {boolean} props.loading - Estado de carga
 * @returns {JSX.Element}
 */
export default function TrendChart({ data = [], metric = 'quality_score', loading = false }) {

  /**
   * Configuración de métricas disponibles
   */
  const metricConfig = {
    quality_score: {
      label: 'Quality Score',
      color: 'rgb(59, 130, 246)', // blue-500
      fillColor: 'rgba(59, 130, 246, 0.1)',
      yAxisMax: 5.0
    },
    reviews_completed: {
      label: 'Revisiones Completadas',
      color: 'rgb(34, 197, 94)', // green-500
      fillColor: 'rgba(34, 197, 94, 0.1)',
      yAxisMax: null // Auto
    },
    avg_rating: {
      label: 'Calificación Promedio',
      color: 'rgb(168, 85, 247)', // purple-500
      fillColor: 'rgba(168, 85, 247, 0.1)',
      yAxisMax: 5.0
    }
  };

  const config = metricConfig[metric];

  const chartData = data;
  /**
   * Configuración de datos para Chart.js
   */
  const chartJsData = {
    labels: chartData.map(d => d.period),
    datasets: [
      {
        label: config.label,
        data: chartData.map(d => d.value),
        borderColor: config.color,
        backgroundColor: config.fillColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4, // Curva suave
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: config.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: config.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3
      }
    ]
  };

  /**
   * Opciones de configuración del gráfico
   */
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        borderColor: config.color,
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += metric === 'reviews_completed'
                ? context.parsed.y.toFixed(0)
                : context.parsed.y.toFixed(1);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6B7280' // gray-500
        }
      },
      y: {
        beginAtZero: true,
        max: config.yAxisMax,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6B7280',
          callback: function (value) {
            return metric === 'reviews_completed'
              ? value.toFixed(0)
              : value.toFixed(1);
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {config.label} - Tendencia
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Últimos 6 períodos
          </p>
        </div>

        {/* Indicador de valor actual */}
        <div className="text-right">
          <p className="text-sm text-gray-500">Actual</p>
          <p className="text-2xl font-bold" style={{ color: config.color }}>
            {chartData.length > 0
              ? (metric === 'reviews_completed'
                ? chartData[chartData.length - 1].value.toFixed(0)
                : chartData[chartData.length - 1].value.toFixed(1))
              : '-'
            }
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-64">
        <Line data={chartJsData} options={options} />
      </div>

      {/* Footer con insights */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Métricas de rendimiento
          </span>
          {chartData.length >= 2 && (
            <span className={`font-medium ${chartData[chartData.length - 1].value > chartData[chartData.length - 2].value
                ? 'text-green-600'
                : chartData[chartData.length - 1].value < chartData[chartData.length - 2].value
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
              {chartData[chartData.length - 1].value > chartData[chartData.length - 2].value
                ? '↑ Tendencia positiva'
                : chartData[chartData.length - 1].value < chartData[chartData.length - 2].value
                  ? '↓ Tendencia negativa'
                  : '→ Estable'
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
