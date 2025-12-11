// components/dashboard/SystemTestWidget.js
// MISIÓN 188.1 - DASHBOARD DE PRUEBAS INTEGRADO
// Objetivo: Ejecutar suite E2E desde Panel de Control y mostrar resultados

import { useState } from 'react';

export default function SystemTestWidget() {
  const [testState, setTestState] = useState('idle'); // idle, running, success, error
  const [testResults, setTestResults] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);
  const [error, setError] = useState(null);
  const [lastExecution, setLastExecution] = useState(null);

  /**
   * EJECUTAR SUITE DE PRUEBAS E2E
   * Llama al endpoint seguro para ejecutar Playwright
   * MISIÓN 188.3: Manejo mejorado de errores ENOENT
   */
  const runSystemTests = async () => {
    try {
      setTestState('running');
      setError(null);
      setTestResults(null);

      console.log('🚀 [SYSTEM-TEST] Iniciando ejecución de suite E2E...');

      const startTime = Date.now();

      const response = await fetch('/api/system-check/run-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'playwright-full'  // ✅ CAMBIO: Suite completa en lugar de minimal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // MANEJO ESPECIAL DE ERRORES ENOENT
        if (errorData.errorType === 'ENOENT') {
          throw new Error(
            `Sistema no configurado: ${errorData.message}. ${errorData.details?.[0] || 'Verifique instalación de Node.js'}`
          );
        }

        throw new Error(
          errorData.message ||
          errorData.error ||
          `Error HTTP ${response.status}`
        );
      }

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      console.log('✅ [SYSTEM-TEST] Suite completada:', result);

      if (!result.success) {
        throw new Error(result.error || 'Error ejecutando pruebas');
      }

      // Procesar resultados
      setTestResults(result.testResults);
      setExecutionDetails({
        ...result.execution,
        clientExecutionTime: executionTime
      });
      setLastExecution(new Date().toISOString());
      setTestState(result.testResults.success ? 'success' : 'failed');

    } catch (err) {
      console.error('❌ [SYSTEM-TEST] Error ejecutando pruebas:', err);
      setError(err.message);
      setTestState('error');
    }
  };

  /**
   * RESETEAR ESTADO DEL WIDGET
   */
  const resetTestState = () => {
    setTestState('idle');
    setTestResults(null);
    setExecutionDetails(null);
    setError(null);
  };

  /**
   * COMPONENTE: BOTÓN PRINCIPAL DE ACCIÓN
   */
  const ActionButton = () => {
    const isRunning = testState === 'running';

    if (testState === 'idle') {
      return (
        <button
          onClick={runSystemTests}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Iniciar Verificación del Sistema
        </button>
      );
    }

    if (isRunning) {
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center cursor-not-allowed"
        >
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Ejecutando Pruebas...
        </button>
      );
    }

    return (
      <div className="flex gap-2">
        <button
          onClick={runSystemTests}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Ejecutar Nuevamente
        </button>
        <button
          onClick={resetTestState}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
        >
          Reiniciar
        </button>
      </div>
    );
  };

  /**
   * COMPONENTE: INDICADOR DE ESTADO EN TIEMPO REAL
   */
  const StatusIndicator = () => {
    if (testState === 'running') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="font-medium text-blue-800">
                🎭 Ejecutando Suite de Pruebas E2E
              </p>
              <p className="text-sm text-blue-600">
                Validando integridad del sistema... Esto puede tomar varios minutos.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      );
    }

    if (testState === 'success') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-green-800">
                ✅ Sistema Saludable - Todas las Pruebas Pasaron
              </p>
              <p className="text-sm text-green-600">
                La plataforma está funcionando correctamente en todos los componentes críticos.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (testState === 'failed') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">
                ⚠️ Algunos Tests Fallaron - Atención Requerida
              </p>
              <p className="text-sm text-yellow-600">
                Se detectaron problemas en componentes no críticos del sistema.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (testState === 'error') {
      // DETERMINAR TIPO DE ERROR PARA MENSAJE APROPIADO
      const isConfigError = error && (
        error.includes('Sistema no configurado') ||
        error.includes('Comando no encontrado') ||
        error.includes('npx') ||
        error.includes('Node.js')
      );

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-red-800">
                {isConfigError ?
                  '⚙️ Error de Configuración del Sistema' :
                  '❌ Error Ejecutando Pruebas'
                }
              </p>
              <p className="text-sm text-red-600">
                {isConfigError ?
                  'El entorno de pruebas requiere configuración adicional.' :
                  'Se produjo un error durante la ejecución de las pruebas.'
                }
              </p>
              {error && (
                <p className="text-sm text-red-700 mt-2 font-mono bg-red-100 p-2 rounded border">
                  {error}
                </p>
              )}
              {isConfigError && (
                <div className="mt-3 text-sm text-red-600">
                  <p className="font-medium mb-1">🛠️ Pasos para solucionar:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Verificar que Node.js esté instalado: <code className="bg-red-100 px-1 rounded">node --version</code></li>
                    <li>Verificar que npm/npx funcionen: <code className="bg-red-100 px-1 rounded">npx --version</code></li>
                    <li>Instalar dependencias: <code className="bg-red-100 px-1 rounded">npm install</code></li>
                    <li>Instalar Playwright: <code className="bg-red-100 px-1 rounded">npx playwright install</code></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  /**
   * COMPONENTE: RESULTADOS DETALLADOS
   */
  const TestResults = () => {
    if (!testResults) return null;

    const { stats } = testResults;
    const hasFailures = stats.failed > 0;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          📊 Resumen de Resultados
          <span className="ml-2 text-xs text-gray-500">
            {new Date(testResults.timestamp).toLocaleString()}
          </span>
        </h4>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-gray-600">Pasaron</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Fallaron</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round(stats.duration / 1000)}s
            </div>
            <div className="text-sm text-gray-600">Duración</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Tasa de éxito</span>
            <span className="font-medium">
              {Math.round((stats.passed / stats.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${hasFailures ? 'bg-yellow-500' : 'bg-green-600'}`}
              style={{ width: `${(stats.passed / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Detalles de ejecución */}
        {executionDetails && (
          <div className="text-xs text-gray-500 border-t border-gray-300 pt-2">
            <div className="flex justify-between">
              <span>Comando: {executionDetails.command}</span>
              <span>Código salida: {executionDetails.exitCode}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Tiempo total: {Math.round(executionDetails.executionTime / 1000)}s</span>
              <span>Última ejecución: {lastExecution && new Date(lastExecution).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            🔧 Monitor de Salud Técnica
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Verificación automática de la integridad técnica de la plataforma mediante tests E2E
          </p>
        </div>
      </div>

      {/* Indicador de estado */}
      <StatusIndicator />

      {/* Resultados de tests */}
      <TestResults />

      {/* Botón de acción */}
      <div className="flex justify-center mt-6">
        <ActionButton />
      </div>

      {/* Footer informativo */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
        <p>
          🎭 Powered by Playwright • Valida autenticación, dashboard, currículo, generación de lecciones y sandbox
        </p>
        <p className="mt-1">
          ⚡ La suite incluye pruebas de regresión, smoke tests y validación de APIs críticas
        </p>
      </div>
    </div>
  );
}
