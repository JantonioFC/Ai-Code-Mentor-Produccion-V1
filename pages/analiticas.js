import { lazy, Suspense, useState } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';

// LAZY LOADING de componentes de analíticas
const EnhancedProgressDashboard = lazy(() => import('../components/dashboard/EnhancedProgressDashboard'));
const AchievementsWidget = lazy(() => import('../components/dashboard/AchievementsWidget'));

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

export default function Analiticas() {
  const [activeTab, setActiveTab] = useState('progress');

  const tabs = [
    { id: 'progress', label: 'Dashboard de Progreso', icon: '📊' },
    { id: 'achievements', label: 'Sistema de Logros', icon: '🏆' },
  ];

  return (
    <ProtectedRoute>
      <PrivateLayout
        title="Analíticas Detalladas - AI Code Mentor"
        description="Estadísticas granulares e historiales del Ecosistema 360"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  📊 Analíticas Detalladas
                </h1>
                <p className="text-gray-600">
                  Estadísticas granulares • Historiales de progreso • Métricas de competencias
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[200px] px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
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

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* PROGRESS TAB */}
            {activeTab === 'progress' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Dashboard de Progreso..." />}>
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      📊 Dashboard de Progreso
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Visualización multidimensional del progreso educativo con métricas de competencias
                    </p>
                  </div>
                  <EnhancedProgressDashboard />
                </div>
              </Suspense>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <Suspense fallback={<WidgetSkeleton title="Cargando Sistema de Logros..." />}>
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      🏆 Sistema de Logros
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Framework de gamificación con badges, reconocimientos y sistema de niveles
                    </p>
                  </div>
                  <AchievementsWidget />
                </div>
              </Suspense>
            )}
          </div>
        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
