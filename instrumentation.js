// Sentry instrumentation for Next.js 15+
// This file is loaded before any other code in the application

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Server-side Sentry initialization
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        // Edge runtime Sentry initialization
        await import('./sentry.edge.config');
    }
}

// onRequestError is called when an error occurs during request handling
export function onRequestError(error, request, context) {
    // Import Sentry at runtime to avoid issues with the instrumentation hook
    const Sentry = require('@sentry/nextjs');

    Sentry.captureException(error, {
        extra: {
            url: request?.url,
            method: request?.method,
            routerKind: context?.routerKind,
            routePath: context?.routePath,
        },
    });
}
