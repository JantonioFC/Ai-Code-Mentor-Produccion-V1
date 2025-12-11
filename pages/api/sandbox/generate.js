// AI CODE MENTOR - Sandbox de Aprendizaje con Gemini AI
// MISIÓN 216.1: Corrección Motor de Contenido - Análisis Real del Input del Usuario
// Objetivo: Generar lecciones relevantes basadas 100% en el contenido proporcionado

// Importar wrapper de tracking de API Gemini
const { geminiAPIWrapperServer } = require('../../../lib/gemini-api-wrapper');

// Mapeo de dominios a contexto pedagógico
const DOMAIN_CONTEXTS = {
  programming: {
    name: 'Programación',
    focus: 'arquitectura de software, patrones de diseño, y mejores prácticas de código',
    examples: 'Usa ejemplos de código real y enfócate en conceptos como DRY, SOLID, y clean code'
  },
  logic: {
    name: 'Lógica Proposicional',
    focus: 'validación de argumentos, proposiciones lógicas, y razonamiento formal',
    examples: 'Usa tablas de verdad, conectivos lógicos, y evalúa la validez de argumentos'
  },
  databases: {
    name: 'Bases de Datos',
    focus: 'normalización, diseño de esquemas, y optimización de consultas SQL',
    examples: 'Usa diagramas ER, formas normales, y ejemplos de queries SQL'
  },
  math: {
    name: 'Matemáticas',
    focus: 'demostraciones formales, notación matemática, y resolución de problemas',
    examples: 'Usa notación LaTeX cuando sea apropiado y desarrolla pasos de demostración'
  }
};

/**
 * Prompt Pedagógico Especializado para Sandbox
 * 
 * Instruye a Gemini a analizar el contenido del usuario y generar
 * una lección educativa estructurada basada EXCLUSIVAMENTE en ese contenido
 */
