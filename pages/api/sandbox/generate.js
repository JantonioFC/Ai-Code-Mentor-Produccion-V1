/**
 * API Endpoint: POST /api/sandbox/generate
 * Genera una lección personalizada en el Sandbox de Aprendizaje
 *
 * @param {string} customContent - Texto/tema ingresado por el usuario
 * @param {string} domain - Dominio de estudio (programming, logic, databases, math)
 * @returns {Object} Lección generada con título, contenido y ejercicios
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const DOMAIN_LABELS = {
  programming: 'Programación y Desarrollo de Software',
  logic: 'Lógica Proposicional y Computacional',
  databases: 'Bases de Datos, SQL y Modelo ER',
  math: 'Matemáticas, Álgebra y Cálculo',
};

const SANDBOX_SYSTEM_PROMPT = `Eres un tutor experto. Tu tarea es crear micro-lecciones educativas personalizadas.

**FORMATO DE RESPUESTA:** Responde SIEMPRE en JSON válido con esta estructura exacta:
{
  "title": "Título descriptivo de la lección",
  "lesson": "Contenido completo de la lección en texto con formato markdown. Incluye explicaciones claras, ejemplos de código si aplica, y analogías para facilitar la comprensión.",
  "exercises": [
    {
      "question": "Pregunta del ejercicio",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicación de por qué es correcta"
    }
  ]
}

**REGLAS:**
- La lección debe ser concisa pero completa (300-600 palabras)
- Incluye al menos 2 ejercicios de opción múltiple
- Usa ejemplos prácticos y código cuando sea relevante
- El contenido debe ser en español
- NO incluyas markdown code blocks alrededor del JSON`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo acepta POST requests'
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  [SANDBOX-GEN] GEMINI_API_KEY not configured');
    return res.status(501).json({
      error: 'Service Not Configured',
      message: 'La generación con IA requiere configurar GEMINI_API_KEY en .env.local'
    });
  }

  const { customContent, domain = 'programming' } = req.body;

  if (!customContent || !customContent.trim()) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Se requiere customContent con el tema a estudiar'
    });
  }

  try {
    const domainLabel = DOMAIN_LABELS[domain] || DOMAIN_LABELS.programming;

    console.log(`🧪 [SANDBOX-GEN] Generating: domain=${domain}, content=${customContent.length} chars`);

    const userPrompt = `[CONTEXTO]
Dominio: ${domainLabel}
Tema solicitado por el estudiante: ${customContent}
[/CONTEXTO]

Genera una micro-lección educativa sobre el tema indicado dentro del dominio ${domainLabel}.`;

    // Use model discovery if available, fallback to direct model name
    let modelName = 'gemini-2.5-flash';
    try {
      const { modelDiscovery } = await import('../../../lib/ai/discovery/ModelDiscovery.js');
      const primaryModel = await modelDiscovery.getPrimaryModel();
      if (primaryModel) {
        modelName = primaryModel.name;
      }
    } catch (e) {
      console.log('[SANDBOX-GEN] Model discovery unavailable, using default:', modelName);
    }

    console.log(`🤖 [SANDBOX-GEN] Using model: ${modelName}`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${SANDBOX_SYSTEM_PROMPT}\n\n${userPrompt}` }] }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 4096,
      }
    });

    const response = await result.response;
    const generatedText = response.text();

    // Parse JSON response from Gemini
    let lessonData;
    try {
      const jsonMatch = generatedText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        lessonData = JSON.parse(jsonMatch[1]);
      } else {
        lessonData = JSON.parse(generatedText);
      }
    } catch (parseError) {
      console.error('❌ [SANDBOX-GEN] Failed to parse JSON:', parseError.message);
      lessonData = {
        title: `Lección: ${customContent.substring(0, 50)}`,
        lesson: generatedText,
        exercises: [],
      };
    }

    console.log('✅ [SANDBOX-GEN] Lesson generated successfully');

    // Normalize exercises: ensure correctAnswerIndex exists
    const rawExercises = lessonData.exercises || lessonData.quiz || [];
    const exercises = rawExercises.map((ex) => ({
      ...ex,
      correctAnswerIndex: typeof ex.correctAnswerIndex === 'number'
        ? ex.correctAnswerIndex
        : typeof ex.correctIndex === 'number'
          ? ex.correctIndex
          : typeof ex.correct_index === 'number'
            ? ex.correct_index
            : 0,
    }));

    return res.status(200).json({
      success: true,
      title: lessonData.title || `Lección: ${customContent.substring(0, 50)}`,
      lesson: lessonData.lesson || lessonData.contenido || generatedText,
      exercises,
      metadata: {
        domain,
        generatedAt: new Date().toISOString(),
        model: modelName,
        inputLength: customContent.length,
      }
    });

  } catch (error) {
    console.error('❌ [SANDBOX-GEN] Error:', error.message);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
