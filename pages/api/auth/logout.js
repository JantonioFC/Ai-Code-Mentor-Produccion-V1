import { serialize } from 'cookie';
import AuthLocal from '../../../lib/auth-local';
import { logger } from '../../../lib/utils/logger';

export default async function logoutHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const refreshToken = req.cookies['ai-code-mentor-refresh'];
        if (refreshToken) {
            await AuthLocal.revokeRefreshToken(refreshToken);
        }

        // Clear both cookies
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/'
        };

        res.setHeader('Set-Cookie', [
            serialize('ai-code-mentor-auth', '', options),
            serialize('ai-code-mentor-refresh', '', options)
        ]);

        logger.info('[AUTH] Usuario cerró sesión y revocó refresh token correctamente');

        return res.status(200).json({ success: true });
    } catch (error) {
        logger.error('[AUTH] Error en logout', error);
        return res.status(500).json({ error: 'Error cerrando sesión' });
    }
}
