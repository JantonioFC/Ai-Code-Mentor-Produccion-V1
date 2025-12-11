/**
 * Componente: QualityGauge
 * 
 * Gauge semicircular para mostrar el Quality Score del revisor.
 * Visualización específica para métricas IRP.
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
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Determinar color según puntuación (escala 0-5)
 */
const getColorForScore = (score) => {
  if (score >= 4.5) return { color: '#10b981', label: 'Excelente' }; // green
  if (score >= 4.0) return { color: '#3b82f6', label: 'Muy Bueno' }; // blue
  if (score >= 3.5) return { color: '#8b5cf6', label: 'Bueno' }; // purple
  if (score >= 3.0) return { color: '#f59e0b', label: 'Regular' }; // yellow
  return { color: '#ef4444', label: 'Necesita Mejorar' }; // red
};

/**
 * Componente principal del gauge
 */
export default function QualityGauge({ score = 0, maxScore = 5.0, title = 'Quality Score', loading = false }) {
  const percentage = (score / maxScore) * 100;
  const { color, label } = getColorForScore(score);

  const chartData = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
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

  // Plugin personalizado para mostrar el score en el centro
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const { width, height, ctx } = chart;
      ctx.restore();
      
      // Score principal
      const fontSize = (height / 100).toFixed(2);
      ctx.font = `bold ${fontSize * 24}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      
      const scoreText = score.toFixed(1);
      const textX = Math.round((width - ctx.measureText(scoreText).width) / 2);
      const textY = height / 1.5;
      
      ctx.fillText(scoreText, textX, textY);
      
      // Max score (pequeño)
      ctx.font = `${fontSize * 12}px sans-serif`;
      ctx.fillStyle = '#9ca3af';
      const maxText = `/ ${maxScore.toFixed(1)}`;
      const maxX = Math.round((width - ctx.measureText(maxText).width) / 2);
      const maxY = textY + (fontSize * 20);
      ctx.fillText(maxText, maxX, maxY);
      
      ctx.save();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Cargando gauge...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">Puntuación de calidad como revisor</p>
      </div>

      {/* Gauge */}
      <div className="relative h-48">
        <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
      </div>

      {/* Footer con etiquetas */}
      <div className="mt-6 flex justify-between items-center text-sm">
        <span className="text-gray-500">0.0</span>
        <div className="text-center">
          <div 
            className="inline-block px-4 py-2 rounded-full font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {percentage.toFixed(0)}% del máximo
          </p>
        </div>
        <span className="text-gray-500">{maxScore.toFixed(1)}</span>
      </div>

      {/* Insights */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        {score >= 4.5 && (
          <p className="text-sm text-center text-green-700">
            🌟 ¡Estás en el top 10% de revisores!
          </p>
        )}
        {score >= 4.0 && score < 4.5 && (
          <p className="text-sm text-center text-blue-700">
            ✨ Excelente trabajo, sigue así
          </p>
        )}
        {score >= 3.0 && score < 4.0 && (
          <p className="text-sm text-center text-purple-700">
            💪 Buen progreso, continúa mejorando
          </p>
        )}
        {score < 3.0 && (
          <p className="text-sm text-center text-yellow-700">
            📚 Revisa ejemplos de feedback de alta calidad
          </p>
        )}
      </div>
    </div>
  );
}
