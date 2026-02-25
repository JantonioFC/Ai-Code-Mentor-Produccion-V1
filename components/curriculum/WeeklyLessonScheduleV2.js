import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClockIcon, AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import InteractiveQuiz from '../quiz/InteractiveQuiz';
import LessonRenderer from '../Sandbox/LessonRenderer';

export default function WeeklyLessonSchedule({ weekData }) {
  // DEBUG: Verificar carga de versión nueva
  console.log('🚀 WeeklyLessonSchedule V2 LOADED');
  const router = useRouter();


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

  // MISIÓN 157 FASE 3: useEffect para cargar progreso al montar componente o cambiar semana
  useEffect(() => {
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

    if (weekData && weekData.semana) {
      setIsLoadingProgress(true);
      loadProgressFromAPI();
    }
  }, [weekData]); // Fixed: Added weekData to dependencies

  // Validación de props requeridas - MOVIMOS ESTO AQUÍ PARA CUMPLIR REGLAS DE HOOKS
  if (!weekData || !weekData.esquemaDiario) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-red-50 p-6 rounded-lg">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-red-900 mb-2">
            Error: Datos de Semana No Disponibles
          </h3>
          <p className="text-red-600 text-sm">
            El componente WeeklySchedule requiere datos de semana con campo &apos;esquemaDiario&apos;
          </p>
        </div>
      </div>
    );
  }

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

      if (getResponse.status === 401) {
        console.warn('🔒 Sesión expirada o no iniciada');
        setModalState({
          isOpen: false,
          loading: false,
          content: null,
          error: null
        });
        // Redirigir al login
        router.push('/auth/login?returnUrl=/modulos');
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
                            className={`text-xs opacity-90 leading-tight ${isClickeable
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
                <strong> &quot;fricción constructiva&quot;</strong>, es el motor principal del aprendizaje.
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
              <span className={`text-gray-700 select-none ${checkedState.ejercicios ? 'line-through opacity-75' : ''
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
              <span className={`text-gray-700 select-none ${checkedState.miniProyecto ? 'line-through opacity-75' : ''
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
              <span className={`text-gray-700 select-none ${checkedState.dma ? 'line-through opacity-75' : ''
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
              <span className={`text-gray-700 select-none ${checkedState.commits ? 'line-through opacity-75' : ''
                }`}>
                Commits organizados con historia coherente
              </span>
            </div>
          </div>
        </div>

        {/* MODAL DE LECCIONES - UI STANDARDIZED (SANDBOX STYLE) */}
        {modalState.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header del modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">🎓</span>
                  {modalState.loading ? 'Generando Contenido...' : 'Lección Interactiva'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                  aria-label="Cerrar modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                {modalState.loading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                    <h4 className="text-xl font-medium text-gray-800 mb-2">Creando tu lección personalizada</h4>
                    <p className="text-gray-500 text-sm max-w-md text-center">
                      Nuestra IA está analizando el tema, estructurando los conceptos y generando ejercicios prácticos...
                    </p>
                  </div>
                )}

                {modalState.error && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 text-3xl">
                      ❌
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{modalState.error.message}</h4>
                    <p className="text-gray-600 max-w-md mx-auto">{modalState.error.details}</p>
                    <button
                      onClick={closeModal}
                      className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Cerrar y Reintentar
                    </button>
                  </div>
                )}

                {modalState.content && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* SANDBOX STYLE: Cabecera con Gradiente */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <AcademicCapIcon className="w-32 h-32 text-blue-900" />
                        </div>

                        {/* Badges de Estado */}
                        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                          {modalState.content.fromDatabase ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              📂 Recuperada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              ✨ Nueva Generación
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            🕒 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-3 relative z-10 leading-tight">
                          {modalState.content.title || modalState.content.titulo || 'Lección Generada (DEBUG MODE)'}
                        </h1>

                        <div className="flex items-center text-sm text-gray-600 relative z-10">
                          <span className="mr-4">
                            📚 {modalState.content.lesson?.length || 0} caracteres
                          </span>
                          {modalState.content.exercises && (
                            <span className="flex items-center">
                              🎯 {modalState.content.exercises.length} Ejercicios
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SANDBOX STYLE: Contenido de la Lección */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                      <div className="px-8 py-8">
                        {(() => {
                          // Helper to process content similar to SandboxWidget logic
                          const processContent = (rawContent) => {
                            console.log('🔍 [DEBUG] processContent received:', typeof rawContent, rawContent);
                            if (!rawContent) return '';

                            let processed = rawContent;

                            if (typeof processed === 'string') {
                              const trimmed = processed.trim();

                              // 1. Try to extract from markdown code blocks (json, text, or no language)
                              // Regex relaxed to find the block ANYWHERE in the text
                              const codeBlockRegex = /```(?:json|text)?\s*([\s\S]*?)\s*```/i;
                              const match = trimmed.match(codeBlockRegex);

                              if (match) {
                                try {
                                  const parsed = JSON.parse(match[1]);
                                  return processContent(parsed); // Recurse with parsed object
                                } catch (e) {
                                  // If parse fails, it might be just text inside a block, return inner text
                                  // But if it looks like JSON, we might want to try to fix it? 
                                  // For now, let's treat it as the content string if it fails to parse as JSON
                                  return match[1];
                                }
                              }

                              // 2. Try to parse specific JSON-like strings that are not valid JSON but look like it
                              // (e.g. if the API returns a string that IS a JSON but without code blocks)
                              if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                try {
                                  const parsed = JSON.parse(trimmed);
                                  return processContent(parsed);
                                } catch (e) {
                                  // Not valid JSON, return as text
                                  return processed;
                                }
                              }

                              return processed;
                            } else if (typeof processed === 'object') {
                              // Extract known fields if object
                              // If 'lesson' exists, use it. If 'contenido' exists, use it.
                              const extracted = processed.lesson || processed.contenido || processed.content;

                              if (extracted) {
                                // [DEBUG] Special handling for 'contenido' which might be markdown
                                if (processed.contenido && typeof processed.contenido === 'string') {
                                  return processContent(processed.contenido);
                                }
                                // If the extracted content is complex (object or array), stringify it
                                // UNLESS we are specifically looking for text content
                                if (typeof extracted === 'object') {
                                  return JSON.stringify(extracted, null, 2);
                                }
                                // Recurse in case the extracted string is also a code block
                                return processContent(extracted);
                              }

                              // If no known fields, dump the whole object
                              return JSON.stringify(processed, null, 2);
                            }
                            return String(processed);
                          };

                          const finalContent = processContent(modalState.content);
                          return <LessonRenderer content={finalContent} />;
                        })()}
                      </div>

                      {/* Footer del contenido */}
                      <div className="px-8 pb-5 bg-gray-50/30 border-t border-gray-100">
                        <div className="flex items-center gap-3 pt-4 text-xs text-gray-400">
                          <span>AI Code Mentor</span>
                          <span>·</span>
                          <span>Potenciado por Google Gemini</span>
                        </div>
                      </div>
                    </div>

                    {/* SANDBOX STYLE: Quiz Interactivo */}
                    {modalState.content.exercises && modalState.content.exercises.length > 0 && (
                      <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4">
                          <h5 className="font-semibold text-lg flex items-center gap-2">
                            🎯 Ejercicios Interactivos ({modalState.content.exercises.length})
                          </h5>
                          <p className="text-blue-100 text-sm mt-0.5">Pon a prueba tu comprensión de esta lección</p>
                        </div>

                        <div className="p-6">
                          <InteractiveQuiz exercises={normalizeExercises(modalState.content.exercises)} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Flotante de Cierre (Móvil) o Footer Actions */}
              {!modalState.loading && (
                <div className="bg-white border-t border-gray-200 p-4 flex justify-end gap-3 z-10">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all shadow-sm"
                  >
                    Cerrar Lección
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}