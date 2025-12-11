/**
 * AI CODE MENTOR V4.2 - Integrated Exercise Environment Component
 * Entorno de ejercicios con ejecución de código y corrección automática
 */

import React, { useState, useEffect } from 'react';

export default function IntegratedExerciseEnvironment({ exercises, lessonPath, language }) {
  const [activeExercise, setActiveExercise] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState([]);

  // Reset user code when changing exercises
  useEffect(() => {
    setUserCode('');
    setExecutionResult(null);
    setAiFeedback(null);
    loadExerciseHistory();
  }, [activeExercise]);

  const loadExerciseHistory = async () => {
    try {
      const response = await fetch(`/api/exercise-system?action=get-exercise-history&lesson_path=${lessonPath}&exercise_id=${activeExercise + 1}`);
      const data = await response.json();
      
      if (data.success) {
        setExerciseHistory(data.history);
      }
    } catch (error) {
      console.error('Error loading exercise history:', error);
    }
  };

  const executeCode = async () => {
    if (!userCode.trim()) {
      alert('⚠️ Escribe algo de código antes de ejecutar');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/exercise-system?action=execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userCode,
          language: language,
          exerciseId: activeExercise + 1,
          lessonPath: lessonPath
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setExecutionResult(data.result);
        console.log('✅ Code executed and auto-saved:', data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setExecutionResult({
        results: [],
        errors: [error.message]
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getAIFeedback = async () => {
    if (!userCode.trim()) {
      alert('⚠️ Escribe código para recibir feedback');
      return;
    }

    setIsGettingFeedback(true);
    setAiFeedback(null);

    try {
      const response = await fetch('/api/exercise-system?action=check-solution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: userCode,
          exerciseDescription: exercises[activeExercise],
          language: language
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAiFeedback(data.feedback);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setAiFeedback(`Error obteniendo feedback: ${error.message}`);
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const getPlaceholderCode = () => {
    switch (language) {
      case 'javascript':
        return '// Escribe tu código JavaScript aquí\nconsole.log("¡Hola mundo!");';
      case 'python':
        return '# Escribe tu código Python aquí\nprint("¡Hola mundo!")';
      case 'react':
        return `// Escribe tu componente React aquí
function MiComponente(props) {
  return (
    <div>
      <h1>¡Hola {props.nombre}!</h1>
    </div>
  );
}

export default MiComponente;`;
      default:
        return '// Escribe tu código aquí';
    }
  };

  if (!exercises || exercises.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-yellow-800">
          ⚠️ No hay ejercicios disponibles para esta lección.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-medium text-blue-800">
          🚀 Entorno de Ejercicios Integrado V4.2
        </h4>
        <div className="text-sm text-blue-600">
          🔥 Ejecutar + Corrección Automática
        </div>
      </div>

      {/* Exercise Selector */}
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-sm font-medium text-blue-700">Ejercicio:</span>
        {exercises.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveExercise(index)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeExercise === index
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
        
        {exerciseHistory.length > 0 && (
          <div className="ml-4 text-xs text-blue-600">
            📚 {exerciseHistory.length} intentos anteriores
          </div>
        )}
      </div>

      {/* Exercise Description */}
      <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
        <h5 className="font-medium text-blue-800 mb-2">
          🎯 Ejercicio {activeExercise + 1}:
        </h5>
        <p className="text-gray-700 leading-relaxed text-sm">
          {exercises[activeExercise]}
        </p>
      </div>

      {/* Code Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-blue-800">💻 Tu Código:</h5>
            <div className="text-xs text-blue-600">
              {language.toUpperCase()} | Auto-guardado
            </div>
          </div>
          
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            placeholder={getPlaceholderCode()}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={executeCode}
              disabled={isExecuting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isExecuting ? '⚡ Ejecutando...' : '▶️ Ejecutar Código'}
            </button>
            
            <button
              onClick={getAIFeedback}
              disabled={isGettingFeedback}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isGettingFeedback ? '🤖 Analizando...' : '🧠 Corrección IA'}
            </button>
            
            <div className="text-xs text-gray-500">
              💾 Se guarda automáticamente
            </div>
          </div>
        </div>

        {/* Right: Results & Feedback */}
        <div className="space-y-4">
          {/* Execution Results */}
          {executionResult && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="flex items-center mb-2">
                <span className="text-yellow-400">⚡</span>
                <span className="ml-2 text-white font-medium">Resultado de Ejecución:</span>
              </div>
              
              {executionResult.results && executionResult.results.length > 0 && (
                <div className="mb-3">
                  <div className="text-green-300 text-xs mb-1">OUTPUT:</div>
                  {executionResult.results.map((result, index) => (
                    <div key={index} className="text-green-400">
                      {result}
                    </div>
                  ))}
                </div>
              )}
              
              {executionResult.errors && executionResult.errors.length > 0 && (
                <div>
                  <div className="text-red-300 text-xs mb-1">ERRORS:</div>
                  {executionResult.errors.map((error, index) => (
                    <div key={index} className="text-red-400">
                      ❌ {error}
                    </div>
                  ))}
                </div>
              )}
              
              {executionResult.message && (
                <div className="text-blue-400 text-xs mt-2 border-t border-gray-700 pt-2">
                  ℹ️ {executionResult.message}
                </div>
              )}
            </div>
          )}

          {/* AI Feedback */}
          {aiFeedback && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="text-purple-600">🧠</span>
                <span className="ml-2 font-medium text-purple-800">Corrección Automática por IA:</span>
              </div>
              
              <div className="prose prose-sm max-w-none text-purple-900">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {aiFeedback}
                </div>
              </div>
            </div>
          )}

          {/* Exercise History */}
          {exerciseHistory.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h6 className="font-medium text-blue-800 mb-2 text-sm">
                📚 Historial de Intentos:
              </h6>
              <div className="space-y-2">
                {exerciseHistory.slice(0, 3).map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-blue-700">
                      Intento {exerciseHistory.length - index}
                    </span>
                    <span className="text-blue-600">
                      {new Date(attempt.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
                {exerciseHistory.length > 3 && (
                  <div className="text-xs text-blue-600">
                    ... y {exerciseHistory.length - 3} más
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Save Notice */}
      <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="text-sm text-green-800">
          💾 <strong>Sistema de Guardado Automático V4.2:</strong> 
          Todo tu código, ejecuciones y feedback se guardan automáticamente. 
          Sin olvidos ni omisiones - registro completo de tu progreso.
        </div>
      </div>
    </div>
  );
}
