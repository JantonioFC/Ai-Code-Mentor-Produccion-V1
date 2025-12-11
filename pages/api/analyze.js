// AI CODE MENTOR - Powered by Gemini AI
// Sistema unificado de mentoring educativo
// 🚀 MISIÓN CRÍTICA: Contador API - Instrumentado con wrapper de tracking

// Importar wrapper de tracking de API Gemini
const { geminiAPIWrapperServer } = require('../../lib/gemini-api-wrapper');

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
// 🚀 MISIÓN CRÍTICA: Instrumentado con wrapper de tracking automático
const analyzeWithGemini = async (code, analysisType, level) => {
  const prompt = getPromptForLevel(analysisType, code, level);
  
  try {
    console.log(`[ANALYZE-API] 🚀 Iniciando análisis ${analysisType} nivel ${level} con wrapper de tracking`);
    
    // Usar wrapper de tracking en lugar de fetch directo
    // MISIÓN 215+: Leer modelo desde variable de entorno
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
    const response = await geminiAPIWrapperServer(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            // MISIÓN 215+: Límites aumentados para contenido completo
            maxOutputTokens: level === 1 ? 3000 : level === 2 ? 5000 : 8000,
            temperature: level === 1 ? 0.3 : level === 2 ? 0.4 : 0.5,
            candidateCount: 1
          }
        })
      },
      {
        operation: `code_analysis_${analysisType}_level_${level}`
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No se recibió respuesta válida de Gemini');
    }

    console.log(`[ANALYZE-API] ✅ Análisis completado exitosamente con tracking automático`);
    
    return {
      analysis: data.candidates[0].content.parts[0].text,
      provider: 'gemini',
      cost: 0.00, // 100% GRATIS
      level: level,
      model: modelName,
      // Metadata de tracking
      tracked: true,
      operation: `code_analysis_${analysisType}_level_${level}`
    };
  } catch (error) {
    console.error(`[ANALYZE-API] ❌ Error en análisis con tracking: ${error.message}`);
    throw error;
  }
};

