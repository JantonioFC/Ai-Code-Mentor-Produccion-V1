/**
 * Endpoint simple para verificar que el servidor esté funcionando
 */

export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    path: '/api/hello'
  });
}
