import db from '../../../lib/db';
import AuthLocal from '../../../lib/auth-local';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // 1. Verificar Autenticación
        const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const authResult = AuthLocal.verifyToken(token);

        if (!authResult.isValid) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        const userId = authResult.userId;
        let newUnlocks = 0;

        // 2. Obtener todos los logros y los ya desbloqueados
        const allAchievements = db.query(`SELECT * FROM achievements`);
        const userUnlocked = db.query(`SELECT achievement_id FROM user_achievements WHERE user_id = ?`, [userId]);
        const unlockedIds = new Set(userUnlocked.map(ua => ua.achievement_id));

        // 3. Obtener métricas del usuario para evaluar criterios
        // (Ejemplo: lecciones completadas, semanas, etc)
        const completedLessonsCount = db.get(`SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = ? AND completed = 1`, [userId])?.count || 0;
        const profile = db.findOne('user_profiles', { id: userId });

        // Calcular semanas completadas (simplificado para este ejemplo)
        // Se podría contar registros en est_progress o curriculum_progress
        const completedWeeksCount = db.get(`SELECT COUNT(*) as count FROM curriculum_progress WHERE user_id = ? AND week_id IS NOT NULL AND completed = 1`, [userId])?.count || 0;

        // 4. Evaluar cada logro no desbloqueado
        db.transaction(() => {
            for (const achievement of allAchievements) {
                if (unlockedIds.has(achievement.id)) continue;

                let criteria;
                try {
                    criteria = JSON.parse(achievement.criteria);
                } catch (e) {
                    console.warn(`[API/ACHIEVEMENTS] Invalid JSON criteria for achievement ${achievement.id}`);
                    continue;
                }

                let unlocked = false;

                switch (criteria.type) {
                    case 'COMPLETE_WEEKS':
                        if (completedWeeksCount >= criteria.value) unlocked = true;
                        break;
                    case 'COMPLETE_LESSONS':
                        // Si el criterio fuera por lecciones (no está en seed data pero por si acaso)
                        if (completedLessonsCount >= criteria.value) unlocked = true;
                        break;
                    case 'PROGRESS_PERCENTAGE':
                        // TODO: Calcular porcentaje real del curso
                        // Por ahora mockeamos si completó al menos 1 semana como 10%
                        const currentProgress = completedWeeksCount * 5; // Ejemplo
                        if (currentProgress >= criteria.value) unlocked = true;
                        break;
                    case 'COMPLETE_PHASE':
                        // TODO: Verificar fase
                        break;
                    case 'PROFILE_COMPLETE':
                        if (profile && profile.bio && profile.learning_goals) unlocked = true;
                        break;
                }

                if (unlocked) {
                    console.log(`[API/ACHIEVEMENTS] 🏆 Unlocking ${achievement.name} for user ${userId}`);
                    db.insert('user_achievements', {
                        id: uuidv4(),
                        user_id: userId,
                        achievement_id: achievement.id,
                        unlocked_at: new Date().toISOString()
                    });
                    newUnlocks++;
                }
            }
        })();

        return res.status(200).json({
            success: true,
            summary: {
                hasNewAchievements: newUnlocks > 0,
                newlyUnlocked: newUnlocks
            }
        });

    } catch (error) {
        console.error('[API/ACHIEVEMENTS] Error checking achievements:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
