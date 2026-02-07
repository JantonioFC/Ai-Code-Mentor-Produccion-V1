/**
 * PÁGINA: SISTEMA DE REVISIÓN POR PARES (PEER REVIEW)
 * 
 * @description Interfaz unificada para el sistema completo de Revisión por Pares
 *              integrado con el Microservicio IRP según Contrato de API v1.0
 * 
 * @author Mentor Coder
 * @version 3.0.0 - Con Visualizaciones Integradas (MISIÓN 210.0)
 * @created 2025-09-29
 * @updated 2025-10-06
 * 
 * FUENTE DE VERDAD: Contrato de API v1.0 (Servicio IRP).md
 * ARQUITECTURA: ARQUITECTURA_VIVA_v13.2.md
 * 
 * MISIÓN 210.0: Visualizaciones de métricas integradas desde common/charts
 * 
 * FUNCIONALIDADES:
 * - Solicitar revisión de código (POST /api/v1/irp/reviews/request)
 * - Ver historial de revisiones (GET /api/v1/irp/reviews/history)
 * - Ver métricas personales con gráficos (GET /api/v1/irp/reviews/metrics/{userId})
 * - Dashboard de revisiones pendientes y completadas
 */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';
import ReviewRequestForm from '../components/irp/ReviewRequestForm';
import ReviewHistoryList from '../components/irp/ReviewHistoryList';
import ReviewReportView from '../components/irp/ReviewReportView';
import { useAuth } from '../lib/auth/useAuth';
import { useUserMetrics } from '../hooks/useUserMetrics';

// MISIÓN 210.0: Importar componentes de visualización de forma dinámica (ssr: false)
// Esto mejora el performance al no cargar Chart.js en el bundle inicial del servidor
const TrendChart = dynamic(() => import('../components/common/charts/TrendChart'), { ssr: false });
const QualityGauge = dynamic(() => import('../components/common/charts/QualityGauge'), { ssr: false });
const ComparisonBar = dynamic(() => import('../components/common/charts/ComparisonBar'), { ssr: false });
const TimelineChart = dynamic(() => import('../components/common/charts/TimelineChart'), { ssr: false });

/**
 * Componente principal de la página de Peer Review
 */
