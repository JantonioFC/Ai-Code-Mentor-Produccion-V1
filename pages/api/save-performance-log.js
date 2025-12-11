/**
 * API ENDPOINT - Guardar Performance Log
 * 
 * Recibe datos del Performance Monitor y los guarda en disco.
 * 
 * POST /api/save-performance-log
 * Body: { report: {...} }
 * 
 * @author Mentor Coder
 * @version 1.0
 */

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { report } = req.body;

    if (!report || !report.metadata) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Directorio de logs
    const logsDir = path.join(process.cwd(), 'performance-logs');
    
    // Crear directorio si no existe
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Generar nombre de archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const page = report.metadata.page.replace(/\//g, '-') || 'root';
    const sessionId = report.metadata.sessionId || Date.now();
    const filename = `perf-${page}-${timestamp}-${sessionId}.json`;
    const filepath = path.join(logsDir, filename);

    // Formatear reporte con metadata adicional
    const fullReport = {
      ...report,
      savedAt: new Date().toISOString(),
      server: 'Next.js Development Server',
      autoSaved: true
    };

    // Guardar archivo
    fs.writeFileSync(filepath, JSON.stringify(fullReport, null, 2), 'utf8');

    console.log(`✅ Performance log guardado: ${filename}`);

    return res.status(200).json({ 
      success: true, 
      filename,
      path: filepath
    });

  } catch (error) {
    console.error('❌ Error guardando performance log:', error);
    return res.status(500).json({ 
      error: 'Failed to save log',
      message: error.message 
    });
  }
}
