
import { GeminiProvider } from './GeminiProvider.js';
import { MockProvider } from './MockProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';
import { logger } from '../../utils/logger.js';

export class ProviderFactory {
    static getProvider(providerName = 'gemini', config = {}) {
        try {
            if (process.env.USE_MOCK_AI === 'true') {
                logger.info('[ProviderFactory] Forzando MockProvider via env var');
                return new MockProvider();
            }

            switch (providerName.toLowerCase()) {
                case 'gemini':
                    const gemini = new GeminiProvider(config.modelName);
                    if (gemini.isAvailable()) {
                        return gemini;
                    }
                    logger.warn('[ProviderFactory] Gemini no disponible (falta API Key). Usando MockProvider.');
                    return new MockProvider();

                case 'openrouter':
                    // Config expects: { modelName, apiKey }
                    const openRouter = new OpenRouterProvider({
                        modelName: config.modelName,
                        apiKey: config.apiKey
                    });
                    if (openRouter.isAvailable()) {
                        return openRouter;
                    }
                    console.warn('[ProviderFactory] OpenRouter key missing or invalid.');
                    return new MockProvider();

                case 'mock':
                    return new MockProvider();

                default:
                    logger.warn(`[ProviderFactory] Proveedor desconocido '${providerName}'. Usando Gemini por defecto.`);
                    const defaultProvider = new GeminiProvider(config.modelName);
                    return defaultProvider.isAvailable() ? defaultProvider : new MockProvider();
            }
        } catch (error) {
            logger.error('[ProviderFactory] Error inicializando proveedor', error);
            return new MockProvider();
        }
    }
}
