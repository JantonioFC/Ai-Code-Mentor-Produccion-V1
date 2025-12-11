/**
 * Utilidades de Lazy Loading para AI Code Mentor
 * Simplifica la carga diferida de componentes pesados
 * 
 * @module lib/utils/lazyLoad
 */

import dynamic from 'next/dynamic';

/**
 * Componente de loading por defecto
 */
const DefaultLoader = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

/**
 * Componente de error por defecto
 */
const DefaultError = ({ error, retry }) => (
    <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        <p className="font-medium">Error cargando componente</p>
        <p className="text-sm text-red-500">{error?.message || 'Error desconocido'}</p>
        {retry && (
            <button
                onClick={retry}
                className="mt-2 text-sm text-blue-600 hover:underline"
            >
                Reintentar
            </button>
        )}
    </div>
);

/**
 * Crear componente con lazy loading optimizado
 * 
 * @param {Function} importFn - Función de importación dinámica
 * @param {Object} options - Opciones de configuración
 * @returns {Component} - Componente con lazy loading
 * 
 * @example
 * const HeavyChart = lazyLoad(() => import('./HeavyChart'));
 * const Dashboard = lazyLoad(() => import('./Dashboard'), { ssr: true });
 */
export function lazyLoad(importFn, options = {}) {
    const {
        loading: LoadingComponent = DefaultLoader,
        ssr = false,
        delay = 200
    } = options;

    return dynamic(importFn, {
        loading: LoadingComponent,
        ssr
    });
}

/**
 * Lazy loading específico para gráficos (Chart.js)
 * Deshabilita SSR por defecto ya que Chart.js requiere window
 */
export function lazyLoadChart(importFn) {
    return lazyLoad(importFn, { ssr: false });
}

/**
 * Lazy loading para componentes de formularios pesados
 */
export function lazyLoadForm(importFn) {
    return lazyLoad(importFn, { ssr: true, delay: 100 });
}

/**
 * Lazy loading para modales
 */
export function lazyLoadModal(importFn) {
    return lazyLoad(importFn, { ssr: false });
}

/**
 * Componentes comunes pre-configurados para lazy loading
 */
export const LazyComponents = {
    // Gráficos
    TrendChart: lazyLoadChart(() => import('../../components/common/charts/TrendChart')),
    QualityGauge: lazyLoadChart(() => import('../../components/common/charts/QualityGauge')),
    ComparisonBar: lazyLoadChart(() => import('../../components/common/charts/ComparisonBar')),
    TimelineChart: lazyLoadChart(() => import('../../components/common/charts/TimelineChart')),

    // Dashboards pesados
    EnhancedDashboard: lazyLoad(() => import('../../components/dashboard/EnhancedProgressDashboard')),
    PortfolioExport: lazyLoad(() => import('../../components/ProjectTracking/PortfolioExportSystem'))
};

/**
 * HOC para precargar un componente al hover
 * 
 * @example
 * <PreloadOnHover load={() => import('./HeavyComponent')}>
 *   <button>Hover me</button>
 * </PreloadOnHover>
 */
export function PreloadOnHover({ load, children }) {
    const handleMouseEnter = () => {
        // Precargar el componente
        load().catch(() => {
            // Ignorar errores de precarga
        });
    };

    return (
        <div onMouseEnter={handleMouseEnter}>
            {children}
        </div>
    );
}
