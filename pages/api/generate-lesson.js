// AI CODE MENTOR - Sandbox Lesson Generation Endpoint 
// MISIÓN 147 FASE 1: Corrige estructura de quizzes para eliminación de pre-resolución
// 🚀 MISIÓN CRÍTICA: Contador API - Instrumentado con wrapper de tracking
// MISIÓN 146.5 FASE 2: Genera lecciones con persistencia en Supabase
// MISIÓN 147.6 COMPLETADA: Sistema de Prompts Contextuales - Meta-Prompts especializados por contexto pedagógico
// MISIÓN 147.9 COMPLETADA: Reparación del Motor de Contexto Curricular
// MISIÓN 147.12 COMPLETADA: Protocolo de Refuerzo de Directivas - Reglas No Negociables implementadas
// MISIÓN 147.13 COMPLETADA: Corrección de Sintaxis en Meta-Prompts - Template Literals corregidos
// MISIÓN 147.14 COMPLETADA: Reparación de la Lógica de Reemplazo de Plantillas - Reemplazo global implementado
// 🚀 MISIÓN 154 COMPLETADA: INTEGRACIÓN DEL NÚCLEO RAG - Motor RAG completamente integrado
//   ✅ retrieve_sources() integrado como primera operación del endpoint
//   ✅ Prompt Augmentation con contexto curricular completo y autoritativo
//   ✅ Reemplazo completo de lógica heredada curriculumMap por Motor RAG
//   ✅ Meta-prompts enriquecidos con información curricular detallada
//   ✅ Logging RAG específico para observabilidad completa
//   ✅ Retrocompatibilidad preservada para casos sin parámetros de contexto
// 🚀 MISIÓN 166 COMPLETADA: INTEGRACIÓN ARM EXTERNO - ARM completamente funcional
//   ✅ ARM (Módulo de Recuperación Activa) integrado con Motor RAG
//   ✅ Cache Hit/Cache Miss → Recuperador → Extractor → Caché implementado
//   ✅ Fuentes externas oficiales (URLs) enriquecen contexto curricular
//   ✅ Meta-prompts ARM-Enhanced con contenido de URLs oficiales
//   ✅ Tabla source_content_cache para persistencia de contenido externo
//   ✅ Fallback resiliente: ARM falla → contexto básico RAG se mantiene

import { withOptionalAuth } from '../../utils/authMiddleware';
import { getAuthenticatedSupabaseFromRequest } from '../../lib/supabaseServerAuth.js';
// 🚀 MISIÓN 154: INTEGRACIÓN MOTOR RAG
import { retrieve_sources } from '../../lib/rag/retrieve-sources.js';
// Importar wrapper de tracking de API Gemini
const { geminiAPIWrapperServer } = require('../../lib/gemini-api-wrapper');
// 🚀 MISIÓN 167 COMPLETADA: CORRECCIÓN CRÍTICA META-PROMPTS RAG
//   ✅ Meta-prompts simplificados para garantizar JSON válido
//   ✅ Instrucciones directas y claras para Gemini
//   ✅ Formato de salida explícito y consistente
//   ✅ Corrección de problema: 0 ejercicios generados en contexto RAG
//   ✅ Optimización de tiempos de respuesta
//   ✅ Versión: Meta-Prompts RAG v3.0 (Corregidos Post-Testing)
// 🚀 MISIÓN 178 COMPLETADA: CORRECCIÓN CRÍTICA CALIDAD CONTENIDO TEMPLATE
//   ✅ TEMPLATE_PROMPT_UNIVERSAL refactorizado con especificaciones del Supervisor
//   ✅ Contenido mínimo 800+ palabras (vs anterior "claro y conciso")
//   ✅ Subtítulos claros + explicaciones conceptuales obligatorias
//   ✅ Mínimo 3 ejemplos prácticos progresivos (vs anterior condicional)
//   ✅ Analogía obligatoria para facilitar comprensión
//   ✅ Quiz expandido a 3 preguntas especializadas (vs anterior 1 pregunta)
//   ✅ Enfoque QUÉ/CÓMO/POR QUÉ comprehensivo
//   ✅ Smoke test completo verificando todas las especificaciones
//   ✅ Solución completa al problema: "contenido de lección inadecuado"
// 🚀 MISIÓN 178.1 COMPLETADA: REFINAMIENTO PARA FIDELIDAD CONTEXTUAL
//   ✅ Directiva de fidelidad contextual absoluta implementada (🛑)
//   ✅ Delimitadores [CONTEXTO] y [/CONTEXTO] para delimitar fuente de verdad
//   ✅ Inserción dinámica del tema del pomodoro en directiva principal
//   ✅ Múltiples referencias al CONTEXTO a lo largo del prompt
//   ✅ Especificación #6 de FIDELIDAD añadida a requisitos obligatorios
//   ✅ Prohibición explícita de información externa y conocimiento general
//   ✅ Solución al problema: "IA no respeta contexto específico del pomodoro"
// 🚀 MISIÓN 176 COMPLETADA: CORRECCIÓN CRÍTICA ARQUITECTURA FEDERADA
//   ✅ Import dinámico implementado para router federado (OPCIÓN A)
//   ✅ Eliminación de require() incompatible con ES modules
//   ✅ Compatibilidad total con Next.js y arquitectura federada v8.0
//   ✅ Solución al error 500 en extraerContextoPomodoro()


// 🚀 MISIÓN 184: FUNCIÓN DE EXTRACCIÓN DE CONTEXTO GRANULAR SQLite
// Extrae el contexto específico del pomodoro usando base de datos SQLite curriculum.db
const extraerContextoPomodoro = async (semanaId, dia, pomodoroIndex) => {
  console.log(`🔍 [CONTEXTO GRANULAR SQLITE] Extrayendo contexto para semana ${semanaId}, día ${dia}, pomodoro ${pomodoroIndex}`);
  
  try {
    // 🚀 MISIÓN 184: UNIFICACIÓN - Usar SQLite en lugar de arquitectura federada
    const { getWeekDetails } = require('../../lib/curriculum-sqlite.js');
    
    // Obtener datos de la semana usando SQLite
    console.log(`🚀 [SQLITE] Cargando datos de semana ${semanaId} desde curriculum.db...`);
    const semanaEncontrada = getWeekDetails(semanaId);
    
    if (!semanaEncontrada) {
      throw new Error(`Semana ${semanaId} no encontrada en curriculum.db`);
    }
    
    console.log(`✅ [SQLITE] Semana ${semanaId} cargada desde curriculum.db`);
    console.log(`   📚 Título: "${semanaEncontrada.titulo_semana}"`);
    console.log(`   🏇 Fase: ${semanaEncontrada.fase_numero} - ${semanaEncontrada.fase_titulo}`);
    console.log(`   📂 Módulo: ${semanaEncontrada.modulo_numero} - ${semanaEncontrada.modulo_titulo}`);
    
    // Validar que existe esquema_diario
    if (!semanaEncontrada.esquema_diario || !Array.isArray(semanaEncontrada.esquema_diario)) {
      throw new Error(`esquema_diario no disponible para semana ${semanaId}`);
    }
    
    // Encontrar el día específico (dia es 1-based, array es 0-based)
    const diaData = semanaEncontrada.esquema_diario[dia - 1];
    if (!diaData) {
      throw new Error(`Día ${dia} no encontrado en semana ${semanaId}`);
    }
    
    // Validar que existe el pomodoro específico
    if (!diaData.pomodoros || !Array.isArray(diaData.pomodoros)) {
      throw new Error(`Pomodoros no disponibles para día ${dia} de semana ${semanaId}`);
    }
    
    if (pomodoroIndex < 0 || pomodoroIndex >= diaData.pomodoros.length) {
      throw new Error(`pomodoroIndex ${pomodoroIndex} fuera de rango para día ${dia} de semana ${semanaId}`);
    }
    
    const textoPomodoro = diaData.pomodoros[pomodoroIndex];
    
    // Construir objeto de contexto según especificación de la misión
    const contexto = {
      tematica_semanal: semanaEncontrada.titulo_semana,
      concepto_del_dia: diaData.concepto,
      texto_del_pomodoro: textoPomodoro
    };
    
    console.log(`✅ [CONTEXTO GRANULAR SQLITE] Extraído exitosamente:`);
    console.log(`   📚 Temática: "${contexto.tematica_semanal}"`);
    console.log(`   🎯 Concepto: "${contexto.concepto_del_dia}"`);
    console.log(`   📝 Pomodoro: "${contexto.texto_del_pomodoro}"`);
    console.log(`   💾 Fuente: curriculum.db (SQLite v9.0)`);
    
    return contexto;
    
  } catch (error) {
    console.error(`❌ [ERROR CONTEXTO GRANULAR SQLITE] Error extrayendo contexto:`, error.message);
    throw error;
  }
};

