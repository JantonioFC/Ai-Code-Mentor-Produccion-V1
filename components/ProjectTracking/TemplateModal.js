/**
 * Template Modal Component - Ecosistema 360 Integration
 * Modal interface for creating entries using educational templates
 * Part of AI Code Mentor Project Tracking System
 */

import React, { useState, useEffect } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';
import SimpleInput from '../ui/atoms/SimpleInput';

const TemplateModal = () => {
  const {
    selectedTemplate,
    templates,
    isModalOpen,
    closeModal,
    createEntry,
    loading,
    error,
    resetError
  } = useProjectTracking();

  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      const template = templates[selectedTemplate];

      // Generate content with today's date
      const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let templateContent = template.template;
      templateContent = templateContent.replace(/{date}/g, today);
      templateContent = templateContent.replace(/{week_number}/g, getWeekNumber());

      setContent(templateContent);

      // Initialize metadata with empty values instead of resetting completely
      if (template.metadata_fields) {
        const initialMetadata = {};
        Object.keys(template.metadata_fields).forEach(field => {
          const fieldType = template.metadata_fields[field];
          if (fieldType === 'number') {
            initialMetadata[field] = 0;
          } else if (fieldType === 'boolean') {
            initialMetadata[field] = false;
          } else if (fieldType === 'array') {
            initialMetadata[field] = [];
          } else {
            initialMetadata[field] = '';
          }
        });
        setMetadata(initialMetadata);
      } else {
        setMetadata({});
      }
    }

    // Error will be reset when modal opens (handled separately)
  }, [selectedTemplate]); // Fixed: removed resetError to prevent infinite loop

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setContent('');
      setMetadata({});
      setIsSubmitting(false);
    }
  }, [isModalOpen]);

  // Reset error when modal opens (separate effect to avoid infinite loop)
  useEffect(() => {
    if (isModalOpen) {
      resetError();
    }
  }, [isModalOpen]); // This only depends on modal state, not the resetError function

  const getWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createEntry(selectedTemplate, content, metadata);
      closeModal();
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetadataChange = (field, value) => {
    // Get the field type from template definition to preserve data types
    const template = templates[selectedTemplate];
    const fieldType = template?.metadata_fields?.[field];

    // Convert value to appropriate type based on template definition
    let processedValue = value;

    if (fieldType === 'array') {
      // For array fields, convert string input to array
      if (typeof value === 'string') {
        processedValue = value.trim() ? [value.trim()] : [];
      } else if (Array.isArray(value)) {
        processedValue = value;
      } else {
        processedValue = [];
      }
    } else if (fieldType === 'number') {
      processedValue = parseInt(value) || 0;
    } else if (fieldType === 'boolean') {
      processedValue = Boolean(value);
    }
    // string type and others remain as-is

    setMetadata(prev => {
      const newMetadata = {
        ...prev,
        [field]: processedValue
      };
      return newMetadata;
    });
  };

  // Helper function to get Spanish labels for fields
  const getFieldLabel = (field) => {
    const labels = {
      'estado_animo': 'Estado de Ánimo',
      'horas_estudiadas': 'Horas Estudiadas',
      'nivel_concentracion': 'Nivel de Concentración (1-10)',
      'nivel_confianza': 'Nivel de Confianza (1-10)',
      'week_number': 'Número de Semana',
      'goals_completed': 'Objetivos Completados',
      'goals_total': 'Total de Objetivos',
      'satisfaction': 'Satisfacción (1-10)',
      'decision_complexity': 'Complejidad de Decisión',
      'alternatives_considered': 'Alternativas Consideradas',
      'ai_consulted': 'IA Consultada',
      'implementation_status': 'Estado de Implementación',
      'phase': 'Fase',
      'main_objectives': 'Objetivos Principales',
      'estimated_hours': 'Horas Estimadas'
    };
    return labels[field] || field.replace(/_/g, ' ');
  };

  // Helper function to get Spanish placeholders for fields
  const getFieldPlaceholder = (field) => {
    const placeholders = {
      'estado_animo': 'Ej: Motivado, Cansado, Concentrado...',
      'horas_estudiadas': 'Ej: 3',
      'nivel_concentracion': 'Del 1 al 10',
      'nivel_confianza': 'Del 1 al 10',
      'week_number': 'Ej: 15',
      'goals_completed': 'Ej: 3',
      'goals_total': 'Ej: 5',
      'satisfaction': 'Del 1 al 10',
      'decision_complexity': 'Baja, Media, Alta',
      'alternatives_considered': 'Ej: 3',
      'implementation_status': 'Pendiente, En Progreso, Completado',
      'phase': 'Ej: Fase 1',
      'main_objectives': 'Ej: 2',
      'estimated_hours': 'Ej: 8'
    };
    return placeholders[field] || `Ingresa ${getFieldLabel(field).toLowerCase()}`;
  };

  const renderMetadataFields = (template) => {
    if (!template.metadata_fields) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Metadatos Educativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(template.metadata_fields).map(([field, type]) => (
            <SimpleInput
              key={field}
              field={field}
              type={type}
              value={metadata[field]}
              onChange={handleMetadataChange}
              placeholder={getFieldPlaceholder(field)}
              label={getFieldLabel(field)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!isModalOpen || !selectedTemplate) return null;

  const template = templates[selectedTemplate];
  if (!template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with Educational Context */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{template.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{template.name}</h2>
                {template.subtitle && (
                  <p className="text-blue-100 text-xs font-medium mb-1">{template.subtitle}</p>
                )}
                <p className="text-blue-100 text-sm">{template.description}</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <form onSubmit={handleSubmit}>
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Educational Context Banner */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🎓</span>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800">Metodología Ecosistema 360</h4>
                  <p className="text-xs text-blue-600">
                    Esta plantilla implementa principios de <strong>Simbiosis Crítica Humano-IA</strong> y
                    <strong> Andamiaje Decreciente</strong> para optimizar tu aprendizaje.
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            {renderMetadataFields(template)}

            {/* Content Editor */}
            <div className="mb-6">
              <label htmlFor="template-content" className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Contenido de la Plantilla Educativa
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>💡 Consejo: Personaliza el contenido según tu contexto de aprendizaje y fase curricular</span>
                  </div>
                </div>
                <textarea
                  id="template-content"
                  name="template_content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 min-h-[400px] resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  placeholder="El contenido de la plantilla educativa aparecerá aquí..."
                  required
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Ecosistema 360</span> • {
                  selectedTemplate === 'dde_entry' ? 'DDE (Diario de Decisiones)' :
                    selectedTemplate === 'weekly_action_plan' ? 'PAS (Plan de Acción)' :
                      selectedTemplate === 'unified_tracking_log' ? 'HRC (Hoja de Competencias)' :
                        selectedTemplate === 'peer_review' ? 'IRP (Revisión por Pares)' :
                          selectedTemplate.replace('_', ' ')
                }
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Guardar Entrada Educativa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;