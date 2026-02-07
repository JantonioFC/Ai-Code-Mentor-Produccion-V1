// Sentry Edge Configuration
// This file configures Sentry for Edge runtime (middleware, etc.)

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Environment tracking
        environment: process.env.NODE_ENV,

        // Edge runtime has limited capabilities
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

        // Enable debug in development
        debug: process.env.NODE_ENV === 'development',
    });

    console.log('[Sentry] Edge runtime initialized');
}