// MISIÓN 154: FUNCIÓN DEPRECADA - Reemplazada por Motor RAG retrieve_sources()
// Mantenida solo para retrocompatibilidad en casos sin parámetros de contexto
const getCurriculumInfoLegacy = (semanaId) => {
  console.warn(`⚠️ [LEGACY] Usando curriculumMap estático para semana ${semanaId} (sin contexto RAG)`);
  
  // Mapeo básico heredado - Solo para fallback
  const curriculumMap = {
    1: { tema: "Teoría y Ética de IA", fase: "Fase 0: Cimentación del Arquitecto" },
    2: { tema: "Práctica de Diseño de Prompts", fase: "Fase 0: Cimentación del Arquitecto" },
    3: { tema: "CS50 - Semana 0: Introducción", fase: "Fase 0: Cimentación del Arquitecto" },
    25: { tema: "Programación Orientada a Objetos - Conceptos Fundamentales", fase: "Fase 1: Fundamentos de Programación" },
    50: { tema: "Fundamentos de Node.js - Profundización", fase: "Fase 3: Desarrollo Backend Profesional" },
    75: { tema: "Fundamentos de Cloud Computing (AWS/GCP)", fase: "Fase 4: DevOps y Cloud Computing" },
    100: { tema: "Contribución Open Source y Crecimiento Continuo", fase: "Fase 7: Profesionalización y Crecimiento Continuo" },
    default: { tema: "Desarrollo de Software", fase: "Ecosistema 360" }
  };

  return curriculumMap[semanaId] || curriculumMap.default;
};

// MISIÓN 154 + 166: FUNCIÓN RAG + ARM EXTERNO - Obtiene contexto curricular con fuentes externas
const getCurriculumInfoRAG = async (semanaId) => {
  try {
    console.log(`🔍 [RAG+ARM] Recuperando contexto curricular con fuentes externas para semana ${semanaId}...`);
    
    // PRIMERA OPERACIÓN: Invocar Motor RAG + ARM Externo (includeExternalSources = true)
    const ragContext = await retrieve_sources(semanaId, true);
    
    console.log(`✅ [RAG+ARM] Contexto recuperado exitosamente:`);
    console.log(`   📚 Título: "${ragContext.weekTitle}"`);
    console.log(`   🎯 Fase: ${ragContext.phase} - ${ragContext.phaseTitle}`);
    console.log(`   📘 Módulo: ${ragContext.module} - ${ragContext.moduleTitle}`);
    console.log(`   🏷️ Enfoque Pedagógico: ${ragContext.pedagogicalApproach}`);
    console.log(`   📊 Nivel Dificultad: ${ragContext.difficultyLevel}`);
    console.log(`   📋 Objetivos: ${ragContext.objectives.length}`);
    console.log(`   📦 Recursos: ${ragContext.resources.length}`);
    console.log(`   🎓 Prerequisitos: ${ragContext.prerequisites.length}`);
    
    // MISIÓN 166: Logging ARM específico
    if (ragContext.armStatus === 'enriched' && ragContext.externalSources?.length > 0) {
      console.log(`   🌐 [ARM] Fuentes externas: ${ragContext.externalSources.length} procesadas`);
      console.log(`   ⚡ [ARM] Cache hits: ${ragContext.armMetadata.cacheHits}/${ragContext.armMetadata.totalUrls}`);
      console.log(`   🕐 [ARM] Tiempo total: ${ragContext.armMetadata.totalProcessTimeMs}ms`);
      
      ragContext.externalSources.forEach((source, index) => {
        console.log(`      ${index + 1}. ${source.type}: ${source.name} (${source.fromCache ? 'cached' : 'fresh'})`);
      });
    } else if (ragContext.armStatus === 'no-external-sources') {
      console.log(`   ℹ️ [ARM] No hay fuentes externas para esta semana`);
    } else if (ragContext.armStatus === 'error') {
      console.warn(`   ⚠️ [ARM] Error procesando fuentes externas: ${ragContext.armError}`);
    }
    
    // Devolver formato compatible con función legacy
    return {
      tema: ragContext.weekTitle,
      fase: `Fase ${ragContext.phase}: ${ragContext.phaseTitle.replace(/^Fase \d+: /, '')}`,
      // Contexto RAG enriquecido adicional
      ragContext: ragContext
    };
    
  } catch (error) {
    console.error(`❌ [RAG ERROR] Error recuperando contexto para semana ${semanaId}:`, error.message);
    
    // Fallback a función legacy en caso de error RAG
    console.warn(`🔄 [FALLBACK] Usando curriculumMap legacy para semana ${semanaId}`);
    return getCurriculumInfoLegacy(semanaId);
  }
};

// Función para obtener propósito del pomodoro según su índice
const getPomodoroContext = (pomodoroIndex) => {
  // Mapeo basado en la estructura del WeeklySchedule
  const pomodoroContextMap = {
    0: {
      tipo: "teorico",
      proposito: "Estudio del concepto teórico del día - Adquisición de conocimiento fundamental"
    },
    1: {
      tipo: "teorico", 
      proposito: "Práctica guiada y experimentación con el código - Consolidación teórica"
    },
    2: {
      tipo: "evaluativo",
      proposito: "Resolución de ejercicios nuevos - Aplicación práctica de conocimientos"
    },
    3: {
      tipo: "evaluativo",
      proposito: "Continuación de problemas y revisión - Integración y evaluación"
    }
  };

  return pomodoroContextMap[pomodoroIndex] || pomodoroContextMap[0];
};

// 🚀 MISIÓN 171.2: TEMPLATE DE PROMPT UNIVERSAL GRANULAR REFACTORIZADO
// 🚀 MISIÓN 178: CORRECCIÓN CRÍTICA CALIDAD CONTENIDO - Template enriquecido con especificaciones del Supervisor
// 🚀 MISIÓN 178.1: REFINAMIENTO PARA FIDELIDAD CONTEXTUAL - Directiva de adherencia estricta al contexto
// 🚀 MISIÓN 178.2: CORRECCIÓN RADICAL DE FIDELIDAD - Múltiples capas de control contra desviación contextual
// Template con refuerzo AGRESIVO de fidelidad contextual para anular conocimiento preexistente de IA

