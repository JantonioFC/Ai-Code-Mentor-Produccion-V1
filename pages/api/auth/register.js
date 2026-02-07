import AuthLocal from '../../../lib/auth-local';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, display_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    try {
        const result = await AuthLocal.registerUser(email, password, display_name);

        if (result.error) {
            return res.status(400).json(result);
        }

        // Set Cookies (Access + Refresh) - matching login.js
        const accessTokenCookie = serialize('ai-code-mentor-auth', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 15, // 15 minutes
            sameSite: 'strict',
            path: '/'
        });

        const refreshTokenCookie = serialize('ai-code-mentor-refresh', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            sameSite: 'strict',
            path: '/'
        });

        res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);

        return res.status(200).json({
            user: result.user,
            session: {
                access_token: result.token,
                refresh_token: result.refreshToken,
                token_type: 'bearer',
                user: result.user
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
