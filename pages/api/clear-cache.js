/**
 * AI CODE MENTOR V4.1 - Clear Cache API
 * Endpoint para limpiar cache obsoleto y forzar regeneración
 */

const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
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