const createSandboxPrompt = (userContent, domain = 'programming') => {
  const domainContext = DOMAIN_CONTEXTS[domain] || DOMAIN_CONTEXTS.programming;
  console.log(`[SANDBOX] 🎯 Generando prompt con dominio: ${domain} (${domainContext.name})`);

  return `Eres un mentor educativo experto en ${domainContext.name}, especializado en transformar contenido técnico en lecciones interactivas estructuradas.

CONTEXTO DEL DOMINIO: ${domainContext.name}
- Enfoque principal: ${domainContext.focus}
- ${domainContext.examples}

CONTENIDO DEL USUARIO A ANALIZAR:
"""
${userContent}
"""

TU MISIÓN:
Analiza el contenido anterior proporcionado por el usuario y genera una lección educativa completa y estructurada basada EXCLUSIVAMENTE en ese contenido.

INSTRUCCIONES CRÍTICAS:
1. **FIDELIDAD ABSOLUTA:** La lección debe estar basada 100% en el contenido proporcionado por el usuario
2. **NO inventes información** que no esté en el texto original
3. **NO uses plantillas genéricas** - cada lección debe ser única y relevante
4. **Identifica el tema real** del contenido (no asumas)
5. **Los ejercicios deben probar comprensión** del contenido específico proporcionado

ESTRUCTURA DE SALIDA (JSON):
Debes generar un objeto JSON con esta estructura exacta:

{
  "title": "Título descriptivo y específico del tema real del contenido (máximo 60 caracteres)",
  "lesson": "Lección educativa en formato Markdown que incluya:\n- Resumen del contenido (2-3 párrafos)\n- Conceptos clave identificados en el texto\n- Explicación expandida con ejemplos del contenido\n- Sección de aplicación práctica\n- Analogías para facilitar comprensión\n- Conclusión con puntos clave",
  "exercises": [
    {
      "question": "Pregunta específica sobre el contenido proporcionado",
      "type": "multiple_choice",
      "options": [
        "Opción A (basada en el contenido)",
        "Opción B (basada en el contenido)",
        "Opción C (basada en el contenido)",
        "Opción D (basada en el contenido)"
      ],
      "correctAnswerIndex": 0,
      "explanation": "Explicación de por qué la respuesta es correcta, citando el contenido original"
    },
    {
      "question": "Segunda pregunta sobre conceptos del contenido",
      "type": "multiple_choice",
      "options": ["...", "...", "...", "..."],
      "correctAnswerIndex": 1,
      "explanation": "Explicación detallada"
    },
    {
      "question": "Tercera pregunta sobre aplicación práctica del contenido",
      "type": "multiple_choice",
      "options": ["...", "...", "...", "..."],
      "correctAnswerIndex": 2,
      "explanation": "Explicación detallada"
    }
  ],
  "inputLength": ${userContent.length},
  "sandboxMetadata": {
    "endpointType": "sandbox_gemini_v2",
    "promptVersion": "pedagogical_fidelity_v2.0",
    "contentSource": "user_provided_analyzed",
    "processingMode": "ai_content_aware",
    "architecture": "gemini_flash_specialized"
  }
}

GUÍA PARA EL CAMPO "lesson" (Markdown):
Estructura recomendada de la lección en Markdown:

# [Título del Tema Específico del Contenido]

## Introducción

[Párrafo introductorio que resume qué trata el contenido del usuario]

## Conceptos Clave

### [Concepto 1 identificado en el texto]

[Explicación expandida del concepto con ejemplos del contenido]

### [Concepto 2 identificado en el texto]

[Explicación expandida del concepto con ejemplos del contenido]

### [Concepto 3 identificado en el texto]

[Explicación expandida del concepto con ejemplos del contenido]

## Ejemplos Prácticos

[Ejemplos basados en el contenido proporcionado]

\`\`\`javascript
// Código de ejemplo si el contenido es técnico
\`\`\`

## Analogía para Mejor Comprensión

[Analogía del mundo real que ayude a entender el tema del contenido]

## Mejores Prácticas

[Prácticas recomendadas relacionadas con el tema del contenido]

## Conclusión

[Resumen de puntos clave del contenido analizado]

VALIDACIÓN ANTES DE RESPONDER:
- ✅ ¿El título refleja el tema REAL del contenido del usuario?
- ✅ ¿La lección está basada en el contenido proporcionado?
- ✅ ¿Los ejercicios prueban comprensión del contenido específico?
- ✅ ¿NO hay información inventada o genérica?
- ✅ ¿El JSON está bien formado?

IMPORTANTE SOBRE EL FORMATO JSON:
- Responde SOLO con el JSON válido. Sin texto adicional.
- ESCAPA las comillas dobles dentro de strings usando \\"
- NO uses saltos de línea dentro de valores string
- ASEGÚRATE de que cada string, array y objeto estén bien cerrados
- VALIDA que todas las comas y llaves estén correctamente posicionadas
- Si incluyes código de ejemplo en el lesson, usa tres backticks para code blocks

Ejemplo de formato correcto:
{
  "title": "Título sin comillas internas",
  "lesson": "Texto que usa \\\\" para comillas internas",
  "exercises": [
    {
      "question": "Pregunta clara",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicación"
    }
  ],
  "inputLength": ${userContent.length}
}

Responde AHORA con el JSON:`;
};

/**
 * Generar lección con Gemini AI
 */
