import { createApiHandler, sendSuccess, sendError } from '../../../../lib/api/APIWrapper';
import AuthLocal from '../../../../lib/auth-local';
import exportService from '../../../../lib/services/exportService';
import { getReviewDetails } from '../../../../lib/services/irp/reviewService';

/**
 * Endpoint para exportar una revisión a Markdown
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Verify Authentication
    const token = req.cookies['ai-code-mentor-auth'] || req.headers.authorization;
    const auth = AuthLocal.verifyToken(token);

    if (!auth.isValid) {
        return sendError(res, 'Authentication required', 401);
    }

    const { id: reviewId } = req.query;

    if (!reviewId) {
        return sendError(res, 'Review ID is required', 400);
    }

    try {
        // 2. Fetch Review Details
        const review = await getReviewDetails(reviewId);

        if (!review) {
            return sendError(res, 'Review not found', 404);
        }

        // 3. Check ownership
        if (review.user_id !== auth.userId && auth.role !== 'admin') {
            return sendError(res, 'Unauthorized to export this review', 403);
        }

        // 4. Generate Markdown
        const markdown = exportService.convertToMarkdown(review);

        // 5. Send as downloadable file
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="AI-Code-Mentor-Review-${reviewId}.md"`);

        return res.status(200).send(markdown);
    } catch (error) {
        console.error('❌ [EXPORT-API] Error:', error);
        return sendError(res, 'Internal server error', 500);
    }
}

export default createApiHandler(handler);
