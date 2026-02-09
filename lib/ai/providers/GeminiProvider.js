import { BaseProvider } from './BaseProvider';

/**
 * Proveedor Unificado Gemini para AI Code Mentor
 * Soporta múltiples modelos Google (Pro, Flash, etc.)
 * 
 * @module lib/ai/providers/GeminiProvider
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Configuración de modelos Gemini
 * ACTUALIZADO: Dic 2025 - modelos gemini-1.5-* deprecados, ahora usamos gemini-2.5-*
 */
const MODEL_CONFIGS = {
    'gemini-2.5-flash': {
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        maxTokens: 65536,
        temperature: 0.4,
        priority: 1,
        capabilities: ['code-analysis', 'fast-response', 'high-capacity']
    },
    'gemini-2.5-pro': {
        name: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        maxTokens: 65536,
        temperature: 0.4,
        priority: 2,
        capabilities: ['code-analysis', 'complex-reasoning', 'high-capacity']
    },
    'gemini-2.0-flash': {
        name: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        maxTokens: 8192,
        temperature: 0.4,
        priority: 3,
        capabilities: ['code-analysis', 'fast-response']
    },
    'gemini-2.0-flash-exp': {
        name: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (Experimental)',
        maxTokens: 8192,
        temperature: 0.4,
        priority: 4,
        capabilities: ['code-analysis', 'experimental']
    }
};

// Modelo por defecto (el más estable y disponible)
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Proveedor Gemini - Interfaz unificada para modelos Google
 */
export class GeminiProvider extends BaseProvider {
    constructor(modelName = DEFAULT_MODEL) {
        super({ name: modelName });
        this.apiKey = process.env.GEMINI_API_KEY;
        this.modelName = modelName;
        this.config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS[DEFAULT_MODEL];

        if (this.isAvailable()) {
            this.client = new GoogleGenerativeAI(this.apiKey);
            this.model = this.client.getGenerativeModel({
                model: this.config.name,
                generationConfig: {
                    maxOutputTokens: this.config.maxTokens,
                    temperature: this.config.temperature
                }
            });
        }
    }

    /**
     * Verificar si el proveedor está disponible
     * @returns {boolean}
     */
    isAvailable() {
        return !!this.apiKey && this.apiKey !== 'your-api-key-here';
    }

    /**
     * Obtener nombre del modelo
     * @returns {string}
     */
    getName() {
        return this.modelName;
    }

    /**
     * Construir prompt del sistema basado en la fase del estudiante
     * @param {string} phase - Fase del estudiante (fase-0 a fase-7)
     * @returns {string}
     */
    buildSystemPrompt(phase) {
        const prompts = {
            'fase-0': `Eres un tutor muy paciente que enseña programación a principiantes completos.
- Usa lenguaje muy simple y ejemplos visuales
- No asumas conocimiento previo de programación
- Celebra cada pequeño logro
- Evita conceptos avanzados como async, classes, POO`,

            'fase-1': `Eres un asistente educativo que guía en fundamentos de programación.
- Enfócate en buenas prácticas de código limpio
- Introduce debugging strategies
- Explica el razonamiento detrás de las sugerencias`,

            'fase-2': `Eres un mentor que ayuda a consolidar fundamentos y explorar conceptos intermedios.
- Introduce estructuras de datos básicas
- Fomenta modularización del código
- Sugiere mejoras de legibilidad`,

            'fase-5': `Eres un mentor senior que ayuda con arquitectura y diseño avanzado.
- Haz code review de nivel profesional
- Sugiere patrones de diseño cuando sean apropiados
- Considera performance y mantenibilidad`,

            'fase-7': `Eres un par técnico experto que hace code review de nivel profesional.
- Evalúa arquitectura y escalabilidad
- Sugiere optimizaciones avanzadas
- Considera trade-offs de diseño`
        };

        return prompts[phase] || prompts['fase-1'];
    }

