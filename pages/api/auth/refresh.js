import AuthLocal from '../../../lib/auth-local';
import { serialize } from 'cookie';
import rateLimit from '../../../lib/rate-limit';

export default async function handler(req, res) {
    // 1. Rate Limiting Check
    try {
        await rateLimit(req, res, 'auth');
    } catch (e) {
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security: Get refresh token from cookie
    const refreshToken = req.cookies['ai-code-mentor-refresh'];

    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
        const result = await AuthLocal.refreshAccessToken(refreshToken);

        if (result.error) {
            return res.status(401).json(result);
        }

        // Set New Access Token Cookie
        const accessTokenCookie = serialize('ai-code-mentor-auth', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 15, // 15 minutes
            sameSite: 'strict',
            path: '/'
        });

        res.setHeader('Set-Cookie', accessTokenCookie);

        return res.status(200).json({
            success: true,
            access_token: result.token
        });

    } catch (error) {
        console.error('Refresh error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
