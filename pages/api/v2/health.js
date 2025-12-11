/**
 * API ROUTE - Health Check del Sistema IA
 * 
 * Verifica el estado del router IA, modelos disponibles,
 * y proporciona métricas de uso.
 * 
 * @version 1.0.0
 */

import { geminiRouter } from '../../../lib/ai/router/GeminiRouter';
import { modelDiscovery } from '../../../lib/ai/discovery/ModelDiscovery';
import { logger } from '../../../lib/utils/logger';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        // Inicializar router
        const availableModels = await geminiRouter.initialize();

        // Obtener estadísticas del router
        const routerStats = geminiRouter.getStats();

        // Obtener reporte de uso (últimas 24h)
        const usageReport = await logger.getDailyReport();

        // Estado general
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            router: {
                initialized: true,
                ...routerStats
            },
            models: {
                available: availableModels.length,
                list: availableModels.map(m => ({
                    name: m.name,
                    displayName: m.displayName,
                    priority: m.priority
                }))
            },
            usage: usageReport,
            geminiApiConfigured: !!process.env.GEMINI_API_KEY
        };

        res.json(health);

    } catch (error) {
        console.error('[Health Check] Error:', error.message);

        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
