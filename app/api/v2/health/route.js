import { NextResponse } from 'next/server';
import { geminiRouter } from '../../../../lib/ai/router/GeminiRouter';
import { logger } from '../../../../lib/utils/logger';

/**
 * Health Check API (Migrated to App Router - V2)
 *
 * Provee un endpoint de health check para validar que el servicio principal
 * está operativo, incluyendo estado del router IA y métricas.
 */
export async function GET(request) {
    try {
        // Inicializar router
        const availableModels = await geminiRouter.initialize();

        // Obtener estadísticas del router
        const routerStats = geminiRouter.getStats();

        // Obtener reporte de uso (últimas 24h)
        const usageReport = await logger.getDailyReport();

        // Estado general
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0-app-router',
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
        });

    } catch (error) {
        console.error('[Health Check V2] Error:', error.message);

        return NextResponse.json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
