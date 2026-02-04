import db from '../../../lib/db';
// import { getSession } from '../../../lib/auth/session'; // Removed: Legacy

/**
 * POST /api/usage/record
 * Records an API call for tracking purposes.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Verify Authentication
    // Using simplified token verification or checking headers 
    // For internal calls from server-side, we might trust if signed, 
    // but for client-side reporting (less secure but needed for now), we use session.

    // Note: Ideally usage should be tracked by the backend service PROXYING the call,
    // not by the client reporting it. 
    // However, given the current architecture where client calls serverless functions,
    // we can either:
    // A) Call db.insert directly in those serverless functions (Authentication, Sandbox, etc.) - BETTER
    // B) Have client report it - WORSE

    // Refactoring Plan: We will implement this endpoint but PRIMARY usage
    // should be direct DB calls from the actual API endpoints (Sandbox, etc.)
    // This endpoint is for client-side logic that might need to sync or report specific events.

    // Let's implement generic recording:
    const user = await getUserFromRequest(req);

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { model, operation, success, responseTime, tokensIn, tokensOut } = req.body;

    if (!model) {
        return res.status(400).json({ error: 'Model is required' });
    }

    try {
        const result = db.insert('api_usage_logs', {
            user_id: user.id,
            model,
            operation: operation || 'unknown',
            success: success ? 1 : 0,
            response_time_ms: responseTime || 0,
            tokens_in: tokensIn || 0,
            tokens_out: tokensOut || 0,
            ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            user_agent: req.headers['user-agent']
        });

        return res.status(200).json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('Error recording API usage:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Helper to get user from session (Adapting to your custom auth)
import AuthLocal from '../../../lib/auth-local';
import { parse } from 'cookie';

async function getUserFromRequest(req) {
    try {
        // 1. Check Bearer Token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = AuthLocal.verifyToken(token);
            if (payload) return payload;
        }

        // 2. Check Cookie
        if (req.headers.cookie) {
            const cookies = parse(req.headers.cookie);
            if (cookies['ai-code-mentor-auth']) {
                const payload = AuthLocal.verifyToken(cookies['ai-code-mentor-auth']);
                if (payload) return payload;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}
