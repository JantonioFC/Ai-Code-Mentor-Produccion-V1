-- ================================================================================
-- AI CODE MENTOR - MISIÓN 146.5: PERSISTENCIA DE CONTENIDO GENERADO POR IA
-- ================================================================================
-- FASE 1: Infraestructura de Base de Datos - Tabla generated_content
-- Objetivo: Implementar persistencia para lecciones generadas por IA
-- Versión: 1.0 - Implementación inicial
-- Generado: 2025-09-14 por Mentor Coder según directiva Supervisor
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MISIÓN 146.5 FASE 1: CREANDO TABLA generated_content ===';
END $$;

-- ================================================================================
-- PASO 1: CREAR TABLA generated_content
-- ================================================================================

CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    semana_id INTEGER NOT NULL,
    dia_index INTEGER NOT NULL,
    pomodoro_index INTEGER NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================
-- PASO 2: CREAR ÍNDICES PARA PERFORMANCE
-- ================================================================================

DO $$
BEGIN
    -- Índice compuesto para búsquedas por usuario y ubicación del contenido
    CREATE INDEX IF NOT EXISTS idx_generated_content_user_location 
    ON generated_content(user_id, semana_id, dia_index, pomodoro_index);
    
    -- Índice para búsquedas por usuario
    CREATE INDEX IF NOT EXISTS idx_generated_content_user_id 
    ON generated_content(user_id);
    
    -- Índice para ordenamiento por fecha
    CREATE INDEX IF NOT EXISTS idx_generated_content_created_at 
    ON generated_content(created_at);
    
    RAISE NOTICE '✅ Índices created_at creados exitosamente';
END $$;

-- ================================================================================
-- PASO 3: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ================================================================================

-- Habilitar RLS en la tabla
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
DO $$
BEGIN
    -- Política para SELECT: usuarios pueden ver solo su propio contenido
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_content' 
        AND policyname = 'Users can view own generated content'
    ) THEN
        CREATE POLICY "Users can view own generated content" 
        ON generated_content FOR SELECT 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política SELECT creada';
    END IF;
    
    -- Política para INSERT: usuarios pueden insertar solo en su nombre
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_content' 
        AND policyname = 'Users can insert own generated content'
    ) THEN
        CREATE POLICY "Users can insert own generated content" 
        ON generated_content FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Política INSERT creada';
    END IF;
    
    -- Política para UPDATE: usuarios pueden actualizar solo su contenido
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_content' 
        AND policyname = 'Users can update own generated content'
    ) THEN
        CREATE POLICY "Users can update own generated content" 
        ON generated_content FOR UPDATE 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política UPDATE creada';
    END IF;
    
    -- Política para DELETE: usuarios pueden eliminar solo su contenido
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_content' 
        AND policyname = 'Users can delete own generated content'
    ) THEN
        CREATE POLICY "Users can delete own generated content" 
        ON generated_content FOR DELETE 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política DELETE creada';
    END IF;
    
    RAISE NOTICE '✅ RLS configurado exitosamente para generated_content';
END $$;

-- ================================================================================
-- PASO 4: VALIDACIÓN FINAL
-- ================================================================================

DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
    rls_enabled BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== VALIDACIÓN FINAL TABLA generated_content ===';
    
    -- Verificar que la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'generated_content'
    ) INTO table_exists;
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'generated_content';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'generated_content';
    
    -- Verificar que RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'generated_content';
    
    -- Reporte final
    RAISE NOTICE '📊 MÉTRICAS DE VALIDACIÓN:';
    RAISE NOTICE '   • Tabla generated_content existe: %', table_exists;
    RAISE NOTICE '   • Índices creados: %', index_count;
    RAISE NOTICE '   • Políticas RLS: %', policy_count;
    RAISE NOTICE '   • RLS habilitado: %', rls_enabled;
    
    IF table_exists AND index_count >= 3 AND policy_count >= 4 AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 FASE 1 COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '✅ Tabla generated_content creada con esquema completo';
        RAISE NOTICE '✅ Índices optimizados para performance implementados';
        RAISE NOTICE '✅ RLS configurado para seguridad granular por usuario';
        RAISE NOTICE '✅ Políticas CRUD completas implementadas';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 LISTO PARA FASE 2: Implementación de APIs';
    ELSE
        RAISE NOTICE '⚠️ FASE 1 INCOMPLETA - Revisar métricas anteriores';
    END IF;
    
    RAISE NOTICE '=== FIN VALIDACIÓN ===';
END $$;

-- ================================================================================
-- MIGRACIÓN 001 COMPLETADA - TABLA generated_content
-- ================================================================================
-- 
-- TABLA CREADA: generated_content con las siguientes columnas:
-- • id (UUID, PK) - Identificador único auto-generado
-- • user_id (UUID, FK) - Referencia a auth.users(id)
-- • semana_id (INTEGER) - Identificador de la semana
-- • dia_index (INTEGER) - Índice del día (0-4)
-- • pomodoro_index (INTEGER) - Índice del pomodoro (0-3)
-- • content (JSONB) - Contenido de la lección generada en formato JSON
-- • created_at (TIMESTAMP) - Fecha y hora de creación
--
-- SEGURIDAD:
-- • RLS habilitado con políticas granulares por usuario
-- • Foreign key cascade delete para integridad referencial
-- • Políticas para SELECT, INSERT, UPDATE, DELETE
--
-- PERFORMANCE:
-- • Índice compuesto para búsquedas por ubicación
-- • Índice por usuario para consultas de perfil
-- • Índice por fecha para ordenamiento temporal
--
-- READY FOR FASE 2: IMPLEMENTACIÓN DE APIs
-- ================================================================================