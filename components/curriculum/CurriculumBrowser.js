import { useState } from 'react';
import PhaseCard from './PhaseCard';
import WeekDetailsLoader from './WeekDetailsLoader';

/**
 * CurriculumBrowser v2.0 - Con Lazy Loading de Módulos
 * MISIÓN 213.0 - Optimización de Performance
 * 
 * Mejoras:
 * - Lazy loading de módulos al expandir fase
 * - Payload inicial reducido ~95%
 * - Mejor performance en carga inicial
 */
export default function CurriculumBrowser({ curriculumData }) {
  const [activePhase, setActivePhase] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [activeWeek, setActiveWeek] = useState(null);
  
  // MISIÓN 213.0: Estados para lazy loading de módulos de fase
  const [phaseModules, setPhaseModules] = useState({});
  const [loadingModules, setLoadingModules] = useState({});
  const [modulesError, setModulesError] = useState({});
  
  // MISIÓN 183.2: Estados para lazy loading de datos de semana
  const [weekDetailsData, setWeekDetailsData] = useState(null);
  const [loadingWeekDetails, setLoadingWeekDetails] = useState(false);
  const [weekDetailsError, setWeekDetailsError] = useState(null);

  // MISIÓN 213.0: Función para cargar módulos de una fase
  const loadPhaseModules = async (phaseId) => {
    // Si ya están cargados, no hacer nada
    if (phaseModules[phaseId]) {
      console.log(`✅ [CurriculumBrowser] Módulos de fase ${phaseId} ya cargados (cache)`);
      return;
    }

    try {
      console.log(`🔄 [CurriculumBrowser] Cargando módulos de fase ${phaseId}...`);
      
      setLoadingModules(prev => ({ ...prev, [phaseId]: true }));
      setModulesError(prev => ({ ...prev, [phaseId]: null }));

      const response = await fetch(`/api/v1/phases/${phaseId}/modules`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ [CurriculumBrowser] Fase ${phaseId}: ${data.totalModules} módulos, ${data.totalWeeks} semanas cargadas`);
      
      // Guardar módulos en cache
      setPhaseModules(prev => ({
        ...prev,
        [phaseId]: data.modulos
      }));

    } catch (error) {
      console.error(`❌ [CurriculumBrowser] Error cargando módulos de fase ${phaseId}:`, error);
      setModulesError(prev => ({
        ...prev,
        [phaseId]: {
          message: 'Error al cargar los módulos de la fase',
          details: error.message
        }
      }));
    } finally {
      setLoadingModules(prev => ({ ...prev, [phaseId]: false }));
    }
  };

  const handlePhaseToggle = async (phaseId) => {
    if (activePhase === phaseId) {
      // Cerrar fase
      setActivePhase(null);
      setActiveModule(null);
      setActiveWeek(null);
      clearWeekDetails();
    } else {
      // Abrir fase
      setActivePhase(phaseId);
      setActiveModule(null);
      setActiveWeek(null);
      clearWeekDetails();
      
      // MISIÓN 213.0: Cargar módulos de la fase si no están cargados
      await loadPhaseModules(phaseId);
    }
  };

  const handleModuleToggle = (moduleId) => {
    if (activeModule === moduleId) {
      setActiveModule(null);
      setActiveWeek(null);
      clearWeekDetails();
    } else {
      setActiveModule(moduleId);
      setActiveWeek(null);
      clearWeekDetails();
    }
  };

  // MISIÓN 183.2: Función helper para limpiar datos de semana
  const clearWeekDetails = () => {
    setWeekDetailsData(null);
    setLoadingWeekDetails(false);
    setWeekDetailsError(null);
  };

  // MISIÓN 183.2: Lazy loading de datos completos de semana
  const handleWeekSelect = async (weekBasicData) => {
    try {
      console.log(`🔄 [CurriculumBrowser] Cargando detalles de semana ${weekBasicData.semana}...`);
      
      // Si es la misma semana, toggle (cerrar)
      if (activeWeek?.semana === weekBasicData.semana) {
        setActiveWeek(null);
        clearWeekDetails();
        return;
      }
      
      // Establecer semana activa y comenzar carga
      setActiveWeek(weekBasicData);
      setLoadingWeekDetails(true);
      setWeekDetailsError(null);
      setWeekDetailsData(null);
      
      // Fetch datos completos desde el nuevo endpoint
      const response = await fetch(`/api/v1/weeks/${weekBasicData.semana}/details`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const detailsData = await response.json();
      
      console.log(`✅ [CurriculumBrowser] Detalles de semana ${weekBasicData.semana} cargados`);
      console.log(`   📅 Esquema diario: ${detailsData.esquemaDiario?.length || 0} días`);
      console.log(`   🎯 Objetivos: ${detailsData.objetivos?.length || 0}`);
      console.log(`   📝 Actividades: ${detailsData.actividades?.length || 0}`);
      
      setWeekDetailsData(detailsData);
      
    } catch (error) {
      console.error(`❌ [CurriculumBrowser] Error cargando detalles de semana:`, error);
      setWeekDetailsError({
        message: 'Error al cargar los detalles de la semana',
        details: error.message,
        weekId: weekBasicData.semana
      });
    } finally {
      setLoadingWeekDetails(false);
    }
  };

  if (!curriculumData || !curriculumData.curriculum) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 text-lg">
          Cargando estructura curricular...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Estructura Curricular - Ecosistema 360
        </h1>
        <p className="text-gray-600 text-lg">
          Explora el programa formativo completo organizado por fases, módulos y semanas.
        </p>
        {curriculumData.metadata?.lazyLoading?.enabled && (
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
            ⚡ Carga optimizada habilitada
          </div>
        )}
      </div>

      <div className="space-y-6">
        {curriculumData.curriculum.map((fase) => {
          // MISIÓN 213.0: Obtener módulos del cache si están cargados
          const modulosToDisplay = phaseModules[fase.fase] || [];
          const isLoadingModules = loadingModules[fase.fase] || false;
          const hasModulesError = modulesError[fase.fase];

          return (
            <PhaseCard
              key={fase.fase}
              fase={fase}
              modulos={modulosToDisplay}
              isActive={activePhase === fase.fase}
              isLoadingModules={isLoadingModules}
              modulesError={hasModulesError}
              activeModule={activeModule}
              activeWeek={activeWeek}
              onPhaseToggle={handlePhaseToggle}
              onModuleToggle={handleModuleToggle}
              onWeekSelect={handleWeekSelect}
            />
          );
        })}
      </div>

      {/* MISIÓN 183.2: Componente mejorado para mostrar detalles de semana con lazy loading */}
      {activeWeek && (
        <div className="mt-6">
          <WeekDetailsLoader 
            activeWeek={activeWeek}
            weekDetailsData={weekDetailsData}
            loadingWeekDetails={loadingWeekDetails}
            weekDetailsError={weekDetailsError}
            onRetry={() => handleWeekSelect(activeWeek)}
          />
        </div>
      )}
    </div>
  );
}
