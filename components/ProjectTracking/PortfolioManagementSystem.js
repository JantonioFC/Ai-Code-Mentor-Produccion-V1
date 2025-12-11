/**
 * Portfolio Management System - Unified Interface
 * Combines Portfolio Export + Reset System for complete cycle management
 * Ecosistema 360 Integration with professional workflow
 */

import React, { useState } from 'react';
import PortfolioExportSystem from './PortfolioExportSystem';
import ResetSystem from './ResetSystem';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

const PortfolioManagementSystem = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('portfolio');
  
  const { entryCounts } = useProjectTracking();

  const tabs = [
    {
      id: 'portfolio',
      name: 'Export Portfolio',
      icon: '📄',
      description: 'Generar portfolio profesional',
      badge: null
    },
    {
      id: 'reset',
      name: 'Gestión de Ciclos',
      icon: '🔄', 
      description: 'Reset y nuevo ciclo curricular',
      badge: 'AVANZADO'
    }
  ];

  const getTotalEntries = () => {
    return Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
  };

  const totalEntries = getTotalEntries();

  return (
    <div className={`${className}`}>
      {/* Header with System Overview */}
      <div className="mb-6 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              📊 Gestión de Portfolio y Ciclos - Ecosistema 360
            </h1>
            <p className="text-gray-600">
              Sistema completo para exportación de evidencias y gestión de ciclos curriculares de 24 meses
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{totalEntries}</div>
            <div className="text-sm text-blue-800">Evidencias Disponibles</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-lg font-semibold text-green-600">📄</div>
            <div className="text-sm font-medium text-gray-700">Portfolio Export</div>
            <div className="text-xs text-gray-500">PDF + GitHub Pages</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-lg font-semibold text-purple-600">🏆</div>
            <div className="text-sm font-medium text-gray-700">Competencias</div>
            <div className="text-xs text-gray-500">Evidencias documentadas</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-lg font-semibold text-blue-600">🔄</div>
            <div className="text-sm font-medium text-gray-700">Gestión de Ciclos</div>
            <div className="text-xs text-gray-500">Reset + Archival</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-lg font-semibold text-orange-600">📚</div>
            <div className="text-sm font-medium text-gray-700">24 Meses</div>
            <div className="text-xs text-gray-500">Curriculum Estructura</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
                <span className="text-xl mr-3">{tab.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs opacity-80">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'portfolio' && (
          <div>
            <PortfolioExportSystem />
          </div>
        )}
        
        {activeTab === 'reset' && (
          <div>
            {/* Warning Message for Reset System */}
            {totalEntries > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Funcionalidad Avanzada</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      El sistema de reset permite gestionar ciclos curriculares completos. 
                      <strong> Recomendamos exportar tu portfolio antes de proceder</strong>.
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-yellow-600">
                      <span>✅ {totalEntries} evidencias actuales</span>
                      <span>📄 Portfolio exportable</span>
                      <span>🔄 Reset disponible</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <ResetSystem />
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">💡 Guía de Gestión de Portfolio</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">📄 Export de Portfolio</h4>
            <ul className="space-y-1 text-sm">
              <li>• <strong>PDF Profesional:</strong> Para presentaciones y entrevistas</li>
              <li>• <strong>GitHub Pages:</strong> Portfolio web deployable</li>
              <li>• <strong>Evidencias DDE/PAS/HRC:</strong> Competencias documentadas</li>
              <li>• <strong>Progresión visible:</strong> Fases + competencias + timeline</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">🔄 Gestión de Ciclos</h4>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Archival seguro:</strong> Preserva evidencias de ciclos anteriores</li>
              <li>• <strong>Reset controlado:</strong> Reinicia contadores manteniendo historial</li>
              <li>• <strong>Nuevo ciclo:</strong> 24 meses estructurados desde Fase 1</li>
              <li>• <strong>Competencias baseline:</strong> Progresión desde principiante</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <span className="text-lg">🎯</span>
            <div className="text-sm">
              <strong>Metodología Ecosistema 360:</strong> Este sistema implementa gestión profesional de evidencias 
              siguiendo principios de Simbiosis Crítica Humano-IA y Andamiaje Decreciente para desarrollo óptimo de competencias.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioManagementSystem;