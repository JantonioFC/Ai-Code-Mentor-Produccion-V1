/**
 * AI Reviewer Service - IRP Integration
 * 
 * Integración con Gemini para revisiones automatizadas de código.
 * Adaptado del microservicio IRP para uso con Supabase.
 * 
 * @author Mentor Coder
 * @version 2.0.0 (Supabase Integration)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración del modelo
const GEMINI_CONFIG = {
    model: 'models/gemini-2.5-flash',
    generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
    }
};

let genAI = null;
let model = null;

/**
 * Inicializa el cliente de Gemini AI
 */
export function initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[IRP-AI] Gemini API Key no configurada');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel(GEMINI_CONFIG);
        console.log('[IRP-AI] Cliente de Gemini inicializado');
        return true;
    } catch (error) {
        console.error('[IRP-AI] Error inicializando Gemini:', error.message);
        return false;
    }
}

/**
 * Genera el prompt para la revisión de código
 */
function generateReviewPrompt(reviewRequest, codeContent) {
    const {
        project_name,
        phase,
        week,
        description,
        learning_objectives = [],
        specific_focus = []
    } = reviewRequest;

    return `Eres un revisor experto de código para un programa educativo de desarrollo de software.

**CONTEXTO DEL PROYECTO:**
- Nombre: ${project_name}
- Fase del curso: ${phase} (Semana ${week})
- Descripción: ${description}
- Objetivos de aprendizaje: ${learning_objectives.join(', ')}
- Áreas de enfoque: ${specific_focus.join(', ')}

**CÓDIGO A REVISAR:**
\`\`\`
${codeContent}
\`\`\`

**INSTRUCCIONES:**
Tu tarea es realizar una revisión constructiva, educativa y detallada del código. Debes generar un informe en formato JSON con la siguiente estructura exacta:

{
  "puntos_fuertes": [
    {
      "categoria": "string (ej: 'Claridad del Código', 'Arquitectura', 'Testing', etc.)",
      "descripcion": "string (descripción detallada del punto fuerte)",
      "archivo_referencia": "string opcional (nombre del archivo)",
      "linea_referencia": number opcional (número de línea)
    }
  ],
  "sugerencias_mejora": [
    {
      "categoria": "string (ej: 'Arquitectura', 'Performance', 'Seguridad', etc.)",
      "descripcion": "string (descripción constructiva de la mejora)",
      "archivo_referencia": "string opcional",
      "linea_referencia": number opcional,
      "prioridad": "string ('baja', 'media', 'alta')"
    }
  ],
  "preguntas_reflexion": [
    {
      "pregunta": "string (pregunta que invite a la reflexión)",
      "contexto": "string (contexto de por qué es importante esta pregunta)"
    }
  ],
  "calificacion_general": {
    "claridad_codigo": number (1-5),
    "arquitectura": number (1-5),
    "testing": number (1-5),
    "documentacion": number (1-5)
  },
  "tiempo_revision_horas": number (estimado entre 1.5 y 3.0),
  "recomendacion": "string ('APPROVE', 'APPROVE_WITH_MINOR_CHANGES', o 'MAJOR_REVISION_NEEDED')"
}

**CRITERIOS DE CALIDAD:**
1. Identifica AL MENOS 3 puntos fuertes específicos
2. Proporciona AL MENOS 3 sugerencias de mejora constructivas
3. Incluye AL MENOS 2 preguntas reflexivas
4. Las calificaciones deben ser justas y alineadas con los objetivos de aprendizaje
5. Sé amable, constructivo y educativo en el tono

**IMPORTANTE:** 
- Responde ÚNICAMENTE con el JSON, sin texto adicional
- Asegúrate de que el JSON sea válido
- Usa comillas dobles para todas las cadenas de texto`;
}

/**
 * Valida la estructura de una revisión generada por IA
 */
