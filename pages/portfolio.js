import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';
import { PortfolioManagementSystem } from '../components/ProjectTracking';

export default function Portfolio() {
  return (
    <ProtectedRoute>
      <PrivateLayout
        title="Portfolio & Gestión - AI Code Mentor"
        description="Sistema de portfolio profesional y gestión de ciclos - Ecosistema 360"
      >
        <div className="space-y-8">
          {/* Header del Portfolio */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Gestión de Portfolio
                </h1>
                <p className="text-gray-600">
                  Exportación automática • Reset de ciclos • Gestión curricular • Portfolio profesional
                </p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>

            <div className="mt-4 flex items-center space-x-6 text-sm text-purple-600">
              <span>✅ Vista Especializada</span>
              <span>📄 Export Automático</span>
              <span>🔄 Gestión de Ciclos</span>
              <span>🏆 Portfolio Profesional</span>
            </div>
          </div>

          {/* Descripción del Sistema de Portfolio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🎯 Sistema de Portfolio y Gestión Curricular
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">📄 Exportación Automática</h3>
                <p className="text-sm text-blue-700">
                  Generación automática de portfolios profesionales en PDF y GitHub con documentación completa
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">🔄 Reset de Ciclos</h3>
                <p className="text-sm text-green-700">
                  Sistema de archival y reset para iniciar nuevos ciclos de aprendizaje manteniendo historial
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">🏆 Gestión Curricular Completa:</h3>
              <div className="text-sm text-purple-700 space-y-1">
                <p><strong>1. Portfolio Export:</strong> Documentación automática de progreso y logros</p>
                <p><strong>2. Cycle Management:</strong> Archival de datos y preparación para nuevos ciclos</p>
                <p><strong>3. Professional Output:</strong> Portfolios listos para presentación profesional</p>
                <p><strong>4. Continuity Management:</strong> Preservación de aprendizajes entre ciclos</p>
              </div>
            </div>
          </div>

          {/* Sistema de Portfolio Principal */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                🛠️ Sistema de Portfolio y Gestión
              </h2>
            </div>

            {/* Integración del PortfolioManagementSystem */}
            <PortfolioManagementSystem />
          </div>

          {/* Características Avanzadas del Portfolio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 Métricas de Portfolio
              </h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Tracking automático de competencias desarrolladas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Documentación de proyectos y logros</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Evidencias de progreso curricular</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Métricas de tiempo y dedicación</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔄 Gestión de Ciclos
              </h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Archival seguro de datos de aprendizaje</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Reset controlado para nuevos ciclos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Preservación de aprendizajes clave</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  <span>Continuidad entre ciclos educativos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guía Avanzada del Portfolio */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">
              💡 Guía Avanzada del Sistema de Portfolio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-purple-800 mb-2">🚀 Exportación Profesional:</h4>
                <ul className="space-y-1 text-purple-700">
                  <li>• Genera portfolios PDF con diseño profesional</li>
                  <li>• Exporta proyectos a GitHub con documentación</li>
                  <li>• Incluye evidencias de competencias desarrolladas</li>
                  <li>• Formato listo para presentación a empleadores</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-purple-800 mb-2">🔄 Gestión de Ciclos:</h4>
                <ul className="space-y-1 text-purple-700">
                  <li>• Archiva datos antes de iniciar nuevo ciclo</li>
                  <li>• Preserva aprendizajes y competencias clave</li>
                  <li>• Reset controlado manteniendo continuidad</li>
                  <li>• Historiales disponibles para consulta</li>
                </ul>
              </div>
            </div>
          </div>


        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
