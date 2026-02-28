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
 * TimelineChart - Timeline de actividad/revisiones completadas
 * 
 * @param {Object} props
 * @param {Array} props.data - Datos del timeline [{date: string, count: number, label: string}]
 * @param {string} props.title - Título del gráfico
 * @param {string} props.color - Color de las barras
 * @param {boolean} props.loading - Estado de carga
 */
export default function TimelineChart({ 
  data = [],
  title = 'Timeline de Actividad',
  color = '#8b5cf6',
  loading = false
}) {
  // Configuración del gráfico
  const chartData = {
    labels: data.map(item => item.label || item.date),
    datasets: [
      {
        label: 'Completadas',
        data: data.map(item => item.count),
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
            const item = data[context.dataIndex];
            return [
              `Completadas: ${context.parsed.x}`,
              item.date ? `Fecha: ${item.date}` : ''
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando timeline...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No hay actividad registrada</p>
          <p className="text-sm mt-2">Completa tu primera revisión para ver el timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4 bg-white rounded-lg shadow">
      <Bar data={chartData} options={options} />
    </div>
  );
}