    /**
     * Analizar código y retornar feedback educativo
     * @param {Object} request - Solicitud de análisis
     * @returns {Promise<Object>} - Resultado del análisis
     */
    async analyze(request) {
        if (!this.isAvailable()) {
            throw new Error('GeminiProvider no está disponible: API key no configurada');
        }

        const startTime = Date.now();
        const { code, language, phase, analysisType } = request;

        const systemPrompt = request.systemPrompt || this.buildSystemPrompt(phase);

        const userPrompt = request.userPrompt || `
Analiza el siguiente código ${language || 'JavaScript'}:

\`\`\`${language || 'javascript'}
${code}
\`\`\`

Proporciona:
1. Feedback constructivo sobre el código
2. Fortalezas identificadas
3. Áreas de mejora específicas
4. Ejemplos de cómo mejorar (si aplica)

Responde en formato JSON con esta estructura exacta:
{
  "feedback": "tu análisis general aquí",
  "strengths": ["fortaleza1", "fortaleza2"],
  "improvements": ["mejora1", "mejora2"],
  "examples": ["ejemplo de código mejorado si aplica"],
  "score": 7.5
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni bloques de código markdown.
    `;

        try {
            // Construir historial de chat
            let history = [];
            let currentPrompt = userPrompt;

            // Si hay mensajes previos (chat intent), usarlos
            if (request.messages && Array.isArray(request.messages) && request.messages.length > 0) {
                // Separar historial de la última pregunta
                // Asumimos que el último mensaje es el usuario actual
                const previousMessages = request.messages.slice(0, -1);
                const lastMessage = request.messages[request.messages.length - 1];

                history = previousMessages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));

                // Usar el contenido del último mensaje como prompt
                if (lastMessage && lastMessage.role === 'user') {
                    currentPrompt = lastMessage.content;
                }
            } else {
                // Si no (explain intent inicial), usar prompt del sistema inicial
                history = [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Entendido, estoy listo para analizar código con este enfoque.' }]
                    }
                ];
            }

            const chat = this.model.startChat({
                history: history
            });

            const result = await chat.sendMessage(currentPrompt);
            const responseText = result.response.text();

            // Extraer JSON de la respuesta
            const parsedResponse = this.parseResponse(responseText);
            const latency = Date.now() - startTime;

            return this.formatResponse(parsedResponse, {
                tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
                latency
            });

        } catch (error) {
            console.error(`[GeminiProvider] Error con ${this.modelName}:`, error.message);
            throw error;
        }
    }

    /**
     * Parsear respuesta de texto a JSON
     * @param {string} responseText - Respuesta en texto
     * @returns {Object} - Respuesta parseada
     */
    parseResponse(responseText) {
        // Intentar extraer JSON de la respuesta
        let jsonStr = responseText;

        // Si viene envuelto en bloques de código markdown
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Si no hay bloques, buscar el JSON directamente
        const directJsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (directJsonMatch) {
            jsonStr = directJsonMatch[0];
        }

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.warn('[GeminiProvider] No se pudo parsear JSON, retornando respuesta como feedback');
            return {
                feedback: responseText,
                strengths: [],
                improvements: [],
                examples: [],
                score: null
            };
        }
    }

    /**
     * Formatear respuesta para consistencia
     * @param {Object} rawResponse - Respuesta parseada
     * @param {Object} metadata - Metadatos de la consulta
     * @returns {Object} - Respuesta formateada
     */
    formatResponse(rawResponse, metadata) {
        return {
            analysis: {
                feedback: rawResponse.feedback || '',
                strengths: rawResponse.strengths || [],
                improvements: rawResponse.improvements || [],
                examples: rawResponse.examples || [],
                score: rawResponse.score || null
            },
            metadata: {
                model: this.modelName,
                tokensUsed: metadata.tokensUsed,
                latency: metadata.latency,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Obtener lista de modelos soportados
     * @returns {Array} - Lista de configuraciones de modelos
     */
    static getSupportedModels() {
        return Object.values(MODEL_CONFIGS).sort((a, b) => a.priority - b.priority);
    }

    /**
     * Verificar si un modelo específico está soportado
     * @param {string} modelName - Nombre del modelo
     * @returns {boolean}
     */
    static isModelSupported(modelName) {
        return modelName in MODEL_CONFIGS;
    }
}
