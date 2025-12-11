/**
 * ReviewHistoryList Component - MISIÓN 195 FASE 2
 * 
 * @description Componente de dashboard para mostrar historial de revisiones
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-09-28
 * 
 * FUENTE DE VERDAD: Contrato de API v1.0 (Servicio IRP).md
 * ENDPOINT: GET /api/v1/irp/reviews/history
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth/useAuth';

/**
 * Badge de estado visual para revisiones
 */
function ReviewStatusBadge({ status }) {
  const statusConfig = {
    pending_assignment: {
      label: 'Pendiente de Asignación',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⏳',
    },
    assigned: {
      label: 'Asignada',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '👤',
    },
    in_progress: {
      label: 'En Progreso',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '📝',
    },
    completed: {
      label: 'Completada',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
    },
    expired: {
      label: 'Expirada',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '⏰',
    },
  };

  const config = statusConfig[status] || statusConfig.pending_assignment;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}

/**
 * Tarjeta individual de revisión
 */
function ReviewCard({ review, onViewDetails, role }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleInfo = () => {
    if (role === 'reviewer') {
      return {
        label: 'Autor',
        name: review.author_name || 'N/A',
        action: 'Revisar',
      };
    }
    return {
      label: 'Tu solicitud',
      name: review.project_name,
      action: 'Ver detalles',
    };
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all">
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {review.project_name}
          </h3>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{roleInfo.label}:</span> {roleInfo.name}
          </p>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      {/* Información contextual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Fase</p>
          <p className="font-medium text-gray-800">Fase {review.phase}</p>
        </div>
        <div>
          <p className="text-gray-500">Semana</p>
          <p className="font-medium text-gray-800">Semana {review.week}</p>
        </div>
        <div>
          <p className="text-gray-500">Fecha</p>
          <p className="font-medium text-gray-800">
            {formatDate(review.submitted_at || review.created_at)}
          </p>
        </div>
        {review.calificacion_promedio && (
          <div>
            <p className="text-gray-500">Calificación</p>
            <p className="font-medium text-gray-800">
              ⭐ {review.calificacion_promedio.toFixed(1)}/5
            </p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(review)}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {roleInfo.action}
        </button>
        {review.github_repo_url && (
          <a
            href={review.github_repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Componente principal: Lista de historial de revisiones
 */
export default function ReviewHistoryList({ onViewDetails }) {
  const router = useRouter();
  const { session, getValidInternalToken } = useAuth(); // MISIÓN 197.1: Obtener función de token válido

  // Estado de datos
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de filtros
  const [filters, setFilters] = useState({
    role: 'both',      // 'author', 'reviewer', 'both'
    status: 'all',     // 'pending', 'completed', 'all'
    phase: '',         // filtro por fase (vacío = todas)
  });

  // Estado de paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  /**
   * Carga el historial de revisiones desde la API
   */
  const fetchReviewHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // MISIÓN 197.1: Obtener token interno válido (renovado si es necesario)
      const token = await getValidInternalToken();
      
      if (!token) {
        throw new Error('No se pudo obtener token válido. Por favor, inicia sesión nuevamente.');
      }
      
      console.log('🔐 [REVIEW-HISTORY] Usando token interno para IRP');

      // Construir query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.role !== 'both') {
        queryParams.append('role', filters.role);
      }
      
      if (filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      if (filters.phase) {
        queryParams.append('phase', filters.phase);
      }

      queryParams.append('limit', '20');
      queryParams.append('offset', (pagination.currentPage - 1) * 20);

      console.log('[REVIEW-HISTORY] Fetching con filtros:', Object.fromEntries(queryParams));

      // Llamar a la API
      const response = await fetch(`/api/v1/irp/reviews/history?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Error HTTP ${response.status}`);
      }

      console.log('[REVIEW-HISTORY] Datos obtenidos:', data);

      // Actualizar estado
      setReviews(data.reviews || []);
      
      if (data.pagination) {
        setPagination({
          currentPage: data.pagination.current_page || 1,
          totalPages: data.pagination.total_pages || 1,
          hasNext: data.pagination.has_next || false,
          hasPrev: data.pagination.has_prev || false,
        });
      }

    } catch (err) {
      console.error('[REVIEW-HISTORY] Error cargando historial:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial al montar y cuando cambien los filtros
  useEffect(() => {
    fetchReviewHistory();
  }, [filters, pagination.currentPage]);

  /**
   * Maneja cambios en los filtros
   */
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
    
    // Resetear a página 1 cuando cambian los filtros
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  };

  /**
   * Navega a la página anterior
   */
  const handlePreviousPage = () => {
    if (pagination.hasPrev) {
      setPagination(prev => ({
        ...prev,
        currentPage: prev.currentPage - 1,
      }));
    }
  };

  /**
   * Navega a la página siguiente
   */
  const handleNextPage = () => {
    if (pagination.hasNext) {
      setPagination(prev => ({
        ...prev,
        currentPage: prev.currentPage + 1,
      }));
    }
  };

  // ============================================================================
  // RENDER: ESTADO DE CARGA
  // ============================================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Cargando historial de revisiones...</p>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ESTADO DE ERROR
  // ============================================================================
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Error al cargar el historial
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchReviewHistory}
              className="mt-3 bg-red-100 text-red-800 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: CONTENIDO PRINCIPAL
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Panel de Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          🔍 Filtros de Búsqueda
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Filtro por Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Revisión
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="both">Todas (Autor y Revisor)</option>
              <option value="author">Como Autor (Mis Solicitudes)</option>
              <option value="reviewer">Como Revisor (Asignadas a Mí)</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>

          {/* Filtro por Fase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fase
            </label>
            <select
              value={filters.phase}
              onChange={(e) => handleFilterChange('phase', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las Fases</option>
              <option value="1">Fase 1 - Fundamentos</option>
              <option value="2">Fase 2 - Frontend Básico</option>
              <option value="3">Fase 3 - Backend</option>
              <option value="4">Fase 4 - Full-Stack</option>
              <option value="5">Fase 5 - Especialización</option>
              <option value="6">Fase 6 - Proyectos Reales</option>
              <option value="7">Fase 7 - Portafolio</option>
              <option value="8">Fase 8 - Profesional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Revisiones */}
      {reviews.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No se encontraron revisiones
          </h3>
          <p className="text-gray-600 mb-6">
            {filters.role === 'author' && 'Aún no has solicitado ninguna revisión.'}
            {filters.role === 'reviewer' && 'No tienes revisiones asignadas todavía.'}
            {filters.role === 'both' && 'Cambia los filtros o crea tu primera solicitud de revisión.'}
          </p>
          <button
            onClick={() => router.push('/peer-review?view=request')}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Solicitar Primera Revisión
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.review_id || `review-${review.project_name}-${review.phase}-${review.week}`}
              review={review}
              onViewDetails={onViewDetails}
              role={review.role}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {reviews.length > 0 && pagination.totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousPage}
              disabled={!pagination.hasPrev}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                pagination.hasPrev
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            <span className="text-sm text-gray-600">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNext}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                pagination.hasNext
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Siguiente
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
