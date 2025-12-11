/**
 * Review Service - IRP Integration
 * 
 * Lógica de negocio para revisiones, métricas y operaciones IRP.
 * Adaptado del microservicio IRP para uso con Supabase.
 * 
 * @author Mentor Coder
 * @version 2.0.0 (Supabase Integration)
 */

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para operaciones del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase credentials not configured');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });
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
    const supabase = getSupabaseAdmin();

    const { data: request, error } = await supabase
        .from('irp_review_requests')
        .insert({
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
        })
        .select()
        .single();

    if (error) {
        console.error('[IRP-Review] Error creating request:', error);
        throw new Error('Error creando solicitud de revisión');
    }

    console.log('[IRP-Review] Request created:', request.id);
    return request;
}

/**
 * Obtiene el historial de revisiones de un usuario
 */
export async function getReviewHistory(userId, options = {}) {
    const supabase = getSupabaseAdmin();
    const { role = 'both', status = 'all', limit = 20, offset = 0 } = options;

    let query = supabase
        .from('irp_review_requests')
        .select(`
      *,
      irp_peer_reviews (*)
    `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Filtrar por rol
    if (role === 'author') {
        query = query.eq('author_user_id', userId);
    } else if (role === 'reviewer') {
        // Para revisiones como revisor, necesitamos unir con peer_reviews
        query = query.eq('irp_peer_reviews.reviewer_user_id', userId);
    }

    // Filtrar por estado
    if (status !== 'all') {
        const statusMap = {
            'pending': ['PENDING_ASSIGNMENT', 'ASSIGNED'],
            'completed': ['COMPLETED']
        };
        if (statusMap[status]) {
            query = query.in('status', statusMap[status]);
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('[IRP-Review] Error getting history:', error);
        throw new Error('Error obteniendo historial de revisiones');
    }

    // Transformar al formato esperado por el frontend
    return data.map(request => ({
        review_id: request.id,
        project_name: request.project_name,
        status: request.status.toLowerCase(),
        phase: request.phase,
        week: request.week,
        created_at: request.created_at,
        review: request.irp_peer_reviews?.[0] || null
    }));
}

/**
 * Obtiene los detalles de una revisión específica
 */
export async function getReviewDetails(reviewId) {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('irp_review_requests')
        .select(`
      *,
      irp_peer_reviews (*)
    `)
        .eq('id', reviewId)
        .single();

    if (error) {
        console.error('[IRP-Review] Error getting details:', error);
        throw new Error('Revisión no encontrada');
    }

    const review = data.irp_peer_reviews?.[0];

    return {
        review_id: data.id,
        project_name: data.project_name,
        github_repo_url: data.github_repo_url,
        description: data.description,
        phase: data.phase,
        week: data.week,
        status: data.status.toLowerCase(),
        created_at: data.created_at,
        learning_objectives: data.learning_objectives,
        specific_focus: data.specific_focus,
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
    const supabase = getSupabaseAdmin();

    // Calcular calificación total
    const { calificacion_general } = reviewData;
    const total = (
        calificacion_general.claridad_codigo +
        calificacion_general.arquitectura +
        calificacion_general.testing +
        calificacion_general.documentacion
    ) / 4;

    const { data: peerReview, error } = await supabase
        .from('irp_peer_reviews')
        .insert({
            review_request_id: reviewRequestId,
            reviewer_user_id: reviewerUserId,
            puntos_fuertes: reviewData.puntos_fuertes,
            sugerencias_mejora: reviewData.sugerencias_mejora,
            preguntas_reflexion: reviewData.preguntas_reflexion,
            calificacion_general: { ...calificacion_general, total },
            tiempo_revision_horas: reviewData.tiempo_revision_horas,
            recomendacion: reviewData.recomendacion.toUpperCase()
        })
        .select()
        .single();

    if (error) {
        console.error('[IRP-Review] Error saving review:', error);
        throw new Error('Error guardando revisión');
    }

    // Actualizar estado de la solicitud a COMPLETED
    await supabase
        .from('irp_review_requests')
        .update({ status: 'COMPLETED' })
        .eq('id', reviewRequestId);

    console.log('[IRP-Review] AI review saved:', peerReview.id);
    return peerReview;
}

// ============================================================================
// MÉTRICAS
// ============================================================================

/**
 * Calcula métricas de un usuario
 */
export async function calculateUserMetrics(userId) {
    const supabase = getSupabaseAdmin();

    // Obtener revisiones como revisor
    const { data: reviewsAsReviewer } = await supabase
        .from('irp_peer_reviews')
        .select('*, irp_review_assignments(*)')
        .eq('reviewer_user_id', userId);

    // Obtener revisiones recibidas como autor
    const { data: reviewsAsAuthor } = await supabase
        .from('irp_peer_reviews')
        .select('*, irp_review_requests!inner(*)')
        .eq('irp_review_requests.author_user_id', userId);

    const totalReviewsCompleted = reviewsAsReviewer?.length || 0;
    const totalReviewsReceived = reviewsAsAuthor?.length || 0;

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
    const supabase = getSupabaseAdmin();

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalResult, pendingResult, weekResult] = await Promise.all([
        supabase.from('irp_peer_reviews').select('id', { count: 'exact', head: true }),
        supabase.from('irp_review_requests')
            .select('id', { count: 'exact', head: true })
            .in('status', ['PENDING_ASSIGNMENT', 'ASSIGNED']),
        supabase.from('irp_peer_reviews')
            .select('id', { count: 'exact', head: true })
            .gte('submitted_at', oneWeekAgo)
    ]);

    return {
        total_reviews: totalResult.count || 0,
        pending_reviews: pendingResult.count || 0,
        completed_this_week: weekResult.count || 0
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
