import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ModuleList from './ModuleList';

/**
 * PhaseCard v2.0 - Con soporte para Lazy Loading
 * MISIÓN 213.0 - Optimización de Performance
 * 
 * Mejoras:
 * - Maneja módulos cargados dinámicamente
 * - Muestra estados de carga
 * - Maneja errores de carga de módulos
 */
export default function PhaseCard({ 
  fase,
  modulos = [], // MISIÓN 213.0: Módulos ahora vienen como prop separado (lazy loaded)
  isActive, 
  isLoadingModules = false, // MISIÓN 213.0: Estado de carga de módulos
  modulesError = null, // MISIÓN 213.0: Error al cargar módulos
  activeModule, 
  activeWeek, 
  onPhaseToggle, 
  onModuleToggle, 
  onWeekSelect 
}) {
  const handlePhaseClick = () => {
    onPhaseToggle(fase.fase);
  };

  // Determinar si hay módulos para mostrar
  const hasModules = modulos && modulos.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header de la Fase */}
      <div 
        className={`p-6 cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'bg-blue-50 border-b border-blue-100' 
            : 'hover:bg-gray-50'
        }`}
        onClick={handlePhaseClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                isActive 
                  ? 'bg-blue-600' 
                  : 'bg-gray-400'
              }`}>
                {fase.fase}
              </div>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${
                isActive ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {fase.tituloFase}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Duración: {fase.duracionMeses}
                {/* MISIÓN 213.0: Mostrar módulos cuando estén cargados */}
                {hasModules && ` • ${modulos.length} módulos`}
                {isLoadingModules && ' • Cargando...'}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2">
            {isLoadingModules && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            {isActive ? (
              <ChevronDownIcon className="w-6 h-6 text-blue-600" />
            ) : (
              <ChevronRightIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Descripción del propósito */}
        <div className="mt-4">
          <p className={`text-sm leading-relaxed ${
            isActive ? 'text-blue-800' : 'text-gray-700'
          }`}>
            {fase.proposito}
          </p>
        </div>
      </div>

      {/* Contenido expandible - Módulos */}
      {isActive && (
        <div className="bg-gray-50">
          {/* Estado de carga de módulos */}
          {isLoadingModules && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando módulos de la fase...</p>
              <p className="text-sm text-gray-500 mt-2">Lazy loading habilitado ⚡</p>
            </div>
          )}

          {/* Error al cargar módulos */}
          {modulesError && !isLoadingModules && (
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="font-semibold">{modulesError.message}</h4>
                </div>
                <p className="text-sm text-red-600">{modulesError.details}</p>
                <button
                  onClick={handlePhaseClick}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Módulos cargados exitosamente */}
          {hasModules && !isLoadingModules && !modulesError && (
            <ModuleList
              modulos={modulos}
              activeModule={activeModule}
              activeWeek={activeWeek}
              onModuleToggle={onModuleToggle}
              onWeekSelect={onWeekSelect}
            />
          )}

          {/* Sin módulos (estado vacío) */}
          {!hasModules && !isLoadingModules && !modulesError && (
            <div className="p-8 text-center text-gray-500">
              <p>No hay módulos disponibles para esta fase</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
