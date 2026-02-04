import { RateLimiterMemory } from 'rate-limiter-flexible';

// Configuración: 5 intentos por 15 minutos por IP
const rateLimiter = new RateLimiterMemory({
    points: 5, // 5 puntos
    duration: 15 * 60, // Por 15 minutos
});

/**
 * Middleware de Rate Limiting para Next.js API Routes
 */
export default async function rateLimit(req, res) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        await rateLimiter.consume(ip);
    } catch (rejRes) {
        res.status(429).json({ error: 'Demasiados intentos de inicio de sesión. Por favor intente más tarde.' });
        throw new Error('Rate limit exceeded');
    }
}
