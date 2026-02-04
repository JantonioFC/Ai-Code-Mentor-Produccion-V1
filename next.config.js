// next.config.cjs
// next.config.cjs
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  console.warn('⚠️ @next/bundle-analyzer not installed, skipping analysis...');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance: Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Performance: Enable compression
  // Performance: Enable compression
  compress: true,

  // Docker Optimization
  output: 'standalone',

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
              connect-src 'self' https://*.google-analytics.com https://*.google.com https://*.facebook.com https://*.doubleclick.net;
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

// Inyectado por integración Sentry
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses all logs
    silent: true,
    org: "ai-code-mentor",
    project: "javascript-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
