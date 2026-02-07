/**
 * Analytics Service
 * Proporciona métricas y estadísticas del sistema.
 * Parte de Phase 10.4: Optional Improvements
 */
const db = require('../db');

class AnalyticsService {
    /**
     * Obtiene estadísticas generales del sistema.
     * @returns {Object}
     */
    getOverview() {
        const lessonsGenerated = db.get(`
            SELECT COUNT(*) as total FROM lesson_evaluations
        `, [])?.total || 0;

        const avgScore = db.get(`
            SELECT AVG(overall_score) as avg FROM lesson_evaluations
        `, [])?.avg || 0;

        const activeSessions = db.get(`
            SELECT COUNT(*) as total FROM learning_sessions WHERE status = 'ACTIVE'
        `, [])?.total || 0;

        const totalUsers = db.get(`
            SELECT COUNT(DISTINCT user_id) as total FROM learning_sessions
        `, [])?.total || 0;

        const feedbackCount = db.get(`
            SELECT COUNT(*) as total FROM lesson_feedback
        `, [])?.total || 0;

        const avgFeedbackRating = db.get(`
            SELECT AVG(rating) as avg FROM lesson_feedback
        `, [])?.avg || 0;

        return {
            lessons: {
                total: lessonsGenerated,
                avgScore: Math.round(avgScore * 10) / 10
            },
            sessions: {
                active: activeSessions,
                totalUsers
            },
            feedback: {
                total: feedbackCount,
                avgRating: Math.round(avgFeedbackRating * 10) / 10
            }
        };
    }

    /**
     * Obtiene lecciones generadas por día.
     * @param {number} days - Últimos N días
     * @returns {Array}
     */
    getLessonsPerDay(days = 30) {
        return db.query(`
            SELECT 
                date(created_at) as date,
                COUNT(*) as count,
                AVG(overall_score) as avgScore
            FROM lesson_evaluations 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY date(created_at)
            ORDER BY date DESC
        `, []);
    }

    /**
     * Obtiene distribución de scores de evaluación.
     * @returns {Array}
     */
    getScoreDistribution() {
        return db.query(`
            SELECT 
                CASE 
                    WHEN overall_score >= 90 THEN 'A (90-100)'
                    WHEN overall_score >= 80 THEN 'B (80-89)'
                    WHEN overall_score >= 70 THEN 'C (70-79)'
                    WHEN overall_score >= 60 THEN 'D (60-69)'
                    ELSE 'F (<60)'
                END as grade,
                COUNT(*) as count
            FROM lesson_evaluations
            GROUP BY grade
            ORDER BY 
                CASE grade 
                    WHEN 'A (90-100)' THEN 1
                    WHEN 'B (80-89)' THEN 2
                    WHEN 'C (70-79)' THEN 3
                    WHEN 'D (60-69)' THEN 4
                    ELSE 5
                END
        `, []);
    }

    /**
     * Obtiene feedback reciente.
     * @param {number} limit 
     * @returns {Array}
     */
    getRecentFeedback(limit = 10) {
        return db.query(`
            SELECT 
                id,
                lesson_id,
                rating,
                feedback_type,
                comment,
                created_at
            FROM lesson_feedback
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);
    }

    /**
     * Obtiene métricas de evaluación por componente.
     * @returns {Object}
     */
    getEvaluationMetrics() {
        const metrics = db.get(`
            SELECT 
                AVG(faithfulness_score) as avgFaithfulness,
                AVG(relevance_score) as avgRelevance,
                AVG(length_score) as avgLength,
                AVG(structure_score) as avgStructure,
                AVG(no_hallucination_score) as avgNoHallucination,
                COUNT(*) as totalEvaluations,
                SUM(CASE WHEN overall_score >= 70 THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN has_examples = 1 THEN 1 ELSE 0 END) as withExamples,
                SUM(CASE WHEN has_quiz = 1 THEN 1 ELSE 0 END) as withQuiz
            FROM lesson_evaluations
        `, []);

        return {
            components: {
                faithfulness: Math.round(metrics?.avgFaithfulness || 0),
                relevance: Math.round(metrics?.avgRelevance || 0),
                length: Math.round(metrics?.avgLength || 0),
                structure: Math.round(metrics?.avgStructure || 0),
                noHallucination: Math.round(metrics?.avgNoHallucination || 0)
            },
            totals: {
                evaluations: metrics?.totalEvaluations || 0,
                passRate: metrics?.totalEvaluations > 0
                    ? Math.round((metrics.passed / metrics.totalEvaluations) * 100)
                    : 0,
                withExamples: metrics?.withExamples || 0,
                withQuiz: metrics?.withQuiz || 0
            }
        };
    }

    /**
     * Obtiene actividad por semana del currículo.
     * @returns {Array}
     */
    getActivityByWeek() {
        return db.query(`
            SELECT 
                json_extract(content, '$.semana') as semana,
                COUNT(*) as interactions
            FROM session_interactions
            WHERE interaction_type = 'LESSON_GENERATED'
            GROUP BY semana
            ORDER BY CAST(semana AS INTEGER)
        `, []);
    }

    /**
     * Obtiene usuarios más activos.
     * @param {number} limit 
     * @returns {Array}
     */
    getTopUsers(limit = 10) {
        return db.query(`
            SELECT 
                ls.user_id,
                COUNT(DISTINCT ls.id) as sessions,
                COUNT(si.id) as interactions,
                MAX(si.created_at) as lastActive
            FROM learning_sessions ls
            LEFT JOIN session_interactions si ON ls.id = si.session_id
            GROUP BY ls.user_id
            ORDER BY interactions DESC
            LIMIT ?
        `, [limit]);
    }
}

// Exportar singleton
const analyticsService = new AnalyticsService();
module.exports = { analyticsService, AnalyticsService };
