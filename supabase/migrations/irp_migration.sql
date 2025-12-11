-- =============================================================================
-- MIGRACIÓN IRP A SUPABASE
-- Fecha: 2025-12-07
-- Descripción: Crea tablas del sistema IRP (Informe de Revisión por Pares)
--              Migrado desde microservicio-irp/prisma/schema.prisma
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE review_request_status AS ENUM (
    'PENDING_ASSIGNMENT',
    'ASSIGNED', 
    'COMPLETED',
    'EXPIRED'
);

CREATE TYPE assignment_status AS ENUM (
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'OVERDUE'
);

CREATE TYPE review_recommendation AS ENUM (
    'APPROVE',
    'APPROVE_WITH_MINOR_CHANGES',
    'MAJOR_REVISION_NEEDED'
);

-- -----------------------------------------------------------------------------
-- TABLAS PRINCIPALES
-- -----------------------------------------------------------------------------

-- Tabla: Solicitudes de Revisión
CREATE TABLE IF NOT EXISTS irp_review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    github_repo_url TEXT NOT NULL,
    pull_request_url TEXT,
    phase INTEGER NOT NULL,
    week INTEGER NOT NULL,
    description TEXT NOT NULL,
    learning_objectives TEXT[] DEFAULT '{}',
    specific_focus TEXT[] DEFAULT '{}',
    status review_request_status DEFAULT 'PENDING_ASSIGNMENT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Asignaciones de Revisor
CREATE TABLE IF NOT EXISTS irp_review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_request_id UUID NOT NULL REFERENCES irp_review_requests(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    status assignment_status DEFAULT 'ASSIGNED',
    review_criteria TEXT[] DEFAULT '{}'
);

-- Tabla: Revisiones (Peer Reviews)
CREATE TABLE IF NOT EXISTS irp_peer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_request_id UUID NOT NULL REFERENCES irp_review_requests(id) ON DELETE CASCADE,
    review_assignment_id UUID REFERENCES irp_review_assignments(id),
    reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puntos_fuertes JSONB DEFAULT '[]',
    sugerencias_mejora JSONB DEFAULT '[]',
    preguntas_reflexion JSONB DEFAULT '[]',
    calificacion_general JSONB DEFAULT '{}',
    tiempo_revision_horas FLOAT DEFAULT 0,
    recomendacion review_recommendation NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    github_comment_url TEXT
);

-- Tabla: Métricas de Usuario (IRP)
CREATE TABLE IF NOT EXISTS irp_user_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_reviews_completed INTEGER DEFAULT 0,
    total_reviews_received INTEGER DEFAULT 0,
    average_review_time_hours FLOAT DEFAULT 0,
    average_rating_given FLOAT DEFAULT 0,
    average_rating_received FLOAT DEFAULT 0,
    quality_score FLOAT DEFAULT 0,
    punctuality_rate FLOAT DEFAULT 0,
    peer_points_total INTEGER DEFAULT 0,
    current_level TEXT DEFAULT 'Beginner Reviewer',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Log de Auditoría (IRP)
CREATE TABLE IF NOT EXISTS irp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ÍNDICES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_irp_review_requests_author ON irp_review_requests(author_user_id);
CREATE INDEX IF NOT EXISTS idx_irp_review_requests_status ON irp_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_irp_review_assignments_request ON irp_review_assignments(review_request_id);
CREATE INDEX IF NOT EXISTS idx_irp_review_assignments_reviewer ON irp_review_assignments(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_irp_peer_reviews_request ON irp_peer_reviews(review_request_id);
CREATE INDEX IF NOT EXISTS idx_irp_peer_reviews_reviewer ON irp_peer_reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_irp_audit_logs_user ON irp_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_irp_audit_logs_entity ON irp_audit_logs(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- TRIGGER: updated_at automático
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_irp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_irp_review_requests_updated_at
    BEFORE UPDATE ON irp_review_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_irp_updated_at();

-- -----------------------------------------------------------------------------
-- RLS (Row Level Security)
-- -----------------------------------------------------------------------------

ALTER TABLE irp_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE irp_review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE irp_peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE irp_user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE irp_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Los usuarios pueden ver sus propias solicitudes y las asignadas
CREATE POLICY "Users can view own review requests"
    ON irp_review_requests FOR SELECT
    USING ((SELECT auth.uid()) = author_user_id);

CREATE POLICY "Users can create own review requests"
    ON irp_review_requests FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = author_user_id);

CREATE POLICY "Users can view assigned reviews"
    ON irp_review_assignments FOR SELECT
    USING ((SELECT auth.uid()) = reviewer_user_id 
        OR (SELECT auth.uid()) = (SELECT author_user_id FROM irp_review_requests WHERE id = review_request_id));

CREATE POLICY "Users can view peer reviews they made or received"
    ON irp_peer_reviews FOR SELECT
    USING ((SELECT auth.uid()) = reviewer_user_id 
        OR (SELECT auth.uid()) = (SELECT author_user_id FROM irp_review_requests WHERE id = review_request_id));

CREATE POLICY "Users can insert peer reviews as reviewer"
    ON irp_peer_reviews FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = reviewer_user_id);

CREATE POLICY "Users can view own metrics"
    ON irp_user_metrics FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own audit logs"
    ON irp_audit_logs FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- FIN DE MIGRACIÓN
-- =============================================================================
