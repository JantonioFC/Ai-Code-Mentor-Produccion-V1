/**
 * Review Service - IRP Integration (Local Version)
 * 
 * Lógica de negocio para revisiones, métricas y operaciones IRP.
 * Adaptado para uso local con almacenamiento JSON.
 * 
 * @author Mentor Coder
 * @version 2.1.0 (Local JSON Integration)
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'db', 'irp_reviews.json');

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Helper functions for local DB
function readDb() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { requests: [], reviews: [] };
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
        console.error('Error reading IRP DB', e);
        return { requests: [], reviews: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error writing IRP DB', e);
        return false;
    }
}

// ============================================================================
// FUNCIONES DE NIVEL
// ============================================================================

export function calculateUserLevel(peerPoints) {
    if (peerPoints >= 500) return 'Master Reviewer';
    if (peerPoints >= 300) return 'Expert Reviewer';
    if (peerPoints >= 150) return 'Senior Reviewer';
    if (peerPoints >= 50) return 'Experienced Reviewer';
    if (peerPoints >= 20) return 'Junior Reviewer';
    return 'Beginner Reviewer';
}

export function getNextLevelThreshold(currentLevel) {
    const thresholds = {
        'Beginner Reviewer': 20,
        'Junior Reviewer': 50,
        'Experienced Reviewer': 150,
        'Senior Reviewer': 300,
        'Expert Reviewer': 500,
        'Master Reviewer': 1000
    };
    return thresholds[currentLevel] || 20;
}

function calculateQualityScore(metrics) {
    const {
        totalReviewsCompleted,
        averageRatingGiven,
        punctualityRate,
        averageReviewTimeHours,
        totalReviewsReceived,
        averageRatingReceived
    } = metrics;

    let score = 50;

    // Factor de experiencia (hasta +20 puntos)
    score += Math.min(totalReviewsCompleted * 2, 20);

    // Factor de calidad de reviews (hasta +15 puntos)
    if (averageRatingGiven >= 3.5 && averageRatingGiven <= 4.5) {
        score += 15;
    } else {
        score += Math.max(0, 15 - Math.abs(averageRatingGiven - 4.0) * 5);
    }

    // Factor de puntualidad (hasta +10 puntos)
    score += punctualityRate * 10;

    // Factor de tiempo de revisión
    if (averageReviewTimeHours >= 1 && averageReviewTimeHours <= 4) {
        score += 5;
    } else if (averageReviewTimeHours < 0.5) {
        score -= 10;
    } else if (averageReviewTimeHours > 6) {
        score -= 5;
    }

    // Factor de recepción de feedback
    if (totalReviewsReceived > 0 && averageRatingReceived >= 3.0) {
        score += 5;
    }

    return Math.max(0, Math.min(100, score));
}

// ============================================================================
// OPERACIONES CRUD
// ============================================================================

/**
 * Crea una nueva solicitud de revisión
 */
export async function createReviewRequest(data, userId) {
    const db = readDb();

    // Security: Validate GitHub URL to prevent Stored XSS
    if (!data.github_repo_url || !data.github_repo_url.startsWith('https://github.com/')) {
        throw new Error('Invalid GitHub Repository URL. Must start with https://github.com/');
    }

    const newRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        author_user_id: userId,
        project_name: data.project_name,
        github_repo_url: data.github_repo_url,
        pull_request_url: data.pull_request_url || null,
        phase: data.phase,
        week: data.week,
        description: data.description,
        learning_objectives: data.learning_objectives || [],
        specific_focus: data.specific_focus || [],
        status: 'PENDING_ASSIGNMENT'
    };

    db.requests.push(newRequest);
    writeDb(db);

    console.log('[IRP-Review] Request created:', newRequest.id);
    return newRequest;
}

/**
 * Obtiene el historial de revisiones de un usuario
 */