const generateLessonWithGemini = async (customContent, domain = 'programming') => {
  const prompt = createSandboxPrompt(customContent, domain);

  try {
    console.log('[SANDBOX-GEMINI] 🚀 Iniciando generación de lección con análisis real del contenido');
    console.log('[SANDBOX-GEMINI] 📝 Longitud del contenido:', customContent.length, 'caracteres');

    // Usar wrapper de tracking
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
            maxOutputTokens: 8000,
            temperature: 0.7, // Creatividad moderada para lecciones pedagógicas
            candidateCount: 1
          }
        })
      },
      {
        operation: 'sandbox_lesson_generation'
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

    const rawText = data.candidates[0].content.parts[0].text;
    console.log('[SANDBOX-GEMINI] 📦 Respuesta recibida, parseando JSON...');

    // Limpiar texto para extraer JSON
    let jsonText = rawText.trim();

    // Remover markdown code blocks si existen
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Intentar parsear JSON con manejo robusto
    let lessonData;
    try {
      lessonData = JSON.parse(jsonText);
    } catch (firstError) {
      console.log('[SANDBOX-GEMINI] ⚠️ Primer intento de parsing falló, sanitizando JSON...');
      console.log('[SANDBOX-GEMINI] 📝 Error:', firstError.message);

      // Intentar sanitizar JSON con múltiples estrategias
      try {
        // Estrategia 1: Extraer JSON con regex
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        // Estrategia 2: Sanitizar caracteres problemáticos en strings
        // Reemplazar newlines literales dentro de strings JSON
        jsonText = jsonText
          // Escapar newlines dentro de strings (pero no entre propiedades)
          .replace(/:\s*"([^"]*)\n([^"]*)"(,|\s*})/g, (match, p1, p2, p3) => {
            return `: "${p1}\\n${p2}"${p3}`;
          })
          // Repetir para múltiples newlines
          .replace(/:\s*"([^"]*)\n([^"]*)"(,|\s*})/g, (match, p1, p2, p3) => {
            return `: "${p1}\\n${p2}"${p3}`;
          });

        // Intentar parsear de nuevo
        lessonData = JSON.parse(jsonText);
        console.log('[SANDBOX-GEMINI] ✅ Parsing exitoso después de sanitización básica');
      } catch (secondError) {
        console.log('[SANDBOX-GEMINI] ⚠️ Segundo intento falló, probando sanitización agresiva...');

        // Estrategia 3: Sanitización más agresiva - reemplazar todos los problemas comunes
        try {
          // Usar una función más robusta para limpiar JSON
          const sanitizedJson = jsonText
            // Reemplazar tabs y newlines problemáticos
            .replace(/\t/g, '\\t')
            .replace(/\r/g, '')
            // Fix: comillas no escapadas dentro de valores string
            .replace(/"lesson"\s*:\s*"([\s\S]*?)",\s*"exercises"/g, (match, content) => {
              const escaped = content
                .replace(/\n/g, '\\n')
                .replace(/(?<!\\)"/g, '\\"');
              return `"lesson": "${escaped}", "exercises"`;
            });

          lessonData = JSON.parse(sanitizedJson);
          console.log('[SANDBOX-GEMINI] ✅ Parsing exitoso después de sanitización agresiva');
        } catch (thirdError) {
          console.error('[SANDBOX-GEMINI] ❌ Parsing falló incluso después de sanitización');
          console.error('[SANDBOX-GEMINI] 📄 Primeros 500 caracteres del JSON recibido:');
          console.error(jsonText.substring(0, 500));
          console.error('[SANDBOX-GEMINI] 📄 Últimos 500 caracteres del JSON recibido:');
          console.error(jsonText.substring(Math.max(0, jsonText.length - 500)));

          // Última estrategia: devolver respuesta parcial con el título si es posible
          const titleMatch = jsonText.match(/"title"\s*:\s*"([^"]+)"/);
          if (titleMatch) {
            console.log('[SANDBOX-GEMINI] ⚠️ Generando respuesta de fallback con título encontrado');
            lessonData = {
              title: titleMatch[1],
              lesson: 'Error al procesar la lección. La IA generó contenido con formato inválido. Por favor, intenta de nuevo.',
              exercises: [],
              sandboxMetadata: { error: 'json_parse_fallback' }
            };
          } else {
            throw new Error(`JSON inválido de Gemini: ${thirdError.message}`);
          }
        }
      }
    }

    // Post-procesamiento: Restaurar newlines reales en el contenido
    // (necesario porque la sanitización convierte \n literal a \\n para JSON válido)
    if (lessonData.lesson && typeof lessonData.lesson === 'string') {
      // Convertir secuencias \\n de vuelta a newlines reales
      lessonData.lesson = lessonData.lesson
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
    }

    // Agregar timestamp real del servidor (no del prompt)
    lessonData.generatedAt = new Date().toISOString();

    console.log('[SANDBOX-GEMINI] ✅ Lección generada exitosamente');
    console.log('[SANDBOX-GEMINI] 📚 Título:', lessonData.title);
    console.log('[SANDBOX-GEMINI] 🎯 Ejercicios:', lessonData.exercises?.length || 0);

    return {
      success: true,
      data: lessonData,
      provider: 'gemini',
      model: modelName,
      tracked: true
    };

  } catch (error) {
    console.error('[SANDBOX-GEMINI] ❌ Error:', error.message);

    // Si el error es de parsing JSON, intentar extraerlo con regex
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error('[SANDBOX-GEMINI] ⚠️ Error parseando JSON, contenido recibido no es JSON válido');
    }

    throw error;
  }
};

