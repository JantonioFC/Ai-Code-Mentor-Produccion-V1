import { BaseProvider } from './BaseProvider.js';

/**
 * OpenRouter Provider (BYOK - Bring Your Own Key)
 * Allows users to use their own OpenRouter API keys to access models like Claude, GPT-4, etc.
 * 
 * @module lib/ai/providers/OpenRouterProvider
 */
export class OpenRouterProvider extends BaseProvider {
    constructor(config = {}) {
        super({ name: config.modelName || 'openai/gpt-3.5-turbo' }); // Default fallback
        this.apiKey = config.apiKey;
        this.modelName = config.modelName;
        this.siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        this.appName = 'AI Code Mentor';
    }

    /**
     * Check if provider is available (needs API Key)
     * @returns {boolean}
     */
    isAvailable() {
        return !!this.apiKey && this.apiKey.startsWith('sk-or-');
    }

    /**
     * Get provider name
     * @returns {string}
     */
    getName() {
        return `openrouter/${this.modelName}`;
    }

    /**
     * Build system prompt based on student phase
     * Reuses the same logic as GeminiProvider for consistency
     * @param {string} phase 
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
     * Analyze code using OpenRouter API
     * @param {Object} request 
     */
    async analyze(request) {
        if (!this.isAvailable()) {
            throw new Error('OpenRouter API Key missing or invalid');
        }

        const startTime = Date.now();
        const { code, language, phase } = request;

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
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": this.siteUrl,
                    "X-Title": this.appName,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": this.modelName,
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": userPrompt }
                    ],
                    "response_format": { "type": "json_object" } // Force JSON if supported
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const responseText = data.choices[0].message.content;

            const parsedResponse = this.parseResponse(responseText);
            const latency = Date.now() - startTime;

            return this.formatResponse(parsedResponse, {
                tokensUsed: data.usage?.total_tokens || 0,
                latency
            });

        } catch (error) {
            console.error(`[OpenRouterProvider] Error with ${this.modelName}:`, error.message);
            throw error;
        }
    }

    /**
     * Format response for consistency
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
                model: this.getName(),
                tokensUsed: metadata.tokensUsed,
                latency: metadata.latency,
                timestamp: new Date().toISOString(),
                provider: 'openrouter'
            }
        };
    }
}
