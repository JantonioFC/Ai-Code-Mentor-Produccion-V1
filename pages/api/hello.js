/**
 * Endpoint simple para verificar que el servidor esté funcionando
 */

export default function handler(req, res) {
  console.warn('[DEPRECATION] pages/api/hello.js is deprecated. Please use /api/v2/hello instead.');
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    path: '/api/hello'
  });
}
