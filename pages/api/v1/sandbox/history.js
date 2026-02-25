// pages/api/v1/sandbox/history.js
// LOCAL-FIRST REFACTOR
// Objetivo: Guardar, recuperar y eliminar historial de generaciones usando SQLite

import { withRequiredAuth } from '../../../../utils/authMiddleware';
// import { getAuthenticatedSupabaseFromRequest } from '../../../../lib/supabaseServerAuth.js'; // REMOVED
import db from '../../../../lib/db';
import crypto from 'crypto';

/**
 * Genera un título simple
 */
function generateTitle(content) {
  if (!content || typeof content !== 'string') return 'Sin título';
  const cleanContent = content.trim();
  const words = cleanContent.split(/\s+/);
  const wordCount = Math.min(7, words.length);
  const titleWords = words.slice(0, wordCount);
  let title = titleWords.join(' ');
  if (title.length > 97) title = title.substring(0, 97) + '...';
  else if (words.length > wordCount) title = title + '...';
  return title;
}

/**
 * API Handler Local-First para Sandbox History
 */
async function sandboxHistoryHandler(req, res) {
  const { method } = req;
  const { isAuthenticated, user, userId } = req.authContext;

  console.log(`[SANDBOX-HISTORY] ${method} request from user: ${user.email} (Local DB)`);

  try {
    // ========================================
    // POST: Guardar nueva generación
    // ========================================
    if (method === 'POST') {
      const { customContent, generatedLesson, metadata } = req.body;

      if (!customContent || typeof customContent !== 'string') {
        return res.status(400).json({ error: 'customContent requerido' });
      }

      if (!generatedLesson || typeof generatedLesson !== 'object') {
        return res.status(400).json({ error: 'generatedLesson requerido' });
      }

      const title = generateTitle(customContent);
      console.log(`[SANDBOX-HISTORY] Guardando: "${title}"`);

      // SQLite Insert
      const id = crypto.randomUUID();
      db.insert('sandbox_generations', {
        id,
        user_id: userId,
        custom_content: customContent,
        title,
        generated_lesson: JSON.stringify(generatedLesson), // Store as text
        metadata: JSON.stringify(metadata || {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      console.log(`[SANDBOX-HISTORY] Generación guardada: ${id}`);
      return res.status(201).json({
        success: true,
        data: {
          id,
          title,
          created_at: new Date().toISOString()
        },
        id, // Legacy compat
        title // Legacy compat
      });
    }

    // ========================================
    // GET: Obtener historial
    // ========================================
    if (method === 'GET') {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      console.log(`[SANDBOX-HISTORY] Fetching history (Limit: ${limit})`);

      // SQLite Query
      const rows = db.query(
        `SELECT id, title, custom_content, generated_lesson, created_at, updated_at 
           FROM sandbox_generations 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const countResult = db.get(`SELECT count(*) as total FROM sandbox_generations WHERE user_id = ?`, [userId]);
      const total = countResult.total;

      // Parse JSON fields
      const generations = rows.map(r => ({
        ...r,
        generated_lesson: JSON.parse(r.generated_lesson),
        // metadata not fetched in select above to save bandwidth, add if needed
      }));

      return res.status(200).json({
        success: true,
        data: {
          generations,
          count: generations.length,
          total,
          hasMore: total > (offset + limit)
        }
      });
    }

    // ========================================
    // DELETE: Eliminar generación
    // ========================================
    if (method === 'DELETE') {
      const generationId = req.query.id;
      if (!generationId) return res.status(400).json({ error: 'ID requerido' });

      console.log(`[SANDBOX-HISTORY] Eliminando: ${generationId}`);

      db.run('DELETE FROM sandbox_generations WHERE id = ? AND user_id = ?', [generationId, userId]);

      return res.status(200).json({ success: true, message: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('[SANDBOX-HISTORY] Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export default withRequiredAuth(sandboxHistoryHandler);
