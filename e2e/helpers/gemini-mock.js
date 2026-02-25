/**
 * FASE 2: Mock robusto de Gemini API para E2E
 *
 * Interceptor de Playwright para mockear llamadas a la API de Gemini.
 * Usa page.route() para interceptar sin tocar código de producción.
 *
 * Endpoints interceptados:
 * - POST /api/sandbox/generate → respuesta de lección sandbox
 * - POST /api/v1/lessons/generate → respuesta de lección curricular
 * - POST /api/v1/lessons/stream → respuesta SSE mock
 * - POST /api/generate-lesson → endpoint legacy de generación
 */

const { mockSandboxResponse } = require('../fixtures/mockSandboxResponse');

/**
 * Respuesta mock para generación de lección curricular
 */
const mockLessonGenerateResponse = {
  title: 'Variables y Tipos de Datos en JavaScript',
  content: '# Variables y Tipos de Datos\n\nJavaScript tiene varios tipos de datos fundamentales.\n\n## let y const\n\n```javascript\nlet variable = "cambio";\nconst constante = "fijo";\n```\n\n## Tipos Primitivos\n\n- string\n- number\n- boolean\n- null\n- undefined\n\n## Conclusión\n\nEntender los tipos de datos es fundamental para programar en JavaScript.',
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
  generatedAt: new Date().toISOString(),
  metadata: {
    model: 'mock-model',
    isMock: true,
    missionId: 'FASE-2'
  }
};

/**
 * Respuesta mock para el endpoint legacy /api/generate-lesson
 */
const mockLegacyLessonResponse = {
  success: true,
  lesson: {
    title: 'Variables y Tipos de Datos en JavaScript',
    content: '# Variables y Tipos de Datos\n\nContenido de la lección generada.',
    exercises: mockLessonGenerateResponse.exercises
  },
  generatedAt: new Date().toISOString(),
  metadata: { isMock: true }
};

/**
 * Respuesta mock para /api/get-lesson (obtener lección existente)
 */
const mockGetLessonResponse = {
  success: true,
  lesson: null,
  message: 'No hay lección previa, generando nueva...'
};

/**
 * Genera chunks SSE para simular streaming
 */
function buildSSEChunks() {
  const events = [
    { type: 'progress', progress: 25, message: 'Analizando tema...' },
    { type: 'progress', progress: 50, message: 'Generando contenido...' },
    { type: 'progress', progress: 75, message: 'Creando ejercicios...' },
    { type: 'content', content: '# Lección Streaming\n\nContenido generado por streaming mock.' },
    { type: 'done', progress: 100 }
  ];

  return events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('');
}

/**
 * Configura todos los interceptores de API de Gemini en una página de Playwright
 *
 * @param {import('@playwright/test').Page} page - Instancia de Playwright page
 * @param {object} options - Opciones de configuración
 * @param {number} options.delay - Delay simulado en ms (default: 300)
 * @param {boolean} options.verbose - Log detallado (default: true)
 * @param {object} options.sandboxResponse - Override de respuesta sandbox
 * @param {object} options.lessonResponse - Override de respuesta lesson generate
 */
async function setupGeminiMock(page, options = {}) {
  const {
    delay = 300,
    verbose = true,
    sandboxResponse = mockSandboxResponse,
    lessonResponse = mockLessonGenerateResponse
  } = options;

  const log = verbose ? console.log : () => {};

  // 1. Interceptar POST /api/sandbox/generate
  await page.route('**/api/sandbox/generate', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    log('🎭 [GEMINI-MOCK] Interceptando POST /api/sandbox/generate');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sandboxResponse)
    });
    log('✅ [GEMINI-MOCK] Respuesta sandbox enviada');
  });

  // 2. Interceptar POST /api/v1/lessons/generate
  await page.route('**/api/v1/lessons/generate', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    log('🎭 [GEMINI-MOCK] Interceptando POST /api/v1/lessons/generate');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lessonResponse)
    });
    log('✅ [GEMINI-MOCK] Respuesta lesson generate enviada');
  });

  // 3. Interceptar POST /api/v1/lessons/stream (SSE)
  await page.route('**/api/v1/lessons/stream', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    log('🎭 [GEMINI-MOCK] Interceptando POST /api/v1/lessons/stream (SSE)');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: buildSSEChunks()
    });
    log('✅ [GEMINI-MOCK] Respuesta SSE stream enviada');
  });

  // 4. Interceptar POST /api/generate-lesson (legacy)
  await page.route('**/api/generate-lesson', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    log('🎭 [GEMINI-MOCK] Interceptando POST /api/generate-lesson (legacy)');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLegacyLessonResponse)
    });
    log('✅ [GEMINI-MOCK] Respuesta legacy lesson enviada');
  });

  // 5. Interceptar GET /api/get-lesson (consulta de lección existente)
  await page.route('**/api/get-lesson*', async (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    log('🎭 [GEMINI-MOCK] Interceptando GET /api/get-lesson');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGetLessonResponse)
    });
    log('✅ [GEMINI-MOCK] Respuesta get-lesson enviada');
  });

  // 6. Interceptar POST /api/v1/lessons/feedback
  await page.route('**/api/v1/lessons/feedback', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    log('🎭 [GEMINI-MOCK] Interceptando POST /api/v1/lessons/feedback');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Feedback registrado correctamente' })
    });
    log('✅ [GEMINI-MOCK] Respuesta feedback enviada');
  });

  log('🎭 [GEMINI-MOCK] Todos los interceptores configurados');
}

/**
 * Configura solo el interceptor de sandbox (para tests específicos)
 */
async function setupSandboxMock(page, options = {}) {
  const { delay = 300, sandboxResponse = mockSandboxResponse } = options;

  await page.route('**/api/sandbox/generate', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    console.log('🎭 [SANDBOX-MOCK] Interceptando POST /api/sandbox/generate');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sandboxResponse)
    });
  });
}

/**
 * Configura solo los interceptores de lesson generation (para LESSON-001)
 */
async function setupLessonMock(page, options = {}) {
  const { delay = 300 } = options;

  await page.route('**/api/get-lesson*', async (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    console.log('🎭 [LESSON-MOCK] Interceptando GET /api/get-lesson');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGetLessonResponse)
    });
  });

  await page.route('**/api/generate-lesson', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    console.log('🎭 [LESSON-MOCK] Interceptando POST /api/generate-lesson');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLegacyLessonResponse)
    });
  });

  await page.route('**/api/v1/lessons/generate', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    console.log('🎭 [LESSON-MOCK] Interceptando POST /api/v1/lessons/generate');
    if (delay > 0) await page.waitForTimeout(delay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLessonGenerateResponse)
    });
  });
}

module.exports = {
  setupGeminiMock,
  setupSandboxMock,
  setupLessonMock,
  mockSandboxResponse,
  mockLessonGenerateResponse,
  mockLegacyLessonResponse,
  mockGetLessonResponse
};
