/**
 * POST /api/save-template
 * Guarda un template generado+editado por el usuario en la base de datos SQLite.
 *
 * Body: { templateType, templateName, content, metadata }
 * Returns: { success, id, message }
 */

import AuthLocal from '../../lib/auth-local';
import db from '../../lib/db';

// Ensure the user_templates table exists (idempotent)
function ensureTable() {
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

    CREATE INDEX IF NOT EXISTS idx_user_templates_user
      ON user_templates(user_id);
  `);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // Auth check
    const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No autorizado: Token faltante' });
    }
    const authResult = AuthLocal.verifyToken(token);
    if (!authResult.isValid) {
        return res.status(401).json({ error: 'No autorizado: Token inválido' });
    }

    const userId = authResult.userId || authResult.user?.id || 'anonymous';

    const { templateType, templateName, content, metadata } = req.body;

    if (!templateType || !content) {
        return res.status(400).json({ error: 'templateType y content son requeridos' });
    }

    try {
        ensureTable();

        const result = db.insert('user_templates', {
            user_id: String(userId),
            template_type: templateType,
            template_name: templateName || templateType,
            content,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });

        console.log(`[save-template] Guardado template "${templateName}" (id=${result.lastInsertRowid}) para user=${userId}`);

        return res.status(200).json({
            success: true,
            id: result.lastInsertRowid,
            message: 'Template guardado correctamente en la base de datos',
        });
    } catch (error) {
        console.error('[save-template] Error:', error.message);
        return res.status(500).json({
            error: 'Error interno al guardar el template',
            details: error.message,
        });
    }
}
