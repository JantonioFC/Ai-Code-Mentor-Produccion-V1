/**
 * Índice de Componentes del Dashboard IRP
 * 
 * Exporta todos los componentes del dashboard de forma centralizada.
 * 
 * ACTUALIZADO MISIÓN 210.0: Componentes de gráficos ahora importados desde common/charts
 * 
 * @author Mentor Coder
 * @version 2.0.0
 * @created 2025-10-05
 * @updated 2025-10-06 (MISIÓN 210.0 - Consolidación)
 * @mission 204.0 - Dashboard de Métricas IRP
 * @mission 210.0 - Realineación del Dashboard IRP
 */

// Componentes específicos del Dashboard IRP
export { default as MetricsSummary } from './MetricsSummary';
export { default as PeriodSelector } from './PeriodSelector';
export { default as InsightPanel } from './InsightPanel';
export { default as ReviewerMetrics } from './ReviewerMetrics';
export { default as AuthorMetrics } from './AuthorMetrics';
export { default as ReviewHistory } from './ReviewHistory';

// Componentes de Gráficos - ELIMINADO DE ESTE BARRIL (Task 2.7)
// Use importaciones directas o desde common/charts para mejor control de bundle

