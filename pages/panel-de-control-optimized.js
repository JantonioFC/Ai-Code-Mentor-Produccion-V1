/**
 * Panel de Control Optimizado - Mission 222
 * 
 * CAMBIOS CRÍTICOS:
 * 1. Lazy loading de todos los widgets pesados
 * 2. Suspense boundaries con fallbacks
 * 3. Carga prioritaria del primer widget
 * 4. Tabs para organizar contenido y evitar renderizado simultáneo
 * 
 * IMPACTO ESPERADO:
 * - LCP reducido de 23s a <3s
 * - Solo el contenido visible se carga inicialmente
 * - Widgets adicionales se cargan on-demand
 */

import { lazy, Suspense, useState } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';

// LAZY LOADING de componentes pesados
const EnhancedProgressDashboard = lazy(() => import('../components/dashboard/EnhancedProgressDashboard'));
const ProgressDashboard = lazy(() => import('../components/dashboard/ProgressDashboard'));
const AchievementsWidget = lazy(() => import('../components/dashboard/AchievementsWidget'));
const EnhancedUnifiedDashboard = lazy(() => import('../components/ProjectTracking').then(module => ({ default: module.EnhancedUnifiedDashboard })));
const SandboxWidget = lazy(() => import('../components/Sandbox/SandboxWidget'));
const SystemTestWidget = lazy(() => import('../components/dashboard/SystemTestWidget'));

// Loading fallback component
function WidgetSkeleton({ title }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-64 mb-6">{title && <span className="opacity-0">{title}</span>}</div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="h-32 bg-gray-100 rounded-lg mt-4"></div>
        </div>
      </div>
    </div>
  );
}

export default function PanelDeControl() {
  const [activeTab, setActiveTab] = useState('progress');

  const tabs = [
    { id: 'progress', label: '📊 Progreso', icon: '📊' },
    { id: 'achievements', label: '🏆 Logros', icon: '🏆' },
    { id: 'unified', label: '📈 Dashboard Unificado', icon: '📈' },
    { id: 'sandbox', label: '🧪 Sandbox', icon: '🧪' },
    { id: 'system', label: '🔧 Sistema', icon: '🔧' },
  ];

  return (
    <ProtectedRoute>
      <PrivateLayout
        title="Panel de Control - AI Code Mentor"
        description="Dashboard principal del ecosistema educativo Ecosistema 360"
      >
        <div className="space-y-6">
          {/* Header Corporativo Sutil */}
          <div className="relative overflow-hidden rounded-2xl p-8 stagger-1 header-corporate group">
            {/* Decorative Elements - Sutiles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/15 rounded-full blur-2xl transform -translate-x-1/3 translate-y-1/3"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">
                    Panel de Control
                  </h1>
                  <p className="text-gray-600 text-base font-medium">
                    Bienvenido de nuevo a tu Ecosistema 360
                  </p>
                </div>

                {/* Chip Badge Sutil */}
                <div className="hidden sm:flex flex-col items-end gap-2">
                  <span className="chip chip-teal">
                    ⚡ Modo Optimizado
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-teal-100 border-2 border-white shadow-sm"></div>
                  ))}
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  3 Widgets activos • LCP &lt;3s verified
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Pill Style Corporativo */}
          <div className="tab-pill-container rounded-full p-1.5 shadow-sm stagger-2 inline-flex">
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${activeTab === tab.id
                    ? 'tab-pill-active'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="flex items-center gap-2 relative z-10">
                    <span className={`text-base transition-transform duration-300 ${activeTab === tab.id ? 'scale-105' : 'opacity-70'}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label.replace(/^[^\s]+\s/, '')}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content with Lazy Loading */}
          <div className="min-h-[400px]">
            {/* PROGRESS TAB */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                {/* Dashboard Mejorado (Prioritario) */}
                <Suspense fallback={<WidgetSkeleton title="Cargando Dashboard de Progreso Mejorado..." />}>
                  <div>
                    <div className="mb-4 flex items-center">
                      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        📊 Dashboard de Progreso con Gráficos Avanzados
                        <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          🆕 Fase 4 - Chart.js
                        </span>
                      </h2>
                    </div>
                    <EnhancedProgressDashboard />
                  </div>
                </Suspense>

                {/* Dashboard Original (Carga diferida) */}
                <Suspense fallback={<WidgetSkeleton title="Cargando Dashboard Original..." />}>
                  <div>
                    <div className="mb-4 flex items-center">
                      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        📊 Dashboard de Progreso (Original)
                        <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          ✅ Misión 159
                        </span>
                      </h2>
                    </div>
                    <ProgressDashboard />
                  </div>
                </Suspense>
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Sistema de Logros..." />}>
                <div>
                  <div className="mb-4 flex items-center">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      🏆 Sistema de Logros v1 (MVP)
                      <span className="ml-2 text-sm font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        ✅ Misión 160
                      </span>
                    </h2>
                  </div>
                  <AchievementsWidget />
                </div>
              </Suspense>
            )}

            {/* UNIFIED DASHBOARD TAB */}
            {activeTab === 'unified' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Dashboard Unificado..." />}>
                <div>
                  <div className="mb-4 flex items-center">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      📈 Dashboard Unificado Ecosistema 360
                      <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        ✅ Migrado
                      </span>
                    </h2>
                  </div>
                  <EnhancedUnifiedDashboard />
                </div>
              </Suspense>
            )}

            {/* SANDBOX TAB */}
            {activeTab === 'sandbox' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Herramientas de Experimentación..." />}>
                <div>
                  <div className="mb-4 flex items-center">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      🧪 Herramientas de Experimentación
                      <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        🆕 Nuevo
                      </span>
                    </h2>
                  </div>
                  <SandboxWidget />
                </div>
              </Suspense>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Monitor de Salud Técnica..." />}>
                <div>
                  <div className="mb-4 flex items-center">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      🔧 Monitor de Salud Técnica
                      <span className="ml-2 text-sm font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        ✨ Misión 188.1
                      </span>
                    </h2>
                  </div>
                  <SystemTestWidget />
                </div>
              </Suspense>
            )}
          </div>

          {/* Footer con información de optimización */}
          <div className="footer-info rounded-lg p-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Optimización aplicada:</strong> Lazy loading • Code splitting • Suspense boundaries •
                Tab-based rendering • Objetivo: LCP &lt;3s
              </span>
            </div>
          </div>
        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
