import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';
import { EnhancedUnifiedDashboard } from '../components/ProjectTracking';
import SandboxWidget from '../components/Sandbox/SandboxWidget';
import ProgressDashboard from '../components/dashboard/ProgressDashboard';
import EnhancedProgressDashboard from '../components/dashboard/EnhancedProgressDashboard';
import AchievementsWidget from '../components/dashboard/AchievementsWidget';
import SystemTestWidget from '../components/dashboard/SystemTestWidget';

export default function PanelDeControl() {
  return (
    <ProtectedRoute>
      <PrivateLayout 
        title="Panel de Control - AI Code Mentor"
        description="Dashboard principal del ecosistema educativo Ecosistema 360"
      >
        <div className="space-y-8">

          {/* Dashboard de Progreso Mejorado - FASE 4 */}
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

          {/* Dashboard de Progreso Original - MISIÓN 159 */}
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

          {/* Sistema de Logros - MISIÓN 160 */}
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

          {/* Dashboard Unificado - MIGRADO */}
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

          {/* Sandbox Widget - NUEVO */}
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

          {/* Monitor de Salud Técnica - MISIÓN 188.1 */}
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

        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
