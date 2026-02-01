
// lib/config/unifiedConfig.ts
const unifiedConfig = {
    app: {
        env: process.env.NODE_ENV || 'development',
        isDev: process.env.NODE_ENV !== 'production',
        port: process.env.PORT || 3000,
    },
    ai: {
        geminiKey: process.env.GEMINI_API_KEY || '',
    },
    db: {
        // Future DB config
    },
    security: {
        rateLimitWindow: 60 * 1000, // 1 minute
        rateLimitMax: 20,
    }
};

export default unifiedConfig;