export default function PeerReviewPage() {
  const router = useRouter();
  const { user, internalToken } = useAuth();

  // Estado de vista activa: 'dashboard' | 'request' | 'history' | 'view-report'
  const [activeView, setActiveView] = useState('dashboard');

  // Estado para almacenar el ID de la revisión seleccionada
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  // MISIÓN 210.0: Obtener métricas del usuario para visualizaciones
  const {
    metrics,
    loading: metricsLoading,
    error: metricsError
  } = useUserMetrics(user?.id, {
    period: 'month',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutos
    token: internalToken
  });

  /**
   * Maneja éxito al crear solicitud de revisión
   */
  const handleRequestSuccess = (data) => {
    setNotification({
      type: 'success',
      title: '✅ Solicitud Creada',
      message: `Tu solicitud de revisión para "${data.project_name || 'el proyecto'}" ha sido creada exitosamente. Nuestro Revisor IA está procesando tu código.`,
    });

    // Volver al dashboard después de 3 segundos
    setTimeout(() => {
      setActiveView('dashboard');
      setNotification(null);
    }, 3000);
  };

  /**
   * Maneja error al crear solicitud
   */
  const handleRequestError = (error) => {
    setNotification({
      type: 'error',
      title: '❌ Error',
      message: error.message || 'Ocurrió un error al crear la solicitud de revisión.',
    });

    // Limpiar notificación después de 5 segundos
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  /**
   * Maneja clic en ver detalles de una revisión
   */
  const handleViewDetails = (review) => {
    console.log('[PEER-REVIEW] Ver detalles de revisión:', review);

    // Guardar el ID de la revisión y cambiar a vista de reporte
    setSelectedReviewId(review.review_id);
    setActiveView('view-report');
  };

  /**
   * Maneja el cierre de la vista de reporte
   */
  const handleCloseReport = () => {
    setSelectedReviewId(null);
    setActiveView('history');
  };

  /**
   * Prepara datos para los gráficos de tendencia
   */
  const prepareTrendData = () => {
    if (!metrics?.reviewer_metrics) return [];

    // Simular datos de tendencia basados en métricas actuales
    // TODO: Cuando el backend envíe datos históricos, usar esos datos
    const { total_reviews_completed = 0, average_rating_given = 0 } = metrics.reviewer_metrics;

    return [
      { period: 'Sem 1', value: Math.max(0, average_rating_given - 0.5) },
      { period: 'Sem 2', value: Math.max(0, average_rating_given - 0.3) },
      { period: 'Sem 3', value: Math.max(0, average_rating_given - 0.1) },
      { period: 'Sem 4', value: average_rating_given }
    ];
  };

  /**
   * Prepara datos para timeline
   */
  const prepareTimelineData = () => {
    if (!metrics?.reviewer_metrics) return [];

    const { total_reviews_completed = 0 } = metrics.reviewer_metrics;

    return [
      { period: 'Esta semana', count: Math.ceil(total_reviews_completed * 0.3), label: 'Revisiones' },
      { period: 'Semana pasada', count: Math.ceil(total_reviews_completed * 0.25), label: 'Revisiones' },
      { period: 'Hace 2 semanas', count: Math.ceil(total_reviews_completed * 0.25), label: 'Revisiones' },
      { period: 'Hace 3 semanas', count: Math.ceil(total_reviews_completed * 0.2), label: 'Revisiones' }
    ];
  };

  /**
   * Renderiza el dashboard principal con métricas integradas
   */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          🤖 Revisor de Código con IA
        </h1>
        <p className="text-blue-100 text-lg">
          Recibe análisis automatizado de tu código con sugerencias de mejora basadas en mejores prácticas
        </p>
      </div>

      {/* Notificación si existe */}
      {notification && (
        <div className={`rounded-lg p-4 border ${notification.type === 'success'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
          }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                {notification.title}
              </h3>
              <p className={`mt-1 text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MISIÓN 210.0: Sección de Métricas con Visualizaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            📊 Mis Métricas de Revisión
          </h2>
        </div>

        {metricsError && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ No se pudieron cargar las métricas. Mostrando vista básica.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Gauge */}
          <QualityGauge
            score={metrics?.reviewer_metrics?.average_rating_given || 0}
            maxScore={5.0}
            title="Calidad Promedio de Revisiones"
            loading={metricsLoading}
          />

          {/* Trend Chart */}
          <TrendChart
            data={prepareTrendData()}
            metric="quality_score"
            loading={metricsLoading}
          />

          {/* Comparison Bar */}
          <ComparisonBar
            userValue={metrics?.reviewer_metrics?.total_reviews_completed || 0}
            averageValue={15}
            title="Revisiones Completadas vs Promedio"
            metric="Revisiones"
            unit=""
            maxValue={30}
            loading={metricsLoading}
          />

          {/* Timeline Chart */}
          <TimelineChart
            data={prepareTimelineData()}
            title="Actividad Reciente"
            color="#8b5cf6"
            loading={metricsLoading}
          />
        </div>

        {/* Resumen de Estadísticas */}
        {metrics && !metricsLoading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-700">Total Revisiones</p>
              <p className="text-2xl font-bold text-blue-900">
                {metrics.reviewer_metrics?.total_reviews_completed || 0}
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-700">Puntuación Promedio</p>
              <p className="text-2xl font-bold text-green-900">
                {(metrics.reviewer_metrics?.average_rating_given || 0).toFixed(1)} / 5.0
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-sm font-medium text-purple-700">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-purple-900">
                {(metrics.reviewer_metrics?.average_review_time_hours || 0).toFixed(1)}h
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Acciones Rápidas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Solicitar Revisión */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg transition-all">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 ml-3">
              Solicitar Revisión
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            Envía tu código para recibir un análisis detallado de nuestro Revisor IA
            sobre arquitectura, buenas prácticas y mejoras potenciales.
          </p>
          <button
            onClick={() => setActiveView('request')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Nueva Solicitud
          </button>
        </div>

        {/* Ver Historial */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-lg transition-all">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 ml-3">
              Mi Historial
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            Consulta el estado de tus solicitudes y lee los informes
            generados por la IA para tus proyectos.
          </p>
          <button
            onClick={() => setActiveView('history')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Ver Historial
          </button>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              🤖 ¿Cómo funciona la Revisión por IA?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  <strong>Crea una solicitud:</strong> Proporciona el enlace a tu repositorio
                  y una descripción de tu proyecto.
                </li>
                <li>
                  <strong>Análisis automático:</strong> Nuestro Revisor IA (potenciado por Gemini)
                  analizará tu código, buscando áreas de mejora.
                </li>
                <li>
                  <strong>Recibe feedback:</strong> En pocos minutos, recibirás un informe
                  estructurado con sugerencias constructivas y referencias a la documentación oficial.
                </li>
                <li>
                  <strong>Mejora tu código:</strong> Aplica las sugerencias recibidas y aprende
                  de la experiencia para mejorar tus habilidades.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza el formulario de solicitud de revisión
   */
  const renderRequestForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          📝 Nueva Solicitud de Revisión
        </h1>
        <button
          onClick={() => setActiveView('dashboard')}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Dashboard
        </button>
      </div>

      <ReviewRequestForm
        onSuccess={handleRequestSuccess}
        onError={handleRequestError}
      />
    </div>
  );

  /**
   * Renderiza el historial de revisiones
   */
  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          📚 Mi Historial de Revisiones
        </h1>
        <button
          onClick={() => setActiveView('dashboard')}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Dashboard
        </button>
      </div>

      <ReviewHistoryList onViewDetails={handleViewDetails} />
    </div>
  );

  /**
   * Renderiza la vista de detalles del reporte
   */
  const renderReportView = () => (
    <div className="space-y-6">
      <ReviewReportView
        reviewId={selectedReviewId}
        onClose={handleCloseReport}
      />
    </div>
  );

  return (
    <ProtectedRoute>
      <PrivateLayout title="Revisor de Código IA - AI Code Mentor">
        <div className="max-w-6xl mx-auto">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'request' && renderRequestForm()}
          {activeView === 'history' && renderHistory()}
          {activeView === 'view-report' && renderReportView()}
        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
