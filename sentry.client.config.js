// Sentry Client Configuration
// Note: Primary client init has been migrated to instrumentation-client.ts
// This file is kept for backwards compatibility with pages/_app.js import

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: process.env.NODE_ENV === 'development',
        ignoreErrors: [
            'Network Error',
            'Failed to fetch',
            'Load failed',
            /^chrome-extension:\/\//,
            /^moz-extension:\/\//,
        ],
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
    });
}
