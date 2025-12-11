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
 * TrendChart - Gráfico de líneas para visualizar tendencias temporales
 * 
 * @param {Object} props
 * @param {Array} props.data - Datos para el gráfico [{label: string, value: number}]
 * @param {string} props.title - Título del gráfico
 * @param {string} props.label - Etiqueta de la serie de datos
 * @param {string} props.color - Color principal del gráfico (hex)
 * @param {boolean} props.showArea - Mostrar área bajo la línea
 * @param {boolean} props.loading - Estado de carga
 */
export default function TrendChart({ 
  data = [], 
  title = 'Tendencia', 
  label = 'Progreso',
  color = '#3b82f6',
  showArea = true,
  loading = false
}) {
  // Configuración del gráfico
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: label,
        data: data.map(item => item.value),
        borderColor: color,
        backgroundColor: showArea ? `${color}33` : 'transparent', // 33 = 20% opacity
        borderWidth: 2,
        fill: showArea,
        tension: 0.4, // Curva suave
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
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
        borderColor: color,
        borderWidth: 1,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
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
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4 bg-white rounded-lg shadow">
      <Line data={chartData} options={options} />
    </div>
  );
}
