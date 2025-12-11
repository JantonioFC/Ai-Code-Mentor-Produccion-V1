-- ================================================================================
-- AI CODE MENTOR - CORRECCIÓN DE SEGURIDAD: FUNCTION SEARCH PATH
-- ================================================================================
-- Objetivo: Resolver las 16 advertencias de "Function Search Path Mutable"
-- Fecha: 2025-12-05
-- Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- ================================================================================
-- 
-- INSTRUCCIONES:
-- 1. Copiar todo este script
-- 2. Ir a Supabase Dashboard → SQL Editor
-- 3. Pegar y ejecutar (Run)
-- 4. Verificar el resultado en Database → Linter
--
-- ================================================================================

-- ============================================================================
-- FUNCIÓN 1: update_updated_at_column
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 2: trigger_set_timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 3: set_lesson_completed_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_lesson_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 4: set_exercise_completed_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_exercise_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 5: cleanup_old_sandbox_generations
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_sandbox_generations()
RETURNS TRIGGER AS $$
DECLARE
    generation_count INTEGER;
    excess_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO generation_count
    FROM public.sandbox_generations
    WHERE user_id = NEW.user_id;
    
    IF generation_count > 20 THEN
        excess_count := generation_count - 20;
        
        DELETE FROM public.sandbox_generations
        WHERE id IN (
            SELECT id
            FROM public.sandbox_generations
            WHERE user_id = NEW.user_id
            ORDER BY created_at ASC
            LIMIT excess_count
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 6: validate_generated_lesson
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_generated_lesson(generated_lesson JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT (
        generated_lesson ? 'title' OR
        generated_lesson ? 'content' OR
        generated_lesson ? 'summary'
    ) THEN
        RAISE EXCEPTION 'generated_lesson debe contener al menos una de las claves: title, content, summary';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 7: is_cache_content_fresh
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_cache_content_fresh(
    p_url TEXT,
    p_max_age_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
    last_fetch TIMESTAMPTZ;
    is_fresh BOOLEAN := FALSE;
BEGIN
    SELECT last_fetched_at INTO last_fetch
    FROM public.source_content_cache
    WHERE url = p_url;
    
    IF FOUND THEN
        is_fresh := (last_fetch > NOW() - (p_max_age_hours || ' hours')::INTERVAL);
    END IF;
    
    RETURN is_fresh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 8: cleanup_expired_cache_content
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache_content()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.source_content_cache 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 9: get_cache_stats
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_cache_stats();

CREATE OR REPLACE FUNCTION public.get_cache_stats()
RETURNS TABLE (
    total_urls INTEGER,
    fresh_content INTEGER,
    expired_content INTEGER,
    avg_content_size INTEGER,
    oldest_fetch TIMESTAMPTZ,
    newest_fetch TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_urls,
        COUNT(CASE WHEN last_fetched_at > NOW() - INTERVAL '24 hours' THEN 1 END)::INTEGER as fresh_content,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 END)::INTEGER as expired_content,
        AVG(LENGTH(content))::INTEGER as avg_content_size,
        MIN(last_fetched_at) as oldest_fetch,
        MAX(last_fetched_at) as newest_fetch
    FROM public.source_content_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 10: update_cache_timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.last_fetched_at = NOW();
        
        IF NEW.expires_at IS NULL THEN
            NEW.expires_at = NOW() + INTERVAL '7 days';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 11: handle_new_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 12: migrate_anonymous_data
-- ============================================================================
DROP FUNCTION IF EXISTS public.migrate_anonymous_data(UUID, UUID);

CREATE OR REPLACE FUNCTION public.migrate_anonymous_data(
    p_anonymous_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Migrar progreso de lecciones
    UPDATE public.user_lesson_progress 
    SET user_id = p_user_id 
    WHERE user_id = p_anonymous_id;
    
    -- Migrar progreso de ejercicios
    UPDATE public.user_exercise_progress 
    SET user_id = p_user_id 
    WHERE user_id = p_anonymous_id;
    
    -- Migrar intentos de quiz
    UPDATE public.quiz_attempts 
    SET user_id = p_user_id 
    WHERE user_id = p_anonymous_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 13: get_anonymous_user_stats
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_anonymous_user_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_anonymous_user_stats(p_user_id UUID)
RETURNS TABLE (
    lesson_count BIGINT,
    exercise_count BIGINT,
    quiz_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.user_lesson_progress WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM public.user_exercise_progress WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 14: calculate_curriculum_progress
-- ============================================================================
DROP FUNCTION IF EXISTS public.calculate_curriculum_progress(UUID);

CREATE OR REPLACE FUNCTION public.calculate_curriculum_progress(p_user_id UUID)
RETURNS TABLE (
    total_lessons BIGINT,
    completed_lessons BIGINT,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_lessons,
        COUNT(CASE WHEN completed = TRUE THEN 1 END)::BIGINT as completed_lessons,
        ROUND(
            (COUNT(CASE WHEN completed = TRUE THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100,
            2
        ) as progress_percentage
    FROM public.user_lesson_progress
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCIÓN 15: update_curriculum_progress_on_lesson_completion
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_curriculum_progress_on_lesson_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar timestamp cuando se completa una lección
    IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- FUNCIÓN 16: get_phases_with_stats
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_phases_with_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_phases_with_stats(p_user_id UUID)
RETURNS TABLE (
    phase_id TEXT,
    phase_name TEXT,
    total_lessons BIGINT,
    completed_lessons BIGINT,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ulp.lesson_id as phase_id,
        ulp.lesson_id as phase_name,
        COUNT(*)::BIGINT as total_lessons,
        COUNT(CASE WHEN ulp.completed = TRUE THEN 1 END)::BIGINT as completed_lessons,
        ROUND(
            (COUNT(CASE WHEN ulp.completed = TRUE THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100,
            2
        ) as progress_percentage
    FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = p_user_id
    GROUP BY ulp.lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FIN DEL SCRIPT - 16 FUNCIONES CORREGIDAS
-- ============================================================================
-- Después de ejecutar, verificar en: Database → Linter
-- ============================================================================
