/**
 * Enhanced Unified Dashboard Component - Ecosistema 360 Integration
 * Shows unified analytics across all systems with educational context
 * PHASE 3 ENHANCEMENT: Phase indicators + Competency framework visualization
 * Powered by SQLite database with cross-system analytics
 */

import React, { useEffect, useState } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';
import { useRouter } from 'next/router';

const EnhancedUnifiedDashboard = ({ className = '' }) => {
  const {
    dashboardData,
    entryCounts,
    recentEntries,
    loading,
    error,
    loadDashboardData
  } = useProjectTracking();

  const [moduleStats, setModuleStats] = useState(null);
  const [loadingModules, setLoadingModules] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0); // User can set this (F0-F7)

  // Ecosistema 360 Curriculum Phases (24 months - 8 fases: F0-F7)
  const curriculumPhases = [
    {
      id: 0,
      name: 'Cimentación',
      duration: '3-4 meses',
      focus: 'IA Crítica + CS50',
      color: 'from-gray-500 to-slate-600',
      competencies: ['Pensamiento Crítico IA', 'CS50 Fundamentos', 'Metodología de Estudio'],
      months: '0'
    },
    {
      id: 1,
      name: 'Fundamentos',
      duration: '6 meses',
      focus: 'Python + Metodología',
      color: 'from-blue-500 to-cyan-500',
      competencies: ['Sintaxis Python', 'Pensamiento Computacional', 'Debugging Básico'],
      months: '1-6'
    },
    {
      id: 2,
      name: 'Frontend',
      duration: '5 meses',
      focus: 'HTML/CSS/JS/React',
      color: 'from-green-500 to-emerald-500',
      competencies: ['DOM Manipulation', 'React Components', 'Responsive Design'],
      months: '7-11'
    },
    {
      id: 3,
      name: 'Backend',
      duration: '5 meses',
      focus: 'APIs + Databases',
      color: 'from-purple-500 to-violet-500',
      competencies: ['REST APIs', 'Database Design', 'Authentication'],
      months: '12-16'
    },
    {
      id: 4,
      name: 'DevOps',
      duration: '4 meses',
      focus: 'Containers + CI/CD',
      color: 'from-orange-500 to-red-500',
      competencies: ['Docker', 'CI/CD Pipelines', 'Cloud Deployment'],
      months: '17-20'
    },
    {
      id: 5,
      name: 'IA/Data',
      duration: '2 meses',
      focus: 'ML + Analytics',
      color: 'from-pink-500 to-rose-500',
      competencies: ['Data Analysis', 'Machine Learning', 'AI Integration'],
      months: '21-22'
    },
    {
      id: 6,
      name: 'Especialización',
      duration: '2 meses',
      focus: 'Advanced Topics',
      color: 'from-teal-500 to-cyan-600',
      competencies: ['Arquitectura Avanzada', 'Patrones de Diseño', 'Performance'],
      months: '23'
    },
    {
      id: 7,
      name: 'Integración',
      duration: '2 meses',
      focus: 'Capstone + Portfolio',
      color: 'from-indigo-500 to-blue-600',
      competencies: ['Full-Stack Projects', 'Technical Leadership', 'Portfolio Professional'],
      months: '24'
    }
  ];

  // Competency Framework based on HRC (Hoja de Ruta de Competencias)
  const competencyLevels = [
    { level: 1, name: 'Principiante', description: 'Conceptos básicos', color: 'bg-red-100 text-red-800', threshold: 0 },
    { level: 2, name: 'Básico', description: 'Fundamentos sólidos', color: 'bg-orange-100 text-orange-800', threshold: 20 },
    { level: 3, name: 'Intermedio', description: 'Aplicación práctica', color: 'bg-yellow-100 text-yellow-800', threshold: 40 },
    { level: 4, name: 'Avanzado', description: 'Proyectos complejos', color: 'bg-green-100 text-green-800', threshold: 70 },
    { level: 5, name: 'Experto', description: 'Mentoría y liderazgo', color: 'bg-blue-100 text-blue-800', threshold: 90 }
  ];

  useEffect(() => {
    loadDashboardData();
    loadModuleStats();
  }, []);

  const loadModuleStats = async () => {
    setLoadingModules(true);
    try {
      const response = await fetch('/api/get-modules');
      if (response.ok) {
        const data = await response.json();
        setModuleStats(data.stats);
      } else {
        console.warn('Module stats endpoint returned non-OK status:', response.status);
        // Set default empty stats to prevent UI errors
        setModuleStats({
          totalModules: 0,
          totalLessons: 0,
          completedLessons: 0,
          totalExercises: 0,
          completedExercises: 0,
          overallProgress: 0
        });
      }
    } catch (error) {
      console.error('Error loading module stats:', error);
      // Set default empty stats to prevent UI errors
      setModuleStats({
        totalModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        totalExercises: 0,
        completedExercises: 0,
        overallProgress: 0
      });
    } finally {
      setLoadingModules(false);
    }
  };

  const getTotalEntries = () => {
    return Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
  };

  const getOverallProgress = () => {
    if (!moduleStats) return 0;
    return moduleStats.overallProgress || 0;
  };

  const getSystemHealthScore = () => {
    const templateScore = Math.min((getTotalEntries() / 20) * 100, 100); // 20 entries = 100%
    const moduleScore = getOverallProgress();
    return Math.round((templateScore + moduleScore) / 2);
  };

  // Calculate competency level based on system data
  const getCurrentCompetencyLevel = () => {
    const progress = getOverallProgress();
    const entries = getTotalEntries();
    const combinedScore = (progress + Math.min((entries / 15) * 100, 100)) / 2;

    for (let i = competencyLevels.length - 1; i >= 0; i--) {
      if (combinedScore >= competencyLevels[i].threshold) {
        return competencyLevels[i];
      }
    }
    return competencyLevels[0];
  };

  // Calculate phase progress within current phase
  const getPhaseProgress = () => {
    const totalProgress = getOverallProgress();
    const phaseProgress = (totalProgress / curriculumPhases.length);
    return Math.min(phaseProgress * curriculumPhases.length, 100);
  };

  if (loading && !dashboardData) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const systemHealth = getSystemHealthScore();
  const totalEntries = getTotalEntries();
  const currentCompetency = getCurrentCompetencyLevel();
  const phaseProgress = getPhaseProgress();

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Enhanced Header with Phase Context */}
      <div className="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              🎯 Ecosistema 360 - Panel de Progreso Educativo
            </h2>
            <p className="text-emerald-100 text-sm">Simbiosis Crítica Humano-IA • Andamiaje Decreciente • Portfolio Basado en Evidencias</p>
            <div className="flex items-center mt-2 space-x-4">
              <div className="text-xs">
                📚 <span className="font-semibold">Fase {currentPhase}:</span> {curriculumPhases[currentPhase]?.name}
              </div>
              <div className="text-xs">
                🏆 <span className="font-semibold">Competencia:</span> {currentCompetency.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{systemHealth}%</div>
            <div className="text-xs text-emerald-100">Salud del Sistema</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* NEW: Curriculum Phase Indicators */}
        <div className="mb-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-5 border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            📚 Progreso del Curriculum (24 meses • 8 fases)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            {curriculumPhases.map((phase, index) => {
              const isActive = phase.id === currentPhase;
              const isCompleted = phase.id < currentPhase;

              return (
                <div
                  key={phase.id}
                  className={`relative rounded-lg p-3 border-2 transition-all cursor-pointer transform hover:scale-105 ${isActive
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  onClick={() => setCurrentPhase(phase.id)}
                >
                  <div className="text-center">
                    <div className={`text-lg font-bold ${isActive ? 'text-blue-600' :
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                      {isCompleted ? '✅' : isActive ? '🔄' : '⏳'} F{phase.id}
                    </div>
                    <div className="text-xs font-semibold text-gray-800">{phase.name}</div>
                    <div className="text-xs text-gray-500">{phase.months}m</div>
                    <div className="text-xs text-gray-600 mt-1">{phase.focus}</div>
                  </div>

                  {/* Phase progress bar */}
                  {isActive && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all"
                          style={{ width: `${phaseProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Phase Detail */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">
                📖 Fase {currentPhase}: {curriculumPhases[currentPhase]?.name}
              </h4>
              <span className="text-sm text-gray-500">
                Meses {curriculumPhases[currentPhase]?.months}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Enfoque:</span> {curriculumPhases[currentPhase]?.focus}
            </p>
            <div className="text-xs text-gray-600">
              <span className="font-medium">Competencias clave:</span> {curriculumPhases[currentPhase]?.competencies.join(' • ')}
            </div>
          </div>
        </div>

        {/* MINIMAL: Competency Framework & Portfolio - Lista Simple */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">🏆 Marco de Competencias & Portfolio</h3>
            <div className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer"
              onClick={() => window.location.href = '/analiticas'}>
              → Ver detalles
            </div>
          </div>

          <div className="space-y-2">
            {/* Competency Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🏆 Marco de Competencias (Nivel {currentCompetency.level} - {currentCompetency.name})</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${(currentCompetency.level / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {Math.round((currentCompetency.level / 5) * 100)}%
                </span>
              </div>
            </div>

            {/* Portfolio Evidence */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">📄 Evidencias del Portfolio (DDE•PAS•HRC•IRP)</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((totalEntries / 20) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {totalEntries}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified System Overview con contexto educativo ENHANCED */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Templates System */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${curriculumPhases[currentPhase]?.color} opacity-5`}></div>
            <div className="relative">
              <div className="text-2xl font-bold text-blue-600">{totalEntries}</div>
              <div className="text-xs text-blue-800 font-medium">Entradas Educativas</div>
              <div className="text-xs text-gray-500">{Object.keys(entryCounts).length}/11 plantillas usadas</div>
              <div className="text-xs text-blue-600 font-medium mt-1">Portfolio Evidence</div>
            </div>
          </div>

          {/* Module System */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${curriculumPhases[currentPhase]?.color} opacity-5`}></div>
            <div className="relative">
              <div className="text-2xl font-bold text-green-600">
                {moduleStats?.totalModules || 0}
              </div>
              <div className="text-xs text-green-800 font-medium">Módulos Cargados</div>
              <div className="text-xs text-gray-500">
                {moduleStats?.totalLessons || 0} lecciones generadas
              </div>
              <div className="text-xs text-green-600 font-medium mt-1">Fase {currentPhase} Focus</div>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${curriculumPhases[currentPhase]?.color} opacity-5`}></div>
            <div className="relative">
              <div className="text-2xl font-bold text-purple-600">
                {getOverallProgress()}%
              </div>
              <div className="text-xs text-purple-800 font-medium">Andamiaje Decreciente</div>
              <div className="text-xs text-gray-500">
                {moduleStats?.completedLessons || 0} lecciones completadas
              </div>
              <div className="text-xs text-purple-600 font-medium mt-1">Simbiosis Crítica</div>
            </div>
          </div>

          {/* Competency Level */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${curriculumPhases[currentPhase]?.color} opacity-5`}></div>
            <div className="relative">
              <div className="text-2xl font-bold text-orange-600">L{currentCompetency.level}</div>
              <div className="text-xs text-orange-800 font-medium">Competencia</div>
              <div className="text-xs text-gray-500">{currentCompetency.name}</div>
              <div className="text-xs text-orange-600 font-medium mt-1">HRC Framework</div>
            </div>
          </div>
        </div>

        {/* Enhanced System Health Indicator */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">📚 Monitor de Progreso Curricular</h3>
              <p className="text-xs text-gray-600 mt-1">
                Seguimiento de competencias, evidencias del portfolio y progreso por fases del Ecosistema 360
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${systemHealth >= 80 ? 'bg-green-100 text-green-800' :
              systemHealth >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
              {systemHealth >= 80 ? '🟢 Excelente' :
                systemHealth >= 60 ? '🟡 Bueno' : '🔴 Necesita Atención'}
            </span>
          </div>

          <div className="space-y-2">
            {/* Templates Health */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">📝 Sistema de Plantillas (DDE•PAS•HRC•IRP)</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((totalEntries / 20) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {Math.round(Math.min((totalEntries / 20) * 100, 100))}%
                </span>
              </div>
            </div>

            {/* Modules Health */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">📚 Sistema de Módulos (Fase {currentPhase} - {curriculumPhases[currentPhase]?.name})</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${getOverallProgress()}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {getOverallProgress()}%
                </span>
              </div>
            </div>

            {/* Competency Framework Health */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🏆 Marco de Competencias (Nivel {currentCompetency.level} - {currentCompetency.name})</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(currentCompetency.level / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {Math.round((currentCompetency.level / 5) * 100)}%
                </span>
              </div>
            </div>

            {/* Database Integration */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🗄️ Base de Datos SQLite (Cross-system Integration)</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full w-full"></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">100%</span>
              </div>
            </div>
          </div>
        </div>



        {/* Recent Unified Activity ENHANCED */}
        {recentEntries && recentEntries.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🕒 Actividad Reciente - Evidencias del Portfolio</h3>
            <div className="space-y-2">
              {recentEntries.slice(0, 3).map((entry, index) => (
                <div key={entry.id} className="flex items-center space-x-3 py-2 bg-white rounded border border-gray-100">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">
                      {entry.entry_type === 'dde_entry' ? '🔧 DDE - Diario de Decisiones de Ingeniería' :
                        entry.entry_type === 'weekly_action_plan' ? '📅 PAS - Plan de Acción Semanal' :
                          entry.entry_type === 'unified_tracking_log' ? '🎯 HRC - Hoja de Ruta de Competencias' :
                            entry.entry_type === 'peer_review' ? '👥 IRP - Informe de Revisión por Pares' :
                              entry.entry_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-3">
                      <span>{new Date(entry.date).toLocaleDateString('es-ES')}</span>
                      <span>•</span>
                      <span>Fase {currentPhase} - {curriculumPhases[currentPhase]?.name}</span>
                      <span>•</span>
                      <span>Portfolio Evidence #{totalEntries - index}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default EnhancedUnifiedDashboard;