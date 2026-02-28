/**
 * Componente: TimelineChart
 * 
 * Timeline de actividad de revisiones completadas a lo largo del tiempo.
 * Visualiza el historial de revisiones del usuario.
 * 
 * @author Mentor Coder
 * @version 1.0.0 (FASE 4 - GRÁFICOS)
 * @created 2025-10-06
 * @mission 204.0 - Dashboard de Métricas IRP - Fase 4
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

/**
 * Componente principal del timeline
 */
export default function TimelineChart({
  data = [],
  title = 'Timeline de Revisiones',
  color = '#8b5cf6',
  loading = false
}) {
  // No generamos datos mock: si no hay datos reales, el chart queda vacío
  const chartData = data;

  const chartJsData = {
    labels: chartData.map(item => item.label || item.period),
    datasets: [
      {
        label: 'Revisiones Completadas',
        data: chartData.map(item => item.count),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 24,
      }
    ]
  };

  const options = {
    indexAxis: 'y', // Barras horizontales
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
        borderColor: color,
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const item = chartData[context.dataIndex];
            const labels = [
              `Completadas: ${context.parsed.x}`
            ];
            if (item.date) {
              labels.push(`Fecha: ${item.date}`);
            }
            return labels;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return Number.isInteger(value) ? value : '';
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
      y: {
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Cargando timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">No hay actividad registrada</p>
            <p className="text-sm mt-2">Completa tu primera revisión para ver el timeline</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular total
  const totalReviews = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Actividad de revisión por período
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-purple-600">{totalReviews}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-64">
        <Bar data={chartJsData} options={options} />
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {data.length > 0 ? 'Datos reales' : 'Datos de ejemplo'}
        </span>
        <span className="text-gray-500">
          {chartData.length} períodos mostrados
        </span>
      </div>
    </div>
  );
}