export async function getReviewHistory(userId, options = {}) {
    const db = readDb();
    const { role = 'both', status = 'all', limit = 20, offset = 0 } = options;

    let requests = db.requests;

    // Filtrar por rol
    if (role === 'author') {
        requests = requests.filter(r => r.author_user_id === userId);
    } else if (role === 'reviewer') {
        // Encontrar requests donde el usuario revisó
        const reviewIds = db.reviews.filter(rev => rev.reviewer_user_id === userId).map(rev => rev.review_request_id);
        requests = requests.filter(r => reviewIds.includes(r.id));
    }

    // Filtrar por estado
    if (status !== 'all') {
        const statusMap = {
            'pending': ['PENDING_ASSIGNMENT', 'ASSIGNED'],
            'completed': ['COMPLETED']
        };
        if (statusMap[status]) {
            requests = requests.filter(r => statusMap[status].includes(r.status));
        }
    }

    // Sort desc
    requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const sliced = requests.slice(offset, offset + limit);

    // Transformar al formato esperado
    return sliced.map(request => {
        const review = db.reviews.find(rev => rev.review_request_id === request.id) || null;
        return {
            review_id: request.id,
            project_name: request.project_name,
            status: request.status.toLowerCase(),
            phase: request.phase,
            week: request.week,
            created_at: request.created_at,
            review: review
        };
    });
}

/**
 * Obtiene los detalles de una revisión específica
 */
export async function getReviewDetails(reviewId) {
    const db = readDb();
    const request = db.requests.find(r => r.id === reviewId);

    if (!request) {
        throw new Error('Revisión no encontrada');
    }

    const review = db.reviews.find(r => r.review_request_id === reviewId);

    return {
        review_id: request.id,
        project_name: request.project_name,
        github_repo_url: request.github_repo_url,
        description: request.description,
        phase: request.phase,
        week: request.week,
        status: request.status.toLowerCase(),
        created_at: request.created_at,
        learning_objectives: request.learning_objectives,
        specific_focus: request.specific_focus,
        review: review ? {
            puntos_fuertes: review.puntos_fuertes,
            sugerencias_mejora: review.sugerencias_mejora,
            preguntas_reflexion: review.preguntas_reflexion,
            calificacion_general: review.calificacion_general,
            tiempo_revision_horas: review.tiempo_revision_horas,
            recomendacion: review.recomendacion,
            submitted_at: review.submitted_at
        } : null
    };
}

/**
 * Guarda el resultado de una revisión de IA
 */
export async function saveAIReview(reviewRequestId, reviewData, reviewerUserId) {
    const db = readDb();

    // Calcular calificación total
    const { calificacion_general } = reviewData;
    const total = (
        calificacion_general.claridad_codigo +
        calificacion_general.arquitectura +
        calificacion_general.testing +
        calificacion_general.documentacion
    ) / 4;

    const newReview = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        review_request_id: reviewRequestId,
        reviewer_user_id: reviewerUserId,
        puntos_fuertes: reviewData.puntos_fuertes,
        sugerencias_mejora: reviewData.sugerencias_mejora,
        preguntas_reflexion: reviewData.preguntas_reflexion,
        calificacion_general: { ...calificacion_general, total },
        tiempo_revision_horas: reviewData.tiempo_revision_horas,
        recomendacion: reviewData.recomendacion.toUpperCase(),
        submitted_at: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Actualizar request
    const reqIndex = db.requests.findIndex(r => r.id === reviewRequestId);
    if (reqIndex !== -1) {
        db.requests[reqIndex].status = 'COMPLETED';
    }

    writeDb(db);

    console.log('[IRP-Review] AI review saved:', newReview.id);
    return newReview;
}

// ============================================================================
// MÉTRICAS
// ============================================================================

/**
 * Calcula métricas de un usuario
 */
