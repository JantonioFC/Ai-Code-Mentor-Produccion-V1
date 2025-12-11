// next.config.cjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Se preserva tu configuración existente para la API Key.
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
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

module.exports = withBundleAnalyzer(nextConfig);
