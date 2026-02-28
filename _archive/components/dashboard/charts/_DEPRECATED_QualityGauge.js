import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * QualityGauge - Gauge semicircular para mostrar quality score
 * 
 * @param {Object} props
 * @param {number} props.score - Puntuación de calidad (0-100)
 * @param {string} props.title - Título del gauge
 * @param {boolean} props.loading - Estado de carga
 */
export default function QualityGauge({ 
  score = 0, 
  title = 'Quality Score',
  loading = false
}) {
  // Determinar color según el score
  const getColor = (value) => {
    if (value >= 80) return '#10b981'; // Verde
    if (value >= 60) return '#3b82f6'; // Azul
    if (value >= 40) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  const color = getColor(score);
  
  // Configuración del gráfico
  const chartData = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [color, '#e5e7eb'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };

  // Plugin personalizado para mostrar el texto en el centro
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const { width, height, ctx } = chart;
      ctx.restore();
      
      const fontSize = (height / 100).toFixed(2);
      ctx.font = `${fontSize * 20}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      
      const scoreText = Math.round(score) + '%';
      const textX = Math.round((width - ctx.measureText(scoreText).width) / 2);
      const textY = height / 1.6;
      
      ctx.fillText(scoreText, textX, textY);
      ctx.save();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4 bg-white rounded-lg shadow">
      <h3 className="text-center text-lg font-bold mb-2">{title}</h3>
      <div className="relative h-48">
        <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <span>0%</span>
        <span className="font-semibold" style={{ color }}>
          {score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Regular' : 'Necesita Mejorar'}
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
