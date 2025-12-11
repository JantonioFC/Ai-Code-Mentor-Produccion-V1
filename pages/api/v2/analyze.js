/**
 * API ROUTE - Análisis de Código con Router IA Resiliente
 * 
 * Usa el nuevo GeminiRouter con:
 * - Fallback automático entre modelos (Pro → Flash)
 * - Auto-discovery de modelos disponibles
 * - Cache de respuestas
 * - Logging y manejo de errores robusto
 * 
 * @version 2.0.0 - Con Router IA
 */

import { geminiRouter } from '../../../lib/ai/router/GeminiRouter';
import { promptFactory } from '../../../lib/prompts/factory/PromptFactory';
import { getUserFriendlyMessage } from '../../../lib/utils/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const {
            code,
            language = 'javascript',
            phase = 'fase-1',
            analysisType = 'general'
        } = req.body;

        // Validaciones
        if (!code || !code.trim()) {
            return res.status(400).json({ error: 'Código requerido' });
        }

        if (code.length > 50000) {
            return res.status(400).json({ error: 'Código muy largo (máx 50,000 caracteres)' });
        }

        console.log(`[API v2] Análisis resiliente: ${language}, ${phase}, ${analysisType}`);

        // Inicializar router si es necesario
        await geminiRouter.initialize();

        // Construir prompts personalizados según la fase
        const promptData = promptFactory.buildPrompt({
            phase,
            language,
            analysisType,
            code
        });

        // Ejecutar análisis con fallback automático
        const result = await geminiRouter.analyze({
            code,
            language,
            phase,
            analysisType,
            systemPrompt: promptData.system,
            userPrompt: promptData.user
        });

        // Respuesta exitosa
        res.json({
            success: true,
            analysis: result.analysis,
            metadata: {
                ...result.metadata,
                phase,
                language,
                analysisType,
                routerVersion: '2.0.0'
            }
        });

    } catch (error) {
        console.error('[API v2] Error en análisis:', error.message);

        // Mensaje amigable para el usuario
        const userMessage = getUserFriendlyMessage(error);

        res.status(500).json({
            success: false,
            error: userMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
