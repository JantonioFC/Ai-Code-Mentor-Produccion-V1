// core/moduleService.js
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const lessonsDirectory = path.resolve(process.cwd(), 'db/lessons');

/**
 * Asegura que el directorio de lecciones existe, creándolo si es necesario.
 */
const ensureLessonsDirectory = () => {
  if (!fsSync.existsSync(lessonsDirectory)) {
    fsSync.mkdirSync(lessonsDirectory, { recursive: true });
    console.log(`📁 Directorio de lecciones creado: ${lessonsDirectory}`);
  }
};

/**
 * Construye un prompt especializado para la generación de lecciones.
 * @param {string} sourceMaterial - El texto plano a transformar en lección.
 * @returns {string} El prompt completo para la IA.
 */
const buildLessonPrompt = (sourceMaterial) => {
  return `
    Actúa como un diseñador instruccional experto de nivel universitario. Tu tarea es transformar el siguiente texto técnico en un segmento de una lección interactiva y estructurada.

    TEXTO A TRANSFORMAR:
    ---
    ${sourceMaterial}
    ---

    RESPONDE ÚNICAMENTE CON UN OBJETO JSON con la siguiente estructura:
    {
      "title": "Un título conciso y atractivo para la lección basado en el texto",
      "explanation": "Una explicación clara y pedagógica del concepto principal del texto, como si se lo explicaras a un estudiante.",
      "code_example": {
        "language": "javascript", // o el lenguaje que corresponda
        "code": "Un ejemplo de código relevante y bien comentado que ilustre el concepto."
      },
      "quiz": {
        "question": "Una pregunta de opción múltiple para verificar la comprensión del concepto.",
        "options": ["Opción A", "Opción B", "Opción C"],
        "correctAnswer": "La opción correcta"
      }
    }
  `;
};

/**
 * Genera una lección a partir de material fuente usando la IA y la guarda.
 * @param {string} sourceMaterial - El texto plano para la lección.
 * @returns {Promise<object>} El objeto de la lección generada y guardada.
 */
export const generateAndSaveLesson = async (sourceMaterial) => {
  ensureLessonsDirectory();
  const prompt = buildLessonPrompt(sourceMaterial);
  
  try {
    // 1. Llamada a la API de Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" } // Solicitamos respuesta en JSON
      })
    });

    if (!response.ok) {
      throw new Error(`Error en la API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    const lessonContent = JSON.parse(data.candidates[0].content.parts[0].text);

    // 2. Guardado de la lección
    const lessonId = `lesson_${Date.now()}`;
    const lessonData = {
      lessonId,
      title: lessonContent.title,
      sourceMaterial,
      generatedContent: [
        { type: 'explanation', content: lessonContent.explanation },
        { type: 'code_example', ...lessonContent.code_example },
        { type: 'quiz', ...lessonContent.quiz }
      ]
    };

    const filePath = path.join(lessonsDirectory, `${lessonId}.json`);
    await fs.writeFile(filePath, JSON.stringify(lessonData, null, 2));

    return lessonData;
  } catch (error) {
    console.error('Error al generar la lección:', error);
    throw error; // Re-lanzamos el error para que el controlador de API lo maneje
  }
};
