/**
 * Componente: ComparisonBar
 * 
 * Gráfico de barras para comparar métricas del usuario con objetivos establecidos.
 * 
 * COMPONENTE COMÚN - Usado por múltiples dashboards del Ecosistema 360
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ComparisonBar({
  userValue = 0,
  averageValue = 0,
  title = 'Comparación con Objetivo',
  metric = 'Progreso',
  unit = '',
  maxValue = 100,
  loading = false
}) {
  const isAboveAverage = userValue >= averageValue;

  const chartData = {
    labels: [`Tu ${metric}`, 'Objetivo'],
    datasets: [
      {
        label: metric,
        data: [userValue, averageValue],
        backgroundColor: [
          isAboveAverage ? '#10b981' : '#3b82f6',
          '#94a3b8'
        ],
        borderColor: [
          isAboveAverage ? '#059669' : '#2563eb',
          '#64748b'
        ],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 60,
      }
    ]
  };

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
        borderColor: isAboveAverage ? '#10b981' : '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(1);
            if (unit) {
              label += unit;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxValue,
        ticks: {
          callback: function (value) {
            return value.toFixed(0) + unit;
          },
          font: {
            size: 12
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Cargando comparación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular porcentaje de avance
  const progressPercent = averageValue > 0 ? (userValue / averageValue * 100) : 0;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Comparativa con el objetivo del programa
        </p>
      </div>

      {/* Gráfico */}
      <div className="h-56">
        <Bar aria-label="Gráfico de barras comparativo" data={chartData} options={options} />
      </div>

      {/* Footer con análisis */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          {isAboveAverage ? (
            <>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold">
                ¡Objetivo alcanzado!
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-blue-700 font-semibold">
                {progressPercent.toFixed(0)}% completado
              </span>
            </>
          )}
        </div>

        {/* Mensaje contextual */}
        <p className="text-xs text-center text-gray-600 mt-2">
          {isAboveAverage
            ? '¡Felicidades! Has completado el programa'
            : `Te falta ${(100 - progressPercent).toFixed(0)}% para completar las 8 fases`
          }
        </p>
      </div>
    </div>
  );
}
