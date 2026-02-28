/**
 * GET /api/entries/counts
 * Devuelve conteos reales de evidencias del usuario:
 * - Templates guardados en user_templates (por tipo)
 * - Lecciones generadas en generated_content
 * Usado por ProjectTrackingContext para mostrar evidencias reales en el portfolio.
 */

import AuthLocal from '../../../lib/auth-local';
import db from '../../../lib/db';

function ensureUserTemplatesTable() {
    try {
        db.exec(`
      CREATE TABLE IF NOT EXISTS user_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        template_type TEXT NOT NULL,
        template_name TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_templates_user ON user_templates(user_id);
    `);
    } catch (e) {
        // Table may already exist — safe to ignore
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // Auth check
    const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const authResult = AuthLocal.verifyToken(token);
    if (!authResult.isValid) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    const userId = authResult.userId || authResult.user?.id || 'anonymous';

    try {
        ensureUserTemplatesTable();

        // Contar templates guardados, agrupados por tipo
        const templateRows = db.query(
            `SELECT template_type, COUNT(*) as count
       FROM user_templates
       WHERE user_id = ?
       GROUP BY template_type`,
            [String(userId)]
        );

        // Contar lecciones generadas en generated_content
        let generatedCount = 0;
        try {
            const generatedRows = db.query(
                `SELECT COUNT(*) as count FROM generated_content WHERE user_id = ?`,
                [String(userId)]
            );
            generatedCount = generatedRows[0]?.count || 0;
        } catch (e) {
            // generated_content table might not exist yet
            console.warn('[entries/counts] generated_content table not found:', e.message);
        }

        // Construir entryCounts con los tipos reales guardados
        const entryCounts = {};
        let totalTemplates = 0;
        for (const row of templateRows) {
            entryCounts[row.template_type] = row.count;
            totalTemplates += row.count;
        }

        // Agregar lecciones generadas como tipo propio
        if (generatedCount > 0) {
            entryCounts['generated_lesson'] = generatedCount;
        }

        const totalEntries = totalTemplates + generatedCount;

        console.log(`[entries/counts] user=${userId} totalEntries=${totalEntries}`, entryCounts);

        return res.status(200).json({
            success: true,
            entryCounts,
            totalEntries,
        });
    } catch (error) {
        console.error('[entries/counts] Error:', error.message);
        return res.status(500).json({
            error: 'Error interno al obtener conteos',
            details: error.message,
        });
    }
}
