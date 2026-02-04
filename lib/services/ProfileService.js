
import db from '../db';
import { logger } from '../utils/logger';

export class ProfileService {
    /**
     * Obtener perfil completo de usuario
     */
    async getProfile(userId, email) {
        try {
            let profile = db.findOne('user_profiles', { id: userId });

            if (!profile) {
                logger.info(`[ProfileService] Creando perfil inicial para ${email}...`, { email });
                profile = this.createInitialProfile(userId, email);
            }

            const stats = await this.getProgressStats(userId);

            return {
                ...profile,
                authData: {
                    email: email,
                    emailVerified: true,
                    lastSignIn: new Date().toISOString(),
                    createdAt: profile.created_at
                },
                stats
            };
        } catch (error) {
            logger.error('[ProfileService] Error obteniendo perfil', error);
            throw error;
        }
    }

    /**
     * Crear perfil inicial
     */
    createInitialProfile(userId, email) {
        const newProfile = {
            id: userId,
            email: email,
            display_name: email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.insert('user_profiles', newProfile);
        return newProfile;
    }

    /**
     * Actualizar perfil
     */
    async updateProfile(userId, updates) {
        try {
            const allowedFields = ['display_name', 'bio', 'learning_goals', 'preferences'];
            const cleanUpdates = {};

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    cleanUpdates[key] = typeof value === 'object' ? JSON.stringify(value) : value;
                }
            }

            cleanUpdates.updated_at = new Date().toISOString();

            db.update('user_profiles', cleanUpdates, { id: userId });
            return db.findOne('user_profiles', { id: userId });

        } catch (error) {
            logger.error('[ProfileService] Error actualizando perfil', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de progreso
     */
    async getProgressStats(userId) {
        try {
            const quizStats = db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
                FROM quiz_attempts
                WHERE user_id = ?
            `, [userId]);

            const lessonsCount = db.get(`
                SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = ? AND completed = 1
            `, [userId]).count;

            const exercisesCount = db.get(`
                SELECT COUNT(*) as count FROM user_exercise_progress WHERE user_id = ? AND completed = 1
            `, [userId]).count;

            return {
                quiz: {
                    total: quizStats.total || 0,
                    correct: quizStats.correct || 0,
                    accuracy: quizStats.total > 0 ? Math.round((quizStats.correct / quizStats.total) * 100) : 0
                },
                progress: {
                    lessonsCompleted: lessonsCount,
                    exercisesCompleted: exercisesCount,
                    totalActivities: (quizStats.total || 0) + lessonsCount + exercisesCount
                },
                streak: 0,
                lastActivity: new Date().toISOString(),
                joinedDate: new Date().toISOString()
            };

        } catch (error) {
            logger.error('[ProfileService] Error calculando estadísticas', error);
            return {
                quiz: { total: 0, correct: 0, accuracy: 0 },
                progress: { lessonsCompleted: 0, exercisesCompleted: 0, totalActivities: 0 },
                streak: 0,
                lastActivity: null,
                joinedDate: null
            };
        }
    }

    /**
     * Eliminar usuario permanentemente (GDPR)
     */
    deleteUser(userId) {
        try {
            logger.warn(`[ProfileService] Eliminando usuario ${userId} (GDPR Request)`);

            // Usar transacción para borrado atómico
            db.transaction(() => {
                // Borrar perfil (cascada a progress, stats, etc)
                db.run('DELETE FROM user_profiles WHERE id = ?', [userId]);

                // Borrar registro de auth (si existe tabla users separada)
                try {
                    db.run('DELETE FROM users WHERE id = ?', [userId]);
                } catch (e) {
                    // Ignorar si tabla users no existe o ya fue borrado
                }
            })();

            return true;
        } catch (error) {
            logger.error('[ProfileService] Error eliminando usuario', error);
            throw error;
        }
    }
}

export const profileService = new ProfileService();
