// Sentry Client Configuration
// This file configures Sentry for the browser/client-side

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Environment and release tracking
        environment: process.env.NODE_ENV,

        // Adjust sample rates in production
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Enable debug in development
        debug: process.env.NODE_ENV === 'development',

        // Filter out known non-critical errors
        ignoreErrors: [
            // Network errors that are usually transient
            'Network Error',
            'Failed to fetch',
            'Load failed',
            // Common browser extension errors
            /^chrome-extension:\/\//,
            /^moz-extension:\/\//,
        ],

        // Disable session replay (can be enabled later if needed)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
    });

    console.log('[Sentry] Client initialized with DSN');
} else {
    console.log('[Sentry] Client disabled - no DSN configured');
}
