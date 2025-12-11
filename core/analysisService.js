import { getPromptForLevel } from './promptService.js';
import { addToHistory } from './historyService.js';

// Clasificador de complejidad para prompts especializados
const getAnalysisLevel = (code, analysisType) => {
  const codeLength = code.length;
  const complexity = {
    hasClasses: /class\s+\w+/.test(code),
    hasAsync: /async|await|Promise/.test(code),
    hasComplexLogic: /if.*else.*if|switch|for.*for|while.*while/.test(code),
    hasPatterns: /observer|factory|singleton|strategy/i.test(code),
    hasArchitecture: /controller|service|repository|middleware/i.test(code),
    hasFrameworks: /react|vue|angular|express|fastapi|django/i.test(code),
    hasComplexStructures: /map|reduce|filter|recursion|closure/i.test(code)
  };

  // Nivel 3: Mentoring avanzado
  if (analysisType === 'learning' || 
      analysisType === 'architecture' ||
      complexity.hasPatterns ||
      complexity.hasArchitecture ||
      complexity.hasFrameworks ||
      codeLength > 300 ||
      (complexity.hasClasses && complexity.hasAsync)) {
    return 3;
  }

  // Nivel 1: Código simple
  if (codeLength < 100 && !complexity.hasClasses && !complexity.hasAsync) {
    return 1;
  }

  // Nivel 2: Código intermedio
  return 2;
};

// Análisis con Gemini Flash para todos los niveles de complejidad (límites más generosos)
const analyzeWithGemini = async (code, analysisType, level) => {
  const prompt = getPromptForLevel(analysisType, code, level);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: level === 1 ? 800 : level === 2 ? 1200 : 1500,
          temperature: level === 1 ? 0.3 : level === 2 ? 0.4 : 0.5,
          candidateCount: 1
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No se recibió respuesta válida de Gemini');
    }

    return {
      analysis: data.candidates[0].content.parts[0].text,
      provider: 'gemini',
      cost: 0.00, // 100% GRATIS
      level: level,
      model: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

// Función principal exportada que orquesta todo el proceso de análisis
export const performAnalysis = async (code, analysisType = 'general') => {
  // Paso 1: Determinar el nivel de complejidad
  const level = getAnalysisLevel(code, analysisType);
  
  // Paso 2: Realizar el análisis con Gemini usando el nivel determinado
  const result = await analyzeWithGemini(code, analysisType, level);
  
  // NUEVA LÓGICA DE GUARDADO:
  // Preparamos una entrada completa para el historial.
  const historyEntry = {
    id: `analysis_${Date.now()}`, // ID único simple
    timestamp: new Date().toISOString(),
    analysisType: analysisType,
    code: code,
    result: result // El resultado completo de Gemini
  };

  // Llamamos al servicio de historial para guardar la entrada.
  // Usamos await para asegurar que se complete, pero no bloqueamos la respuesta al usuario.
  await addToHistory(historyEntry);

  // Paso 3: Retornar el resultado completo con metadatos adicionales
  return {
    ...result,
    type: analysisType,
    timestamp: new Date().toISOString()
  };
};