export async function calculateUserMetrics(userId) {
    const db = readDb();

    const reviewsAsReviewer = db.reviews.filter(r => r.reviewer_user_id === userId);
    const reviewsAsAuthor = db.reviews.filter(rev => {
        const req = db.requests.find(r => r.id === rev.review_request_id);
        return req && req.author_user_id === userId;
    });

    const totalReviewsCompleted = reviewsAsReviewer.length;
    const totalReviewsReceived = reviewsAsAuthor.length;

    // Calcular promedios
    let averageReviewTimeHours = 0;
    let averageRatingGiven = 0;
    let averageRatingReceived = 0;

    if (totalReviewsCompleted > 0) {
        averageReviewTimeHours = reviewsAsReviewer.reduce(
            (sum, r) => sum + (r.tiempo_revision_horas || 0), 0
        ) / totalReviewsCompleted;

        averageRatingGiven = reviewsAsReviewer.reduce(
            (sum, r) => sum + (r.calificacion_general?.total || 0), 0
        ) / totalReviewsCompleted;
    }

    if (totalReviewsReceived > 0) {
        averageRatingReceived = reviewsAsAuthor.reduce(
            (sum, r) => sum + (r.calificacion_general?.total || 0), 0
        ) / totalReviewsReceived;
    }

    // Puntualidad (simplificado)
    const punctualityRate = 1.0;

    // Calcular score de calidad
    const qualityScore = calculateQualityScore({
        totalReviewsCompleted,
        averageRatingGiven,
        punctualityRate,
        averageReviewTimeHours,
        totalReviewsReceived,
        averageRatingReceived
    });

    // Peer points
    const peerPointsBase = totalReviewsCompleted * 10;
    const qualityBonus = totalReviewsCompleted > 0 ? Math.floor(qualityScore * 5) : 0;
    const peerPointsTotal = peerPointsBase + qualityBonus;

    const currentLevel = calculateUserLevel(peerPointsTotal);
    const nextLevelThreshold = getNextLevelThreshold(currentLevel);

    return {
        reviewer_metrics: {
            total_reviews_completed: totalReviewsCompleted,
            average_review_time_hours: Math.round(averageReviewTimeHours * 10) / 10,
            average_rating_given: Math.round(averageRatingGiven * 10) / 10
        },
        author_metrics: {
            total_reviews_received: totalReviewsReceived,
            average_rating_received: Math.round(averageRatingReceived * 10) / 10
        },
        quality_score: Math.round(qualityScore * 10) / 10,
        punctuality_rate: punctualityRate,
        peer_points_total: peerPointsTotal,
        current_level: currentLevel,
        next_level_threshold: nextLevelThreshold
    };
}

/**
 * Genera estadísticas del sistema
 */
export async function generateSystemStats() {
    const db = readDb();

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalReviews = db.reviews.length;
    const pendingReviews = db.requests.filter(r => ['PENDING_ASSIGNMENT', 'ASSIGNED'].includes(r.status)).length;
    const completedThisWeek = db.reviews.filter(r => new Date(r.submitted_at) >= oneWeekAgo).length;

    return {
        total_reviews: totalReviews,
        pending_reviews: pendingReviews,
        completed_this_week: completedThisWeek
    };
}

/**
 * Valida los datos de una revisión
 */
export function validateReviewData(reviewData) {
    const errors = [];

    if (!reviewData.puntos_fuertes || reviewData.puntos_fuertes.length < 1) {
        errors.push('Debe incluir al menos 1 punto fuerte');
    }

    if (!reviewData.sugerencias_mejora || reviewData.sugerencias_mejora.length < 1) {
        errors.push('Debe incluir al menos 1 sugerencia de mejora');
    }

    const { calificacion_general } = reviewData;
    if (!calificacion_general) {
        errors.push('Calificación general es requerida');
    } else {
        const fields = ['claridad_codigo', 'arquitectura', 'testing', 'documentacion'];
        for (const field of fields) {
            if (!calificacion_general[field] || calificacion_general[field] < 1 || calificacion_general[field] > 5) {
                errors.push(`Calificación de ${field} debe ser entre 1 y 5`);
            }
        }
    }

    if (!reviewData.tiempo_revision_horas || reviewData.tiempo_revision_horas < 0.1) {
        errors.push('Tiempo de revisión debe ser al menos 0.1 horas');
    }

    return { isValid: errors.length === 0, errors };
}
