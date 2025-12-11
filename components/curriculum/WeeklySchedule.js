import { useState, useEffect } from 'react';
import { ClockIcon, AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import InteractiveQuiz from '../quiz/InteractiveQuiz';

export default function WeeklySchedule({ weekData }) {
  // Validación de props requeridas
  if (!weekData || !weekData.esquemaDiario) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-red-50 p-6 rounded-lg">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-red-900 mb-2">
            Error: Datos de Semana No Disponibles
          </h3>
          <p className="text-red-600 text-sm">
            El componente WeeklySchedule requiere datos de semana con campo 'esquemaDiario'
          </p>
        </div>
      </div>
    );
  }

  // Estado local para gestionar el checklist de entregables (ahora persistente)
  const [checkedState, setCheckedState] = useState({
    ejercicios: false,
    miniProyecto: false,
    dma: false,
    commits: false
  });

  // Estados para manejo de API de persistencia EST
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Estado para modal de lecciones generadas
  const [modalState, setModalState] = useState({
    isOpen: false,
    loading: false,
    content: null,
    error: null
  });

  // MISIÓN 157 FASE 3: Función mejorada con persistencia automática
  const handleCheckboxToggle = async (itemName) => {
    console.log(`📋 Toggle EST: ${itemName} para semana ${weekData.semana}`);
    
    // Actualizar estado local inmediatamente para UX responsiva
    const newCheckedState = {
      ...checkedState,
      [itemName]: !checkedState[itemName]
    };
    setCheckedState(newCheckedState);
    
    // Guardar en base de datos de forma asíncrona
    await saveProgressToAPI(newCheckedState);
  };

  // MISIÓN 157 FASE 3: Función para guardar progreso en API
  const saveProgressToAPI = async (newState) => {
    setIsSavingProgress(true);
    
    try {
      const response = await fetch(`/api/est/${weekData.semana}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          checkedState: newState
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastSaved(new Date(result.lastUpdated));
        console.log(`✅ Progreso EST guardado: ${result.statistics.completionPercentage}% completado`);
      } else {
        const error = await response.json();
        console.error('❌ Error guardando progreso EST:', error.message);
        // TODO: Mostrar notificación de error al usuario
      }
    } catch (error) {
      console.error('❌ Error de red guardando progreso EST:', error);
      // TODO: Implementar retry o almacenamiento local temporal
    } finally {
      setIsSavingProgress(false);
    }
  };

  // MISIÓN 157 FASE 3: Función para cargar progreso desde API
  const loadProgressFromAPI = async () => {
    console.log(`🔍 Cargando progreso EST para semana ${weekData.semana}...`);
    
    try {
      const response = await fetch(`/api/est/${weekData.semana}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setCheckedState(result.checkedState);
        
        if (result.fromDatabase) {
          setLastSaved(new Date(result.lastUpdated));
          console.log(`✅ Progreso EST cargado desde BD: semana ${weekData.semana}`);
        } else {
          console.log(`📭 Sin progreso previo para semana ${weekData.semana}, usando estado por defecto`);
        }
      } else {
        console.error('❌ Error cargando progreso EST, usando estado por defecto');
      }
    } catch (error) {
      console.error('❌ Error de red cargando progreso EST:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // MISIÓN 157 FASE 3: useEffect para cargar progreso al montar componente o cambiar semana
  useEffect(() => {
    if (weekData && weekData.semana) {
      setIsLoadingProgress(true);
      loadProgressFromAPI();
    }
  }, [weekData?.semana]); // Recarga cuando cambia la semana

  // Función: Manejar click en pomodoro activo (MISIÓN 146.5 preservada)
  const handlePomodoroClick = async (semanaId, diaIndex, pomodoroIndex, pomodoroText) => {
    console.log(`🎯 Click en pomodoro: semana ${semanaId}, día ${diaIndex}, pomodoro ${pomodoroIndex}`);
    
    // Abrir modal en estado de carga
    setModalState({
      isOpen: true,
      loading: true,
      content: null,
      error: null
    });

    try {
      // PASO 1: Intentar recuperar lección existente
      console.log('🔍 Intentando recuperar lección existente...');
      
      // Convertir diaIndex (0-based) a dia (1-based) para consistencia con API
      const dia = diaIndex + 1;
      
      const getResponse = await fetch(`/api/get-lesson?semanaId=${semanaId}&dia=${dia}&pomodoroIndex=${pomodoroIndex}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (getResponse.ok) {
        // CASO 1: Lección encontrada - mostrar contenido recuperado
        const existingContent = await getResponse.json();
        console.log('✅ Lección recuperada de BD:', existingContent.title);
        
        setModalState({
          isOpen: true,
          loading: false,
          content: existingContent,
          error: null
        });
        return;
      }

      if (getResponse.status === 404) {
        // CASO 2: Lección no encontrada - generar nueva
        console.log('📭 Lección no existe, generando nueva...');
        
        const generateResponse = await fetch('/api/generate-lesson', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            text: pomodoroText,
            semanaId: semanaId,
            dia: diaIndex + 1, // Convertir de 0-based a 1-based
            pomodoroIndex: pomodoroIndex
          })
        });

        if (generateResponse.ok) {
          const newContent = await generateResponse.json();
          console.log('✅ Nueva lección generada:', newContent.title);
          
          setModalState({
            isOpen: true,
            loading: false,
            content: newContent,
            error: null
          });
          return;
        } else {
          throw new Error(`Error generando lección: ${generateResponse.status}`);
        }
      }

      throw new Error(`Error recuperando lección: ${getResponse.status}`);

    } catch (error) {
      console.error('❌ Error en flujo de lección:', error);
      
      setModalState({
        isOpen: true,
        loading: false,
        content: null,
        error: {
          message: 'Error al procesar la lección',
          details: error.message
        }
      });
    }
  };

  // Función: Cerrar modal
  const closeModal = () => {
    setModalState({
      isOpen: false,
      loading: false,
      content: null,
      error: null
    });
  };

  // Función: Normalizar ejercicios para compatibilidad (MISIÓN 147)
  const normalizeExercises = (exercises) => {
    if (!exercises || !Array.isArray(exercises)) return [];
    
    return exercises.map((exercise, index) => {
      if (typeof exercise.correctAnswerIndex === 'number') {
        return exercise;
      }
      
      if (exercise.correctAnswer && exercise.options) {
        const correctAnswerIndex = exercise.options.findIndex(option => option === exercise.correctAnswer);
        
        if (correctAnswerIndex >= 0) {
          console.log(`🔄 Ejercicio ${index + 1}: Convertido formato legacy correctAnswer → correctAnswerIndex=${correctAnswerIndex}`);
          return {
            ...exercise,
            correctAnswerIndex: correctAnswerIndex
          };
        }
      }
      
      console.warn(`⚠️ Ejercicio ${index + 1}: No se pudo determinar respuesta correcta, usando índice 0`);
      return {
        ...exercise,
        correctAnswerIndex: 0
      };
    });
  };

  // FUNCIÓN NUEVA: Determinar si un pomodoro es de Adquisición o Aplicación
  const getPomodoroType = (pomodoroIndex) => {
    return pomodoroIndex < 2 ? 'adquisicion' : 'aplicacion';
  };

  // FUNCIÓN NUEVA: Obtener configuración visual por tipo de pomodoro
  const getPomodoroConfig = (type) => {
    const configs = {
      adquisicion: {
        title: "Adquisición de Conocimiento",
        duration: "2 horas",
        bgColor: "bg-slate-800",
        textColor: "text-white",
        icon: AcademicCapIcon
      },
      aplicacion: {
        title: "Aplicación y Resolución de Problemas", 
        duration: "2 horas",
        bgColor: "bg-gray-700",
        textColor: "text-white",
        icon: CodeBracketIcon
      }
    };
    return configs[type];
  };

  // FUNCIÓN NUEVA: Generar estructura de días dinámicamente desde weekData
  const generateScheduleData = () => {
    if (!weekData.esquemaDiario) return [];
    
    return weekData.esquemaDiario.map((diaData, index) => {
      // Agrupar pomodoros en bloques de Adquisición (0,1) y Aplicación (2,3)
      const adquisicionPomodoros = diaData.pomodoros.slice(0, 2);
      const aplicacionPomodoros = diaData.pomodoros.slice(2, 4);
      
      return {
        day: `Día ${diaData.dia}`,
        theme: diaData.concepto,
        blocks: [
          {
            ...getPomodoroConfig('adquisicion'),
            pomodoros: adquisicionPomodoros
          },
          {
            ...getPomodoroConfig('aplicacion'),
            pomodoros: aplicacionPomodoros
          }
        ]
      };
    });
  };

  // Generar datos dinámicos del schedule
  const scheduleData = generateScheduleData();

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header del Esquema - AHORA DINÁMICO */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Esquema Semanal de Trabajo (EST)
          </h3>
          <p className="text-lg font-semibold text-indigo-700 mb-2">
            Semana {weekData.semana}: {weekData.tituloSemana}
          </p>
          <p className="text-gray-600 text-sm">
            Modelo Pedagógico 5x4: <span className="font-semibold">5 días de estudio</span> • 
            <span className="font-semibold"> 4 horas por día</span> • 
            <span className="font-semibold"> Separación entre Adquisición y Aplicación</span>
          </p>
          <p className="text-indigo-600 text-xs mt-2">
            💡 <strong>Nuevo:</strong> Haz clic en cualquier pomodoro para generar lecciones personalizadas con IA + Quiz Interactivo
          </p>
        </div>

        {/* Grid de días - AHORA RENDERIZADO DINÁMICO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {scheduleData.map((dayData, dayIndex) => (
            <div key={dayIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del día */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
                <h4 className="text-white font-semibold text-center">{dayData.day}</h4>
                <p className="text-blue-100 text-xs text-center mt-1 leading-tight">
                  {dayData.theme}
                </p>
              </div>

              {/* Bloques de trabajo */}
              <div className="p-4 space-y-3">
                {dayData.blocks.map((block, blockIndex) => (
                  <div key={blockIndex} className={`${block.bgColor} ${block.textColor} rounded-lg p-3`}>
                    {/* Header del bloque */}
                    <div className="flex items-center space-x-2 mb-2">
                      <block.icon className="w-4 h-4" />
                      <div>
                        <h5 className="font-medium text-xs leading-tight">{block.title}</h5>
                        <div className="flex items-center space-x-1 mt-1">
                          <ClockIcon className="w-3 h-3 opacity-75" />
                          <span className="text-xs opacity-75">{block.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estructura de Pomodoros - DINÁMICOS Y CLICKEABLES */}
                    <div className="space-y-1">
                      {block.pomodoros.map((pomodoro, pomodoroIndex) => {
                        // Calcular índice real del pomodoro (0-3 por día)
                        const realPomodoroIndex = blockIndex === 0 ? pomodoroIndex : pomodoroIndex + 2;
                        const isClickeable = true; // Todos los pomodoros son clickeables ahora
                        
                        return (
                          <div 
                            key={pomodoroIndex} 
                            className={`text-xs opacity-90 leading-tight ${
                              isClickeable 
                                ? 'cursor-pointer hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors' 
                                : ''
                            }`}
                            onClick={isClickeable ? () => {
                              handlePomodoroClick(weekData.semana, dayIndex, realPomodoroIndex, pomodoro);
                            } : undefined}
                          >
                            <div className="flex items-start space-x-1">
                              <span className="text-xs mt-0.5">🎯</span>
                              <span>{pomodoro}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Principio Pedagógico - PRESERVADO */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 font-bold text-sm">💡</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Principio Pedagógico</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Este modelo separa la <strong>adquisición</strong> de la <strong>aplicación</strong>, 
                forzando la transición del conocimiento pasivo al activo. El segundo bloque, centrado en la 
                <strong> "fricción constructiva"</strong>, es el motor principal del aprendizaje.
              </p>
            </div>
          </div>
        </div>

        {/* Checklist de entregables - AHORA PERSISTENTE (MISIÓN 157) */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <span>📋</span>
              <span>Checklist de Entregables Semanales</span>
            </h4>
            {/* MISIÓN 157: Indicadores de estado de persistencia */}
            <div className="flex items-center space-x-2 text-xs">
              {isLoadingProgress && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Cargando...</span>
                </div>
              )}
              {isSavingProgress && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <div className="animate-spin w-3 h-3 border border-orange-600 border-t-transparent rounded-full"></div>
                  <span>Guardando...</span>
                </div>
              )}
              {lastSaved && !isSavingProgress && !isLoadingProgress && (
                <div className="flex items-center space-x-1 text-green-600">
                  <span>💾</span>
                  <span>Guardado {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div 
              className="flex items-start space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
              onClick={() => handleCheckboxToggle('ejercicios')}
            >
              <span className="text-green-600 mt-0.5 select-none">
                {checkedState.ejercicios ? '☑' : '☐'}
              </span>
              <span className={`text-gray-700 select-none ${
                checkedState.ejercicios ? 'line-through opacity-75' : ''
              }`}>
                Mínimo de 8 ejercicios de práctica completados
              </span>
            </div>
            <div 
              className="flex items-start space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
              onClick={() => handleCheckboxToggle('miniProyecto')}
            >
              <span className="text-green-600 mt-0.5 select-none">
                {checkedState.miniProyecto ? '☑' : '☐'}
              </span>
              <span className={`text-gray-700 select-none ${
                checkedState.miniProyecto ? 'line-through opacity-75' : ''
              }`}>
                Mini-Proyecto semanal funcional y documentado
              </span>
            </div>
            <div 
              className="flex items-start space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
              onClick={() => handleCheckboxToggle('dma')}
            >
              <span className="text-green-600 mt-0.5 select-none">
                {checkedState.dma ? '☑' : '☐'}
              </span>
              <span className={`text-gray-700 select-none ${
                checkedState.dma ? 'line-through opacity-75' : ''
              }`}>
                {weekData.entregables || 'Entrada en Diario de Metacognición (DMA/DDE)'}
              </span>
            </div>
            <div 
              className="flex items-start space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
              onClick={() => handleCheckboxToggle('commits')}
            >
              <span className="text-green-600 mt-0.5 select-none">
                {checkedState.commits ? '☑' : '☐'}
              </span>
              <span className={`text-gray-700 select-none ${
                checkedState.commits ? 'line-through opacity-75' : ''
              }`}>
                Commits organizados con historia coherente
              </span>
            </div>
          </div>
        </div>

        {/* MODAL DE LECCIONES - PRESERVADO COMPLETAMENTE */}
        {modalState.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {modalState.loading ? 'Procesando...' : modalState.error ? 'Error' : 'Lección Generada'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                {modalState.loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generando lección personalizada...</p>
                  </div>
                )}

                {modalState.error && (
                  <div className="text-center py-8">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{modalState.error.message}</h4>
                    <p className="text-gray-600 text-sm">{modalState.error.details}</p>
                  </div>
                )}

                {modalState.content && (
                  <div className="space-y-6">
                    {/* Título de la lección */}
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        {modalState.content.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {modalState.content.fromDatabase && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            📁 Recuperada de BD
                          </span>
                        )}
                        {modalState.content.savedToDatabase && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            💾 Guardada en BD
                          </span>
                        )}
                        <span>
                          {modalState.content.fromDatabase 
                            ? `Creada: ${new Date(modalState.content.originallyCreatedAt).toLocaleString()}`
                            : `Generada: ${new Date(modalState.content.generatedAt).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Contenido de la lección */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h5 className="font-semibold text-gray-900 mb-3">Contenido de la Lección:</h5>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        {modalState.content.lesson.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </div>

                    {/* Quiz Interactivo */}
                    {modalState.content.exercises && modalState.content.exercises.length > 0 && (
                      <div>
                        <InteractiveQuiz exercises={normalizeExercises(modalState.content.exercises)} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}