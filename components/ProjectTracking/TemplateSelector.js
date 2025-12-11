/**
 * Template Selector Component - Ecosistema 360 Integration
 * Displays educational templates organized by categories following Ecosistema 360 methodology
 * Part of AI Code Mentor Project Tracking System
 * 
 * MISIÓN 191.1: Implementación de carga defensiva y resiliencia
 * - Carga autónoma de plantillas desde lib/templates.js
 * - Manejo robusto de estados de loading y error
 * - Operación independiente del ProjectTrackingContext
 */

import React, { useState, useEffect } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';
import { getAllTemplates, getTemplatesByCategory } from '../../lib/templates';

const TemplateSelector = ({ className = '' }) => {
  // Estados locales para manejo defensivo
  const [templates, setTemplates] = useState(null);
  const [templateCategories, setTemplateCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Obtener selectTemplate del contexto si está disponible
  const projectTracking = useProjectTracking();
  const selectTemplate = projectTracking?.selectTemplate || (() => {
    console.warn('[TEMPLATE_SELECTOR] selectTemplate no disponible en contexto');
  });

  // Carga autónoma de plantillas
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📚 [TEMPLATE_SELECTOR] Cargando plantillas desde lib/templates.js...');
        
        // Cargar plantillas directamente desde el módulo
        const allTemplates = getAllTemplates();
        const categories = getTemplatesByCategory();
        
        if (!allTemplates || Object.keys(allTemplates).length === 0) {
          throw new Error('No se pudieron cargar las plantillas desde el módulo');
        }
        
        if (!categories || Object.keys(categories).length === 0) {
          throw new Error('No se pudieron cargar las categorías de plantillas');
        }
        
        setTemplates(allTemplates);
        setTemplateCategories(categories);
        
        console.log(`✅ [TEMPLATE_SELECTOR] Plantillas cargadas: ${Object.keys(allTemplates).length} plantillas en ${Object.keys(categories).length} categorías`);
        
      } catch (err) {
        console.error('❌ [TEMPLATE_SELECTOR] Error cargando plantillas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);

  const handleTemplateSelect = (templateType) => {
    selectTemplate(templateType);
  };

  const renderTemplateCard = (templateType) => {
    const template = templates[templateType];
    if (!template) return null;

    return (
      <div
        key={templateType}
        className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => handleTemplateSelect(templateType)}
      >
        <div className="flex items-start space-x-3">
          <div className="text-2xl group-hover:scale-110 transition-transform">
            {template.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm">
              {template.name}
            </h3>
            {template.subtitle && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                {template.subtitle}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {template.description}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">
            Ecosistema 360 • {templateType.replace('_', ' ')}
          </span>
          <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const renderCategory = (categoryName, templateTypes) => {
    return (
      <div key={categoryName} className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
          {categoryName}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({templateTypes.length} plantillas)
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateTypes.map(templateType => renderTemplateCard(templateType))}
        </div>
      </div>
    );
  };

  // Estado de carga con spinner mejorado
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-800">Cargando Plantillas Educativas</h3>
            <p className="text-sm text-gray-600 mt-2">Inicializando sistema de plantillas Ecosistema 360...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error con mensaje controlado y opción de reintento
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="text-red-500 text-6xl">⚠️</div>
          <div className="text-center max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al Cargar Plantillas</h3>
            <p className="text-sm text-gray-600 mb-4">
              No se pudieron cargar las plantillas educativas del Ecosistema 360.
            </p>
            <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 font-mono">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              🔄 Reintentar Carga
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validación defensiva adicional antes del renderizado
  if (!templates || !templateCategories) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="text-yellow-500 text-6xl">📋</div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-800">Plantillas No Disponibles</h3>
            <p className="text-sm text-gray-600 mt-2">Las plantillas educativas no están disponibles en este momento.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              🔄 Recargar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          📋 Plantillas Educativas - Ecosistema 360
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Selecciona una plantilla para crear una entrada estructurada siguiendo la metodología educativa. 
          Cada plantilla implementa principios de <strong>Simbiosis Crítica Humano-IA</strong> y <strong>Andamiaje Decreciente</strong>.
        </p>
      </div>

      {/* Quick Stats with Educational Context */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Sistema Metodológico Completo</h3>
            <p className="text-sm text-gray-600">10 plantillas educativas • Metodología universitaria • Evidencias documentadas</p>
          </div>
          <div className="text-3xl">🎯</div>
        </div>
      </div>

      {/* Template Categories - Con validación defensiva */}
      {Object.entries(templateCategories || {}).length > 0 ? (
        Object.entries(templateCategories).map(([categoryName, templateTypes]) => 
          renderCategory(categoryName, templateTypes)
        )
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <p className="text-gray-600">No hay categorías de plantillas disponibles.</p>
        </div>
      )}

      {/* Footer with Educational Context */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <h4 className="font-medium text-gray-800 mb-2">🎓 Metodología Ecosistema 360</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Cada plantilla está diseñada para fomentar la <strong>reflexión crítica</strong>, 
            <strong>documentación estructurada</strong> y <strong>progresión por competencias</strong> 
            a lo largo del curriculum de 24 meses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;