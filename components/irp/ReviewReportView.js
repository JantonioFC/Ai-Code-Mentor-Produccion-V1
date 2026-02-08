/**
 * COMPONENTE: VISUALIZACIÓN DE INFORME DE REVISIÓN IRP
 * 
 * @description Muestra los detalles completos de una revisión de código generada por IA
 *              Implementa el modelo pedagógico con estructura clara y accesible
 *              Compatible con Contrato de API v1.0 (Servicio IRP)
 * 
 * @author Mentor Coder
 * @version 2.0.0
 * @created 2025-09-30
 * @updated 2025-09-30 (Misión 199.2 Fase 2 - Refactorización para objetos complejos)
 * 
 * FUENTE DE VERDAD: Contrato de API v1.0 (Servicio IRP).md
 * ARQUITECTURA: ARQUITECTURA_VIVA_v12.0.md
 * 
 * PROPS:
 * - reviewId {string}: ID de la revisión a mostrar
 * - onClose {function}: Callback para cerrar la vista
 * 
 * CHANGELOG v2.0.0:
 * - Refactorizado para manejar objetos complejos en lugar de strings simples
 * - Agregado renderizado de metadata rica (archivo_referencia, linea_referencia, prioridad)
 * - Mejorada visualización pedagógica con badges de categoría y prioridad
 * - Implementado renderizado de contexto en preguntas de reflexión
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import LessonFeedback from '../common/LessonFeedback';

/**
 * Componente principal de visualización del informe
 */
