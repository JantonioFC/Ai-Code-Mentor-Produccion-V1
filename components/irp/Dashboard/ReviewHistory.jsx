/**
 * Componente: ReviewHistory
 * 
 * Muestra la tabla de historial de revisiones con paginación funcional,
 * filtros y ordenamiento.
 * 
 * @author Mentor Coder
 * @version 3.0.0 (FASE 3 - API REAL)
 * @created 2025-10-05
 * @updated 2025-10-05 (Fase 3)
 * @mission 204.0 - Dashboard de Métricas IRP
 */

import React, { useState } from 'react';
import { useReviewHistory } from '../../../hooks/useUserMetrics';

/**
 * Componente de fila de revisión individual
 */
function ReviewRow({ review, onViewDetails }) {
  const roleIcon = review.role === 'reviewer' ? '👁️' : '✍️';
  const roleLabel = review.role === 'reviewer' ? 'Revisor' : 'Autor';
  const statusIcon = review.status === 'completed' ? '✅' : '⏳';
  const statusColor = review.status === 'completed' ? 'text-green-600' : 'text-yellow-600';

  return (
    <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-600">
        {review.submitted_at ? (
          <div>
            <p className="font-medium">
              {new Date(review.submitted_at).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(review.submitted_at).toLocaleDateString('es-ES', {
                year: 'numeric'
              })}
            </p>
          </div>
        ) : (
          <span className="text-gray-400">Pendiente</span>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{review.project_name}</p>
        <p className="text-xs text-gray-500">
          Fase {review.phase} • Semana {review.week}
        </p>
      </td>
      <td className="px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100">
          <span>{roleIcon}</span>
          <span className="text-gray-700 font-medium">{roleLabel}</span>
        </span>
      </td>
      <td className="px-4 py-3">
        {review.calificacion_promedio !== null ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-800">
                  {review.calificacion_promedio.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              {/* Barra de progreso visual */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className={`h-1.5 rounded-full ${
                    review.calificacion_promedio >= 4.5 ? 'bg-green-500' :
                    review.calificacion_promedio >= 4.0 ? 'bg-blue-500' :
                    review.calificacion_promedio >= 3.5 ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${(review.calificacion_promedio / 5.0) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm italic">Sin calificar</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center gap-1 ${statusColor}`}>
          <span>{statusIcon}</span>
          <span className="font-medium">
            {review.status === 'completed' ? 'Completada' : 'Pendiente'}
          </span>
        </span>
      </td>
      <td className="px-4 py-3">
        <button 
          onClick={() => onViewDetails(review)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors hover:underline"
        >
          Ver Detalles →
        </button>
      </td>
    </tr>
  );
}

/**
 * Barra de filtros
 */
function FilterBar({ filters, onFilterChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Filtro de Rol */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Rol:</label>
        <select
          value={filters.role}
          onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="both">Ambos</option>
          <option value="reviewer">👁️ Revisor</option>
          <option value="author">✍️ Autor</option>
        </select>
      </div>

      {/* Filtro de Estado */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Estado:</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="completed">✅ Completadas</option>
          <option value="pending">⏳ Pendientes</option>
        </select>
      </div>

      {/* Ordenamiento */}
      <div className="flex items-center gap-2 ml-auto">
        <label className="text-sm font-medium text-gray-700">Ordenar:</label>
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="date">Fecha</option>
          <option value="rating">Rating</option>
          <option value="project">Proyecto</option>
        </select>
        <button
          onClick={() => onFilterChange({ 
            ...filters, 
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
          })}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          title={filters.sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}

/**
 * Componente principal de historial de revisiones
 */
export default function ReviewHistory({ limit = 10, token = null }) {
  const [filters, setFilters] = useState({
    role: 'both',
    status: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    limit,
    token // ✅ Incluir token en filtros
  });

  // ✅ CRÍTICO: Actualizar filtros cuando el token cambie
  React.useEffect(() => {
    if (token !== filters.token) {
      setFilters(prev => ({ ...prev, token }));
    }
  }, [token]);

  const { history, pagination, loading, error, loadNextPage, loadPrevPage, refresh } = useReviewHistory(filters);

  /**
   * Maneja click en "Ver Detalles"
   */
  const handleViewDetails = (review) => {
    // TODO: Implementar modal o navegación a página de detalles
    console.log('Ver detalles de revisión:', review);
    alert(`Ver detalles de: ${review.project_name}\n(Modal se implementará en próxima fase)`);
  };

  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📋 Historial de Revisiones
        </h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📋 Historial de Revisiones
        </h2>
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-700 font-medium">Error cargando historial</p>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          📋 Historial de Revisiones
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refrescar historial"
          >
            🔄 Refrescar
          </button>
          <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline">
            Ver Todo →
          </button>
        </div>
      </div>

      {/* Barra de filtros */}
      <FilterBar filters={filters} onFilterChange={setFilters} />

      {/* Tabla de revisiones */}
      {!history || history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">📝</p>
          <p className="font-medium">No hay revisiones {filters.status !== 'all' ? filters.status : ''}</p>
          <p className="text-sm mt-2">
            {filters.role === 'reviewer' 
              ? 'Comienza a revisar proyectos para verlos aquí'
              : filters.role === 'author'
              ? 'Solicita revisiones para tus proyectos'
              : 'Tus revisiones aparecerán aquí'
            }
          </p>
          {(filters.role !== 'both' || filters.status !== 'all') && (
            <button
              onClick={() => setFilters({ ...filters, role: 'both', status: 'all' })}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Proyecto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((review, index) => (
                  <ReviewRow 
                    key={review.review_id || index} 
                    review={review}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación mejorada */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-medium">{history.length}</span> de{' '}
                  <span className="font-medium">{pagination.total_reviews || 0}</span> revisiones
                </p>
                <p className="text-xs text-gray-500">
                  Página {pagination.current_page} de {pagination.total_pages}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={loadPrevPage}
                  disabled={!pagination.has_prev}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    pagination.has_prev
                      ? 'border-blue-500 text-blue-600 hover:bg-blue-50 active:scale-95'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ← Anterior
                </button>
                
                {/* Indicador de páginas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const page = i + 1;
                    const isCurrent = page === pagination.current_page;
                    return (
                      <div
                        key={page}
                        className={`w-2 h-2 rounded-full transition-all ${
                          isCurrent ? 'bg-blue-600 w-6' : 'bg-gray-300'
                        }`}
                      />
                    );
                  })}
                </div>
                
                <button
                  onClick={loadNextPage}
                  disabled={!pagination.has_next}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    pagination.has_next
                      ? 'border-blue-500 text-blue-600 hover:bg-blue-50 active:scale-95'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
