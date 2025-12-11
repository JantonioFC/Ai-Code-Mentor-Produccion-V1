import { 
  LightBulbIcon,
  MapIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

/**
 * COMPONENTE GUÍA DE ESTUDIO ESTRATÉGICO - MISIÓN 185.3
 * 
 * Renderiza la Guía de Estudio Estratégico para semanas de proyecto,
 * mostrando el enfoque, plan sugerido y recomendaciones de manera visual.
 * 
 * @author Mentor Coder
 * @version 1.0
 * @param {Object} props.weekData - Datos completos de la semana
 * @param {Object} props.weekData.guiaEstudio - Guía de estudio estratégico
 */
export default function GuiaEstudio({ weekData }) {
  if (!weekData || !weekData.guiaEstudio) {
    return null;
  }

  const { guiaEstudio } = weekData;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Especial para Guía de Estudio */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {weekData.semana || "?"}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <MapIcon className="w-5 h-5 text-purple-200" />
                  <span className="text-purple-200 text-sm font-medium uppercase tracking-wide">
                    Guía de Estudio Estratégico
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {weekData.tituloSemana || "Título no disponible"}
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  Semana {weekData.semana} - Proyecto Práctico
                </p>
              </div>
              <div className="flex-shrink-0">
                <StarIcon className="w-8 h-8 text-yellow-300 fill-current" />
              </div>
            </div>
          </div>
          
          {/* Resumen de la Guía */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-2 mb-2">
              <LightBulbIcon className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-semibold text-purple-900">Enfoque Estratégico</h4>
            </div>
            <p className="text-purple-800 leading-relaxed">
              Esta semana se enfoca en un proyecto práctico con una guía de estudio personalizada 
              que te ayudará a maximizar tu aprendizaje y lograr resultados concretos.
            </p>
          </div>
        </div>

        {/* Título de la Guía */}
        {guiaEstudio.titulo && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <MapIcon className="w-6 h-6 text-indigo-600" />
              <h4 className="text-xl font-bold text-gray-900">Título del Proyecto</h4>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h5 className="text-lg font-semibold text-indigo-900 leading-relaxed">
                {guiaEstudio.titulo}
              </h5>
            </div>
          </div>
        )}

        {/* Enfoque de la Guía */}
        {guiaEstudio.enfoque && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <LightBulbIcon className="w-6 h-6 text-amber-600" />
              <h4 className="text-xl font-bold text-gray-900">Enfoque de Aprendizaje</h4>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-gray-800 leading-relaxed">
                {guiaEstudio.enfoque}
              </p>
            </div>
          </div>
        )}

        {/* Plan Sugerido */}
        {guiaEstudio.planSugerido && Array.isArray(guiaEstudio.planSugerido) && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="w-6 h-6 text-green-600" />
              <h4 className="text-xl font-bold text-gray-900">Plan de Trabajo Sugerido</h4>
            </div>
            <div className="plan-de-trabajo space-y-6">
              {guiaEstudio.planSugerido.map((paso, index) => {
                // Manejar diferentes formatos de datos del paso
                if (typeof paso === 'string') {
                  // Si es string simple, renderizar como antes pero mejorado
                  return (
                    <div 
                      key={index}
                      className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <ArrowRightIcon className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 font-semibold">
                            Paso {index + 1}
                          </span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {paso}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Si es objeto, usar estructura completa
                const foco = paso.foco || paso.descripcion || `Paso ${index + 1}`;
                const dias = paso.dias || paso.dia || null;
                const tareas = paso.tareas || [];

                return (
                  <div key={index} className="paso-container bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                    {/* Header del paso */}
                    <div className="bg-green-100 px-6 py-4 border-b border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-green-800">
                            Paso {index + 1}: {foco}
                          </h4>
                          {dias && (
                            <p className="text-green-600 text-sm mt-1">
                              <ClockIcon className="w-4 h-4 inline mr-1" />
                              Duración: {dias} {typeof dias === 'string' ? '' : (dias === 1 ? 'día' : 'días')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contenido del paso */}
                    <div className="px-6 py-4">
                      {tareas && tareas.length > 0 ? (
                        <div>
                          <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                            Tareas a completar:
                          </h5>
                          <ul className="space-y-2">
                            {tareas.map((tarea, tareaIndex) => (
                              <li key={tareaIndex} className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="text-gray-700 leading-relaxed">
                                  {tarea}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        // Fallback si no hay tareas estructuradas
                        <div className="text-gray-600 italic">
                          <p>📋 Sigue las indicaciones generales para este paso.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Nota motivacional */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  💪 ¡Sigue estos pasos y dominarás esta semana de proyecto!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información Adicional de la Semana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Temática */}
          {weekData.tematica && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <StarIcon className="w-6 h-6 text-purple-600" />
                <h4 className="text-lg font-semibold text-gray-900">Temática</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {weekData.tematica}
              </p>
            </div>
          )}

          {/* Entregables */}
          {weekData.entregables && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                <h4 className="text-lg font-semibold text-gray-900">Entregables</h4>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-gray-800 leading-relaxed">
                  {weekData.entregables}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recursos y Fuentes (si existen) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Recursos */}
          {weekData.recursos && weekData.recursos.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <LightBulbIcon className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Recursos Clave</h4>
              </div>
              <ul className="space-y-2">
                {weekData.recursos.map((recurso, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <ArrowRightIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <a 
                      href={recurso.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline transition-colors duration-200"
                    >
                      {recurso.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fuentes Oficiales */}
          {weekData.officialSources && weekData.officialSources.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <StarIcon className="w-6 h-6 text-indigo-600" />
                <h4 className="text-lg font-semibold text-gray-900">Fuentes Oficiales</h4>
              </div>
              <ul className="space-y-2">
                {weekData.officialSources.map((fuente, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <ArrowRightIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <a 
                      href={fuente.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm underline transition-colors duration-200"
                    >
                      {fuente.nombre || fuente.title || fuente.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-center shadow-lg">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <StarIcon className="w-6 h-6 text-yellow-300 fill-current" />
            <h4 className="text-xl font-bold text-white">¡Es hora de crear!</h4>
            <StarIcon className="w-6 h-6 text-yellow-300 fill-current" />
          </div>
          <p className="text-purple-100 leading-relaxed mb-4">
            Esta semana es tu oportunidad de aplicar todo lo aprendido en un proyecto real. 
            Sigue la guía estratégica y construye algo increíble.
          </p>
          <div className="flex items-center justify-center space-x-2 text-yellow-300">
            <LightBulbIcon className="w-5 h-5" />
            <span className="font-medium">¡Tu futuro se construye paso a paso!</span>
            <LightBulbIcon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