// 🛡️ FUNCIÓN DE VALIDACIÓN PRE-ENVÍO - Verificar coherencia contextual antes de envío a IA
function validateContextualCoherence(tematicaSemanal, conceptoDelDia, textoDelPomodoro) {
  const warnings = [];
  const errors = [];
  
  // Detectar términos problemáticos que indican conocimiento externo de CS50
  const problematicTerms = [
    'printf', 'scanf', 'c programming', 'command line', 'terminal',
    'python', 'javascript', 'java', 'compiler', 'gcc',
    'variables', 'functions', 'loops', 'arrays'
  ];
  
  // Términos esperados para Scratch/programación visual
  const expectedScratchTerms = [
    'scratch', 'sprite', 'bloques', 'drag', 'drop', 'visual',
    'pensamiento computacional', 'algoritmo', 'secuencia',
    'repetición', 'condicional', 'evento'
  ];
  
  const contextText = `${tematicaSemanal} ${conceptoDelDia} ${textoDelPomodoro}`.toLowerCase();
  
  // ❌ Verificar ausencia de términos problemáticos
  const foundProblematic = problematicTerms.filter(term => 
    contextText.includes(term.toLowerCase())
  );
  
  if (foundProblematic.length > 0) {
    errors.push(`CRÍTICO: Detectados términos de CS50 textual: ${foundProblematic.join(', ')}`);
  }
  
  // ✅ Verificar presencia de términos esperados para Scratch
  if (contextText.includes('cs50') || contextText.includes('semana 0')) {
    const foundExpected = expectedScratchTerms.filter(term => 
      contextText.includes(term.toLowerCase())
    );
    
    if (foundExpected.length === 0) {
      warnings.push(`ADVERTENCIA: CS50 Semana 0 detectado pero sin términos de Scratch`);
    }
  }
  
  // 🔍 Verificar coherencia entre niveles del contexto
  if (tematicaSemanal && conceptoDelDia && textoDelPomodoro) {
    const temaWords = tematicaSemanal.toLowerCase().split(' ');
    const conceptWords = conceptoDelDia.toLowerCase().split(' ');
    const pomodoroWords = textoDelPomodoro.toLowerCase().split(' ');
    
    const commonWords = temaWords.filter(word => 
      conceptWords.includes(word) || pomodoroWords.includes(word)
    );
    
    if (commonWords.length === 0) {
      warnings.push('ADVERTENCIA: Posible incoherencia entre niveles de contexto');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    contextAnalysis: {
      detectedTerms: {
        problematic: foundProblematic,
        expectedFound: expectedScratchTerms.filter(term => 
          contextText.includes(term.toLowerCase())
        )
      }
    }
  };
}

const TEMPLATE_PROMPT_UNIVERSAL = `
🚨 **ALERTA CRITICÁ: PROHIBIDO USAR CONOCIMIENTO PREVIO DE CS50**
🛑 **DIRECTIVA DE FIDELIDAD CONTEXTUAL ABSOLUTA**

IMPORTANTE: Olvídate COMPLETAMENTE de todo lo que sabes sobre CS50, Harvard, o cualquier curso de programación. 
Tu Única fuente de verdad es el siguiente bloque de texto delimitado por [CONTEXTO]. 
NO uses información externa. NO menciones C, Python, JavaScript, línea de comandos, o printf().
Si el contexto dice "Scratch", habla SOLO de Scratch. Si dice "pensamiento computacional", habla SOLO de eso.

[CONTEXTO]
Temática Semanal: {tematica_semanal}
Concepto del Día: {concepto_del_dia}  
Tarea Específica del Pomodoro: {texto_del_pomodoro}
[/CONTEXTO]

🛑 **REPETICIÓN DE DIRECTIVA:** Tu tema central es: "{texto_del_pomodoro}"
NO te desvíes. NO uses conocimiento externo. SOLO el contexto delimitado arriba.

Eres un tutor de programación experto especializado EXCLUSIVAMENTE en el tema contextual proporcionado.

Tu misión es crear una micro-lección educativa COMPLETA y un quiz basado SOLO en el [CONTEXTO].

**ESPECIFICACIONES OBLIGATORIAS DEL CONTENIDO:**
1. **Extensión:** Mínimo 800 palabras de contenido educativo sustancial
2. **Estructura:** Subtítulos claros con explicaciones conceptuales detalladas 
3. **Ejemplos:** Mínimo 3 ejemplos prácticos diferentes y progresivos
4. **Pedagogía:** 1 analogía obligatoria para facilitar comprensión
5. **Enfoque:** Explicar tanto el QUÉ como el CÓMO y el POR QUÉ de la tarea
6. **FIDELIDAD:** Basándote EXCLUSIVAMENTE en la tarea específica del contexto delimitado
7. **PROHIBICIÓN:** NO menciones lenguajes de programación textual si el contexto habla de programación visual

🚨 **ADVERTENCIA FINAL:** Si generas contenido sobre C, Python, línea de comandos, o printf() cuando el contexto habla de Scratch, has fallado completamente.

Basado ESTRICTA y EXCLUSIVAMENTE en el [CONTEXTO] delimitado arriba, genera lo siguiente en formato JSON:
{
  "contenido": "Un texto de lección educativo ROBUSTO de mínimo 800 palabras que explique COMPREHENSIVAMENTE SOLO la tarea mencionada en el CONTEXTO. NO uses información externa. DEBE incluir: (1) Subtítulos claros organizando el contenido, (2) Explicaciones conceptuales detalladas del QUÉ, CÓMO y POR QUÉ, (3) Exactamente 3 ejemplos prácticos progresivos basados en el CONTEXTO, (4) Una analogía clara para facilitar comprensión, (5) Conexiones con conceptos relacionados DENTRO del CONTEXTO. NO te desvíes del CONTEXTO proporcionado, desarrolla profundamente SOLO la tarea específica delimitada.",
  "quiz": [
    {
      "pregunta": "Una pregunta que evalúe la comprensión conceptual profunda de la tarea del CONTEXTO (NO uses conocimiento externo).",
      "opciones": ["Opción A basada en CONTEXTO", "Opción B basada en CONTEXTO", "Opción C basada en CONTEXTO", "Opción D basada en CONTEXTO"],
      "respuesta_correcta": "La opción correcta basada en el CONTEXTO"
    },
    {
      "pregunta": "Una segunda pregunta que evalúe la aplicación práctica de la tarea del CONTEXTO (NO uses conocimiento externo).",
      "opciones": ["Opción A basada en CONTEXTO", "Opción B basada en CONTEXTO", "Opción C basada en CONTEXTO", "Opción D basada en CONTEXTO"],
      "respuesta_correcta": "La opción correcta basada en el CONTEXTO"
    },
    {
      "pregunta": "Una tercera pregunta que evalúe la conexión con conceptos relacionados DENTRO del CONTEXTO (NO uses conocimiento externo).",
      "opciones": ["Opción A basada en CONTEXTO", "Opción B basada en CONTEXTO", "Opción C basada en CONTEXTO", "Opción D basada en CONTEXTO"],
      "respuesta_correcta": "La opción correcta basada en el CONTEXTO"
    }
  ]
}

🚨 **RECORDATORIO FINAL:** Solo habla de lo que está en el [CONTEXTO]. Si dice Scratch, habla de Scratch. Si dice sprites, habla de sprites. NO menciones otros lenguajes.
`;

// DEPRECATED: META-PROMPT TEÓRICO RAG-ENHANCED v2.0 - Reemplazado por Template Universal
// Mantenido solo para referencia histórica
const META_PROMPT_TEORICO_RAG_DEPRECATED = `
Eres un mentor experto del "Ecosistema 360" creando contenido educativo.

**CONTEXTO CURRICULAR:**
- Semana {SEMANA_ID}: {TEMA_DE_LA_SEMANA}
- Fase: {FASE_CURRICULAR} 
- Enfoque: {ENFOQUE_PEDAGOGICO}
- Nivel: {NIVEL_DIFICULTAD}

**REGLA ABSOLUTA:** Todo el contenido debe relacionarse EXCLUSIVAMENTE con "{TEMA_DE_LA_SEMANA}"

**TAREA:** Genera un objeto JSON válido con esta estructura exacta:

{
  "title": "Título específico sobre {TEMA_DE_LA_SEMANA}",
  "lesson": "Contenido educativo de 300-500 palabras sobre {TEMA_DE_LA_SEMANA}",
  "exercises": [
    {
      "question": "Pregunta sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice", 
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicación de la respuesta correcta"
    },
    {
      "question": "Segunda pregunta sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"], 
      "correctAnswerIndex": 1,
      "explanation": "Explicación de la respuesta correcta"
    },
    {
      "question": "Tercera pregunta sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 2, 
      "explanation": "Explicación de la respuesta correcta"
    }
  ]
}

**IMPORTANTE:** 
- Responde SOLO con el JSON válido
- correctAnswerIndex debe ser número entero (0, 1, 2, o 3)
- Cada ejercicio debe evaluar {TEMA_DE_LA_SEMANA}
- NO agregues texto antes o después del JSON
`;

// DEPRECATED: META-PROMPT EVALUATIVO RAG-ENHANCED v2.0 - Reemplazado por Template Universal
// Mantenido solo para referencia histórica
const META_PROMPT_EVALUATIVO_RAG_DEPRECATED = `
Eres un evaluador experto del "Ecosistema 360" creando ejercicios de evaluación.

**CONTEXTO CURRICULAR:**
- Semana {SEMANA_ID}: {TEMA_DE_LA_SEMANA}
- Fase: {FASE_CURRICULAR}
- Enfoque: {ENFOQUE_PEDAGOGICO} 
- Nivel: {NIVEL_DIFICULTAD}

**REGLA ABSOLUTA:** Todo el contenido debe relacionarse EXCLUSIVAMENTE con "{TEMA_DE_LA_SEMANA}"

**TAREA:** Genera un objeto JSON válido con esta estructura exacta:

{
  "title": "Evaluación: {TEMA_DE_LA_SEMANA}",
  "lesson": "Introducción breve a los ejercicios de evaluación sobre {TEMA_DE_LA_SEMANA}",
  "exercises": [
    {
      "question": "Pregunta de 'Recordar' sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicación de por qué esta respuesta es correcta"
    },
    {
      "question": "Pregunta de 'Comprender' sobre {TEMA_DE_LA_SEMANA}", 
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 1,
      "explanation": "Explicación de por qué esta respuesta es correcta"
    },
    {
      "question": "Pregunta de 'Aplicar' sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice", 
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 2,
      "explanation": "Explicación de por qué esta respuesta es correcta"
    }
  ]
}

**IMPORTANTE:**
- Responde SOLO con el JSON válido
- correctAnswerIndex debe ser número entero (0, 1, 2, o 3)  
- Ejercicios deben seguir Taxonomía de Bloom
- NO agregues texto antes o después del JSON
`;

// 🚀 MISIÓN 184: FUNCIÓN PRINCIPAL CON CONTEXTO GRANULAR SQLite
// Genera prompt usando contexto específico del pomodoro desde base de datos SQLite
const generateContextualPromptGranular = async (semanaId, dia, pomodoroIndex) => {
  console.log(`🚀 [PROMPT GRANULAR SQLITE] Generando prompt para semana ${semanaId}, día ${dia}, pomodoro ${pomodoroIndex} usando SQLite`);
  
  try {
    // PASO 1: Extraer contexto específico del pomodoro usando SQLite
    const contextoPomodoro = await extraerContextoPomodoro(semanaId, dia, pomodoroIndex);
    
    // PASO 2: Poblar template universal con contexto granular
    const promptGenerado = TEMPLATE_PROMPT_UNIVERSAL
      .replace(/{tematica_semanal}/g, contextoPomodoro.tematica_semanal)
      .replace(/{concepto_del_dia}/g, contextoPomodoro.concepto_del_dia)
      .replace(/{texto_del_pomodoro}/g, contextoPomodoro.texto_del_pomodoro);
    
    console.log(`✅ [PROMPT GRANULAR SQLITE] Template poblado exitosamente:`);
    console.log(`   📚 Temática: "${contextoPomodoro.tematica_semanal}"`);
    console.log(`   🎯 Concepto: "${contextoPomodoro.concepto_del_dia}"`);
    console.log(`   📝 Tarea: "${contextoPomodoro.texto_del_pomodoro}"`);
    console.log(`   💾 Arquitectura: SQLite curriculum.db v9.0`);
    
    return promptGenerado;
    
  } catch (error) {
    console.error(`❌ [ERROR PROMPT GRANULAR SQLITE] Error generando prompt granular con SQLite:`, error.message);
    
    // Fallback a función RAG original
    console.warn(`🔄 [FALLBACK] Usando generateContextualPromptRAGLegacy por error en SQLite`);
    return generateContextualPromptRAGLegacy(semanaId, pomodoroIndex, '');
  }
};

// DEPRECATED: FUNCIÓN PRINCIPAL RAG-ENHANCED - Reemplazada por contexto granular
// Mantenida para retrocompatibilidad y casos de fallback
const generateContextualPromptRAGLegacy = async (semanaId, pomodoroIndex, inputText) => {
  console.log(`🚀 [RAG PROMPT LEGACY] Generando prompt contextual para semana ${semanaId}, pomodoro ${pomodoroIndex}`);
  
  try {
    // PASO 1: Obtener contexto curricular completo del Motor RAG
    const curriculumInfo = await getCurriculumInfoRAG(semanaId);
    const pomodoroContext = getPomodoroContext(pomodoroIndex);
    
    // PASO 2: Seleccionar plantilla RAG-Enhanced según pomodoroIndex
    let selectedPrompt;
    if (pomodoroIndex === 0 || pomodoroIndex === 1) {
      selectedPrompt = META_PROMPT_TEORICO_RAG_DEPRECATED;
      console.log(`🎯 [RAG LEGACY] Prompt seleccionado: META_PROMPT_TEORICO_RAG para pomodoro ${pomodoroIndex}`);
    } else if (pomodoroIndex === 2 || pomodoroIndex === 3) {
      selectedPrompt = META_PROMPT_EVALUATIVO_RAG_DEPRECATED;
      console.log(`🎯 [RAG LEGACY] Prompt seleccionado: META_PROMPT_EVALUATIVO_RAG para pomodoro ${pomodoroIndex}`);
    } else {
      selectedPrompt = META_PROMPT_TEORICO_RAG_DEPRECATED;
      console.warn(`⚠️ [RAG LEGACY] pomodoroIndex ${pomodoroIndex} fuera de rango, usando META_PROMPT_TEORICO_RAG por defecto`);
    }
    
    // PASO 3: Construir contexto enriquecido si tenemos información RAG
    let enrichedPrompt;
    if (curriculumInfo.ragContext) {
      const ragCtx = curriculumInfo.ragContext;
      
      // Poblar plantilla RAG + ARM con contexto completo (reemplazo global)
      enrichedPrompt = selectedPrompt
        .replace(/{SEMANA_ID}/g, semanaId.toString())
        .replace(/{TEMA_DE_LA_SEMANA}/g, ragCtx.weekTitle)
        .replace(/{FASE_CURRICULAR}/g, `Fase ${ragCtx.phase}: ${ragCtx.phaseTitle}`)
        .replace(/{MODULO_TITULO}/g, `Módulo ${ragCtx.module}: ${ragCtx.moduleTitle}`)
        .replace(/{ENFOQUE_PEDAGOGICO}/g, ragCtx.pedagogicalApproach)
        .replace(/{NIVEL_DIFICULTAD}/g, ragCtx.difficultyLevel);
        
      console.log(`✅ [RAG LEGACY] Prompt enriquecido con contexto curricular`);
      
    } else {
      // Fallback: usar información básica del curriculum legacy
      console.warn(`⚠️ [RAG LEGACY FALLBACK] Sin contexto RAG, usando información básica`);
      enrichedPrompt = selectedPrompt
        .replace(/{SEMANA_ID}/g, semanaId.toString())
        .replace(/{TEMA_DE_LA_SEMANA}/g, curriculumInfo.tema)
        .replace(/{FASE_CURRICULAR}/g, curriculumInfo.fase);
    }
    
    return enrichedPrompt;
    
  } catch (error) {
    console.error(`❌ [RAG LEGACY ERROR] Error generando prompt contextual:`, error.message);
    
    // Fallback completo: usar función legacy original
    console.warn(`🔄 [COMPLETE FALLBACK] Usando generateContextualPromptLegacy`);
    return generateContextualPromptLegacy(semanaId, pomodoroIndex, inputText);
  }
};

// FUNCIÓN LEGACY PRESERVADA para casos de fallback completo
const generateContextualPromptLegacy = (semanaId, pomodoroIndex, inputText) => {
  console.warn(`⚠️ [LEGACY PROMPT] Generando prompt con curriculumMap estático`);
  
  const curriculumInfo = getCurriculumInfoLegacy(semanaId);
  const pomodoroContext = getPomodoroContext(pomodoroIndex);
  
  // Meta-prompts originales (versiones básicas)
  const META_PROMPT_TEORICO_BASIC = `
Actúa como un mentor y arquitecto de sistemas senior del "Ecosistema 360".
Tu tarea es generar el contenido para un micro-módulo de estudio.

Tema Principal de la Semana: {TEMA_DE_LA_SEMANA}
Objetivo Específico de este Bloque: {PROPOSITO_DEL_POMODORO}

1. Genera el "Contenido de la Lección":
- Profundidad: 500-700 palabras para 45 minutos de estudio.
- Estructura: Subtítulos claros + explicaciones conceptuales.
- Componentes: 2+ ejemplos prácticos + analogía obligatoria.

2. Genera los "Ejercicios de Práctica":
Quiz de 3 preguntas de opción múltiple para evaluación.

Formato: content.lesson y content.quiz en JSON estructurado.
`;

  const META_PROMPT_EVALUATIVO_BASIC = `
Actúa como un examinador que diseña evaluaciones para validar comprensión del "Ecosistema 360".

Tema Principal de la Semana: {TEMA_DE_LA_SEMANA}
Objetivo Específico de este Bloque: {PROPOSITO_DEL_POMODORO}

Genera quiz de 3 preguntas con Taxonomía de Bloom:
1. Pregunta de 'Recordar'
2. Pregunta de 'Comprender'  
3. Pregunta de 'Aplicar/Analizar' con escenario

Formato: content.quiz y content.lesson (introducción breve) en JSON.
`;

  let selectedPrompt = pomodoroIndex === 0 || pomodoroIndex === 1 
    ? META_PROMPT_TEORICO_BASIC 
    : META_PROMPT_EVALUATIVO_BASIC;
  
  return selectedPrompt
    .replace(/{TEMA_DE_LA_SEMANA}/g, curriculumInfo.tema)
    .replace(/{PROPOSITO_DEL_POMODORO}/g, pomodoroContext.proposito);
};

// 🚀 MISIÓN 178.2: FUNCIÓN DE VALIDACIÓN CONTEXTUAL PRE-ENVÍO
// Verifica que el contexto del pomodoro sea coherente antes de enviar a Gemini
const validarContextoGranular = (contextoPomodoro) => {
  console.log(`🔍 [VALIDACIÓN CONTEXTUAL] Verificando coherencia del contexto granular...`);
  
  const errores = [];
  const advertencias = [];
  
  // Validaciones básicas de estructura
  if (!contextoPomodoro.tematica_semanal || contextoPomodoro.tematica_semanal.trim().length === 0) {
    errores.push('Temática semanal vacía o indefinida');
  }
  
  if (!contextoPomodoro.concepto_del_dia || contextoPomodoro.concepto_del_dia.trim().length === 0) {
    errores.push('Concepto del día vacío o indefinido');
  }
  
  if (!contextoPomodoro.texto_del_pomodoro || contextoPomodoro.texto_del_pomodoro.trim().length === 0) {
    errores.push('Texto del pomodoro vacío o indefinido');
  }
  
  // VALIDACIÓN ESPECÍFICA PARA CS50 SEMANA 0
  if (contextoPomodoro.tematica_semanal.includes('CS50') && contextoPomodoro.tematica_semanal.includes('Semana 0')) {
    console.log(`🎯 [VALIDACIÓN CS50] Detectado CS50 Semana 0 - Aplicando validaciones específicas...`);
    
    // Verificar que el contenido sea sobre Scratch/programación visual
    const textoCompleto = `${contextoPomodoro.concepto_del_dia} ${contextoPomodoro.texto_del_pomodoro}`.toLowerCase();
    
    const esScratch = textoCompleto.includes('scratch') || 
                     textoCompleto.includes('programación visual') ||
                     textoCompleto.includes('bloques') ||
                     textoCompleto.includes('sprites');
    
    const esProgramacionTextual = textoCompleto.includes('python') ||
                                 textoCompleto.includes('javascript') ||
                                 textoCompleto.includes('java') ||
                                 textoCompleto.includes('printf') ||
                                 textoCompleto.includes('línea de comandos') ||
                                 textoCompleto.includes('terminal');
    
    if (!esScratch) {
      advertencias.push('CS50 Semana 0 debería enfocarse en Scratch/programación visual');
    }
    
    if (esProgramacionTextual) {
      errores.push('CS50 Semana 0 NO debe mencionar lenguajes de programación textual - debe ser Scratch');
    }
  }
  
  // Log de validación
  if (errores.length > 0) {
    console.error(`❌ [VALIDACIÓN] Errores críticos encontrados:`, errores);
  }
  
  if (advertencias.length > 0) {
    console.warn(`⚠️ [VALIDACIÓN] Advertencias encontradas:`, advertencias);
  }
  
  if (errores.length === 0 && advertencias.length === 0) {
    console.log(`✅ [VALIDACIÓN] Contexto granular válido y coherente`);
  }
  
  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    esCS50Semana0: contextoPomodoro.tematica_semanal.includes('CS50') && contextoPomodoro.tematica_semanal.includes('Semana 0')
  };
};

