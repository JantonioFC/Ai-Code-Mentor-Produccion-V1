/**
 * ReviewRequestForm Component - MISIÓN 195 FASE 1
 * 
 * @description Formulario para crear solicitudes de revisión por pares
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-09-28
 * 
 * FUENTE DE VERDAD: Contrato de API v1.0 (Servicio IRP).md
 * ENDPOINT: POST /api/v1/irp/reviews/request
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth/useAuth';

/**
 * Componente de formulario para crear solicitudes de revisión por pares
 * @param {Object} props - Props del componente
 * @param {Function} props.onSuccess - Callback cuando la solicitud es exitosa
 * @param {Function} props.onError - Callback cuando hay un error
 */
export default function ReviewRequestForm({ onSuccess, onError }) {
  const router = useRouter();
  const { session, getValidInternalToken } = useAuth(); // MISIÓN 197.1: Obtener función de token válido
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    project_name: '',
    github_repo_url: '',
    pull_request_url: '',
    phase: 1,
    week: 1,
    description: '',
    learning_objectives: '',  // String separado por comas, se convertirá a array
    specific_focus: '',       // String separado por comas, se convertirá a array
  });

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Valida el formulario antes de enviar
   * @returns {Object} Objeto con isValid y errors
   */
  const validateForm = () => {
    const newErrors = {};

    // Validar campos requeridos
    if (!formData.project_name.trim()) {
      newErrors.project_name = 'El nombre del proyecto es requerido';
    }

    if (!formData.github_repo_url.trim()) {
      newErrors.github_repo_url = 'La URL del repositorio es requerida';
    } else if (!isValidGitHubUrl(formData.github_repo_url)) {
      newErrors.github_repo_url = 'URL de GitHub inválida (debe ser https://github.com/...)';
    }

    if (!formData.pull_request_url.trim()) {
      newErrors.pull_request_url = 'La URL del Pull Request es requerida';
    } else if (!isValidGitHubUrl(formData.pull_request_url)) {
      newErrors.pull_request_url = 'URL de Pull Request inválida (debe ser https://github.com/...)';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción del proyecto es requerida';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    if (!formData.learning_objectives.trim()) {
      newErrors.learning_objectives = 'Debes especificar al menos un objetivo de aprendizaje';
    }

    if (!formData.specific_focus.trim()) {
      newErrors.specific_focus = 'Debes especificar al menos un área de enfoque';
    }

    // Validar rangos numéricos
    if (formData.phase < 1 || formData.phase > 8) {
      newErrors.phase = 'La fase debe estar entre 1 y 8';
    }

    if (formData.week < 1 || formData.week > 100) {
      newErrors.week = 'La semana debe estar entre 1 y 100';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  /**
   * Valida si una URL es de GitHub
   * @param {string} url - URL a validar
   * @returns {boolean} true si es válida
   */
  const isValidGitHubUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'github.com' && urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Maneja cambios en los inputs del formulario
   * @param {Event} e - Evento del input
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Maneja el envío del formulario
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Preparar datos para la API
      const requestData = {
        project_name: formData.project_name.trim(),
        github_repo_url: formData.github_repo_url.trim(),
        pull_request_url: formData.pull_request_url.trim(),
        phase: parseInt(formData.phase),
        week: parseInt(formData.week),
        description: formData.description.trim(),
        learning_objectives: formData.learning_objectives
          .split(',')
          .map(obj => obj.trim())
          .filter(obj => obj.length > 0),
        specific_focus: formData.specific_focus
          .split(',')
          .map(focus => focus.trim())
          .filter(focus => focus.length > 0),
      };

      console.log('[REVIEW-REQUEST-FORM] Enviando solicitud:', requestData);

      // MISIÓN 197.1: Obtener token interno válido (renovado si es necesario)
      const token = await getValidInternalToken();
      
      if (!token) {
        throw new Error('No se pudo obtener token válido. Por favor, inicia sesión nuevamente.');
      }
      
      console.log('🔐 [REVIEW-REQUEST-FORM] Usando token interno para IRP');


      // Enviar solicitud al proxy API
      const response = await fetch('/api/v1/irp/reviews/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Error HTTP ${response.status}`);
      }

      console.log('[REVIEW-REQUEST-FORM] Solicitud creada exitosamente:', data);

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess(data);
      }

      // Limpiar formulario
      setFormData({
        project_name: '',
        github_repo_url: '',
        pull_request_url: '',
        phase: 1,
        week: 1,
        description: '',
        learning_objectives: '',
        specific_focus: '',
      });

    } catch (error) {
      console.error('[REVIEW-REQUEST-FORM] Error creando solicitud:', error);
      
      // Llamar callback de error
      if (onError) {
        onError(error);
      }

      // Mostrar error general
      setErrors({
        _form: error.message || 'Ocurrió un error al crear la solicitud de revisión',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error general del formulario */}
      {errors._form && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errors._form}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información del Proyecto */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📁 Información del Proyecto
        </h3>

        <div className="space-y-4">
          {/* Nombre del Proyecto */}
          <div>
            <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              id="project_name"
              name="project_name"
              type="text"
              value={formData.project_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.project_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ej. Sistema de Gestión de Tareas"
              disabled={loading}
            />
            {errors.project_name && (
              <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
            )}
          </div>

          {/* URL del Repositorio */}
          <div>
            <label htmlFor="github_repo_url" className="block text-sm font-medium text-gray-700 mb-1">
              URL del Repositorio en GitHub *
            </label>
            <input
              id="github_repo_url"
              name="github_repo_url"
              type="url"
              value={formData.github_repo_url}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.github_repo_url ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://github.com/tu-usuario/tu-proyecto"
              disabled={loading}
            />
            {errors.github_repo_url && (
              <p className="mt-1 text-sm text-red-600">{errors.github_repo_url}</p>
            )}
          </div>

          {/* URL del Pull Request */}
          <div>
            <label htmlFor="pull_request_url" className="block text-sm font-medium text-gray-700 mb-1">
              URL del Pull Request *
            </label>
            <input
              id="pull_request_url"
              name="pull_request_url"
              type="url"
              value={formData.pull_request_url}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.pull_request_url ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://github.com/tu-usuario/tu-proyecto/pull/1"
              disabled={loading}
            />
            {errors.pull_request_url && (
              <p className="mt-1 text-sm text-red-600">{errors.pull_request_url}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Asegúrate de crear un Pull Request en tu repositorio antes de solicitar revisión
            </p>
          </div>
        </div>
      </div>

      {/* Contexto Curricular */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📚 Contexto Curricular
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Fase */}
          <div>
            <label htmlFor="phase" className="block text-sm font-medium text-gray-700 mb-1">
              Fase *
            </label>
            <select
              id="phase"
              name="phase"
              value={formData.phase}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phase ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value={1}>Fase 1 - Fundamentos</option>
              <option value={2}>Fase 2 - Frontend Básico</option>
              <option value={3}>Fase 3 - Backend</option>
              <option value={4}>Fase 4 - Full-Stack</option>
              <option value={5}>Fase 5 - Especialización</option>
              <option value={6}>Fase 6 - Proyectos Reales</option>
              <option value={7}>Fase 7 - Portafolio</option>
              <option value={8}>Fase 8 - Profesional</option>
            </select>
            {errors.phase && (
              <p className="mt-1 text-sm text-red-600">{errors.phase}</p>
            )}
          </div>

          {/* Semana */}
          <div>
            <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-1">
              Semana *
            </label>
            <input
              id="week"
              name="week"
              type="number"
              min="1"
              max="100"
              value={formData.week}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.week ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.week && (
              <p className="mt-1 text-sm text-red-600">{errors.week}</p>
            )}
          </div>
        </div>
      </div>

      {/* Descripción y Objetivos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📝 Descripción y Objetivos
        </h3>

        <div className="space-y-4">
          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Proyecto *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe brevemente tu proyecto, las tecnologías utilizadas y su propósito..."
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 20 caracteres. Sé específico sobre lo que hace tu proyecto.
            </p>
          </div>

          {/* Objetivos de Aprendizaje */}
          <div>
            <label htmlFor="learning_objectives" className="block text-sm font-medium text-gray-700 mb-1">
              Objetivos de Aprendizaje *
            </label>
            <input
              id="learning_objectives"
              name="learning_objectives"
              type="text"
              value={formData.learning_objectives}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.learning_objectives ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ej. POO, Encapsulación, Herencia, Polimorfismo"
              disabled={loading}
            />
            {errors.learning_objectives && (
              <p className="mt-1 text-sm text-red-600">{errors.learning_objectives}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Separa múltiples objetivos con comas
            </p>
          </div>

          {/* Áreas de Enfoque Específico */}
          <div>
            <label htmlFor="specific_focus" className="block text-sm font-medium text-gray-700 mb-1">
              Áreas de Enfoque Específico *
            </label>
            <input
              id="specific_focus"
              name="specific_focus"
              type="text"
              value={formData.specific_focus}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.specific_focus ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ej. Arquitectura de clases, Manejo de errores, Testing"
              disabled={loading}
            />
            {errors.specific_focus && (
              <p className="mt-1 text-sm text-red-600">{errors.specific_focus}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Separa múltiples áreas con comas. Estas son las áreas donde deseas feedback específico.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando solicitud...
            </span>
          ) : (
            '✅ Solicitar Revisión'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Importante:</strong> Una vez creada la solicitud, un instructor asignará un revisor 
              dentro de las próximas 24 horas. Recibirás una notificación cuando tu código haya sido revisado.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