export function validateReviewStructure(reviewData) {
    const errors = [];

    if (!reviewData.puntos_fuertes || !Array.isArray(reviewData.puntos_fuertes)) {
        errors.push('puntos_fuertes debe ser un array');
    } else if (reviewData.puntos_fuertes.length < 1) {
        errors.push('Debe haber al menos 1 punto fuerte');
    }

    if (!reviewData.sugerencias_mejora || !Array.isArray(reviewData.sugerencias_mejora)) {
        errors.push('sugerencias_mejora debe ser un array');
    } else if (reviewData.sugerencias_mejora.length < 1) {
        errors.push('Debe haber al menos 1 sugerencia de mejora');
    }

    if (!reviewData.preguntas_reflexion || !Array.isArray(reviewData.preguntas_reflexion)) {
        errors.push('preguntas_reflexion debe ser un array');
    }

    if (!reviewData.calificacion_general) {
        errors.push('calificacion_general es requerida');
    } else {
        const ratings = ['claridad_codigo', 'arquitectura', 'testing', 'documentacion'];
        ratings.forEach(r => {
            const value = reviewData.calificacion_general[r];
            if (!value || value < 1 || value > 5) {
                errors.push(`${r} debe ser un número entre 1 y 5`);
            }
        });
    }

    if (!reviewData.tiempo_revision_horas || reviewData.tiempo_revision_horas < 0.1) {
        errors.push('tiempo_revision_horas debe ser mayor a 0.1');
    }

    const validRecs = ['APPROVE', 'APPROVE_WITH_MINOR_CHANGES', 'MAJOR_REVISION_NEEDED'];
    if (!reviewData.recomendacion || !validRecs.includes(reviewData.recomendacion)) {
        errors.push('recomendacion debe ser: APPROVE, APPROVE_WITH_MINOR_CHANGES o MAJOR_REVISION_NEEDED');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Realiza una revisión de código utilizando Gemini AI
 */
export async function performAIReview(reviewRequest, codeContent) {
    const startTime = Date.now();

    try {
        if (!model) {
            const initialized = initializeAI();
            if (!initialized) {
                throw new Error('No se pudo inicializar Gemini AI');
            }
        }

        console.log('[IRP-AI] Iniciando revisión', {
            requestId: reviewRequest.id,
            projectName: reviewRequest.project_name
        });

        const prompt = generateReviewPrompt(reviewRequest, codeContent);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parsear respuesta JSON
        let reviewData;
        try {
            let cleanedText = text.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/```\n?/g, '');
            }
            reviewData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('[IRP-AI] Error parseando respuesta:', parseError.message);
            throw new Error('La respuesta de la IA no pudo ser parseada como JSON válido');
        }

        // Validar estructura
        const validation = validateReviewStructure(reviewData);
        if (!validation.isValid) {
            console.error('[IRP-AI] Estructura inválida:', validation.errors);
            throw new Error(`Estructura de revisión inválida: ${validation.errors.join(', ')}`);
        }

        const duration = Date.now() - startTime;

        console.log('[IRP-AI] Revisión completada', {
            requestId: reviewRequest.id,
            duration: `${duration}ms`,
            puntosFuertes: reviewData.puntos_fuertes.length
        });

        return {
            success: true,
            reviewData,
            metadata: {
                duration,
                model: GEMINI_CONFIG.model,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('[IRP-AI] Error en revisión:', error.message, { duration });
        throw error;
    }
}

/**
 * Obtiene el contenido del código desde GitHub
 * @param {string} githubRepoUrl - URL del repositorio
 * @returns {Promise<string>} Contenido del código
 */
export async function fetchCodeFromGitHub(githubRepoUrl) {
    // TODO: Implementar integración real con GitHub API
    console.warn('[IRP-AI] GitHub integration pending - using sample code');

    return `// Código del repositorio
// ${githubRepoUrl}
function main() {
  console.log('Sample code from repository');
}
main();`;
}

/**
 * Verifica si el servicio de IA está disponible
 */
export function isAIAvailable() {
    return !!process.env.GEMINI_API_KEY;
}
