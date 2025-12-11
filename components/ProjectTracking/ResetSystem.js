/**
 * Reset System Component - Ecosistema 360 Integration  
 * Real implementation with data archival and curriculum cycle management
 * Professional data preservation with competency baseline reset
 */

import React, { useState } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

const ResetSystem = ({ className = '' }) => {
  const {
    dashboardData,
    entryCounts,
    recentEntries,
    loading,
    refreshData
  } = useProjectTracking();

  const [resetConfig, setResetConfig] = useState({
    resetType: 'soft', // 'soft' (archive), 'hard' (delete), 'selective' (choose)
    archiveData: true,
    resetCompetencies: true,
    resetPhaseProgress: true,
    resetModules: false,
    preserveSettings: true,
    exportBeforeReset: true,
    newCycleStartDate: new Date().toISOString().split('T')[0]
  });

  const [resetStatus, setResetStatus] = useState({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    completed: false,
    archiveUrl: null,
    preResetExportUrl: null,
    newCycleId: null,
    error: null,
    metadata: null
  });

  const [confirmationStep, setConfirmationStep] = useState(0); // 0: config, 1: preview, 2: confirm, 3: execute

  // 24-month curriculum cycle structure
  const curriculumCycle = {
    duration: '24 meses',
    phases: [
      { id: 0, name: 'Cimentación', months: '0', description: 'IA Crítica + CS50' },
      { id: 1, name: 'Fundamentos', months: '1-6', description: 'Python + Metodología' },
      { id: 2, name: 'Frontend', months: '7-11', description: 'HTML/CSS/JS/React' },
      { id: 3, name: 'Backend', months: '12-16', description: 'APIs + Databases' },
      { id: 4, name: 'DevOps', months: '17-20', description: 'Containers + CI/CD' },
      { id: 5, name: 'IA/Data', months: '21-22', description: 'ML + Analytics' },
      { id: 6, name: 'Especialización', months: '23', description: 'Advanced Topics' },
      { id: 7, name: 'Integración', months: '24', description: 'Capstone + Portfolio' }
    ],
    competencyLevels: [
      { level: 1, name: 'Principiante', icon: '🌱', description: 'Conceptos básicos' },
      { level: 2, name: 'Básico', icon: '🌿', description: 'Fundamentos sólidos' },
      { level: 3, name: 'Intermedio', icon: '🌳', description: 'Aplicación práctica' },
      { level: 4, name: 'Avanzado', icon: '🏆', description: 'Proyectos complejos' },
      { level: 5, name: 'Experto', icon: '👑', description: 'Mentoría y liderazgo' }
    ]
  };

  const handleResetStart = async () => {
    setResetStatus({
      isProcessing: true,
      progress: 0,
      currentStep: 'Preparando reset del ciclo curricular...',
      completed: false,
      archiveUrl: null,
      preResetExportUrl: null,
      newCycleId: null,
      error: null,
      metadata: null
    });

    try {
      // Step 1: Preparation
      setResetStatus(prev => ({
        ...prev,
        progress: 10,
        currentStep: 'Inicializando proceso de reset...'
      }));

      // Step 2: Call real reset API
      setResetStatus(prev => ({
        ...prev,
        progress: 30,
        currentStep: `Ejecutando reset ${resetConfig.resetType}...`
      }));

      const response = await fetch('/api/reset-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetType: resetConfig.resetType,
          config: {
            archiveData: resetConfig.archiveData,
            resetCompetencies: resetConfig.resetCompetencies,
            resetPhaseProgress: resetConfig.resetPhaseProgress,
            resetModules: resetConfig.resetModules,
            preserveSettings: resetConfig.preserveSettings,
            exportBeforeReset: resetConfig.exportBeforeReset,
            newCycleStartDate: resetConfig.newCycleStartDate
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reset failed');
      }

      const result = await response.json();

      // Step 3: Processing completion
      setResetStatus(prev => ({
        ...prev,
        progress: 80,
        currentStep: 'Finalizando reset y actualizando sistema...'
      }));

      // Refresh data in context
      await refreshData();

      // Step 4: Completion
      setResetStatus({
        isProcessing: false,
        progress: 100,
        currentStep: 'Reset completado - Nuevo ciclo iniciado',
        completed: true,
        archiveUrl: result.archiveUrl,
        preResetExportUrl: result.preResetExportUrl,
        newCycleId: result.newCycleId,
        error: null,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('Reset system error:', error);
      setResetStatus({
        isProcessing: false,
        progress: 0,
        currentStep: '',
        completed: false,
        archiveUrl: null,
        preResetExportUrl: null,
        newCycleId: null,
        error: error.message,
        metadata: null
      });
    }
  };

  const handleDownload = (url, filename) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getTotalEntries = () => {
    return Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
  };

  const getCurrentCompetencyLevel = () => {
    const totalEntries = getTotalEntries();
    if (totalEntries >= 15) return { level: 4, name: 'Avanzado', icon: '🏆' };
    if (totalEntries >= 10) return { level: 3, name: 'Intermedio', icon: '🌳' };
    if (totalEntries >= 5) return { level: 2, name: 'Básico', icon: '🌿' };
    return { level: 1, name: 'Principiante', icon: '🌱' };
  };

  const getResetPreview = () => {
    const totalEntries = getTotalEntries();
    const competency = getCurrentCompetencyLevel();

    return {
      currentData: {
        entries: totalEntries,
        types: Object.keys(entryCounts).length,
        competencyLevel: competency.level,
        competencyName: competency.name
      },
      afterReset: {
        entries: resetConfig.resetType === 'hard' ? 0 : 'Archivado',
        types: resetConfig.resetType === 'hard' ? 0 : 'Preservado',
        competencyLevel: resetConfig.resetCompetencies ? 1 : competency.level,
        competencyName: resetConfig.resetCompetencies ? 'Principiante' : competency.name,
        phase: resetConfig.resetPhaseProgress ? 1 : 'Actual',
        phaseName: resetConfig.resetPhaseProgress ? 'Fundamentos' : 'Preservada'
      }
    };
  };

  const totalEntries = getTotalEntries();
  const competency = getCurrentCompetencyLevel();
  const preview = getResetPreview();

  // Confirmation Step Rendering
  const renderConfirmationStep = () => {
    switch (confirmationStep) {
      case 0: // Configuration
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 mb-4">⚙️ Configuración del Reset</h3>

            {/* Reset Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Reset</label>
              <div className="space-y-2">
                {[
                  {
                    value: 'soft',
                    label: '🗂️ Suave (Recomendado)',
                    description: 'Archiva datos actuales y reinicia contadores. Datos preservados.',
                    color: 'border-green-200 bg-green-50'
                  },
                  {
                    value: 'selective',
                    label: '🎯 Selectivo',
                    description: 'Elige qué componentes resetear. Control granular.',
                    color: 'border-blue-200 bg-blue-50'
                  },
                  {
                    value: 'hard',
                    label: '❗ Completo',
                    description: 'Elimina todos los datos. No se puede deshacer.',
                    color: 'border-red-200 bg-red-50'
                  }
                ].map(type => (
                  <label key={type.value} className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${resetConfig.resetType === type.value ? type.color : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="radio"
                      name="resetType"
                      value={type.value}
                      checked={resetConfig.resetType === type.value}
                      onChange={(e) => setResetConfig(prev => ({ ...prev, resetType: e.target.value }))}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Selective Options */}
            {resetConfig.resetType === 'selective' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Componentes a Resetear</label>
                <div className="space-y-2">
                  {[
                    { key: 'resetCompetencies', label: '🏆 Resetear nivel de competencias', default: true },
                    { key: 'resetPhaseProgress', label: '📚 Resetear progreso de fases', default: true },
                    { key: 'resetModules', label: '📄 Resetear módulos cargados', default: false }
                  ].map(option => (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={resetConfig[option.key]}
                        onChange={(e) => setResetConfig(prev => ({ ...prev, [option.key]: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Opciones Adicionales</label>
              <div className="space-y-2">
                {[
                  { key: 'exportBeforeReset', label: '📄 Exportar portfolio antes del reset', recommended: true },
                  { key: 'archiveData', label: '🗂️ Archivar datos actuales (recomendado)', recommended: true },
                  { key: 'resetCompetencies', label: '🏆 Resetear nivel de competencias', recommended: resetConfig.resetType !== 'selective' },
                  { key: 'resetPhaseProgress', label: '📚 Resetear progreso de fases', recommended: resetConfig.resetType !== 'selective' },
                  { key: 'preserveSettings', label: '⚙️ Preservar configuraciones personales', recommended: true }
                ].map(option => (
                  resetConfig.resetType === 'selective' && ['resetCompetencies', 'resetPhaseProgress'].includes(option.key) ? null : (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={resetConfig[option.key]}
                        onChange={(e) => setResetConfig(prev => ({ ...prev, [option.key]: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Recomendado</span>
                      )}
                    </label>
                  )
                )).filter(Boolean)}
              </div>
            </div>

            {/* New Cycle Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Fecha de inicio del nuevo ciclo
              </label>
              <input
                type="date"
                value={resetConfig.newCycleStartDate}
                onChange={(e) => setResetConfig(prev => ({ ...prev, newCycleStartDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Establece la fecha de inicio para el nuevo ciclo de 24 meses
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setConfirmationStep(1)}
                disabled={totalEntries === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${totalEntries === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                Vista Previa →
              </button>
            </div>
          </div>
        );

      case 1: // Preview
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 mb-4">👀 Vista Previa del Reset</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current State */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">📊 Estado Actual</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Evidencias documentadas:</span>
                    <span className="font-medium">{preview.currentData.entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipos de templates:</span>
                    <span className="font-medium">{preview.currentData.types}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nivel de competencia:</span>
                    <span className="font-medium">L{preview.currentData.competencyLevel} - {preview.currentData.competencyName}</span>
                  </div>
                </div>
              </div>

              {/* After Reset State */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">🔄 Después del Reset</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Evidencias:</span>
                    <span className="font-medium">{preview.afterReset.entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Templates:</span>
                    <span className="font-medium">{preview.afterReset.types}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Competencia:</span>
                    <span className="font-medium">L{preview.afterReset.competencyLevel} - {preview.afterReset.competencyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fase curricular:</span>
                    <span className="font-medium">F{preview.afterReset.phase} - {preview.afterReset.phaseName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Summary */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-3">📋 Resumen del Reset</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• <strong>Tipo:</strong> {resetConfig.resetType === 'soft' ? 'Suave (Archival)' : resetConfig.resetType === 'hard' ? 'Completo (Eliminación)' : 'Selectivo'}</p>
                <p>• <strong>Archival:</strong> {resetConfig.archiveData ? 'Sí - Datos preservados' : 'No - Solo reset'}</p>
                <p>• <strong>Export previo:</strong> {resetConfig.exportBeforeReset ? 'Sí - Portfolio exportado' : 'No'}</p>
                <p>• <strong>Nuevo ciclo:</strong> Inicia el {new Date(resetConfig.newCycleStartDate).toLocaleDateString('es-ES')}</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setConfirmationStep(0)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={() => setConfirmationStep(2)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Confirmar Reset →
              </button>
            </div>
          </div>
        );

      case 2: // Final Confirmation
        return (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-600 mb-4">Confirmación Final</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Estás a punto de resetear tu ciclo curricular. Esta acción cambiará el estado actual del sistema según la configuración seleccionada.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-red-800 text-left space-y-1">
                  <p>✅ <strong>Se mantendrá:</strong> {resetConfig.archiveData ? 'Archivo de datos actuales' : 'Configuraciones básicas'}</p>
                  <p>🔄 <strong>Se reseteará:</strong> {resetConfig.resetCompetencies ? 'Competencias + ' : ''}
                    {resetConfig.resetPhaseProgress ? 'Progreso de fases + ' : ''}
                    Contadores y métricas</p>
                  <p>📅 <strong>Nuevo ciclo:</strong> Comienza el {new Date(resetConfig.newCycleStartDate).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setConfirmationStep(1)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Revisar
              </button>
              <button
                onClick={() => {
                  setConfirmationStep(3);
                  handleResetStart();
                }}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors"
              >
                🔄 EJECUTAR RESET
              </button>
            </div>
          </div>
        );

      case 3: // Execution
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 mb-4">🔄 Ejecutando Reset</h3>

            {resetStatus.isProcessing && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{resetStatus.currentStep}</span>
                  <span className="text-sm font-medium text-blue-600">{resetStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${resetStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {resetStatus.completed && (
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-xl font-bold text-green-600 mb-2">Reset Completado Exitosamente</h4>
                <p className="text-gray-600 mb-4">{resetStatus.currentStep}</p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-green-800 space-y-1">
                    {resetStatus.archiveUrl && (
                      <p>📁 <strong>Archivo generado:</strong>
                        <button
                          onClick={() => handleDownload(resetStatus.archiveUrl, `cycle-archive-${Date.now()}.zip`)}
                          className="ml-2 text-green-600 underline hover:text-green-800"
                        >
                          Descargar archivo
                        </button>
                      </p>
                    )}
                    {resetStatus.preResetExportUrl && (
                      <p>📄 <strong>Backup pre-reset:</strong>
                        <button
                          onClick={() => handleDownload(resetStatus.preResetExportUrl, `pre-reset-backup-${Date.now()}.zip`)}
                          className="ml-2 text-green-600 underline hover:text-green-800"
                        >
                          Descargar backup
                        </button>
                      </p>
                    )}
                    <p>🔄 <strong>Nuevo ciclo:</strong> {resetStatus.newCycleId}</p>
                    <p>🎯 <strong>Estado:</strong> Listo para comenzar Fase 1 - Fundamentos</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setConfirmationStep(0);
                    setResetStatus({
                      isProcessing: false,
                      progress: 0,
                      currentStep: '',
                      completed: false,
                      archiveUrl: null,
                      preResetExportUrl: null,
                      newCycleId: null,
                      error: null,
                      metadata: null
                    });
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ Finalizar
                </button>
              </div>
            )}

            {resetStatus.error && (
              <div className="text-center py-6">
                <div className="text-6xl mb-4">❌</div>
                <h4 className="text-xl font-bold text-red-600 mb-2">Error en el Reset</h4>
                <p className="text-gray-600 mb-4">{resetStatus.error}</p>
                <button
                  onClick={() => setConfirmationStep(0)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  🔄 Intentar de Nuevo
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              🔄 Sistema de Reset de Ciclo Curricular
            </h2>
            <p className="text-orange-100 text-sm">Ecosistema 360 • Gestión de ciclos de 24 meses • Archival profesional</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{competency.icon}</div>
            <div className="text-xs text-orange-100">Actual: L{competency.level}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current Cycle Overview */}
        <div className="mb-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg p-5 border border-orange-200">
          <h3 className="font-semibold text-gray-800 mb-4">📊 Estado del Ciclo Actual</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{totalEntries}</div>
              <div className="text-xs text-blue-800">Evidencias</div>
              <div className="text-xs text-gray-500">Documentadas</div>
            </div>
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{Object.keys(entryCounts).length}</div>
              <div className="text-xs text-green-800">Templates</div>
              <div className="text-xs text-gray-500">Utilizados</div>
            </div>
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{competency.level}</div>
              <div className="text-xs text-purple-800">Competencia</div>
              <div className="text-xs text-gray-500">{competency.name}</div>
            </div>
            <div className="text-center p-3 bg-white rounded border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">24m</div>
              <div className="text-xs text-orange-800">Ciclo</div>
              <div className="text-xs text-gray-500">Curriculum</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3">🎯 Estructura del Ciclo Curricular</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {curriculumCycle.phases.map((phase) => (
                <div key={phase.id} className="bg-gray-50 rounded p-2 text-sm">
                  <div className="font-semibold text-gray-700">F{phase.id}: {phase.name}</div>
                  <div className="text-xs text-gray-500">{phase.months} • {phase.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reset Configuration & Processing */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          {renderConfirmationStep()}
        </div>

        {/* Help & Information */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-gray-800 mb-2">💡 Información del Sistema de Reset</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• El reset permite iniciar un nuevo ciclo curricular de 24 meses preservando o archivando datos</p>
            <p>• Los datos archivados se mantienen accesibles como evidencias de ciclos anteriores</p>
            <p>• Recomendamos exportar portfolio y archivar datos antes del reset</p>
            <p>• El nuevo ciclo inicia en Fase 1 (Fundamentos) con competencias baseline</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetSystem;