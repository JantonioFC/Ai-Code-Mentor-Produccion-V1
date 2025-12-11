-- ================================================================================
-- AI CODE MENTOR - AGREGAR ÍNDICES PARA FOREIGN KEYS
-- ================================================================================
-- Objetivo: Resolver sugerencias de "Unindexed Foreign Keys" del linter
-- Fecha: 2025-12-05
-- Referencia: database-linter?lint=0001_unindexed_foreign_keys
-- ================================================================================

-- ============================================================================
-- curriculum_progress - 3 foreign keys sin índice
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_curriculum_progress_module_id 
    ON public.curriculum_progress (module_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_progress_phase_id 
    ON public.curriculum_progress (phase_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_progress_week_id 
    ON public.curriculum_progress (week_id);

-- ============================================================================
-- lesson_progress - 1 foreign key sin índice
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id 
    ON public.lesson_progress (lesson_id);

-- ============================================================================
-- user_achievements - 1 foreign key sin índice
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id 
    ON public.user_achievements (achievement_id);

-- ============================================================================
-- FIN DEL SCRIPT - 5 ÍNDICES AGREGADOS
-- ============================================================================
