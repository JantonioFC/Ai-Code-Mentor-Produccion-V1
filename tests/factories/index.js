/**
 * FASE 2: Factories y fixtures de datos de test reutilizables
 *
 * Factories para generar objetos de test consistentes:
 * - createTestUser: Usuarios mock
 * - createTestLesson: Lecciones mock (basado en LessonFactory.js)
 * - createTestFeedback: Feedback mock
 * - createMockAIResponse: Respuestas AI mock (basado en MockProvider.js)
 */

/**
 * Genera un objeto de usuario de test
 * @param {object} overrides - Propiedades a sobreescribir
 */
function createTestUser(overrides = {}) {
  return {
    id: overrides.id || `user-${Math.random().toString(36).substr(2, 9)}`,
    email: overrides.email || 'demo@aicodementor.com',
    name: overrides.name || 'Demo User',
    role: overrides.role || 'student',
    created_at: overrides.created_at || new Date().toISOString(),
    ...overrides
  };
}

/**
 * Genera un objeto de lección de test
 * @param {object} overrides - Propiedades a sobreescribir
 */
function createTestLesson(overrides = {}) {
  const week = overrides.week || 1;
  const day = overrides.day || 1;
  const topic = overrides.topic || 'Conceptos Básicos de JavaScript ES6';

  return {
    id: overrides.id || `lesson-${Math.random().toString(36).substr(2, 9)}`,
    title: overrides.title || topic,
    week,
    day,
    content: overrides.content || `# ${topic}\n\n## Introducción\n\nContenido de la lección sobre ${topic}.\n\n## Conceptos Clave\n\n- Concepto 1\n- Concepto 2\n- Concepto 3\n\n## Ejemplo Práctico\n\n\`\`\`javascript\nconsole.log('Ejemplo de ${topic}');\n\`\`\`\n\n## Conclusión\n\nResumen de ${topic}.`,
    exercises: overrides.exercises || [
      {
        question: `¿Cuál es un concepto clave de ${topic}?`,
        type: 'multiple_choice',
        options: [
          'Respuesta correcta',
          'Distractor A',
          'Distractor B',
          'Distractor C'
        ],
        correctAnswerIndex: 0,
        explanation: 'Esta es la explicación de la respuesta correcta.'
      }
    ],
    difficulty: overrides.difficulty || 'beginner',
    topics: overrides.topics || ['javascript', 'es6'],
    estimated_time: overrides.estimated_time || '30 min',
    generated_at: overrides.generated_at || new Date().toISOString(),
    ...overrides
  };
}

/**
 * Genera un objeto de feedback de test
 * @param {object} overrides - Propiedades a sobreescribir
 */
function createTestFeedback(overrides = {}) {
  return {
    id: overrides.id || `feedback-${Math.random().toString(36).substr(2, 9)}`,
    lessonId: overrides.lessonId || 'lesson-test-001',
    sessionId: overrides.sessionId || 'session-test-001',
    rating: overrides.rating || 4,
    score: overrides.score || 8.0,
    wasHelpful: overrides.wasHelpful !== undefined ? overrides.wasHelpful : true,
    difficulty: overrides.difficulty || 'appropriate',
    comment: overrides.comment || 'Lección clara y bien estructurada.',
    created_at: overrides.created_at || new Date().toISOString(),
    ...overrides
  };
}

/**
 * Genera una respuesta mock de AI consistente
 * @param {object} overrides - Propiedades a sobreescribir
 * @param {string} overrides.type - Tipo: 'sandbox', 'lesson', 'analysis', 'stream'
 */
function createMockAIResponse(overrides = {}) {
  const type = overrides.type || 'sandbox';

  const responses = {
    sandbox: {
      title: 'Conceptos Básicos de JavaScript ES6',
      lesson: '# Conceptos Básicos de JavaScript ES6\n\n## Introducción\n\nJavaScript ES6 introdujo mejoras significativas al lenguaje.\n\n## Arrow Functions\n\n```javascript\nconst suma = (a, b) => a + b;\n```\n\n## Destructuring\n\n```javascript\nconst { nombre, edad } = persona;\n```\n\n## Conclusión\n\nES6 es fundamental para JavaScript moderno.',
      exercises: [
        {
          question: '¿Cuál es una ventaja clave de las arrow functions?',
          type: 'multiple_choice',
          options: [
            'Sintaxis más concisa y binding léxico de this',
            'Son más rápidas en ejecución',
            'Permiten múltiples valores de retorno',
            'Solo funcionan con arrays'
          ],
          correctAnswerIndex: 0,
          explanation: 'Las arrow functions ofrecen sintaxis más corta y binding léxico de this.'
        }
      ],
      generatedAt: new Date().toISOString(),
      inputLength: 85,
      sandboxMetadata: {
        endpointType: 'sandbox_gemini_v2_MOCK',
        promptVersion: 'pedagogical_fidelity_v2.0',
        missionId: 'FACTORY',
        isMock: true
      }
    },

    lesson: {
      title: 'Lección Generada - Variables y Tipos de Datos',
      content: '# Variables y Tipos de Datos\n\n## Introducción\n\nJavaScript tiene varios tipos de datos fundamentales.\n\n## let y const\n\n```javascript\nlet variable = "cambio";\nconst constante = "fijo";\n```',
      exercises: [
        {
          question: '¿Cuál es la diferencia entre let y const?',
          type: 'multiple_choice',
          options: [
            'let permite reasignación, const no',
            'No hay diferencia',
            'const es más rápido',
            'let es obsoleto'
          ],
          correctAnswerIndex: 0,
          explanation: 'let permite reasignar valores, mientras que const crea una referencia inmutable.'
        }
      ],
      week: 1,
      day: 1,
      generatedAt: new Date().toISOString(),
      metadata: {
        model: 'mock-model',
        isMock: true
      }
    },

    analysis: {
      analysis: {
        feedback: 'Análisis simulado: Código bien estructurado con buenas prácticas.',
        strengths: ['Código ejecutado en entorno seguro', 'Estructura básica correcta'],
        improvements: ['Configurar API real', 'Implementar manejo de errores robusto'],
        examples: [],
        score: 8.0
      },
      metadata: {
        model: 'mock-model',
        tokensUsed: 0,
        latency: 10,
        timestamp: new Date().toISOString()
      }
    },

    stream: {
      chunks: [
        { type: 'progress', progress: 25, message: 'Analizando tema...' },
        { type: 'progress', progress: 50, message: 'Generando contenido...' },
        { type: 'progress', progress: 75, message: 'Creando ejercicios...' },
        { type: 'content', content: '# Lección Streaming\n\nContenido generado por streaming.' },
        { type: 'done', progress: 100 }
      ]
    }
  };

  const baseResponse = responses[type] || responses.sandbox;

  // Allow overriding specific fields within the response
  const { type: _type, ...rest } = overrides;
  return { ...baseResponse, ...rest };
}

module.exports = {
  createTestUser,
  createTestLesson,
  createTestFeedback,
  createMockAIResponse
};