// 🚀 MISIÓN 178.2: FUNCIÓN DE DETECCIÓN POST-PROCESAMIENTO
// Detecta contenido fuera de contexto en la respuesta de la IA
function detectarDesviacionContextual(lessonData, contextoPomodoro) {
  console.log(`🔍 [POST-PROCESAMIENTO] Detectando desviación contextual en respuesta IA...`);
  
  const problemas = [];
  const contenidoCompleto = `${lessonData.contenido || ''} ${JSON.stringify(lessonData.quiz || [])}`.toLowerCase();
  
  // DETECCIÓN ESPECÍFICA PARA CS50 SEMANA 0
  if (contextoPomodoro.tematica_semanal && contextoPomodoro.tematica_semanal.includes('CS50') && contextoPomodoro.tematica_semanal.includes('Semana 0')) {
    console.log(`🎯 [POST-PROCESAMIENTO CS50] Verificando adherencia a Scratch/programación visual...`);
    
    // Términos prohibidos para CS50 Semana 0
    const terminosProhibidos = [
      'printf()', 'python', 'javascript', 'java', 'c programming', 
      'línea de comandos', 'terminal', 'compilar', 'gcc',
      'int main', 'include <stdio.h>', '#include',
      'variable declaration', 'memory allocation'
    ];
    
    terminosProhibidos.forEach(termino => {
      if (contenidoCompleto.includes(termino)) {
        problemas.push(`Término prohibido detectado para CS50 Semana 0: "${termino}"`);
      }
    });
    
    // Términos esperados para CS50 Semana 0
    const terminosEsperados = ['scratch', 'sprite', 'bloque', 'programación visual'];
    const terminosEncontrados = terminosEsperados.filter(termino => 
      contenidoCompleto.includes(termino) || contenidoCompleto.includes(termino + 's')
    );
    
    if (terminosEncontrados.length === 0) {
      problemas.push('No se encontraron términos esperados para CS50 Semana 0 (Scratch, sprites, bloques, programación visual)');
    }
  }
  
  // Log de detección
  if (problemas.length > 0) {
    console.error(`❌ [POST-PROCESAMIENTO] Desviación contextual detectada:`, problemas);
  } else {
    console.log(`✅ [POST-PROCESAMIENTO] Contenido adherente al contexto`);
  }
  
  return {
    tieneDesviacion: problemas.length > 0,
    problemas,
    puntuacionAdherencia: Math.max(0, 100 - (problemas.length * 25)) // Cada problema resta 25%
  };
}
const validateExerciseStructure = (exercise) => {
  return exercise && 
         typeof exercise === 'object' && 
         exercise.question && 
         exercise.type === 'multiple_choice' && 
         Array.isArray(exercise.options) && 
         exercise.options.length === 4 &&
         typeof exercise.correctAnswerIndex === 'number' &&
         exercise.correctAnswerIndex >= 0 &&
         exercise.correctAnswerIndex <= 3;
  // explanation es opcional para compatibilidad
};