/**
 * Handler principal del endpoint sandbox
 * MISIÓN 231.7: Diagnóstico robusto de causa raíz del error 500
 */
export default async function handler(req, res) {
  console.log('🧪 [SANDBOX] Request received:', req.method);
  console.log('🔍 [M-231.7] User-Agent:', req.headers['user-agent']);
  console.log('🔍 [M-231.7] Content-Type:', req.headers['content-type']);

  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido',
      message: 'Este endpoint solo acepta solicitudes POST'
    });
  }

  try {
    console.log('🧪 [SANDBOX] Processing request body...');

    // Extraer contenido personalizado y dominio del cuerpo de la solicitud
    const { customContent, domain = 'programming' } = req.body || {};

    console.log(`🎯 [SANDBOX] Dominio recibido: ${domain}`);

    console.log('🧪 [SANDBOX] Custom content length:', customContent?.length || 0);

    // Validación del contenido
    if (!customContent || typeof customContent !== 'string' || customContent.trim().length === 0) {
      return res.status(400).json({
        error: 'Contenido requerido',
        message: 'El campo customContent es obligatorio y debe contener texto válido',
        received: { customContent: customContent }
      });
    }

    // Validación de longitud mínima
    if (customContent.trim().length < 50) {
      return res.status(400).json({
        error: 'Contenido insuficiente',
        message: 'El contenido debe tener al menos 50 caracteres',
        contentLength: customContent.trim().length
      });
    }

    // Validación de API Key
    // MISIÓN 231.7: Validación defensiva reforzada con logging diagnóstico
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔍 [M-231.7] Verificando API Key del servidor...');
    console.log('🔍 [M-231.7] API Key presente:', apiKey ? `SÍ (${apiKey.substring(0, 10)}...)` : 'NO');

    if (!apiKey) {
      console.error('[SANDBOX] ❌ GEMINI_API_KEY no configurada en process.env');
      console.error('🔍 [M-231.7] Variables de entorno disponibles:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
      return res.status(500).json({
        error: 'Configuración del servidor incorrecta',
        message: 'API Key de Gemini no configurada en el servidor',
        diagnostic: 'GEMINI_API_KEY no encontrada en process.env'
      });
    }

    console.log('✅ [M-231.7] API Key del servidor VALIDADA correctamente');

    console.log('🧪 [SANDBOX] Generando lección con Gemini AI...');

    // Generar lección con Gemini (pasando dominio)
    const result = await generateLessonWithGemini(customContent, domain);

    if (!result.success) {
      throw new Error('Error generando lección con Gemini');
    }

    console.log('✅ [SANDBOX SUCCESS] Lección generada y validada');

    // Respuesta exitosa con estructura completa
    res.status(200).json(result.data);

  } catch (error) {
    // MISIÓN 231.7: Logging diagnóstico exhaustivo para identificar causa raíz del 500
    console.error('❌ [SANDBOX ERROR] ==================== INICIO ERROR ====================');
    console.error('🔍 [M-231.7] Tipo de Error:', error.constructor.name);
    console.error('🔍 [M-231.7] Mensaje:', error.message);
    console.error('🔍 [M-231.7] Stack Trace:', error.stack);

    if (error.code) {
      console.error('🔍 [M-231.7] Código de Error:', error.code);
    }

    // Diagnóstico específico para errores comunes
    if (error.message.includes('API Key')) {
      console.error('🚨 [M-231.7] ERROR DE API KEY DETECTADO');
      console.error('🔍 [M-231.7] process.env.GEMINI_API_KEY presente:', process.env.GEMINI_API_KEY ? 'SÍ' : 'NO');
    }

    if (error.message.includes('fetch')) {
      console.error('🚨 [M-231.7] ERROR DE RED DETECTADO');
    }

    if (error.message.includes('JSON')) {
      console.error('🚨 [M-231.7] ERROR DE PARSING JSON DETECTADO');
    }

    console.error('❌ [SANDBOX ERROR] ==================== FIN ERROR ====================');

    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error generando lección estructurada',
      timestamp: new Date().toISOString(),
      diagnostic: {
        errorType: error.constructor.name,
        errorCode: error.code || 'N/A',
        apiKeyPresent: !!process.env.GEMINI_API_KEY,
        mission: 'M-231.7'
      },
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        type: error.constructor.name
      } : undefined
    });
  }
}
