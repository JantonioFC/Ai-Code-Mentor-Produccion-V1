/**
 * Componente de Búsqueda y Filtrado en Historial
 * Permite buscar análisis por texto, lenguaje y fecha
 * 
 * @component HistorySearch
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Componente de búsqueda en historial
 * @param {Object} props
 * @param {Function} props.onSearch - Callback cuando hay resultados
 * @param {Array} props.history - Historial completo
 */
export default function HistorySearch({ onSearch, history = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        language: 'all',
        dateRange: 'all'
    });
    const [isSearching, setIsSearching] = useState(false);
    const [resultCount, setResultCount] = useState(0);

    // Función de búsqueda
    const performSearch = useCallback(() => {
        setIsSearching(true);

        try {
            let results = [...history];

            // Filtro por texto
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                results = results.filter(item => {
                    const matchesCode = item.code?.toLowerCase().includes(term);
                    const matchesFeedback = item.result?.analysis?.feedback?.toLowerCase().includes(term);
                    const matchesLanguage = item.language?.toLowerCase().includes(term);
                    return matchesCode || matchesFeedback || matchesLanguage;
                });
            }

            // Filtro por lenguaje
            if (filters.language !== 'all') {
                results = results.filter(item => item.language === filters.language);
            }

            // Filtro por fecha
            if (filters.dateRange !== 'all') {
                const now = new Date();
                let cutoffDate;

                switch (filters.dateRange) {
                    case 'today':
                        cutoffDate = new Date(now.setHours(0, 0, 0, 0));
                        break;
                    case 'week':
                        cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        cutoffDate = null;
                }

                if (cutoffDate) {
                    results = results.filter(item =>
                        new Date(item.timestamp) >= cutoffDate
                    );
                }
            }

            setResultCount(results.length);
            onSearch?.(results);

        } catch (error) {
            console.error('[HistorySearch] Error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [history, searchTerm, filters, onSearch]);

    // Debounce de búsqueda
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [performSearch]);

    // Obtener lenguajes únicos del historial
    const uniqueLanguages = [...new Set(history.map(item => item.language).filter(Boolean))];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            {/* Barra de búsqueda */}
            <div className="mb-3">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar en código o feedback..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-3">
                {/* Filtro de lenguaje */}
                <select
                    value={filters.language}
                    onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Todos los lenguajes</option>
                    {uniqueLanguages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>

                {/* Filtro de fecha */}
                <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Todo el tiempo</option>
                    <option value="today">Hoy</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mes</option>
                </select>

                {/* Botón de limpiar filtros */}
                {(searchTerm || filters.language !== 'all' || filters.dateRange !== 'all') && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilters({ language: 'all', dateRange: 'all' });
                        }}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Contador de resultados */}
            <div className="text-sm text-gray-600">
                {isSearching ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Buscando...
                    </span>
                ) : (
                    <span>
                        {resultCount === history.length
                            ? `${resultCount} análisis en historial`
                            : `${resultCount} de ${history.length} resultados`}
                    </span>
                )}
            </div>
        </div>
    );
}
