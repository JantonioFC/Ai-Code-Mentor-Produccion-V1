/**
 * AI CODE MENTOR V4.1 - Clear Cache API
 * Endpoint para limpiar cache obsoleto y forzar regeneración
 */

const fs = require('fs');
const path = require('path');

import AuthLocal from '../../lib/auth-local';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;
  if (!token) {
    console.warn('[API/clear-cache] Unauthorized access attempt: No token');
    return res.status(401).json({ error: 'No autorizado: Token faltante' });
  }

  const authResult = AuthLocal.verifyToken(token);
  if (!authResult.isValid) {
    console.warn('[API/clear-cache] Unauthorized access attempt: Invalid token');
    return res.status(401).json({ error: 'No autorizado: Token inválido' });
  }

  if (authResult.role !== 'admin') {
    console.warn(`[API/clear-cache] Forbidden access attempt by user: ${authResult.email} (Role: ${authResult.role})`);
    return res.status(403).json({ error: 'Prohibido: Se requiere rol de administrador' });
  }

  try {
    const cacheDir = path.join(process.cwd(), 'data', 'lesson-cache');

    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      let deletedCount = 0;

      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(cacheDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      console.log(`🧹 Cleared ${deletedCount} cache files`);

      res.json({
        success: true,
        message: `Cache limpiado exitosamente: ${deletedCount} archivos eliminados`,
        deletedCount
      });
    } else {
      res.json({
        success: true,
        message: 'No hay cache para limpiar',
        deletedCount: 0
      });
    }

  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    res.status(500).json({
      error: 'Error limpiando cache',
      details: error.message
    });
  }
}
