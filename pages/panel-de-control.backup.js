/**
 * Panel de Control - Vista Principal (Refactored Round 3)
 * 
 * Uses Radix UI Primitives for accessible tabs.
 * Stitch Design System: Glassmorphism & Neon Accents.
 */

import { lazy, Suspense } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';
import {
  Root as TabsRoot,
  List as TabsList,
  Trigger as TabsTrigger,
  Content as TabsContent
} from '@radix-ui/react-tabs';

// LAZY LOADING
const EnhancedUnifiedDashboard = lazy(() => import('../components/ProjectTracking').then(module => ({ default: module.EnhancedUnifiedDashboard })));
const SandboxWidget = lazy(() => import('../components/Sandbox/SandboxWidget'));
const SystemTestWidget = lazy(() => import('../components/dashboard/SystemTestWidget'));

function WidgetSkeleton({ title }) {
  return (
    <div className="glass-panel rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-64 mb-6">{title && <span className="opacity-0">{title}</span>}</div>
      <div className="space-y-4">
        <div className="h-32 bg-white/5 rounded-lg mt-4"></div>
      </div>
    </div>
  );
}

export default function PanelDeControl() {
  console.log('[PanelDeControl] Rendering...');
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
        <div className="space-y-8">

          {/* Header with Stitch Gradient */}
          <div className="header-corporate rounded-2xl p-8 border border-teal-500/20 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[--stitch-neon-blue] to-[--stitch-neon-purple] opacity-5"></div>
            <h1 className="text-3xl font-bold text-gray-800 text-center relative z-10">
              Panel de Control <span className="text-teal-600">360</span>
            </h1>
          </div>

          {/* Radix Tabs Root - Named Import Usage */}
          <TabsRoot defaultValue="unified" className="flex flex-col gap-6">

            {/* Tab List (Glass Panel) */}
            <TabsList className="glass-panel p-2 rounded-xl flex gap-3 overflow-x-auto" aria-label="Secciones del Panel">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="
                    flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium transition-all duration-300
                    text-gray-600 hover:bg-white/10 hover:text-teal-600
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 
                    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]
                    focus:outline-none focus:ring-2 focus:ring-teal-400
                  "
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Contents (Lazy Loaded + Accessible) */}
            <div className="min-h-[400px]">

              <TabsContent value="unified" className="radix-tab-content focus:outline-none focus:ring-2 focus:ring-teal-500/50 rounded-xl">
                <Suspense fallback={<WidgetSkeleton title="Cargando Dashboard..." />}>
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">📈 Dashboard Unificado</h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 border border-teal-200">En vivo</span>
                  </div>
                  <EnhancedUnifiedDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="sandbox" className="radix-tab-content focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl">
                <Suspense fallback={<WidgetSkeleton title="Cargando Sandbox..." />}>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">🧪 Herramientas de Experimentación</h2>
                  </div>
                  <SandboxWidget />
                </Suspense>
              </TabsContent>

              <TabsContent value="system" className="radix-tab-content focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl">
                <Suspense fallback={<WidgetSkeleton title="Cargando Sistema..." />}>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">🔧 Monitor de Salud Técnica</h2>
                  </div>
                  <SystemTestWidget />
                </Suspense>
              </TabsContent>

            </div>

          </TabsRoot>

        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
