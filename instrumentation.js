// Sentry instrumentation for Next.js 15+
// This file is loaded before any other code in the application

export async function register() {
    try {
        if (process.env.NEXT_RUNTIME === 'nodejs') {
            await import('./sentry.server.config');
        }

        if (process.env.NEXT_RUNTIME === 'edge') {
            await import('./sentry.edge.config');
        }
    } catch (e) {
        // Sentry configs may fail to load if DSN is not configured
        // and Sentry webpack plugin was not applied during build
        console.log('[Sentry] Instrumentation skipped:', e.code || e.message);
    }
}

// onRequestError is called when an error occurs during request handling
export function onRequestError(error, request, context) {
    try {
        const Sentry = require('@sentry/nextjs');

        if (Sentry.isInitialized && !Sentry.isInitialized()) {
            return;
        }

        Sentry.captureException(error, {
            extra: {
                url: request?.url,
                method: request?.method,
                routerKind: context?.routerKind,
                routePath: context?.routePath,
            },
        });
    } catch (e) {
        // Sentry not available or not initialized — silently skip
    }
}
