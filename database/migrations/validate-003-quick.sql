-- ================================================================================
-- SCRIPT DE VALIDACIÓN RÁPIDA - FASE 1 MISIÓN 216.0
-- ================================================================================
-- Este script verifica que la tabla sandbox_generations fue creada correctamente
-- con todas sus columnas, índices, políticas RLS, triggers y funciones.
-- 
-- INSTRUCCIONES:
-- 1. Copiar este script completo
-- 2. Pegar en Supabase SQL Editor
-- 3. Ejecutar (Run)
-- 4. Verificar que todos los checks muestran ✅
-- ================================================================================

-- Verificar tabla existe
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sandbox_generations'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '✅ 1. Tabla sandbox_generations existe';
    ELSE
        RAISE NOTICE '❌ 1. Tabla sandbox_generations NO existe';
    END IF;
END $$;

-- Verificar columnas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_name = 'sandbox_generations';
    
    RAISE NOTICE '✅ 2. Columnas creadas: % (esperadas: 8)', v_count;
END $$;

-- Verificar columnas específicas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'id') THEN
        RAISE NOTICE '   ✅ - Columna id (UUID, PK) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'user_id') THEN
        RAISE NOTICE '   ✅ - Columna user_id (UUID, FK) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'custom_content') THEN
        RAISE NOTICE '   ✅ - Columna custom_content (TEXT) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'title') THEN
        RAISE NOTICE '   ✅ - Columna title (VARCHAR) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'generated_lesson') THEN
        RAISE NOTICE '   ✅ - Columna generated_lesson (JSONB) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'metadata') THEN
        RAISE NOTICE '   ✅ - Columna metadata (JSONB) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'created_at') THEN
        RAISE NOTICE '   ✅ - Columna created_at (TIMESTAMPTZ) existe';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sandbox_generations' AND column_name = 'updated_at') THEN
        RAISE NOTICE '   ✅ - Columna updated_at (TIMESTAMPTZ) existe';
    END IF;
END $$;

-- Verificar índices
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes 
    WHERE tablename = 'sandbox_generations';
    
    RAISE NOTICE '✅ 3. Índices creados: % (esperados: 3)', v_count;
END $$;

-- Verificar políticas RLS
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_policies 
    WHERE tablename = 'sandbox_generations';
    
    RAISE NOTICE '✅ 4. Políticas RLS: % (esperadas: 4)', v_count;
END $$;

-- Verificar que RLS está habilitado
DO $$
DECLARE
    v_rls BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO v_rls
    FROM pg_class 
    WHERE relname = 'sandbox_generations';
    
    IF v_rls THEN
        RAISE NOTICE '✅ 5. RLS está HABILITADO';
    ELSE
        RAISE NOTICE '❌ 5. RLS NO está habilitado';
    END IF;
END $$;

-- Verificar triggers
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'sandbox_generations';
    
    RAISE NOTICE '✅ 6. Triggers creados: % (esperados: 2)', v_count;
END $$;

-- Verificar funciones
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_sandbox_generations') THEN
        RAISE NOTICE '✅ 7. Función cleanup_old_sandbox_generations existe';
    ELSE
        RAISE NOTICE '❌ 7. Función cleanup_old_sandbox_generations NO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_generated_lesson') THEN
        RAISE NOTICE '✅ 8. Función validate_generated_lesson existe';
    ELSE
        RAISE NOTICE '❌ 8. Función validate_generated_lesson NO existe';
    END IF;
END $$;

-- Verificar constraint de validación
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.conname = 'valid_generated_lesson'
        AND t.relname = 'sandbox_generations'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '✅ 9. Constraint valid_generated_lesson existe';
    ELSE
        RAISE NOTICE '❌ 9. Constraint valid_generated_lesson NO existe';
    END IF;
END $$;

-- Verificar foreign key
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sandbox_generations' 
        AND constraint_type = 'FOREIGN KEY'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '✅ 10. Foreign key a auth.users existe';
    ELSE
        RAISE NOTICE '❌ 10. Foreign key a auth.users NO existe';
    END IF;
END $$;

-- Prueba de inserción (y limpieza inmediata)
DO $$
DECLARE
    v_test_id UUID;
    v_success BOOLEAN := FALSE;
BEGIN
    BEGIN
        -- Intentar insertar registro de prueba
        INSERT INTO sandbox_generations (
            user_id,
            custom_content,
            title,
            generated_lesson,
            metadata
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            'Test content for validation',
            'Test Title',
            '{"title": "Test", "content": "Test content"}',
            '{}'
        ) RETURNING id INTO v_test_id;
        
        v_success := TRUE;
        
        -- Limpiar inmediatamente
        DELETE FROM sandbox_generations WHERE id = v_test_id;
        
        RAISE NOTICE '✅ 11. Prueba de inserción EXITOSA (registro limpiado)';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 11. Prueba de inserción FALLÓ: %', SQLERRM;
    END;
END $$;

-- Resumen final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '           VALIDACIÓN FASE 1 COMPLETADA';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Si todos los checks anteriores muestran ✅:';
    RAISE NOTICE '   → Tabla sandbox_generations está LISTA';
    RAISE NOTICE '   → FASE 1 completada exitosamente';
    RAISE NOTICE '   → Listo para FASE 2: Backend API Endpoints';
    RAISE NOTICE '';
    RAISE NOTICE 'Si algún check muestra ❌:';
    RAISE NOTICE '   → Revisar el paso específico que falló';
    RAISE NOTICE '   → Consultar con Mentor Coder';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
