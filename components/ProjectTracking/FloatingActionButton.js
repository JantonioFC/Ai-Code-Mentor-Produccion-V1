/**
 * Floating Action Button Component - Ecosistema 360 Integration
 * Provides quick access to educational template system from anywhere in the app
 * Part of AI Code Mentor Project Tracking System
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

const FloatingActionButton = () => {
  const { 
    templates,
    templateCategories,
    selectTemplate,
    loading
  } = useProjectTracking();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMainButtonClick = () => {
    setIsMenuOpen(!isMenuOpen);
    setSelectedCategory(null);
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  const handleTemplateSelect = (templateType) => {
    selectTemplate(templateType);
    setIsMenuOpen(false);
    setSelectedCategory(null);
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Reflexión y Seguimiento': '📝',
      'Documentación Educativa': '📚',
      'Control de Calidad': '✅'
    };
    return icons[categoryName] || '📄';
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Reflexión y Seguimiento': 'bg-blue-500 hover:bg-blue-600',
      'Documentación Educativa': 'bg-purple-500 hover:bg-purple-600',
      'Control de Calidad': 'bg-green-500 hover:bg-green-600'
    };
    return colors[categoryName] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getCategoryDescription = (categoryName) => {
    const descriptions = {
      'Reflexión y Seguimiento': 'Metacognición • Andamiaje decreciente',
      'Documentación Educativa': 'DDE • PAS • HRC • IRP',
      'Control de Calidad': 'Estándares profesionales'
    };
    return descriptions[categoryName] || 'Templates educativos';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header with Educational Context */}
          <div className="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 text-white p-4">
            <h3 className="font-semibold text-sm">🎯 Ecosistema 360 - Templates</h3>
            <p className="text-xs text-emerald-100 mt-1">Simbiosis Crítica • Portfolio basado en evidencias</p>
          </div>

          {/* Categories */}
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(templateCategories).map(([categoryName, templateTypes]) => (
              <div key={categoryName}>
                <button
                  onClick={() => handleCategoryClick(categoryName)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCategoryIcon(categoryName)}</span>
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{categoryName}</div>
                        <div className="text-xs text-blue-600">{getCategoryDescription(categoryName)}</div>
                        <div className="text-xs text-gray-500 mt-1">{templateTypes.length} plantillas disponibles</div>
                      </div>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        selectedCategory === categoryName ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Template Options with Educational Context */}
                {selectedCategory === categoryName && (
                  <div className="bg-gray-50 border-b border-gray-100">
                    {templateTypes.map(templateType => {
                      const template = templates[templateType];
                      if (!template) return null;

                      return (
                        <button
                          key={templateType}
                          onClick={() => handleTemplateSelect(templateType)}
                          className="w-full px-6 py-3 text-left hover:bg-blue-50 transition-colors group border-b border-gray-100 last:border-b-0"
                          disabled={loading}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg mt-0.5">{template.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600 mb-1">
                                {template.name}
                              </div>
                              {template.subtitle && (
                                <div className="text-xs text-blue-600 font-medium mb-1">
                                  {template.subtitle}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 leading-relaxed">
                                {template.description.length > 60 
                                  ? `${template.description.substring(0, 60)}...`
                                  : template.description}
                              </div>
                            </div>
                            <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer with Educational Context */}
          <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
            <div className="text-xs text-center">
              <div className="font-medium text-gray-700 mb-1">💡 Metodología Educativa Profesional</div>
              <div className="text-gray-500">24 meses • 6 fases • Portfolio basado en evidencias</div>
            </div>
          </div>
        </div>
      )}

      {/* Main FAB Button with Enhanced Context */}
      <button
        ref={buttonRef}
        onClick={handleMainButtonClick}
        disabled={loading}
        className={`w-14 h-14 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 
          hover:from-emerald-600 hover:via-blue-700 hover:to-purple-700 
          text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 
          flex items-center justify-center group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`transition-transform ${isMenuOpen ? 'rotate-45' : 'group-hover:scale-110'}`}>
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* Enhanced Tooltip with Educational Context */}
      {!isMenuOpen && !loading && (
        <div className="absolute bottom-16 right-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          <div className="font-medium">🎯 Templates Ecosistema 360</div>
          <div className="text-gray-300 text-xs mt-0.5">DDE • PAS • HRC • IRP</div>
        </div>
      )}
    </div>
  );
};

export default FloatingActionButton;