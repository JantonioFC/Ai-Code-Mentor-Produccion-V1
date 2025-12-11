/**
 * Portfolio Export System - Ecosistema 360 Integration
 * Real implementation with PDF, HTML, and GitHub Pages export
 * Professional evidence-based competency documentation
 */

import React, { useState } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

const PortfolioExportSystem = ({ className = '' }) => {
  const { 
    dashboardData,
    entryCounts,
    recentEntries,
    loading
  } = useProjectTracking();

  const [exportConfig, setExportConfig] = useState({
    includeTemplates: true,
    includeModules: true,
    includeAnalytics: true,
    format: 'pdf', // 'pdf', 'html', 'github'
    theme: 'ecosistema360', // Professional Ecosistema 360 branding
    competencyLevel: 'auto', // Based on current progression
    studentName: 'AI Code Mentor User'
  });

  const [exportStatus, setExportStatus] = useState({
    isExporting: false,
    progress: 0,
    currentStep: '',
    completed: false,
    downloadUrl: null,
    error: null,
    metadata: null
  });

  // Portfolio structure based on Ecosistema 360 methodology
  const portfolioStructure = {
    cover: {
      title: 'Portfolio de Competencias - Ecosistema 360',
      subtitle: 'Evidencias Documentadas • Simbiosis Crítica Humano-IA',
      student: exportConfig.studentName,
      date: new Date().toLocaleDateString('es-ES'),
      methodology: '24 meses • 6 fases • Andamiaje Decreciente'
    },
    sections: [
      {
        id: 'executive_summary',
        title: '📋 Resumen Ejecutivo',
        description: 'Progreso general y competencias desarrolladas'
      },
      {
        id: 'competency_framework',
        title: '🏆 Marco de Competencias (HRC)',
        description: 'Progresión basada en evidencias y skill development'
      },
      {
        id: 'evidence_documentation',
        title: '📄 Documentación de Evidencias',
        description: 'DDE • PAS • HRC • IRP - Template entries como evidencias'
      },
      {
        id: 'learning_modules',
        title: '📚 Módulos de Aprendizaje',
        description: 'Lecciones completadas y ejercicios resueltos'
      },
      {
        id: 'analytics_insights',
        title: '📊 Métricas y Análisis',
        description: 'Progress tracking y performance indicators'
      },
      {
        id: 'future_development',
        title: '🚀 Plan de Desarrollo Futuro',
        description: 'Próximos objetivos y roadmap de competencias'
      }
    ]
  };

  const handleExportStart = async () => {
    setExportStatus({
      isExporting: true,
      progress: 0,
      currentStep: 'Inicializando exportación...',
      completed: false,
      downloadUrl: null,
      error: null,
      metadata: null
    });

    try {
      // Step 1: Preparation
      setExportStatus(prev => ({
        ...prev,
        progress: 10,
        currentStep: 'Preparando datos para exportación...'
      }));

      // Step 2: API Call for real export
      setExportStatus(prev => ({
        ...prev,
        progress: 30,
        currentStep: `Generando portfolio ${exportConfig.format.toUpperCase()}...`
      }));

      const response = await fetch('/api/export-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: exportConfig.format,
          config: {
            includeTemplates: exportConfig.includeTemplates,
            includeModules: exportConfig.includeModules,
            includeAnalytics: exportConfig.includeAnalytics,
            theme: exportConfig.theme,
            studentName: exportConfig.studentName
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const result = await response.json();

      // Step 3: Processing complete
      setExportStatus(prev => ({
        ...prev,
        progress: 80,
        currentStep: 'Finalizando exportación...'
      }));

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Completion
      setExportStatus({
        isExporting: false,
        progress: 100,
        currentStep: 'Exportación completada exitosamente',
        completed: true,
        downloadUrl: result.downloadUrl,
        error: null,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('Portfolio export error:', error);
      setExportStatus({
        isExporting: false,
        progress: 0,
        currentStep: '',
        completed: false,
        downloadUrl: null,
        error: error.message,
        metadata: null
      });
    }
  };

  const handleDownload = () => {
    if (exportStatus.downloadUrl) {
      const link = document.createElement('a');
      link.href = exportStatus.downloadUrl;
      link.download = `portfolio-ecosistema360-${exportConfig.format}-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCurrentCompetencyLevel = () => {
    const totalEntries = Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
    if (totalEntries >= 15) return { level: 4, name: 'Avanzado', icon: '🏆' };
    if (totalEntries >= 10) return { level: 3, name: 'Intermedio', icon: '🌳' };
    if (totalEntries >= 5) return { level: 2, name: 'Básico', icon: '🌿' };
    return { level: 1, name: 'Principiante', icon: '🌱' };
  };

  const getCurrentPhaseProgress = () => {
    const totalEntries = Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
    return {
      currentPhase: Math.min(Math.floor(totalEntries / 5) + 1, 6),
      phaseName: ['Fundamentos', 'Frontend', 'Backend', 'DevOps', 'IA/Data', 'Integration'][Math.min(Math.floor(totalEntries / 5), 5)],
      progress: Math.min((totalEntries / 30) * 100, 100)
    };
  };

  const getTotalEntries = () => {
    return Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
  };

  const competencyLevel = getCurrentCompetencyLevel();
  const phaseProgress = getCurrentPhaseProgress();
  const totalEntries = getTotalEntries();

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with Ecosistema 360 Branding */}
      <div className="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              📄 Sistema de Exportación de Portfolio
            </h2>
            <p className="text-emerald-100 text-sm">Ecosistema 360 • Evidencias Documentadas • Competencias Profesionales</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{competencyLevel.icon}</div>
            <div className="text-xs text-emerald-100">Nivel {competencyLevel.level}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Portfolio Overview */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-4">📊 Vista General del Portfolio</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{totalEntries}</div>
              <div className="text-xs text-blue-800">Evidencias</div>
              <div className="text-xs text-gray-500">Documentadas</div>
            </div>
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{Object.keys(entryCounts).length}</div>
              <div className="text-xs text-green-800">Tipos</div>
              <div className="text-xs text-gray-500">Templates</div>
            </div>
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{competencyLevel.level}</div>
              <div className="text-xs text-purple-800">Competencia</div>
              <div className="text-xs text-gray-500">{competencyLevel.name}</div>
            </div>
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">F{phaseProgress.currentPhase}</div>
              <div className="text-xs text-orange-800">Fase Actual</div>
              <div className="text-xs text-gray-500">{phaseProgress.phaseName}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">📋 Estructura del Portfolio</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {portfolioStructure.sections.map((section, index) => (
                <div key={section.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{section.title}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-600">{section.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Configuration */}
        <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">⚙️ Configuración de Exportación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Exportación</label>
              <select
                value={exportConfig.format}
                onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                disabled={exportStatus.isExporting}
              >
                <option value="pdf">📄 PDF Profesional</option>
                <option value="html">🌐 Página Web (HTML)</option>
                <option value="github">🐙 GitHub Pages</option>
              </select>
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Estudiante</label>
              <input
                type="text"
                value={exportConfig.studentName}
                onChange={(e) => setExportConfig(prev => ({ ...prev, studentName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                disabled={exportStatus.isExporting}
                placeholder="Tu nombre para el portfolio"
              />
            </div>
          </div>

          {/* Content Inclusion Options */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenido a Incluir</label>
            <div className="space-y-2">
              {[
                { key: 'includeTemplates', label: '📝 Entradas de Templates (DDE, PAS, HRC, IRP)', recommended: true },
                { key: 'includeModules', label: '📚 Módulos de Aprendizaje y Lecciones', recommended: true },
                { key: 'includeAnalytics', label: '📊 Métricas y Análisis de Progreso', recommended: false }
              ].map(option => (
                <label key={option.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportConfig[option.key]}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, [option.key]: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={exportStatus.isExporting}
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                  {option.recommended && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Recomendado</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Export Status */}
        {(exportStatus.isExporting || exportStatus.completed || exportStatus.error) && (
          <div className="mb-6 bg-white rounded-lg p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">📊 Estado de Exportación</h3>
            
            {exportStatus.isExporting && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{exportStatus.currentStep}</span>
                  <span className="text-sm font-medium text-blue-600">{exportStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${exportStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {exportStatus.completed && (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <h4 className="font-semibold text-green-600 mb-2">Portfolio Exportado Exitosamente</h4>
                <p className="text-sm text-gray-600 mb-2">{exportStatus.currentStep}</p>
                
                {exportStatus.metadata && (
                  <div className="bg-green-50 p-3 rounded-lg mb-4 text-sm">
                    <div><strong>Formato:</strong> {exportStatus.metadata.format.toUpperCase()}</div>
                    <div><strong>Tamaño:</strong> {Math.round(exportStatus.metadata.size / 1024)} KB</div>
                    {exportStatus.metadata.pages && (
                      <div><strong>Páginas:</strong> {exportStatus.metadata.pages}</div>
                    )}
                    {exportStatus.metadata.sections && (
                      <div><strong>Secciones:</strong> {exportStatus.metadata.sections}</div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={handleDownload}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mr-2"
                >
                  📄 Descargar Portfolio
                </button>
                
                <button
                  onClick={() => setExportStatus({ isExporting: false, progress: 0, currentStep: '', completed: false, downloadUrl: null, error: null, metadata: null })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ✅ Finalizar
                </button>
              </div>
            )}

            {exportStatus.error && (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h4 className="font-semibold text-red-600 mb-2">Error en la Exportación</h4>
                <p className="text-sm text-gray-600 mb-4">{exportStatus.error}</p>
                <button
                  onClick={() => setExportStatus({ isExporting: false, progress: 0, currentStep: '', completed: false, downloadUrl: null, error: null, metadata: null })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🔄 Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Export Action */}
        {!exportStatus.isExporting && !exportStatus.completed && (
          <div className="text-center">
            <button
              onClick={handleExportStart}
              disabled={totalEntries === 0 || loading}
              className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                totalEntries === 0 || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 hover:from-emerald-600 hover:via-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {totalEntries === 0 
                ? '📝 Necesitas evidencias para exportar' 
                : loading 
                ? '⏳ Cargando...' 
                : `🚀 Exportar Portfolio ${exportConfig.format.toUpperCase()} (${totalEntries} evidencias)`}
            </button>
            
            {totalEntries > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Portfolio con {totalEntries} evidencias • Nivel {competencyLevel.level} ({competencyLevel.name}) • Fase {phaseProgress.currentPhase}
              </p>
            )}
          </div>
        )}

        {/* Help & Information */}
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <h4 className="font-medium text-gray-800 mb-2">💡 Información del Sistema de Portfolio</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>PDF:</strong> Documento profesional listo para presentaciones e impresión</p>
            <p>• <strong>HTML:</strong> Página web con diseño responsive y navegación completa</p>
            <p>• <strong>GitHub Pages:</strong> ZIP con archivos listos para deployment en GitHub</p>
            <p>• <strong>Evidencias automáticas:</strong> Tus templates se convierten en evidencias de competencias</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioExportSystem;