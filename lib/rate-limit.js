import { RateLimiterMemory } from 'rate-limiter-flexible';

// 1. Perfil Estricto: 5 intentos / 15 min (Para Login/Auth)
const authLimiter = new RateLimiterMemory({
    points: 5,
    duration: 15 * 60,
});

// 2. Perfil Estándar: 60 peticiones / 1 min (Para API Usage/Telemetría)
const apiLimiter = new RateLimiterMemory({
    points: 60,
    duration: 60,
});

// 3. Perfil IA: 10 peticiones / 5 min (Para endpoints de Gemini/AI - recursos costosos)
const aiLimiter = new RateLimiterMemory({
    points: 10,
    duration: 5 * 60, // 5 minutos
});

/**
 * Middleware de Rate Limiting para Next.js API Routes
 * @param {string} profile - 'auth', 'api', o 'ai'
 */
export default async function rateLimit(req, res, profile = 'auth') {
    // Select limiter based on profile
    let limiter, errorMessage;

    switch (profile) {
        case 'api':
            limiter = apiLimiter;
            errorMessage = 'Límite de peticiones de telemetría excedido.';
            break;
        case 'ai':
            limiter = aiLimiter;
            errorMessage = 'Límite de generación IA excedido. Por favor espera unos minutos.';
            break;
        default: // 'auth'
            limiter = authLimiter;
            errorMessage = 'Demasiados intentos de inicio de sesión. Por favor intente más tarde.';
    }

    try {
        // Skip rate limiting in E2E Test Mode (server-side only env var)
        if (process.env.E2E_TEST_MODE === 'true') {
            return;
        }

        const ip = req.socket?.remoteAddress || 'unknown';
        await limiter.consume(ip);
    } catch (rejRes) {
        res.status(429).json({ error: errorMessage });
        throw new Error('Rate limit exceeded');
    }
}
