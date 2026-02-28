// next.config.cjs
// next.config.cjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // FIX: Optimize barrel imports for better HMR (from react-best-practices skill)
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-icons',
      '@heroicons/react',
      'date-fns',
      'lodash',
    ],
  },

  // Turbopack: Empty config to allow custom webpack config in Next.js 16
  turbopack: {},

  // Performance: Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Performance: Enable compression
  // Performance: Enable compression
  compress: true,

  // Docker Optimization (Disabled for Local Dev)
  // output: 'standalone',

  env: {
    // SECURITY: API Keys should NOT be inlined here to avoid leaking to client bundle.
    // They are accessed via process.env on the server side securely.
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // Policy:
            // - default-src 'self': Only allow same-origin by default
            // - script-src: Allow self, unsafe-eval (for Dev/Next.js), unsafe-inline (Next.js scripts), Google/Meta/Vercel Analytics
            // - style-src: Allow self, unsafe-inline (Tailwind/CSS-in-JS)
            // - img-src: Allow self, data URIs, and external avatars (GitHub, Google, etc.) and Analytics pixels
            // - connect-src: Allow self and Analytics endpoints
            value: `
              default-src 'self'; 
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.google.com https://*.googletagmanager.com https://connect.facebook.net https://va.vercel-scripts.com; 
              style-src 'self' 'unsafe-inline'; 
              img-src 'self' data: https:; 
              font-src 'self' data:;
              connect-src 'self' https://*.google-analytics.com https://*.google.com https://*.facebook.com https://*.doubleclick.net https://*.ingest.sentry.io https://*.sentry.io;
              frame-src 'self' https://*.google.com;
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
      // Performance: Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // AÑADIMOS la nueva directiva para Webpack aquí.
  webpack: (config, { isServer }) => {
    // Esta lógica se ejecuta durante la compilación.
    // La variable 'isServer' nos dice si estamos compilando para el servidor o para el cliente (navegador).

    // Si NO estamos compilando para el servidor (es decir, es para el cliente)...
    if (!isServer) {
      // ...le decimos a Webpack que cuando encuentre una importación de 'better-sqlite3',
      // la ignore y la reemplace con 'false', evitando el error.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
      };
    }

    // Devolvemos la configuración modificada para que Next.js la utilice.
    return config;
  },
};

// Sentry integration for Next.js 15
const { withSentryConfig } = require('@sentry/nextjs');

const sentryWebpackPluginOptions = {
  // Suppress Sentry webpack plugin logs
  silent: true,

  // Upload source maps for better stack traces
  hideSourceMaps: true,

  // Disable Sentry telemetry
  disableLogger: true,

  // For Next.js 15: Use instrumentation hook instead of auto-wrapping
  autoInstrumentServerFunctions: false,
  autoInstrumentAppDirectory: false,

  // Tunnel route to avoid ad blockers
  tunnelRoute: "/monitoring",
};

// Export with Sentry wrapper (only if DSN is configured)
const hasSentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (hasSentryDSN) {
  module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions);
} else {
  // No DSN configured - export without Sentry
  console.log('[Sentry] Disabled - no NEXT_PUBLIC_SENTRY_DSN configured');
  module.exports = withBundleAnalyzer(nextConfig);
}

