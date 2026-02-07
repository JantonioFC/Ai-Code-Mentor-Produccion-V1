// Sentry Server Configuration
// This file configures Sentry for server-side (Node.js runtime)

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Environment and release tracking
        environment: process.env.NODE_ENV,

        // Server-side performance sampling
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Enable debug in development
        debug: process.env.NODE_ENV === 'development',

        // Spotlight for local development
        spotlight: process.env.NODE_ENV === 'development',

        // Filter sensitive data
        beforeSend(event) {
            // Remove any sensitive headers
            if (event.request?.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }
            return event;
        },
    });

    console.log('[Sentry] Server initialized with DSN');
} else {
    console.log('[Sentry] Server disabled - no DSN configured');
}
