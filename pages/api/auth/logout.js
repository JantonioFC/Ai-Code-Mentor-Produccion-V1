
import { serialize } from 'cookie';
import { logger } from '../../../lib/utils/logger';

export default async function logoutHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Clear the auth cookie
        res.setHeader('Set-Cookie', serialize('ai-code-mentor-auth', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: -1,
            path: '/'
        }));

        logger.info('[AUTH] Usuario cerró sesión correctamente');

        return res.status(200).json({ success: true });
    } catch (error) {
        logger.error('[AUTH] Error en logout', error);
        return res.status(500).json({ error: 'Error cerrando sesión' });
    }
}
