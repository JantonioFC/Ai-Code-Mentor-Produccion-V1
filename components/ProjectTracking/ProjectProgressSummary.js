/**
 * Project Progress Summary Component
 * Dashboard widget showing stats and progress for the 10 templates system
 * Part of AI Code Mentor Project Tracking System
 */

import React, { useEffect } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

const ProjectProgressSummary = ({ className = '' }) => {
  const { 
    dashboardData,
    entryCounts,
    recentEntries,
    lastReflection,
    lastReview,
    loading,
    error,
    loadDashboardData
  } = useProjectTracking();

  useEffect(() => {
    // Refresh dashboard data when component mounts
    loadDashboardData();
  }, []);

  const getTotalEntries = () => {
    return Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
  };

  const getEntryTypeIcon = (entryType) => {
    const icons = {
      daily_reflection: '📝',
      weekly_review: '📊',
      dde_entry: '📋',
      weekly_action_plan: '📅',
      quality_checklist_precommit: '✅',
      quality_checklist_project: '🏆',
      quality_checklist_weekly: '📋',
      project_documentation: '📖',
      technical_documentation: '🏗️',
      unified_tracking_log: '📊'
    };
    return icons[entryType] || '📄';
  };

  const getEntryTypeLabel = (entryType) => {
    const labels = {
      daily_reflection: 'Reflexiones Diarias',
      weekly_review: 'Reviews Semanales',
      dde_entry: 'Decisiones DDE',
      weekly_action_plan: 'Planes de Acción',
      quality_checklist_precommit: 'Checklists Pre-commit',
      quality_checklist_project: 'Checklists Proyecto',
      quality_checklist_weekly: 'Checklists Semanales',
      project_documentation: 'Docs de Proyecto',
      technical_documentation: 'Docs Técnicas',
      unified_tracking_log: 'Tracking Unificado'
    };
    return labels[entryType] || entryType;
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    return `Hace ${diffWeeks} semanas`;
  };

  const getMostActiveTemplateType = () => {
    if (!entryCounts || Object.keys(entryCounts).length === 0) return null;
    
    return Object.entries(entryCounts).reduce((max, [type, count]) => 
      count > (entryCounts[max] || 0) ? type : max
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Error cargando dashboard</p>
          <button 
            onClick={loadDashboardData}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const totalEntries = getTotalEntries();
  const mostActiveType = getMostActiveTemplateType();

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">📊 Dashboard de Templates</h2>
            <p className="text-blue-100 text-sm">Sistema completo de tracking profesional</p>
          </div>
          <div className="text-2xl">🚀</div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalEntries}</div>
            <div className="text-xs text-gray-500">Total Entradas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(entryCounts).length}</div>
            <div className="text-xs text-gray-500">Types Usados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">10</div>
            <div className="text-xs text-gray-500">Templates Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {mostActiveType ? entryCounts[mostActiveType] : 0}
            </div>
            <div className="text-xs text-gray-500">Más Usado</div>
          </div>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">Última Reflexión</h3>
                <p className="text-sm text-blue-600">
                  {getTimeSince(lastReflection?.date)}
                </p>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-800">Último Review</h3>
                <p className="text-sm text-purple-600">
                  {getTimeSince(lastReview?.date)}
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
        </div>

        {/* Entry Types Breakdown */}
        {Object.keys(entryCounts).length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">📋 Tipos de Entradas</h3>
            <div className="space-y-2">
              {Object.entries(entryCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getEntryTypeIcon(type)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {getEntryTypeLabel(type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min((count / Math.max(...Object.values(entryCounts))) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentEntries && recentEntries.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">🕒 Actividad Reciente</h3>
            <div className="space-y-2">
              {recentEntries.slice(0, 3).map((entry, index) => (
                <div key={entry.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-lg">{getEntryTypeIcon(entry.entry_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {getEntryTypeLabel(entry.entry_type)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTimeSince(entry.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalEntries === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="font-medium text-gray-800 mb-1">¡Comienza a usar los templates!</h3>
            <p className="text-sm text-gray-600">
              Usa el botón flotante para crear tu primera entrada
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectProgressSummary;
