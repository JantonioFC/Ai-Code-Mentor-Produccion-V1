/**
 * Panel de Control - Vista Principal
 * 
 * Tabs incluidos:
 * - Dashboard Unificado (Ecosistema 360)
 * - Sandbox (Experimentación)
 * - Sistema (Monitor de Salud Técnica)
 * 
 * NOTA: Progreso y Logros migrados a /analiticas (Fase 3 UI_REARCHITECTURE_PLAN)
 */

import { lazy, Suspense, useState } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';

// LAZY LOADING de componentes
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
  const [activeTab, setActiveTab] = useState('unified');

  const tabs = [
    { id: 'unified', label: 'Dashboard Unificado', icon: '📈' },
    { id: 'sandbox', label: 'Sandbox', icon: '🧪' },
    { id: 'system', label: 'Sistema', icon: '🔧' },
  ];

  return (
    <ProtectedRoute>
      <PrivateLayout
        title="Panel de Control - AI Code Mentor"
        description="Dashboard principal del ecosistema educativo Ecosistema 360"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="header-corporate rounded-2xl p-6">
            <h1 className="text-3xl font-bold text-gray-800 text-center">
              Panel de Control
            </h1>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content with Lazy Loading */}
          <div className="min-h-[400px]">
            {/* UNIFIED DASHBOARD TAB */}
            {activeTab === 'unified' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Dashboard Unificado..." />}>
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      📈 Dashboard Unificado Ecosistema 360
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
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      🧪 Herramientas de Experimentación
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
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      🔧 Monitor de Salud Técnica
                    </h2>
                  </div>
                  <SystemTestWidget />
                </div>
              </Suspense>
            )}
          </div>
        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
