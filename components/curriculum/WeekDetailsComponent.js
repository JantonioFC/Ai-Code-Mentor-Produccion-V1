import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  LinkIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import WeeklyLessonSchedule from './WeeklyLessonScheduleV2';

export default function WeekDetails({ weekData }) {
  // DEBUG: Verificar carga de versión nueva
  console.log('🚀 WeekDetailsComponent (Renamed) LOADED for week:', weekData?.semana);
  const [showSchedule, setShowSchedule] = useState(true);

  if (!weekData) return null;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-bold text-lg">
                {weekData.semana || "?"}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {weekData.tituloSemana || "Título no disponible"}
            </h3>
            <p className="text-gray-600 mt-1">
              Semana {weekData.semana || "N/A"} - Detalles del programa
            </p>
          </div>
        </div>

        {/* Grid de Información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Objetivos */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Objetivos</h4>
            </div>
            <ul className="space-y-2">
              {(weekData.objetivos || []).map((objetivo, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm leading-relaxed">
                    {objetivo}
                  </span>
                </li>
              ))}
              {(!weekData.objetivos || weekData.objetivos.length === 0) && (
                <li className="text-gray-500 text-sm italic">
                  No hay objetivos específicos definidos para esta semana
                </li>
              )}
            </ul>
          </div>

          {/* Temática */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpenIcon className="w-6 h-6 text-purple-600" />
              <h4 className="text-lg font-semibold text-gray-900">Temática</h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {weekData.tematica || "No hay temática específica definida para esta semana"}
            </p>
          </div>

          {/* Actividades */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
              <h4 className="text-lg font-semibold text-gray-900">Actividades</h4>
            </div>
            <ul className="space-y-2">
              {(weekData.actividades || []).map((actividad, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm leading-relaxed">
                    {actividad}
                  </span>
                </li>
              ))}
              {(!weekData.actividades || weekData.actividades.length === 0) && (
                <li className="text-gray-500 text-sm italic">
                  No hay actividades específicas definidas para esta semana
                </li>
              )}
            </ul>
          </div>

          {/* Entregables */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-900">Entregables</h4>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-gray-700 text-sm leading-relaxed">
                {weekData.entregables || "No hay entregables específicos definidos para esta semana"}
              </p>
            </div>
          </div>
        </div>

        {/* Recursos Clave - Renderizado Condicional */}
        {weekData.recursos && weekData.recursos.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <LinkIcon className="w-6 h-6 text-indigo-600" />
                <h4 className="text-lg font-semibold text-gray-900">Recursos Clave</h4>
              </div>
              <ul className="space-y-3">
                {weekData.recursos.map((recurso, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <LinkIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <a
                      href={recurso.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline transition-colors duration-200"
                    >
                      {recurso.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Fuentes Oficiales - Renderizado Condicional */}
        {weekData.officialSources && weekData.officialSources.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpenIcon className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Fuentes Oficiales</h4>
              </div>
              <ul className="space-y-3">
                {weekData.officialSources.map((fuente, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <BookOpenIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <a
                      href={fuente.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline transition-colors duration-200"
                    >
                      {fuente.nombre || fuente.title || fuente.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Ejercicios Prácticos - Renderizado Condicional */}
        {weekData.ejercicios && weekData.ejercicios.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <ClipboardDocumentListIcon className="w-6 h-6 text-emerald-600" />
                <h4 className="text-lg font-semibold text-gray-900">Ejercicios Prácticos</h4>
              </div>
              <ul className="space-y-3">
                {weekData.ejercicios.map((ejercicio, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <a
                      href={ejercicio.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-800 text-sm font-medium underline transition-colors duration-200"
                    >
                      {ejercicio.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Plan de Trabajo Sugerido (EST) - Acordeón */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header del Acordeón */}
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="w-6 h-6 text-indigo-600" />
                <h4 className="text-lg font-semibold text-gray-900">Plan de Trabajo Sugerido (EST)</h4>
              </div>
              {showSchedule ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Contenido del Acordeón */}
            {showSchedule && (
              <div className="border-t border-gray-200">
                <WeeklyLessonSchedule weekData={weekData} />
              </div>
            )}
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm text-center">
            💡 <strong>Tip:</strong> Haz clic en otras semanas para explorar más contenido del programa formativo
          </p>
        </div>
      </div>
    </div>
  );
}