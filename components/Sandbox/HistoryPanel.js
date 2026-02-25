import { useState, useEffect, useCallback } from 'react';

// HistoryPanel.js - Panel de historial de generaciones del Sandbox
// Este componente se renderiza dentro de páginas autenticadas (AuthGate).
// La auth se maneja server-side via cookies httpOnly — no necesita useAuth.

export default function HistoryPanel({ onRestoreGeneration, refreshTrigger = 0 }) {
  const [generations, setGenerations] = useState([]);
  const [filteredGenerations, setFilteredGenerations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Función para obtener historial — cookies se envían automáticamente
  const fetchHistory = useCallback(async () => {
    // Only show loading spinner on first load or if list is empty
    if (generations.length === 0) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/sandbox/history');

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // keep original error
        }
        if (response.status === 401) {
          errorMessage = "Inicia sesión para ver tu historial";
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const loaded = data.data?.generations || [];
      setGenerations(loaded);

    } catch (error) {
      console.error('[HISTORY] Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [generations.length]); // Dependencies for internal logic, but triggered by effect below

  // Cargar historial al montar y cuando cambie refreshTrigger
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  // Filtrar generaciones cuando cambie el query o las generaciones
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGenerations(generations);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = generations.filter(gen =>
        gen.title.toLowerCase().includes(query)
      );
      setFilteredGenerations(filtered);
    }
  }, [searchQuery, generations]);

  // Función para eliminar generación
  const handleDeleteGeneration = async (generationId, title) => {
    // Confirmación nativa del navegador
    const confirmDelete = window.confirm(
      `¿Está seguro de que desea eliminar esta generación?\n\n"${title}"\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      console.log('🗑️ [HISTORY] Eliminando generación:', generationId);

      const response = await fetch(`/api/v1/sandbox/history/${generationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      console.log('✅ [HISTORY] Generación eliminada exitosamente');

      // Actualizar estado local sin recargar
      setGenerations(prev => prev.filter(gen => gen.id !== generationId));

      // Si la generación expandida fue eliminada, colapsar
      if (expandedId === generationId) {
        setExpandedId(null);
      }

    } catch (error) {
      console.error('❌ [HISTORY] Error eliminando:', error);
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  // Función para formatear fecha relativa
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Función para manejar click en generación
  const handleRestoreClick = (generation) => {
    console.log('🔄 [HISTORY] Restaurando generación:', generation.id);
    onRestoreGeneration(generation);
    setExpandedId(null); // Colapsar después de restaurar
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="font-bold text-base">Historial</h3>
          </div>
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Recargar historial"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="text-purple-100 text-xs mt-1">
          {generations.length > 0
            ? `${generations.length} generación${generations.length !== 1 ? 'es' : ''}`
            : 'Sin generaciones aún'
          }
          {searchQuery && ` (${filteredGenerations.length} mostradas)`}
        </p>
      </div>

      {/* Search Bar - MISIÓN 217.0 */}
      {generations.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en mi historial..."
              className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Cargando historial...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <span>⚠️</span>
              <span>Error: {error}</span>
            </div>
            <button
              onClick={fetchHistory}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && generations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm">Aún no has generado lecciones</p>
            <p className="text-xs text-gray-400 mt-1">
              Tus generaciones aparecerán aquí
            </p>
          </div>
        )}

        {/* No Results State - MISIÓN 217.0 */}
        {!isLoading && !error && generations.length > 0 && filteredGenerations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">No se encontraron resultados</p>
            <p className="text-xs text-gray-400 mt-1">
              Intenta con otros términos de búsqueda
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-purple-600 hover:text-purple-800 underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Generations List */}
        {!isLoading && !error && filteredGenerations.length > 0 && (
          <div className="divide-y divide-gray-200">
            {filteredGenerations.map((generation) => (
              <div
                key={generation.id}
                className="p-3 hover:bg-gray-50 transition-colors"
              >
                {/* Title and Controls */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4
                    className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === generation.id ? null : generation.id)}
                  >
                    {generation.title}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Delete Button - MISIÓN 217.0 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGeneration(generation.id, generation.title);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar generación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    {/* Expand Button */}
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === generation.id ? null : generation.id);
                      }}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedId === generation.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    🕒 {formatRelativeTime(generation.created_at)}
                  </span>
                  <span>•</span>
                  <span>{generation.custom_content?.length || 0} caracteres</span>
                </div>

                {/* Expanded Content */}
                {expandedId === generation.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {/* Preview */}
                    <div className="text-xs text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded">
                      {generation.custom_content}
                    </div>

                    {/* Restore Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreClick(generation);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restaurar Generación
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      {generations.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 rounded-b-xl border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Se mantienen las últimas 20 generaciones
          </p>
        </div>
      )}
    </div>
  );
}
