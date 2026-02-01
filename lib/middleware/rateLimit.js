import { LRUCache } from 'lru-cache'; // Necesitará instalar lru-cache si no existe, o usar Map simple para MVP sin dependencias

// Implementación simple de Token Bucket en memoria para MVP
// En producción real, usar Redis
const rateLimitCache = new Map();

const WINDOW_SIZE_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 20; // 20 requests por minuto por IP

function cleanOldEntries() {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.expiry) {
            rateLimitCache.delete(key);
        }
    }
}

// Limpieza periódica (cada 10 min)
setInterval(cleanOldEntries, 10 * 60 * 1000);

export function rateLimit(req, res) {
    // Si estamos en build time o server-side rendering interno, saltar
    if (!req) return Promise.resolve(false);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}`;
    const now = Date.now();

    const record = rateLimitCache.get(key) || { count: 0, expiry: now + WINDOW_SIZE_MS };

    // Reset si expiró la ventana
    if (now > record.expiry) {
        record.count = 0;
        record.expiry = now + WINDOW_SIZE_MS;
    }

    record.count++;
    rateLimitCache.set(key, record);

    const currentUsage = record.count;
    const remaining = Math.max(0, MAX_REQUESTS - currentUsage);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', record.expiry);

    if (currentUsage > MAX_REQUESTS) {
        return Promise.reject({
            status: 429,
            message: 'Too Many Requests'
        });
    }

    return Promise.resolve(true);
}

// Higher-order function para API Routes
export function withRateLimit(handler) {
    return async (req, res) => {
        try {
            await rateLimit(req, res);
            return handler(req, res);
        } catch (error) {
            if (error.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'Demasiadas solicitudes. Por favor intente más tarde.'
                });
            }
            throw error;
        }
    };
}