export default function ReviewReportView({ reviewId, onClose }) {
  const { getValidInternalToken } = useAuth();

  // Estados
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadMarkdown = async () => {
    if (!review) return;
    try {
      setIsExporting(true);
      const res = await fetch(`/api/v1/export/markdown?id=${review.review_id}`);
      if (!res.ok) throw new Error('Error al descargar el informe');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IA-Code-Mentor-Review-${review.review_id}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ [EXPORT-UI] Error downloading report:', err);
      alert('Hubo un problema al generar el archivo de descarga.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Carga los detalles de la revisión
   */
  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener token del usuario
        const token = await getValidInternalToken();

        if (!token) {
          throw new Error('No se pudo obtener el token de autenticación');
        }

        // Llamar al endpoint del sistema principal (proxy)
        const response = await fetch(`/api/v1/irp/reviews/${reviewId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar la revisión');
        }

        const data = await response.json();
        setReview(data);

      } catch (err) {
        console.error('[REVIEW-REPORT] Error cargando revisión:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (reviewId) {
      fetchReviewDetails();
    }
  }, [reviewId, getValidInternalToken]);

  /**
   * Renderiza un badge de categoría
   */
  const renderCategoryBadge = (categoria) => {
    return (
      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        {categoria}
      </span>
    );
  };

  /**
   * Renderiza un badge de prioridad
   */
  const renderPriorityBadge = (prioridad) => {
    const configs = {
      'alta': {
        text: 'Prioridad Alta',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: '🔴'
      },
      'media': {
        text: 'Prioridad Media',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '🟡'
      },
      'baja': {
        text: 'Prioridad Baja',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: '🟢'
      }
    };

    const config = configs[prioridad] || configs['media'];

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.bgColor} ${config.textColor}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  /**
   * Renderiza referencia a archivo y línea
   */
  const renderFileReference = (archivo, linea) => {
    if (!archivo && !linea) return null;

    return (
      <div className="mt-2 flex items-center text-sm text-gray-600">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">
          {archivo}{linea ? `:${linea}` : ''}
        </code>
      </div>
    );
  };

  /**
   * Renderiza puntos fuertes (objetos con categoría, descripción, archivo, línea)
   */
  const renderPuntosFuertes = (puntosFuertes) => {
    if (!puntosFuertes || puntosFuertes.length === 0) {
      return (
        <div className="text-gray-500 italic text-center py-4">
          No hay puntos fuertes registrados en esta revisión.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {puntosFuertes.map((punto, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Categoría */}
            <div className="mb-2">
              {renderCategoryBadge(punto.categoria)}
            </div>

            {/* Descripción */}
            <p className="text-gray-700 leading-relaxed mb-2">
              {punto.descripcion}
            </p>

            {/* Referencia a archivo */}
            {renderFileReference(punto.archivo_referencia, punto.linea_referencia)}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renderiza sugerencias de mejora (objetos con categoría, descripción, archivo, línea, prioridad)
   */
  const renderSugerenciasMejora = (sugerencias) => {
    if (!sugerencias || sugerencias.length === 0) {
      return (
        <div className="text-gray-500 italic text-center py-4">
          No hay sugerencias de mejora en esta revisión.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sugerencias.map((sugerencia, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Categoría y Prioridad */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {renderCategoryBadge(sugerencia.categoria)}
              {sugerencia.prioridad && renderPriorityBadge(sugerencia.prioridad)}
            </div>

            {/* Descripción */}
            <p className="text-gray-700 leading-relaxed mb-2">
              {sugerencia.descripcion}
            </p>

            {/* Referencia a archivo */}
            {renderFileReference(sugerencia.archivo_referencia, sugerencia.linea_referencia)}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renderiza preguntas para la reflexión (objetos con pregunta y contexto)
   */
  const renderPreguntasReflexion = (preguntas) => {
    if (!preguntas || preguntas.length === 0) {
      return (
        <div className="text-gray-500 italic text-center py-4">
          No hay preguntas de reflexión en esta revisión.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {preguntas.map((pregunta, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Pregunta */}
            <div className="flex items-start mb-3">
              <span className="text-purple-500 text-xl mr-2 mt-1">❓</span>
              <p className="text-gray-800 font-medium leading-relaxed flex-1">
                {pregunta.pregunta}
              </p>
            </div>

            {/* Contexto */}
            {pregunta.contexto && (
              <div className="mt-3 pl-7">
                <p className="text-sm text-gray-600 italic bg-purple-50 p-3 rounded-lg">
                  <strong>Contexto:</strong> {pregunta.contexto}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renderiza la calificación con estrellas
   */
  const renderRating = (value, label) => {
    const maxStars = 5;
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-gray-700 font-medium">{label}:</span>
        <div className="flex items-center space-x-1">
          {[...Array(maxStars)].map((_, index) => (
            <span key={index} className={index < value ? 'text-yellow-400' : 'text-gray-300'}>
              ⭐
            </span>
          ))}
          <span className="ml-2 text-gray-600">({value}/5)</span>
        </div>
      </div>
    );
  };

  /**
   * Renderiza el badge de recomendación
   */
  const renderRecommendation = (recommendation) => {
    const configs = {
      'approve': {
        text: 'Aprobado',
        icon: '✅',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300'
      },
      'approve_with_minor_changes': {
        text: 'Aprobado con cambios menores',
        icon: '✏️',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300'
      },
      'major_revision_needed': {
        text: 'Requiere revisión mayor',
        icon: '🔧',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300'
      }
    };

    const config = configs[recommendation] || configs['approve_with_minor_changes'];

    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        <span className="text-xl mr-2">{config.icon}</span>
        <span className="font-semibold">{config.text}</span>
      </div>
    );
  };

  /**
   * Renderiza estado de carga
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500"></div>
        <p className="mt-4 text-gray-600">Cargando informe de revisión...</p>
      </div>
    );
  }

  /**
   * Renderiza estado de error
   */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-red-500 text-4xl mr-4">⚠️</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar el informe
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🔄 Reintentar
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Volver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Renderiza el informe completo
   */
  return (
    <div className="space-y-6">
      {/* Header con botón de volver */}
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          🤖 Informe de Auditoría por IA
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadMarkdown}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300 font-medium text-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? '⌛ Generando...' : '📝 Descargar Markdown'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Historial
            </button>
          )}
        </div>
      </div>

      {/* Mensaje del Mentor / Tutor */}
      {review.mensaje_tutor && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">Comentario de tu Mentor IA</h3>
            <p className="text-xl font-medium leading-relaxed italic">&quot;{review.mensaje_tutor}&quot;</p>
          </div>
        </div>
      )}

      {/* Información del Proyecto */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📁</span> Contexto de la Auditoría
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Proyecto</p>
            <p className="text-lg font-semibold text-gray-800">{review.project_info.project_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Progreso Curricular</p>
            <p className="text-lg font-semibold text-gray-800">
              Fase {review.project_info.phase} • Semana {review.project_info.week}
            </p>
          </div>
          {review.project_info.github_repo_url && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Repositorio en GitHub</p>
              <a
                href={review.project_info.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center"
              >
                {review.project_info.github_repo_url}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Metadata de la Revisión */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Auditor Asignado</p>
            <p className="font-semibold text-gray-800">Gemini 2.5 Flash (Curricular Audit Mode)</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold">Fecha de Auditoría</p>
          <p className="font-semibold text-gray-800">
            {new Date(review.reviewer_info.review_date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Recomendación General */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🎯 Recomendación General
        </h2>
        <div className="flex justify-center">
          {renderRecommendation(review.recomendacion)}
        </div>
      </div>

      {/* Calificación General */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📊 Calificación por Categorías
        </h2>
        <div className="space-y-2">
          {renderRating(review.calificacion_general.claridad_codigo, 'Claridad del Código')}
          {renderRating(review.calificacion_general.arquitectura, 'Arquitectura y Diseño')}
          {renderRating(review.calificacion_general.testing, 'Testing y Calidad')}
          {renderRating(review.calificacion_general.documentacion, 'Documentación')}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-between py-2">
              <span className="text-lg font-bold text-gray-800">Calificación Total:</span>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600 mr-2">
                  {review.calificacion_general.total}
                </span>
                <span className="text-gray-600">/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Puntos Fuertes */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">✅</span>
          Puntos Fuertes
        </h2>
        {renderPuntosFuertes(review.feedback.puntos_fuertes)}
      </div>

      {/* Sugerencias de Mejora */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Sugerencias de Mejora
        </h2>
        {renderSugerenciasMejora(review.feedback.sugerencias_mejora)}
      </div>

      {/* Preguntas para la Reflexión */}
      {review.feedback.preguntas_reflexion && review.feedback.preguntas_reflexion.length > 0 && (
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🤔</span>
            Preguntas para la Reflexión
          </h2>
          {renderPreguntasReflexion(review.feedback.preguntas_reflexion)}
        </div>
      )}

      {/* Información Adicional */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          ℹ️ Información Adicional
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tiempo de Revisión:</p>
            <p className="text-lg font-semibold text-gray-800">
              {review.tiempo_revision_horas} hora{review.tiempo_revision_horas !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ID de Revisión:</p>
            <p className="text-sm font-mono text-gray-600">{review.review_id}</p>
          </div>
        </div>
      </div>

      {/* Sistema de Feedback para Refuerzo de IA */}
      <LessonFeedback
        lessonId={review.review_id}
        sessionId={review.session_id || null}
      />

      {/* Footer con Metodología */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 text-center">
        <p className="text-sm text-gray-700">
          <strong>🎓 Metodología Ecosistema 360</strong>
          <br />
          Esta revisión fue generada siguiendo principios de feedback constructivo y orientación pedagógica.
          <br />
          Utiliza estas sugerencias como guía para mejorar tus habilidades de desarrollo.
        </p>
      </div>

      {/* Botón de acción al final */}
      {onClose && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ← Volver al Historial de Revisiones
          </button>
        </div>
      )}
    </div>
  );
}
