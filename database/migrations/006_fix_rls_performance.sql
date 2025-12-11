-- ================================================================================
-- AI CODE MENTOR - CORRECCIÓN DE RENDIMIENTO: RLS POLICIES
-- ================================================================================
-- Objetivo: Resolver advertencias de performance del linter de Supabase
-- Fecha: 2025-12-05
-- Problemas:
--   1. auth_rls_initplan: auth.uid() se re-evalúa para cada fila
--   2. multiple_permissive_policies: políticas duplicadas
-- ================================================================================

-- ============================================================================
-- PARTE 1: ELIMINAR POLÍTICAS DUPLICADAS EN user_profiles
-- ============================================================================
-- Hay políticas duplicadas con nombres similares:
-- "Users can view own profile" vs "Users can view their own profile"
-- "Users can insert own profile" vs "Users can insert their own profile"
-- "Users can update own profile" vs "Users can update their own profile"

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Recrear con nombres únicos y (select auth.uid())
CREATE POLICY "user_profiles_select" ON public.user_profiles
    FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "user_profiles_update" ON public.user_profiles
    FOR UPDATE USING ((select auth.uid()) = id);

-- ============================================================================
-- PARTE 2: CORREGIR POLÍTICAS EN source_content_cache
-- ============================================================================
-- Consolidar en una sola política para evitar duplicados

DROP POLICY IF EXISTS "Public read access to cached content" ON public.source_content_cache;
DROP POLICY IF EXISTS "System can modify cached content" ON public.source_content_cache;
DROP POLICY IF EXISTS "cache_public_read" ON public.source_content_cache;
DROP POLICY IF EXISTS "cache_system_write" ON public.source_content_cache;

-- Una sola política para todo (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "cache_all_access" ON public.source_content_cache
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PARTE 3: CORREGIR quiz_attempts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.quiz_attempts;

CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 4: CORREGIR user_lesson_progress
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.user_lesson_progress;

CREATE POLICY "lesson_progress_select" ON public.user_lesson_progress
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "lesson_progress_insert" ON public.user_lesson_progress
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "lesson_progress_update" ON public.user_lesson_progress
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 5: CORREGIR user_exercise_progress
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own exercise progress" ON public.user_exercise_progress;
DROP POLICY IF EXISTS "Users can insert own exercise progress" ON public.user_exercise_progress;
DROP POLICY IF EXISTS "Users can update own exercise progress" ON public.user_exercise_progress;

CREATE POLICY "exercise_progress_select" ON public.user_exercise_progress
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "exercise_progress_insert" ON public.user_exercise_progress
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "exercise_progress_update" ON public.user_exercise_progress
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 6: CORREGIR generated_content
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own generated content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can insert own generated content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can update own generated content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can delete own generated content" ON public.generated_content;

CREATE POLICY "generated_content_select" ON public.generated_content
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "generated_content_insert" ON public.generated_content
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "generated_content_update" ON public.generated_content
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "generated_content_delete" ON public.generated_content
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 7: CORREGIR est_progress
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own EST progress" ON public.est_progress;
DROP POLICY IF EXISTS "Users can view own EST progress" ON public.est_progress;
DROP POLICY IF EXISTS "Users can insert own EST progress" ON public.est_progress;
DROP POLICY IF EXISTS "Users can update own EST progress" ON public.est_progress;
DROP POLICY IF EXISTS "Users can delete own EST progress" ON public.est_progress;

CREATE POLICY "est_progress_select" ON public.est_progress
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "est_progress_insert" ON public.est_progress
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "est_progress_update" ON public.est_progress
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "est_progress_delete" ON public.est_progress
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 8: CORREGIR user_achievements
-- ============================================================================

DROP POLICY IF EXISTS "Allow user to read their own achievements" ON public.user_achievements;

CREATE POLICY "user_achievements_select" ON public.user_achievements
    FOR SELECT USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 9: CORREGIR sandbox_generations
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own sandbox generations" ON public.sandbox_generations;
DROP POLICY IF EXISTS "Users can insert own sandbox generations" ON public.sandbox_generations;
DROP POLICY IF EXISTS "Users can update own sandbox generations" ON public.sandbox_generations;
DROP POLICY IF EXISTS "Users can delete own sandbox generations" ON public.sandbox_generations;

CREATE POLICY "sandbox_generations_select" ON public.sandbox_generations
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "sandbox_generations_insert" ON public.sandbox_generations
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "sandbox_generations_update" ON public.sandbox_generations
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "sandbox_generations_delete" ON public.sandbox_generations
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTE 10: CORREGIR lesson_progress (si existe)
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own lesson progress" ON public.lesson_progress;

-- Solo crear si la tabla existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_progress') THEN
        EXECUTE 'CREATE POLICY "lesson_progress_all" ON public.lesson_progress
            FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)';
    END IF;
END $$;

-- ============================================================================
-- PARTE 11: CORREGIR curriculum_progress (si existe)
-- ============================================================================

DROP POLICY IF EXISTS "curriculum_progress_own" ON public.curriculum_progress;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curriculum_progress') THEN
        EXECUTE 'CREATE POLICY "curriculum_progress_all" ON public.curriculum_progress
            FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)';
    END IF;
END $$;

-- ============================================================================
-- FIN DEL SCRIPT - POLÍTICAS RLS OPTIMIZADAS
-- ============================================================================
-- Cambios realizados:
-- 1. Todas las políticas usan (select auth.uid()) para mejor rendimiento
-- 2. Políticas duplicadas eliminadas y consolidadas
-- 3. Nombres de políticas normalizados (tabla_accion)
-- ============================================================================
