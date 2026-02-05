import React, { useState } from 'react';

export default function CodeMentor() {
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // Check URL params for code (VS Code Satellite integration)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      const langParam = params.get('lang');

      if (codeParam) {
        setCode(codeParam);
        // Optional: Auto-analyze if coming from satellite? 
        // setCode(codeParam) is enough for now, let user click to confirm cost/model.
      }
    }
  }, []);

  const handleAnalyze = async () => {
    // Prevenir múltiples clicks rápidos (debouncing)
    const now = Date.now();
    if (now - lastRequestTime < 2000) { // 2 segundos mínimo entre requests
      console.log('Request bloqueado - muy pronto desde el anterior');
      return;
    }

    if (!code.trim()) {
      setError('Por favor, ingresa código para analizar');
      return;
    }

    // Verificar si ya está loading
    if (isLoading) {
      console.log('Request bloqueado - análisis en progreso');
      return;
    }

    console.log('🚀 Enviando request a Gemini Flash...');
    setLastRequestTime(now);
    setIsLoading(true);
    setError('');
    setAnalysis('');
    setAnalysisInfo(null);

    try {
      // Leer configuración de IA (OpenRouter Support)
      const provider = localStorage.getItem('ai_provider');
      const apiKey = localStorage.getItem('openrouter_key');
      const model = localStorage.getItem('openrouter_model');

      const headers = {
        'Content-Type': 'application/json',
      };

      if (provider === 'openrouter' && apiKey) {
        headers['x-ai-provider'] = 'openrouter';
        headers['x-openrouter-key'] = apiKey;
        if (model) headers['x-openrouter-model'] = model;
      }

      const response = await fetch('/api/v2/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, analysisType }),
      });

      console.log('🔄 Response recibido:', response.status);
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error response:', data);
        throw new Error(data.error || 'Error al analizar el código');
      }

      console.log('✅ Análisis completado exitosamente');
      setAnalysis(data.analysis.feedback || data.analysis); // Handle object or string

      // Adapt metadata from v2
      setAnalysisInfo({
        provider: data.metadata?.provider || 'gemini',
        level: data.metadata?.phase || 'fase-1',
        cost: 0, // Free or BYOK
        model: data.metadata?.model || 'unknown'
      });
    } catch (err) {
      console.error('❌ Error en análisis:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 Request completado - loading terminado');
    }
  };

  const analysisOptions = [
    { value: 'general', label: 'Análisis General', description: 'Básico y educativo' },
    { value: 'debug', label: 'Encontrar Errores', description: 'Debugging especializado' },
    { value: 'performance', label: 'Optimización', description: 'Análisis de performance' },
    { value: 'architecture', label: 'Arquitectura', description: 'Diseño y patrones' },
    { value: 'learning', label: 'Modo Aprendizaje', description: 'Mentoring profundo' }
  ];

  const getProviderBadge = (level) => {
    const levelColors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-purple-100 text-purple-800'
    };

    const color = levelColors[level] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        Nivel {level}
      </span>
    );
  };

  const getCostDisplay = (cost) => {
    if (cost === 0) {
      return <span className="text-green-600 font-medium">GRATIS</span>;
    }
    return <span className="text-gray-600">${cost.toFixed(3)}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <header className="text-center mb-8">
        <div className="inline-flex items-center px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm mb-4">
          🚀 MVP en Validación - Tu feedback es valioso
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          AI Code Mentor
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Tu mentor de código personal que <em>nunca se cansa de enseñar</em>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          No solo genera código → Te enseña a <em>pensar como programador</em>
        </p>
        <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-gray-700 rounded-full text-sm">
          🤖 Powered by Gemini Flash (15 RPM)
        </div>
      </header>

      {/* Características principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-pink-50 rounded-lg">
          <div className="text-2xl mb-2">🧠</div>
          <div className="font-medium text-gray-800">Mentoring Pedagógico</div>
          <div className="text-sm text-gray-600">Explicaciones que te ayudan a entender el <em>por qué</em>, no solo el <em>qué</em></div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-medium text-gray-800">Análisis Especializado</div>
          <div className="text-sm text-gray-600">Debug, performance, arquitectura y aprendizaje dirigido</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-medium text-gray-800">Feedback Inmediato</div>
          <div className="text-sm text-gray-600">Aprende en tiempo real con sugerencias contextuales</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Análisis
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {analysisOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu Código
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Pega tu código aquí ..."
              className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !code.trim()}
            className={`w-full py-3 px-6 rounded-md font-medium text-white transition-colors ${isLoading || !code.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 active:scale-95'
              }`}
            onDoubleClick={(e) => e.preventDefault()} // Prevenir double-click
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizando con Gemini Flash...
              </span>
            ) : (
              '🚀 Analizar Código'
            )}
          </button>

          {/* Tips de Uso */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">💡 Cómo funciona AI Code Mentor:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Una request por análisis:</strong> Optimizado para evitar múltiples llamadas</li>
              <li>• <strong>Gemini Flash:</strong> Modelo rápido con límites generosos (15 RPM)</li>
              <li>• <strong>100% Gratuito:</strong> Sin costos operacionales</li>
              <li>• <strong>Enfoque educativo:</strong> Te enseña a pensar, no solo da respuestas</li>
            </ul>
          </div>
        </div>

        {/* Panel de Output */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Análisis del Mentor
              </label>
              {analysisInfo && (
                <div className="flex items-center space-x-2">
                  {getProviderBadge(analysisInfo.level)}
                  {getCostDisplay(analysisInfo.cost)}
                </div>
              )}
            </div>

            <div className="h-96 p-4 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto">
              {error && (
                <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {analysis && (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {analysis}
                  </div>
                </div>
              )}

              {!analysis && !error && !isLoading && (
                <div className="text-gray-500 italic">
                  El análisis de tu código aparecerá aquí...
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Footer con diferenciación competitiva */}
      <footer className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600 mb-6">
          <p className="mb-2">
            <strong>AI Code Mentor</strong> - Tu mentor personal que te enseña a programar mejor
          </p>
          <div className="flex justify-center space-x-8 text-xs mb-4">
            <span>🚀 Mentoring personalizado</span>
            <span>🧠 3 niveles de análisis</span>
            <span>⚡ 100% Gratuito</span>
          </div>
        </div>

        {/* Comparación competitiva */}
        <div className="mb-6">
          <h3 className="text-center text-sm font-medium text-gray-700 mb-4">¿Por qué AI Code Mentor es diferente?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="font-medium text-red-700">GitHub Copilot:</div>
              <div className="text-red-600">Genera código</div>
              <div className="font-medium text-blue-700 mt-1">AI Code Mentor:</div>
              <div className="text-blue-600">Te enseña a pensar</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="font-medium text-red-700">ChatGPT:</div>
              <div className="text-red-600">Respuestas puntuales</div>
              <div className="font-medium text-blue-700 mt-1">AI Code Mentor:</div>
              <div className="text-blue-600">Curriculum progresivo</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="font-medium text-red-700">Udemy:</div>
              <div className="text-red-600">Cursos estáticos</div>
              <div className="font-medium text-blue-700 mt-1">AI Code Mentor:</div>
              <div className="text-blue-600">Experiencia 1:1 adaptativa</div>
            </div>
          </div>
        </div>

        {/* Indicadores de sistema */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-green-50 p-3 rounded text-center">
            <div className="text-green-700 font-medium">Nivel 1</div>
            <div className="text-green-600 text-xs">Básico</div>
          </div>
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="text-blue-700 font-medium">Nivel 2</div>
            <div className="text-blue-600 text-xs">Intermedio</div>
          </div>
          <div className="bg-purple-50 p-3 rounded text-center">
            <div className="text-purple-700 font-medium">Nivel 3</div>
            <div className="text-purple-600 text-xs">Avanzado</div>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="text-xs text-gray-500">
            © 2025 AI Code Mentor MVP - Desarrollado con metodología Ecosistema 360
          </div>
          <div className="text-xs text-pink-600 mt-1">
            🚀 Fase de Validación: Comparte tu feedback para mejorar el producto
          </div>
        </div>
      </footer>
    </div>
  );
}