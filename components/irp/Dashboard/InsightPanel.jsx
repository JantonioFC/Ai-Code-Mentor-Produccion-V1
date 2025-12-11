/**
 * Componente: InsightPanel
 * 
 * Muestra sugerencias accionables basadas en las métricas del usuario.
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-10-05
 * @mission 204.0 - Dashboard de Métricas IRP
 */

import React from 'react';
import { useInsights } from '../../../hooks/useUserMetrics';

function InsightCard({ insight }) {
  const typeConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: '✅'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      icon: '⚠️'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: '💡'
    }
  };

  const config = typeConfig[insight.type] || typeConfig.info;

  return (
    <div className={`rounded-lg border-2 p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <p className={`font-medium ${config.textColor} mb-1`}>
            {insight.message}
          </p>
          {insight.action && (
            <button className={`text-sm underline ${config.textColor} hover:opacity-75 transition-opacity`}>
              {insight.action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightPanel({ metrics, loading }) {
  const insights = useInsights(metrics);

  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          💡 Sugerencias para Mejorar
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg bg-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          💡 Sugerencias para Mejorar
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-6xl mb-4">🎉</p>
          <p className="font-medium">¡Excelente trabajo!</p>
          <p className="text-sm">No hay sugerencias en este momento. Sigue así.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        💡 Sugerencias para Mejorar
      </h2>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  );
}
