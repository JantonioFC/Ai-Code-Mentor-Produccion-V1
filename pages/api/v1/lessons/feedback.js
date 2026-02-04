import { z } from 'zod';
import db from '../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { createApiHandler, sendSuccess, sendError } from '../../../../lib/api/APIWrapper';
import { withValidation } from '../../../../lib/api/validate';
import AuthLocal from '../../../../lib/auth-local';
import rateLimit from '../../../../lib/rate-limit'; // Anti-Abuse

// Esquema Zod para Feedback (userId removido, se obtiene de la sesión)
const feedbackSchema = z.object({
    lessonId: z.string().min(1),
    sessionId: z.string().optional().nullable(),
    rating: z.number().int().min(1).max(5),
    wasHelpful: z.boolean().optional().default(false),
    difficulty: z.enum(['TOO_EASY', 'JUST_RIGHT', 'TOO_HARD']).optional().nullable(),
    comment: z.string().max(500).optional().nullable()
});

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await rateLimit(req, res); // 5 request / 15 min
    } catch (e) {
        return; // Response handled by middleware
    }

    // 1. Verify Authentication
    const token = req.cookies['ai-code-mentor-auth'] || req.headers.authorization;
    const auth = AuthLocal.verifyToken(token);

    if (!auth.isValid) {
        return sendError(res, 'Authentication required', 401);
    }

    const userId = auth.userId;
    const { lessonId, sessionId, rating, wasHelpful, difficulty, comment } = req.body;

    // Insertar feedback
    const feedbackId = uuidv4();

    // NOTA: Idealmente esto iría en un FeedbackService, pero seguimos lógica existente
    db.run(
        `INSERT INTO lesson_feedback (id, user_id, lesson_id, session_id, rating, was_helpful, difficulty, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [feedbackId, userId, lessonId, sessionId || null, rating, wasHelpful ? 1 : 0, difficulty || null, comment || null]
    );

    // Stats
    const stats = db.get(
        `SELECT 
            AVG(rating) as avgRating, 
            COUNT(*) as totalReviews,
            SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpfulCount
            FROM lesson_feedback WHERE lesson_id = ?`,
        [lessonId]
    );

    return sendSuccess(res, {
        feedbackId,
        lessonStats: {
            averageRating: parseFloat(stats.avgRating?.toFixed(2)) || rating,
            totalReviews: stats.totalReviews || 1,
            helpfulPercentage: stats.totalReviews
                ? Math.round((stats.helpfulCount / stats.totalReviews) * 100)
                : (wasHelpful ? 100 : 0)
        }
    }, { status: 201 });
}

export default createApiHandler(withValidation(feedbackSchema, handler));