// Handler principal
async function handler(req, res) {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido',
      message: 'Este endpoint solo acepta solicitudes POST' 
    });
  }

  try {
    // 🚀 MISIÓN 177: VALIDACIÓN DE PARÁMETROS GRANULARES - CORREGIDA
    // Endpoint refactorizado para aceptar tanto dia como diaIndex para compatibilidad
    const { semanaId, dia, diaIndex, pomodoroIndex } = req.body;

    // COMPATIBILIDAD: Aceptar tanto 'dia' como 'diaIndex' del frontend
    const diaFinal = dia || (diaIndex !== undefined ? diaIndex + 1 : null);

    // VALIDACIÓN: Parámetros granulares obligatorios
    if (!semanaId || !diaFinal || pomodoroIndex === undefined) {
      return res.status(400).json({
        error: 'Parámetros granulares requeridos',
        message: 'Los campos semanaId, dia/diaIndex y pomodoroIndex son obligatorios para generación granular',
        received: { semanaId, dia, diaIndex, pomodoroIndex, diaFinal }
      });
    }

    // Validación de tipos y rangos
    if (!Number.isInteger(semanaId) || semanaId < 1) {
      return res.status(400).json({
        error: 'semanaId inválido',
        message: 'semanaId debe ser un entero positivo'
      });
    }

    if (!Number.isInteger(diaFinal) || diaFinal < 1 || diaFinal > 5) {
      return res.status(400).json({
        error: 'dia inválido', 
        message: 'dia debe ser un entero entre 1 y 5'
      });
    }

    if (!Number.isInteger(pomodoroIndex) || pomodoroIndex < 0 || pomodoroIndex > 3) {
      return res.status(400).json({
        error: 'pomodoroIndex inválido',
        message: 'pomodoroIndex debe ser un entero entre 0 y 3'
      });
    }

    // Verificar API key de Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ API key de Gemini no configurada');
      return res.status(500).json({ 
        error: 'Configuración del servidor',
        message: 'API de IA no configurada correctamente' 
      });
    }

    const { isAuthenticated, userId } = req.authContext;

    console.log(`🧪 [GENERACIÓN GRANULAR SQLITE] Generando lección para semana ${semanaId}, día ${diaFinal}, pomodoro ${pomodoroIndex} usando SQLite curriculum.db`);

    // 🚀 MISIÓN 184: EXTRAER CONTEXTO Y VALIDAR PRE-ENVÍO USANDO SQLITE
    console.log(`🚀 [CONTEXTO GRANULAR SQLITE] Extrayendo contexto específico del pomodoro...`);
    const contextoPomodoro = await extraerContextoPomodoro(semanaId, diaFinal, pomodoroIndex);
    
    // 🛡️ MISIÓN 178.2: VALIDACIÓN PRE-ENVÍO - Verificar coherencia contextual
    console.log(`🛡️ [VALIDACIÓN PRE-ENVÍO] Ejecutando validación contextual crítica...`);
    const validationResult = validateContextualCoherence(
      contextoPomodoro.tematica_semanal,
      contextoPomodoro.concepto_del_dia,
      contextoPomodoro.texto_del_pomodoro
    );
    
    console.log(`📊 [VALIDACIÓN] Resultado:`, validationResult);
    
    // ❌ FALLAR RÁPIDO si hay errores críticos
    if (!validationResult.isValid) {
      console.error(`🚨 [VALIDACIÓN FALLIDA] Contexto problemático detectado`);
      console.error(`❌ Errores críticos:`, validationResult.errors);
      
      return res.status(400).json({
        success: false,
        error: 'Fallo de validación contextual',
        details: {
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          contextAnalysis: validationResult.contextAnalysis,
          semanaId,
          dia: diaFinal,
          pomodoroIndex,
          contexto: contextoPomodoro
        },
        message: 'El contexto contiene términos problemáticos que generarían contenido incorrecto. Para CS50 Semana 0, verifique que el contenido esté alineado con Scratch/programación visual, NO con C/Python/línea de comandos.'
      });
    }
    
    // ⚠️ Log warnings pero continuar
    if (validationResult.warnings.length > 0) {
      console.warn(`⚠️ [VALIDACIÓN] Advertencias encontradas:`, validationResult.warnings);
    }
    
    console.log(`✅ [VALIDACIÓN] Contexto validado exitosamente - Procediendo con generación`);
    
    // 🚀 GENERAR PROMPT CON CONTEXTO VALIDADO
    console.log(`🚀 [PROMPT GENERATION] Generando prompt con contexto validado...`);
    const prompt = TEMPLATE_PROMPT_UNIVERSAL
      .replace(/{tematica_semanal}/g, contextoPomodoro.tematica_semanal)
      .replace(/{concepto_del_dia}/g, contextoPomodoro.concepto_del_dia)
      .replace(/{texto_del_pomodoro}/g, contextoPomodoro.texto_del_pomodoro);
    
    console.log(`✅ [GRANULAR SQLITE] Usando prompt contextual granular con datos SQLite validados`);

    // 🚨 MISIÓN 171.2: LOGGING DEBUG GRANULAR - Mostrar prompt granular antes de envío
    console.log(`\n🔍 [DEBUG CONTEXTO GRANULAR] PROMPT GRANULAR A ENVIAR A GEMINI:`);
    console.log(`================== INICIO PROMPT GRANULAR ==================`);
    console.log(prompt);
    console.log(`================== FIN PROMPT GRANULAR ===================\n`);
    
    // Verificar que las variables granulares se reemplazaron correctamente
    if (prompt.includes('{')) {
      const unreplacedVars = prompt.match(/{[a-z_]+}/g);
      if (unreplacedVars) {
        console.error(`❌ [GRANULAR ERROR CRÍTICO] Variables granulares no reemplazadas:`, unreplacedVars);
      } else {
        console.log(`✅ [GRANULAR] Todas las variables contextuales reemplazadas exitosamente`);
      }
    }

    // 🚀 MISIÓN 215.0: CORRECCIÓN CRÍTICA - Usar variable de entorno GEMINI_MODEL_NAME
    // Leer modelo desde variable de entorno en lugar de hardcodeado
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
    console.log(`[GENERATE-LESSON-API] 🎯 Modelo seleccionado: ${modelName}`);
    
    // Llamar a la API de Gemini con wrapper de tracking
    console.log(`[GENERATE-LESSON-API] 🚀 Iniciando generación de lección con tracking automático`);
    
    const response = await geminiAPIWrapperServer(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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
            maxOutputTokens: 8000,  // 🚀 MISIÓN 215.2: Aumentado a 8000 (máximo para gemini-2.5-flash)
            temperature: 0.4,
            candidateCount: 1
          }
        })
      },
      {
        operation: `lesson_generation_s${semanaId}_d${diaFinal}_p${pomodoroIndex}`
      }
    );

    // Verificar respuesta de Gemini con tracking
    if (!response.ok) {
      console.error(`❌ Error de Gemini API con tracking: ${response.status} ${response.statusText}`);
      return res.status(500).json({ 
        error: 'Error del servicio de IA',
        message: `La API de IA respondió con estado ${response.status}` 
      });
    }
    
    console.log(`[GENERATE-LESSON-API] ✅ Respuesta de Gemini recibida con tracking automático`);

    const geminiData = await response.json();
    
    // 🚀 MISIÓN 215.1: DEBUG - Logging completo de respuesta Gemini
    console.log('🔍 [DEBUG GEMINI] Estructura de respuesta completa:');
    console.log(JSON.stringify(geminiData, null, 2));

    // Verificar estructura de respuesta de forma más robusta
    if (!geminiData.candidates || !Array.isArray(geminiData.candidates) || geminiData.candidates.length === 0) {
      console.error('❌ [GEMINI ERROR] No hay candidatos en la respuesta:', geminiData);
      return res.status(500).json({ 
        error: 'Respuesta inválida de IA',
        message: 'El servicio de IA no devolvió candidatos' 
      });
    }
    
    const firstCandidate = geminiData.candidates[0];
    
    // 🚀 MISIÓN 215.2: Verificar finishReason ANTES de intentar leer parts
    if (firstCandidate.finishReason === 'MAX_TOKENS') {
      console.error('❌ [GEMINI ERROR] MAX_TOKENS alcanzado - La respuesta fue truncada');
      console.error('   📊 Prompt tokens:', geminiData.usageMetadata?.promptTokenCount);
      console.error('   📊 Total tokens:', geminiData.usageMetadata?.totalTokenCount);
      console.error('   📊 Thoughts tokens:', geminiData.usageMetadata?.thoughtsTokenCount);
      return res.status(500).json({ 
        error: 'Límite de tokens excedido',
        message: 'La generación fue interrumpida por límite de tokens. Esto es un error de configuración.' 
      });
    }
    
    if (!firstCandidate.content || !firstCandidate.content.parts || !Array.isArray(firstCandidate.content.parts) || firstCandidate.content.parts.length === 0) {
      console.error('❌ [GEMINI ERROR] Estructura de contenido inválida:', firstCandidate);
      console.error('   finishReason:', firstCandidate.finishReason);
      return res.status(500).json({ 
        error: 'Respuesta inválida de IA',
        message: 'El servicio de IA no devolvió contenido válido' 
      });
    }

    const generatedText = firstCandidate.content.parts[0].text;
    
    if (!generatedText) {
      console.error('❌ [GEMINI ERROR] No hay texto en la respuesta:', firstCandidate.content.parts[0]);
      return res.status(500).json({ 
        error: 'Respuesta inválida de IA',
        message: 'El servicio de IA no devolvió texto' 
      });
    }
    
    console.log('✅ [GEMINI SUCCESS] Texto generado recibido:', generatedText.substring(0, 200) + '...');

    // Intentar parsear JSON de la respuesta
    let lessonData;
    try {
      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessonData = JSON.parse(jsonMatch[0]);
      } else {
        // Si no hay JSON válido, crear estructura básica
        lessonData = {
          title: "Lección Generada",
          lesson: generatedText,
          exercises: []
        };
      }
    } catch (parseError) {
      console.warn('⚠️ No se pudo parsear JSON de Gemini, usando texto plano:', parseError.message);
      // Fallback: crear estructura con el texto generado
      lessonData = {
        title: "Lección Generada",
        lesson: generatedText,
        exercises: []
      };
    }

    // 🚀 MISIÓN 171.2: Procesamiento para formato granular y fallbacks
    let extractedLesson, extractedExercises;
    
    if (lessonData.contenido && lessonData.quiz) {
      // Formato granular: contenido y quiz
      extractedLesson = lessonData.contenido;
      extractedExercises = lessonData.quiz.map(q => ({
        question: q.pregunta,
        type: 'multiple_choice',
        options: q.opciones,
        // Encontrar índice de la respuesta correcta
        correctAnswerIndex: q.opciones.findIndex(opcion => opcion === q.respuesta_correcta),
        explanation: `La respuesta correcta es: ${q.respuesta_correcta}`
      }));
      console.log('✨ [GRANULAR] Procesando respuesta con formato granular contenido/quiz');
    } else if (lessonData.content) {
      // Formato RAG: content.lesson y content.quiz
      extractedLesson = lessonData.content.lesson || lessonData.lesson || generatedText;
      extractedExercises = lessonData.content.quiz || lessonData.exercises || [];
      console.log('✨ [RAG FALLBACK] Procesando respuesta con formato content.lesson/content.quiz');
    } else {
      // Formato legacy: lesson y exercises
      extractedLesson = lessonData.lesson || generatedText;
      extractedExercises = lessonData.exercises || [];
      console.log('🔄 [LEGACY FALLBACK] Procesando respuesta con formato legacy lesson/exercises');
    }
    
    // 🚀 MISIÓN 178.2: DETECCIÓN POST-PROCESAMIENTO - Verificar adherencia contextual en respuesta IA
    console.log(`🔍 [POST-PROCESAMIENTO] Ejecutando detección de desviación contextual...`);
    const postProcessingResult = detectarDesviacionContextual(
      { contenido: extractedLesson, quiz: extractedExercises },
      contextoPomodoro
    );
    
    console.log(`📊 [POST-PROCESAMIENTO] Resultado de detección:`, postProcessingResult);
    
    // ⚠️ ADVERTIR si hay desviación contextual pero no bloquear (logging crítico)
    if (postProcessingResult.tieneDesviacion) {
      console.error(`🚨 [DESVIACIÓN DETECTADA] La IA generó contenido fuera de contexto:`);
      postProcessingResult.problemas.forEach((problema, index) => {
        console.error(`   ${index + 1}. ${problema}`);
      });
      console.error(`📉 [PUNTUACIÓN ADHERENCIA] ${postProcessingResult.puntuacionAdherencia}%`);
      
      // Añadir metadata de desviación para monitoring
      lessonData.contextValidation = {
        hasDeviation: true,
        deviationProblems: postProcessingResult.problemas,
        adherenceScore: postProcessingResult.puntuacionAdherencia,
        preValidation: validationResult,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log(`✅ [POST-PROCESAMIENTO] Contenido adherente al contexto - Calidad verificada`);
      lessonData.contextValidation = {
        hasDeviation: false,
        adherenceScore: postProcessingResult.puntuacionAdherencia,
        preValidation: validationResult,
        timestamp: new Date().toISOString()
      };
    }

    // 🚀 MISIÓN 184: Construir respuesta enriquecida con contexto granular SQLite
    const cleanedLesson = {
      title: lessonData.title || "Micro-Lección Granular SQLite",
      lesson: extractedLesson,
      exercises: Array.isArray(extractedExercises) ? 
        extractedExercises.filter(ex => {
          // Usar función de validación
          const isValid = validateExerciseStructure(ex);
          if (!isValid) {
            console.warn('⚠️ Ejercicio descartado por estructura incorrecta:', {
              hasQuestion: !!ex?.question,
              hasType: ex?.type === 'multiple_choice',
              hasOptions: Array.isArray(ex?.options) && ex?.options?.length === 4,
              hasCorrectAnswerIndex: typeof ex?.correctAnswerIndex === 'number',
              correctAnswerIndexInRange: ex?.correctAnswerIndex >= 0 && ex?.correctAnswerIndex <= 3,
              hasExplanation: !!ex?.explanation
            });
          }
          return isValid;
        }).map(ex => ({
          ...ex,
          type: 'multiple_choice' // Asegurar que siempre tenga el tipo correcto
        })) : [],
      generatedAt: new Date().toISOString(),
      inputLength: 0, // Campo legacy mantenido para compatibilidad
      // 🚀 MISIÓN 184: Metadatos granulares SQLite enriquecidos
      semanaId,
      dia: diaFinal, 
      pomodoroIndex,
      contextInfo: {
        promptType: 'granular_sqlite',
        granularEnabled: true,
        granularVersion: 'v2.0_sqlite',
        sqliteArchitecture: 'v9.0',
        dataSource: 'sqlite_curriculum_db'
      }
    };

    // Log de validación de ejercicios
    if (extractedExercises && extractedExercises.length > 0) {
      const originalCount = extractedExercises.length;
      const validCount = cleanedLesson.exercises.length;
      console.log(`📊 [RAG] Validación ejercicios: ${validCount}/${originalCount} válidos con correctAnswerIndex`);
      
      // Log detallado de ejercicios válidos
      cleanedLesson.exercises.forEach((ex, index) => {
        console.log(`✅ Ejercicio ${index + 1}: correctAnswerIndex=${ex.correctAnswerIndex} → "${ex.options[ex.correctAnswerIndex]}"`);
      });
    }

    // 💾 MISIÓN 171.2: PERSISTIR SIEMPRE (parámetros granulares obligatorios)
    if (isAuthenticated) {
      try {
        console.log(`💾 [GRANULAR] Persistiendo lección granular para usuario ${userId} en BD...`);
        
        const authenticatedSupabase = getAuthenticatedSupabaseFromRequest(req);
        
        // Insertar en tabla generated_content
        const { data: savedContent, error: saveError } = await authenticatedSupabase
          .from('generated_content')
          .insert({
            user_id: userId,
            semana_id: semanaId,
            dia_index: diaFinal - 1, // Convertir a 0-based para consistencia con BD
            pomodoro_index: pomodoroIndex,
            content: cleanedLesson
          })
          .select()
          .single();

        if (saveError) {
          console.error('⚠️ Error guardando en BD (continuando con respuesta):', saveError);
          // No devolver error, solo log - la generación fue exitosa
        } else {
          console.log(`✅ [GRANULAR] Lección granular persistida con ID: ${savedContent.id}`);
          cleanedLesson.savedToDatabase = true;
          cleanedLesson.contentId = savedContent.id;
        }

      } catch (persistError) {
        console.error('⚠️ Error en persistencia (continuando con respuesta):', persistError);
        // No devolver error, solo log - la generación fue exitosa
      }
    }

    // 🚀 MISIÓN 184: Log diferenciado con información granular SQLite
    const promptTypeUsed = cleanedLesson.contextInfo?.promptType || 'granular_sqlite';
    const granularInfo = cleanedLesson.contextInfo?.granularEnabled ? ' (Contexto Granular SQLite)' : '';
    const sqliteInfo = cleanedLesson.contextInfo?.sqliteArchitecture || 'v9.0';
    
    console.log(`✅ [GRANULAR SQLITE SUCCESS] Lección generada con contexto granular SQLite:`);
    console.log(`   🎯 Prompt: ${promptTypeUsed}${granularInfo}`);
    console.log(`   📚 Título: "${cleanedLesson.title}"`);
    console.log(`   📝 Ejercicios: ${cleanedLesson.exercises.length} interactivos`);
    console.log(`   💾 Persistencia: ${cleanedLesson.savedToDatabase ? 'BD' : 'No'}`);
    console.log(`   🔍 Contexto: Semana ${semanaId}, Día ${diaFinal}, Pomodoro ${pomodoroIndex}`);
    console.log(`   🚀 Arquitectura: SQLite ${sqliteInfo} (Rendimiento Optimizado)`);
    console.log(`   💾 Fuente: Base de datos SQLite curriculum.db`);

    // Respuesta exitosa con contexto granular
    res.status(200).json(cleanedLesson);

  } catch (error) {
    console.error('❌ [GRANULAR SQLITE ERROR] Error interno generando lección:', error);
    
    // Determinar tipo de error para respuesta apropiada
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return res.status(500).json({ 
        error: 'Error de conectividad',
        message: 'No se pudo conectar con el servicio de IA' 
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado al generar la lección'
    });
  }
}

// Aplicar middleware de autenticación opcional
export default withOptionalAuth(handler);