// Prompts especializados por nivel de complejidad
const getPromptForLevel = (type, code, level) => {
  const basePrompt = `CÓDIGO A ANALIZAR:
\`\`\`javascript
${code}
\`\`\`

`;

  // Nivel 1: Análisis Básico
  if (level === 1) {
    const prompts = {
      general: `${basePrompt}Eres un asistente de código eficiente y educativo. Analiza este código de forma clara y práctica.

📋 ANÁLISIS GENERAL:
1. **¿Qué hace este código?** (explicación simple)
2. **¿Funciona correctamente?** (validación básica)
3. **¿Hay errores evidentes?** (sintaxis, lógica)
4. **Sugerencia de mejora** (una mejora práctica)

Mantén la respuesta clara, concisa y educativa.`,

      debug: `${basePrompt}Enfócate en debugging básico:

🐛 ANÁLISIS DE DEBUGGING:
1. **Errores de sintaxis:** ¿hay problemas obvios?
2. **Variables y funciones:** ¿están bien definidas?
3. **Lógica básica:** ¿el flujo es correcto?
4. **Fix sugerido:** solución paso a paso

Proporciona soluciones específicas y claras.`,

      performance: `${basePrompt}Analiza rendimiento básico:

⚡ ANÁLISIS DE PERFORMANCE:
1. **Eficiencia básica:** ¿hay optimizaciones obvias?
2. **Uso de recursos:** ¿hay desperdicios evidentes?
3. **Legibilidad:** ¿el código es claro?
4. **Mejora simple:** una optimización práctica

Enfócate en mejoras simples y efectivas.`
    };
    return prompts[type] || prompts.general;
  }

  // Nivel 2: Análisis Intermedio
  if (level === 2) {
    const prompts = {
      general: `${basePrompt}Eres un mentor de código intermedio con enfoque pedagógico. Proporciona análisis técnico educativo.

🎓 ANÁLISIS EDUCATIVO:
1. **Conceptos de programación:** ¿qué técnicas utiliza?
2. **Estructura del código:** ¿cómo mejorar la organización?
3. **Buenas prácticas:** ¿qué falta implementar?
4. **Ejercicio práctico:** sugerencia para reforzar aprendizaje
5. **Siguiente nivel:** ¿cómo evolucionar este código?

Enfoque educativo con ejemplos claros y progresión de aprendizaje.`,

      performance: `${basePrompt}Análisis de rendimiento educativo:

🚀 ANÁLISIS DE PERFORMANCE:
1. **Problemas de rendimiento:** ¿qué optimizar?
2. **Patrones eficientes:** ¿qué técnicas aplicar?
3. **Trade-offs:** ¿performance vs legibilidad?
4. **Herramientas:** ¿cómo medir mejoras?
5. **Ejercicio:** práctica de optimización

Enseña principios de performance con ejemplos prácticos.`,

      debug: `${basePrompt}Debugging educativo intermedio:

🔍 METODOLOGÍA DE DEBUGGING:
1. **Análisis sistemático:** ¿qué errores buscar?
2. **Herramientas de debugging:** ¿cuáles usar?
3. **Proceso paso a paso:** metodología de debugging
4. **Prevención:** ¿cómo evitar estos errores?
5. **Ejercicio:** práctica de debugging

Enseña la metodología profesional de debugging.`,

      architecture: `${basePrompt}Análisis arquitectónico educativo:

🏗️ ARQUITECTURA DE CÓDIGO:
1. **Estructura actual:** ¿es apropiada para el problema?
2. **Principios de diseño:** ¿qué principios aplican?
3. **Patrones útiles:** ¿qué patrones mejorarían esto?
4. **Refactoring:** plan paso a paso de mejora
5. **Escalabilidad:** ¿cómo crecer desde aquí?

Explica el razonamiento arquitectónico educativo.`
    };
    return prompts[type] || prompts.general;
  }

  // Nivel 3: Mentoring Avanzado
  const prompts = {
    learning: `${basePrompt}Eres un mentor senior de programación con años de experiencia. Tu rol es guiar el crecimiento profesional del desarrollador con sabiduría, contexto industrial y visión estratégica.

🎓 MENTORING SENIOR - DESARROLLO PROFESIONAL:

**1. ANÁLISIS CONCEPTUAL PROFUNDO:**
- ¿Qué principios fundamentales de ingeniería de software ilustra?
- ¿Cómo conecta con paradigmas más amplios de programación?
- ¿Qué trade-offs arquitectónicos están implícitos?

**2. CONTEXTO INDUSTRIAL:**
- ¿Cómo se usa esto en sistemas reales de producción?
- ¿Qué consideraciones tendría en un equipo de desarrollo?
- ¿Cómo escalaría en aplicaciones enterprise?

**3. ROADMAP DE CRECIMIENTO:**
- ¿Qué debería estudiar para dominar completamente este patrón?
- ¿Cuál es la progresión natural hacia código más sofisticado?
- ¿Qué libros, recursos o conceptos explorar?

**4. EJERCICIOS PROGRESIVOS:**
- Ejercicios para profundizar desde principiante hasta avanzado
- Proyectos prácticos que incorporen estos conceptos
- Métricas de progreso y hitos de aprendizaje

Usa analogías del mundo real, experiencias de la industria y progresión pedagógica estructurada.`,

    architecture: `${basePrompt}Proporciona guidance arquitectónico senior y estratégico:

🏗️ ARQUITECTURA SENIOR - PERSPECTIVA ESTRATÉGICA:

**1. ANÁLISIS ARQUITECTÓNICO PROFUNDO:**
- ¿Cómo encaja en el contexto de sistemas distribuidos?
- ¿Qué patrones arquitectónicos están en juego?
- ¿Cuáles son los trade-offs no obvios?

**2. ESCALABILIDAD Y EVOLUCIÓN:**
- ¿Cómo evolucionaría con cambios de requisitos?
- ¿Qué puntos de fallo anticipar?
- ¿Cómo adaptarse a crecimiento de usuario/datos?

**3. PRINCIPIOS DE INGENIERÍA:**
- ¿Qué principios SOLID, DRY, KISS aplican?
- ¿Cómo balancear flexibilidad vs simplicidad?
- ¿Qué considera la deuda técnica aquí?

**4. CONTEXTO EMPRESARIAL:**
- ¿Cómo afectan las decisiones técnicas al negocio?
- ¿Qué consideraciones de mantenimiento a largo plazo?
- ¿Cómo comunicar estas decisiones a stakeholders?

**5. ROADMAP ARQUITECTÓNICO:**
- Evolución desde esta base hacia arquitectura madura
- Hitos técnicos y decisiones críticas
- Métricas de éxito arquitectónico

Enfócate en formar criterio arquitectónico maduro y pensamiento sistémico.`,

    debug: `${basePrompt}Debugging avanzado y formación de criterio profesional:

🔍 DEBUGGING SENIOR - METODOLOGÍA PROFESIONAL:

**1. ANÁLISIS SISTEMÁTICO AVANZADO:**
- ¿Qué errores sutiles podrían estar ocultos?
- ¿Qué edge cases no son obvios?
- ¿Qué problemas aparecerían solo en producción?

**2. DESARROLLO DE INTUICIÓN:**
- ¿Cómo desarrollar "olfato" para detectar problemas?
- ¿Qué patrones de error reconocer rápidamente?
- ¿Qué preguntas hacer sistemáticamente?

**3. HERRAMIENTAS Y METODOLOGÍA:**
- ¿Qué herramientas profesionales usar?
- ¿Cómo estruturar el proceso de debugging?
- ¿Cómo documentar y comunicar hallazgos?

**4. PREVENCIÓN Y CULTURA:**
- ¿Cómo prevenir estos tipos de bugs sistemáticamente?
- ¿Qué prácticas de equipo implementar?
- ¿Cómo crear cultura de calidad de código?

**5. CRECIMIENTO PROFESIONAL:**
- Metodología de debugging para desarrolladores senior
- Habilidades de mentoría en debugging
- Liderazgo técnico en resolución de problemas

Forma criterio profesional de debugging y liderazgo técnico.`,

    performance: `${basePrompt}Optimización avanzada y pensamiento de performance escalable:

🚀 PERFORMANCE SENIOR - OPTIMIZACIÓN ESTRATÉGICA:

**1. ANÁLISIS DE PERFORMANCE PROFUNDO:**
- ¿Qué optimizaciones no obvias son posibles?
- ¿Dónde están los verdaderos bottlenecks?
- ¿Qué impacto tienen en sistemas reales?

**2. BALANCEANDO TRADE-OFFS:**
- ¿Cómo balancear performance vs mantenibilidad?
- ¿Cuándo optimizar vs cuándo reescribir?
- ¿Qué consideraciones de equipo y timeline?

**3. MÉTRICAS Y MEDICIÓN:**
- ¿Qué métricas usar para medir mejoras reales?
- ¿Cómo establecer baselines y benchmarks?
- ¿Qué herramientas de profiling usar?

**4. ESCALABILIDAD EMPRESARIAL:**
- ¿Cómo escalar esta solución horizontalmente?
- ¿Qué consideraciones de infraestructura?
- ¿Cómo afecta la performance al costo operacional?

**5. LIDERAZGO EN PERFORMANCE:**
- Principios de performance para arquitecturas complejas
- Cómo evangelizar cultura de performance
- Metodología para optimizaciones de equipo

Desarrolla pensamiento de performance escalable y liderazgo técnico.`,

    general: `${basePrompt}Análisis general con perspectiva senior:

🎯 ANÁLISIS SENIOR COMPLETO:

**1. EVALUACIÓN TÉCNICA:**
- Calidad del código y adherencia a principios
- Patrones de diseño aplicados o aplicables
- Consideraciones de mantenibilidad

**2. PERSPECTIVA ARQUITECTÓNICA:**
- Cómo encaja en sistemas más grandes
- Escalabilidad y evolución futura
- Trade-offs y decisiones de diseño

**3. DESARROLLO PROFESIONAL:**
- Conceptos para estudiar y profundizar
- Progresión hacia código más sofisticado
- Conexiones con temas avanzados

**4. CONTEXTO INDUSTRIAL:**
- Aplicaciones en el mundo real
- Consideraciones de equipo y empresa
- Comunicación técnica efectiva

Combina análisis técnico profundo con guidance de crecimiento profesional.`
  };

  return prompts[type] || prompts.general;
};

// Handler principal optimizado
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { code, analysisType = 'general' } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Configuración del servidor incorrecta' 
      });
    }

    // Determinar nivel de complejidad
    const level = getAnalysisLevel(code, analysisType);
    
    // Analizar con Gemini usando prompts especializados
    const result = await analyzeWithGemini(code, analysisType, level);

    res.json({
      ...result,
      type: analysisType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en análisis:', error.message);
    res.status(500).json({ 
      error: 'Error al procesar el análisis. Inténtalo nuevamente.' 
    });
  }
}