import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import { useAPITracking } from '../../contexts/APITrackingContext';
import Quiz from './Quiz';
import HistoryPanel from './HistoryPanel';
import ExportButton from './ExportButton';
import LessonRenderer from './LessonRenderer';

// Dominios disponibles para el selector (moved outside component to avoid recreation each render)
const STUDY_DOMAINS = [
  { value: 'programming', label: '🖥️ Programación', description: 'Código y desarrollo' },
  { value: 'logic', label: '🧠 Lógica', description: 'Lógica proposicional' },
  { value: 'databases', label: '🗄️ Bases de Datos', description: 'SQL y modelo ER' },
  { value: 'math', label: '📐 Matemáticas', description: 'Álgebra y cálculo' }
];

// Función para procesar formato inline (negrita, cursiva, código)
const processInlineFormatting = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic text-gray-700">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-sm border border-indigo-200">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

// Función utilitaria para formatear texto como markdown estructurado
const formatMarkdownContent = (text) => {
  if (!text || typeof text !== 'string') return <span></span>;

  const lines = text.split('\n');
  const formattedElements = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let inList = false;
  let listItems = [];
  let listType = 'ul'; // 'ul' or 'ol'

  const flushParagraph = (key) => {
    if (currentParagraph.length > 0) {
      formattedElements.push(
        <p key={key} className="mb-4 text-gray-700 leading-relaxed text-[15px]">
          {processInlineFormatting(currentParagraph.join(' '))}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = (key) => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      const listClass = listType === 'ol'
        ? 'list-decimal list-inside space-y-2 mb-5 ml-2'
        : 'list-disc list-inside space-y-2 mb-5 ml-2';
      formattedElements.push(
        <ListTag key={key} className={listClass}>
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700 text-[15px] leading-relaxed pl-1">
              {processInlineFormatting(item)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushList(`list-pre-code-${index}`);
        formattedElements.push(
          <div key={`code-${index}`} className="my-5 rounded-lg overflow-hidden border border-gray-700 shadow-sm">
            {codeBlockLang && (
              <div className="bg-gray-800 text-gray-400 text-xs px-4 py-1.5 border-b border-gray-700 font-mono uppercase tracking-wider">
                {codeBlockLang}
              </div>
            )}
            <pre className="bg-gray-900 text-green-400 p-4 text-sm font-mono overflow-x-auto leading-relaxed">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        flushParagraph(`p-pre-code-${index}`);
        flushList(`list-pre-code-${index}`);
        codeBlockLang = line.trim().replace('```', '').trim();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Horizontal rule
    if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      flushParagraph(`p-hr-${index}`);
      flushList(`list-hr-${index}`);
      formattedElements.push(
        <hr key={`hr-${index}`} className="my-6 border-gray-200" />
      );
      return;
    }

    // Headings
    if (line.startsWith('#### ')) {
      flushParagraph(`p-h4-${index}`);
      flushList(`list-h4-${index}`);
      formattedElements.push(
        <h4 key={`h4-${index}`} className="text-base font-semibold text-gray-800 mt-5 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
          {processInlineFormatting(line.replace('#### ', ''))}
        </h4>
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushParagraph(`p-h3-${index}`);
      flushList(`list-h3-${index}`);
      formattedElements.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold text-gray-800 mt-6 mb-3 pl-3 border-l-4 border-blue-500">
          {processInlineFormatting(line.replace('### ', ''))}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushParagraph(`p-h2-${index}`);
      flushList(`list-h2-${index}`);
      formattedElements.push(
        <h2 key={`h2-${index}`} className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">
          {processInlineFormatting(line.replace('## ', ''))}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushParagraph(`p-h1-${index}`);
      flushList(`list-h1-${index}`);
      formattedElements.push(
        <h1 key={`h1-${index}`} className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-indigo-500">
          {processInlineFormatting(line.replace('# ', ''))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph(`p-bq-${index}`);
      flushList(`list-bq-${index}`);
      formattedElements.push(
        <blockquote key={`bq-${index}`} className="my-4 pl-4 py-2 border-l-4 border-indigo-300 bg-indigo-50 rounded-r-lg text-gray-700 italic text-[15px]">
          {processInlineFormatting(line.replace('> ', ''))}
        </blockquote>
      );
      return;
    }

    // Unordered list items
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (ulMatch) {
      flushParagraph(`p-ul-${index}`);
      if (!inList || listType !== 'ul') {
        flushList(`list-switch-${index}`);
        listType = 'ul';
      }
      inList = true;
      listItems.push(ulMatch[2]);
      return;
    }

    // Ordered list items
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      flushParagraph(`p-ol-${index}`);
      if (!inList || listType !== 'ol') {
        flushList(`list-switch-${index}`);
        listType = 'ol';
      }
      inList = true;
      listItems.push(olMatch[2]);
      return;
    }

    // Empty line
    if (line.trim() === '') {
      flushParagraph(`p-empty-${index}`);
      flushList(`list-empty-${index}`);
      return;
    }

    // Regular text
    flushList(`list-text-${index}`);
    currentParagraph.push(line);
  });

  // Flush remaining
  flushParagraph('final-p');
  flushList('final-list');

  return <div className="space-y-1">{formattedElements}</div>;
};

// Función para procesar respuesta del API y asegurar estructura correcta
const processAPIResponse = (rawResponse) => {
  try {
    console.log('📊 [SANDBOX] Procesando respuesta del API:', typeof rawResponse);

    // Si la respuesta ya tiene la estructura correcta
    if (rawResponse && typeof rawResponse === 'object' && rawResponse.title && rawResponse.lesson) {
      console.log('✅ [SANDBOX] Respuesta ya estructurada correctamente');
      return {
        title: rawResponse.title,
        lesson: rawResponse.lesson,
        exercises: Array.isArray(rawResponse.exercises) ? rawResponse.exercises : [],
        metadata: rawResponse.sandboxMetadata || {},
        generatedAt: rawResponse.generatedAt,
        inputLength: rawResponse.inputLength
      };
    }

    // Si es una cadena de texto, intentar parsear JSON
    if (typeof rawResponse === 'string') {
      try {
        const parsed = JSON.parse(rawResponse);
        console.log('✅ [SANDBOX] JSON parseado exitosamente desde string');
        return processAPIResponse(parsed); // Recursión para procesar el objeto parseado
      } catch (parseError) {
        console.warn('⚠️ [SANDBOX] String no es JSON válido, creando estructura básica');
        return {
          title: 'Lección Generada - Texto Libre',
          lesson: rawResponse,
          exercises: [],
          metadata: { processingNote: 'Contenido procesado como texto plano' },
          generatedAt: new Date().toISOString(),
          inputLength: rawResponse.length
        };
      }
    }

    // Fallback: crear estructura básica
    console.warn('⚠️ [SANDBOX] Respuesta inesperada, creando estructura fallback');
    return {
      title: 'Lección Generada - Sandbox',
      lesson: JSON.stringify(rawResponse, null, 2),
      exercises: [],
      metadata: { processingNote: 'Contenido procesado como fallback' },
      generatedAt: new Date().toISOString(),
      inputLength: 0
    };

  } catch (error) {
    console.error('❌ [SANDBOX] Error procesando respuesta:', error);
    return {
      title: 'Error al Procesar Lección',
      lesson: 'Hubo un problema al procesar el contenido generado. Por favor, intenta de nuevo.',
      exercises: [],
      metadata: { error: error.message },
      generatedAt: new Date().toISOString(),
      inputLength: 0
    };
  }
};

export default function SandboxWidget() {
  // Hook de autenticación
  const { user, isAuthenticated } = useAuth();

  // Hook de tracking de API para sincronizar contador
  const { recordAPICall } = useAPITracking();

  // Ref for scrolling to results
  const resultRef = useRef(null);

  // Estado del componente
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // MISIÓN DOMINIO: Estado para el dominio de estudio seleccionado
  const [currentDomain, setCurrentDomain] = useState('programming');

  // Manejador de cambio de dominio
  const handleDomainChange = (e) => {
    const newDomain = e.target.value;
    setCurrentDomain(newDomain);
    localStorage.setItem('studyDomain', newDomain);
    console.log(`🎯 [SANDBOX] Dominio cambiado a: ${newDomain}`);
  };

  // Leer dominio de localStorage al montar componente
  useEffect(() => {
    const savedDomain = localStorage.getItem('studyDomain');
    if (savedDomain) {
      setCurrentDomain(savedDomain);
      console.log(`🎯 [SANDBOX] Dominio cargado: ${savedDomain}`);
    }

    // Escuchar cambios en localStorage (por si el usuario cambia dominio en header)
    const handleStorage = (e) => {
      if (e.key === 'studyDomain' && e.newValue) {
        setCurrentDomain(e.newValue);
        console.log(`🔄 [SANDBOX] Dominio cambiado a: ${e.newValue}`);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // MISIÓN 216.0: Función para guardar generación en historial
  const saveToHistory = async (customContent, generatedLesson) => {
    // Solo intentar guardar si hay usuario autenticado
    if (!isAuthenticated) {
      console.log('[SANDBOX-HISTORY] Usuario no autenticado, no se guarda en historial');
      return;
    }

    setIsSavingHistory(true);
    try {
      console.log('💾 [SANDBOX-HISTORY] Guardando generación en historial...');

      const response = await fetch('/api/v1/sandbox/history', {
        method: 'POST',
        credentials: 'include', // Usar cookies de Supabase en lugar de internalToken
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customContent: customContent,
          generatedLesson: generatedLesson,
          metadata: {
            savedAt: new Date().toISOString(),
            source: 'sandbox_widget'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SANDBOX-HISTORY] Generación guardada:', data.data.id);
        // Trigger history refresh
        setHistoryRefreshTrigger(prev => prev + 1);
      } else {
        console.error('⚠️ [SANDBOX-HISTORY] Error guardando:', response.status);
      }
    } catch (error) {
      console.error('❌ [SANDBOX-HISTORY] Error:', error);
    } finally {
      setIsSavingHistory(false);
    }
  };

  // MISIÓN 216.0: Función para restaurar generación del historial
  const handleRestoreGeneration = (generation) => {
    console.log('🔄 [SANDBOX] Restaurando generación del historial:', generation.id);

    // Restaurar input
    setInputText(generation.custom_content);

    // Restaurar output procesado
    const processedContent = processAPIResponse(generation.generated_lesson);
    setGeneratedContent(processedContent);

    // Limpiar errores
    setError(null);

    // Scroll al contenido generado
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Función principal para generar lección
  const handleGenerateLesson = async () => {
    if (!inputText.trim()) {
      alert('Por favor, ingresa algún texto para generar una lección.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🧪 [SANDBOX] Enviando contenido para generación:', inputText.length, 'caracteres');
      console.log(`🎯 [SANDBOX] Dominio seleccionado: ${currentDomain}`);

      const response = await fetch('/api/sandbox/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customContent: inputText,
          domain: currentDomain
        }),
      });

      console.log('📡 [SANDBOX] Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const rawData = await response.json();
      console.log('📦 [SANDBOX] Datos recibidos:', Object.keys(rawData));

      // Procesar respuesta para asegurar estructura correcta
      const processedData = processAPIResponse(rawData);

      console.log('✅ [SANDBOX] Datos procesados exitosamente:', {
        titulo: processedData.title,
        longitudLeccion: processedData.lesson?.length || 0,
        numEjercicios: processedData.exercises?.length || 0
      });

      setGeneratedContent(processedData);

      // MISIÓN 216.0: Guardar en historial (sin bloquear UI)
      saveToHistory(inputText, rawData);

      // Sincronizar contador de API en frontend
      recordAPICall('sandbox_generation', true);

    } catch (error) {
      console.error('❌ [SANDBOX] Error generando lección:', error);
      setError({
        message: error.message || 'Error desconocido',
        details: 'Revisa la consola para más detalles'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para limpiar el sandbox
  const handleClear = () => {
    setInputText('');
    setGeneratedContent(null);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {/* Columna Principal (Input + Output) - 3/4 del ancho */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {/* Título del Widget */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                🧪 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sandbox de Aprendizaje</span>
              </h2>
              <p className="text-gray-600 mt-1">Transforma cualquier contenido en una lección interactiva</p>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Experimentación • IA Avanzada
            </div>
          </div>

          {/* Formulario Principal */}
          <div className="space-y-6">
            {/* Selector de Dominio */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">🎯 Dominio de Estudio:</span>
                <select
                  id="domain-selector"
                  value={currentDomain}
                  onChange={handleDomainChange}
                  disabled={isLoading}
                  className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer disabled:opacity-50"
                  title="Selecciona el dominio para personalizar las lecciones"
                >
                  {STUDY_DOMAINS.map((domain) => (
                    <option key={domain.value} value={domain.value}>
                      {domain.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {STUDY_DOMAINS.find(d => d.value === currentDomain)?.description}
              </span>
            </div>

            {/* Área de Texto */}
            <div>
              <label htmlFor="sandbox-input" className="block text-sm font-semibold text-gray-700 mb-3">
                📝 Contenido a Procesar:
              </label>
              <textarea
                id="sandbox-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder="Pega aquí cualquier contenido educativo: documentación técnica, artículos, conceptos, código, teorías, explicaciones...&#10;&#10;Ejemplo: 'Los arrays en JavaScript son estructuras de datos que permiten almacenar múltiples valores...'"
                className={`w-full h-40 p-4 border-2 rounded-lg resize-vertical transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 ${isLoading
                  ? 'bg-gray-100 cursor-not-allowed border-gray-200 text-gray-500'
                  : 'bg-white border-gray-300 hover:border-blue-400'
                  }`}
                rows={6}
              />
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>Mínimo 50 caracteres requeridos</span>
                <span className={`${inputText.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                  {inputText.length} caracteres
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGenerateLesson}
                  disabled={isLoading || inputText.trim().length < 50}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${isLoading || inputText.trim().length < 50
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando Lección...
                    </>
                  ) : (
                    <>
                      ⚡ Generar Lección Interactiva
                    </>
                  )}
                </button>

                {(inputText || generatedContent || error) && (
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    🗑️ Limpiar Todo
                  </button>
                )}

                {/* MISIÓN 216.0: Botón de Exportación */}
                {generatedContent && (
                  <ExportButton generatedLesson={generatedContent} />
                )}
              </div>

              {/* Indicador de estado */}
              <div className="flex items-center space-x-2">
                {isLoading && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                    Procesando con IA...
                  </div>
                )}
                {isSavingHistory && (
                  <div className="flex items-center text-purple-600 text-sm">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse mr-2"></div>
                    Guardando en historial...
                  </div>
                )}
                {!isLoading && !isSavingHistory && generatedContent && (
                  <div className="flex items-center text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                    Lección generada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manejo de Errores */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">❌</div>
                <div>
                  <h4 className="font-semibold text-red-800">Error al generar la lección</h4>
                  <p className="text-red-700 text-sm mt-1">{error.message}</p>
                  {error.details && (
                    <p className="text-red-600 text-xs mt-1">{error.details}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Área de Resultado */}
          {generatedContent && !error && (
            <div ref={resultRef} id="sandbox-result" className="mt-8 space-y-6">
              {/* Encabezado de la Lección */}
              <div className="border-t-2 border-gradient-to-r from-green-400 to-blue-500 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    📚 Lección Generada
                  </h3>
                  {generatedContent.metadata && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {generatedContent.metadata.endpointType || 'sandbox'}
                    </div>
                  )}
                </div>

                {/* Título de la Lección */}
                {generatedContent.title && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-6">
                    <h1 className="text-3xl font-bold text-green-800 mb-2">
                      {generatedContent.title}
                    </h1>
                    <div className="flex items-center text-sm text-green-600 space-x-4">
                      {generatedContent.generatedAt && (
                        <span>🕒 {new Date(generatedContent.generatedAt).toLocaleTimeString()}</span>
                      )}
                      {generatedContent.inputLength && (
                        <span>📊 {generatedContent.inputLength} caracteres procesados</span>
                      )}
                      {generatedContent.exercises && (
                        <span>🎯 {generatedContent.exercises.length} ejercicios</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contenido de la Lección */}
                {generatedContent.lesson && (
                  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm mb-6 overflow-hidden">
                    <div className="px-8 pt-7 pb-1">
                      <LessonRenderer content={generatedContent.lesson} />
                    </div>
                    <div className="px-8 pb-5">
                      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100 text-xs text-gray-400">
                        <span>Generado con IA</span>
                        <span>·</span>
                        <span>{generatedContent.lesson?.length || 0} caracteres</span>
                        {generatedContent.metadata?.model && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{generatedContent.metadata.model}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ejercicios Interactivos */}
                {generatedContent.exercises && generatedContent.exercises.length > 0 && (
                  <div className="bg-white rounded-xl border border-blue-200 shadow-sm">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-t-xl">
                      <h5 className="font-semibold text-lg flex items-center gap-2">
                        🎯 Ejercicios Interactivos ({generatedContent.exercises.length})
                      </h5>
                      <p className="text-blue-100 text-sm mt-1">Pon a prueba tu comprensión del contenido</p>
                    </div>
                    <div className="p-6 space-y-6">
                      {generatedContent.exercises.map((exercise, index) => (
                        <div key={`exercise-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <Quiz
                            exercise={exercise}
                            questionNumber={index + 1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Panel de Información Adicional */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="font-semibold text-gray-700 mb-1">📊 Estadísticas</div>
                    <div className="text-gray-600 space-y-1">
                      <div>Contenido: {generatedContent.lesson?.length || 0} caracteres</div>
                      <div>Ejercicios: {generatedContent.exercises?.length || 0} preguntas</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="font-semibold text-gray-700 mb-1">⚙️ Procesamiento</div>
                    <div className="text-gray-600 space-y-1">
                      <div>Entrada: {generatedContent.inputLength || 0} caracteres</div>
                      <div>Modelo: IA Especializada</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="font-semibold text-gray-700 mb-1">🕒 Tiempo</div>
                    <div className="text-gray-600 space-y-1">
                      <div>
                        {generatedContent.generatedAt
                          ? new Date(generatedContent.generatedAt).toLocaleString()
                          : 'No disponible'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MISIÓN 216.0: Panel de Historial - 1/4 del ancho */}
      <div className="lg:col-span-1">
        <HistoryPanel
          onRestoreGeneration={handleRestoreGeneration}
          refreshTrigger={historyRefreshTrigger}
        />
      </div>
    </div>
  );
}
