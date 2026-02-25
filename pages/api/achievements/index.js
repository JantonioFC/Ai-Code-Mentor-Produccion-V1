import db from '../../../lib/db';
import AuthLocal from '../../../lib/auth-local';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // 1. Verificar Autenticación usando AuthLocal
        // NOTA: AuthLocal espera el token crudo, sin "Bearer " si viene de cookie,
        // pero verifyToken maneja "Bearer " internsmente.
        const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const authResult = AuthLocal.verifyToken(token);

        if (!authResult.isValid) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        const userId = authResult.userId;

        // 2. Obtener Logros Desbloqueados
        // Se une con la tabla achievements para obtener detalles
        const unlockedAchievements = db.query(`
      SELECT 
        a.id, 
        a.name, 
        a.description, 
        a.icon, 
        ua.unlocked_at as unlockedAt
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `, [userId]);

        // 3. Calcular Metadatos (Progreso)
        const totalRow = db.get(`SELECT COUNT(*) as count FROM achievements`);
        const totalAchievements = totalRow ? totalRow.count : 0;

        const unlockedCount = unlockedAchievements.length;
        const completionPercentage = totalAchievements > 0
            ? Math.round((unlockedCount / totalAchievements) * 100)
            : 0;

        return res.status(200).json({
            success: true,
            achievements: unlockedAchievements,
            metadata: {
                totalAchievementsAvailable: totalAchievements,
                unlockedCount: unlockedCount,
                completionPercentage: completionPercentage
            }
        });

    } catch (error) {
        console.error('[API/ACHIEVEMENTS] Error fetching achievements:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
