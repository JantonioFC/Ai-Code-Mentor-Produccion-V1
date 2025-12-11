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
 * ComparisonBar - Gráfico de barras para comparar con promedio
 * 
 * @param {Object} props
 * @param {number} props.userValue - Valor del usuario
 * @param {number} props.averageValue - Valor promedio
 * @param {string} props.title - Título del gráfico
 * @param {string} props.metric - Nombre de la métrica
 * @param {string} props.unit - Unidad de medida (%, puntos, etc.)
 * @param {boolean} props.loading - Estado de carga
 */
export default function ComparisonBar({ 
  userValue = 0,
  averageValue = 0,
  title = 'Comparación',
  metric = 'Progreso',
  unit = '%',
  loading = false
}) {
  const isAboveAverage = userValue >= averageValue;
  
  // Configuración del gráfico
  const chartData = {
    labels: ['Tu ' + metric, 'Promedio'],
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
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderWidth: 1,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}${unit}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + unit;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comparación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4 bg-white rounded-lg shadow">
      <div className="h-48">
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          {isAboveAverage ? (
            <>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-600 font-semibold">
                {Math.round(((userValue - averageValue) / averageValue) * 100)}% por encima del promedio
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-blue-600 font-semibold">
                Continúa mejorando
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
