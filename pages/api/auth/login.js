import AuthLocal from '../../../lib/auth-local';
import { serialize } from 'cookie';
import rateLimit from '../../../lib/rate-limit'; // Security: Rate Limiting

export default async function handler(req, res) {
    // 1. Rate Limiting Check
    try {
        await rateLimit(req, res);
    } catch (e) {
        return; // Response already handled by rateLimit
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    try {
        const result = await AuthLocal.loginUser(email, password);

        if (result.error) {
            return res.status(401).json(result);
        }

        // Set JWT Cookie
        const cookie = serialize('ai-code-mentor-auth', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: 'strict',
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);

        return res.status(200).json({
            user: result.user,
            session: {
                access_token: result.token,
                token_type: 'bearer',
                user: result.user
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
