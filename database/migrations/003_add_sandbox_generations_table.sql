-- ================================================================================
-- AI CODE MENTOR - MISIÓN 216.0: EVOLUCIÓN DEL SANDBOX DE APRENDIZAJE (v2.0)
-- ================================================================================
-- FASE 1: Capa de Datos - Tabla sandbox_generations
-- Objetivo: Implementar persistencia para historial de generaciones del Sandbox
-- Versión: 1.1 - CORRECCIÓN CRÍTICA: Fix queries information_schema
-- Generado: 2025-10-08 por Mentor Coder según directiva Supervisor
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MISIÓN 216.0 FASE 1: CREANDO TABLA sandbox_generations ===';
    RAISE NOTICE 'Objetivo: Persistir historial de las últimas 20 generaciones por usuario';
END $$;

-- ================================================================================
-- PASO 1: CREAR TABLA sandbox_generations
-- ================================================================================

CREATE TABLE IF NOT EXISTS sandbox_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contenido de entrada del usuario (input)
    custom_content TEXT NOT NULL,
    
    -- Título generado automáticamente (primeras 5-7 palabras del input)
    title VARCHAR(100) NOT NULL,
    
    -- Lección generada (output completo incluyendo ejercicios)
    generated_lesson JSONB NOT NULL,
    
    -- Metadata adicional (opcional para extensibilidad futura)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================
-- PASO 2: CREAR FUNCIÓN TRIGGER PARA updated_at
-- ================================================================================

-- Reutilizar función existente update_updated_at_column() si ya existe
-- Si no existe, la función ya fue creada en migración 002

-- ================================================================================
-- PASO 3: CREAR TRIGGER PARA ACTUALIZAR updated_at
-- ================================================================================

DO $$
BEGIN
    -- Crear trigger para updated_at automático
    DROP TRIGGER IF EXISTS update_sandbox_generations_updated_at ON sandbox_generations;
    CREATE TRIGGER update_sandbox_generations_updated_at
        BEFORE UPDATE ON sandbox_generations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Trigger update_sandbox_generations_updated_at creado';
END $$;

-- ================================================================================
-- PASO 4: CREAR ÍNDICES PARA PERFORMANCE
-- ================================================================================

DO $$
BEGIN
    -- Índice principal para consultas por usuario ordenadas por fecha (DESC para mostrar más recientes primero)
    CREATE INDEX IF NOT EXISTS idx_sandbox_generations_user_created 
    ON sandbox_generations(user_id, created_at DESC);
    
    -- Índice para búsquedas por usuario
    CREATE INDEX IF NOT EXISTS idx_sandbox_generations_user_id 
    ON sandbox_generations(user_id);
    
    -- Índice para ordenamiento por fecha de creación (DESC para queries de historial)
    CREATE INDEX IF NOT EXISTS idx_sandbox_generations_created_at 
    ON sandbox_generations(created_at DESC);
    
    RAISE NOTICE '✅ Índices de performance creados exitosamente';
END $$;

-- ================================================================================
-- PASO 5: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ================================================================================

-- Habilitar RLS en la tabla
ALTER TABLE sandbox_generations ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
DO $$
BEGIN
    -- Política para SELECT: usuarios pueden ver solo sus propias generaciones
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sandbox_generations' 
        AND policyname = 'Users can view own sandbox generations'
    ) THEN
        CREATE POLICY "Users can view own sandbox generations" 
        ON sandbox_generations FOR SELECT 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política SELECT creada';
    END IF;
    
    -- Política para INSERT: usuarios pueden insertar solo en su nombre
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sandbox_generations' 
        AND policyname = 'Users can insert own sandbox generations'
    ) THEN
        CREATE POLICY "Users can insert own sandbox generations" 
        ON sandbox_generations FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Política INSERT creada';
    END IF;
    
    -- Política para UPDATE: usuarios pueden actualizar solo sus generaciones
    -- (Nota: En práctica, no se espera UPDATE frecuente, pero incluido por completitud)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sandbox_generations' 
        AND policyname = 'Users can update own sandbox generations'
    ) THEN
        CREATE POLICY "Users can update own sandbox generations" 
        ON sandbox_generations FOR UPDATE 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política UPDATE creada';
    END IF;
    
    -- Política para DELETE: usuarios pueden eliminar solo sus generaciones
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sandbox_generations' 
        AND policyname = 'Users can delete own sandbox generations'
    ) THEN
        CREATE POLICY "Users can delete own sandbox generations" 
        ON sandbox_generations FOR DELETE 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política DELETE creada';
    END IF;
    
    RAISE NOTICE '✅ RLS configurado exitosamente para sandbox_generations';
END $$;

-- ================================================================================
-- PASO 6: CREAR FUNCIÓN PARA LIMPIEZA AUTOMÁTICA (Límite de 20 generaciones)
-- ================================================================================

-- Función para mantener solo las últimas 20 generaciones por usuario
CREATE OR REPLACE FUNCTION cleanup_old_sandbox_generations()
RETURNS TRIGGER AS $$
DECLARE
    generation_count INTEGER;
    excess_count INTEGER;
BEGIN
    -- Contar cuántas generaciones tiene el usuario
    SELECT COUNT(*) INTO generation_count
    FROM sandbox_generations
    WHERE user_id = NEW.user_id;
    
    -- Si excede 20, eliminar las más antiguas
    IF generation_count > 20 THEN
        excess_count := generation_count - 20;
        
        -- Eliminar las generaciones más antiguas que exceden el límite
        DELETE FROM sandbox_generations
        WHERE id IN (
            SELECT id
            FROM sandbox_generations
            WHERE user_id = NEW.user_id
            ORDER BY created_at ASC
            LIMIT excess_count
        );
        
        RAISE NOTICE 'Limpieza automática: % generaciones antiguas eliminadas para user_id %', 
                     excess_count, NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ================================================================================
-- PASO 7: CREAR TRIGGER PARA LIMPIEZA AUTOMÁTICA
-- ================================================================================

DO $$
BEGIN
    -- Crear trigger que se ejecuta DESPUÉS de cada INSERT
    DROP TRIGGER IF EXISTS trigger_cleanup_sandbox_generations ON sandbox_generations;
    CREATE TRIGGER trigger_cleanup_sandbox_generations
        AFTER INSERT ON sandbox_generations
        FOR EACH ROW
        EXECUTE FUNCTION cleanup_old_sandbox_generations();
    
    RAISE NOTICE '✅ Trigger de limpieza automática creado (límite: 20 generaciones/usuario)';
END $$;

-- ================================================================================
-- PASO 8: VALIDACIÓN DE ESQUEMA JSONB generated_lesson
-- ================================================================================

-- Función para validar estructura básica del generated_lesson
CREATE OR REPLACE FUNCTION validate_generated_lesson(generated_lesson JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que contiene al menos las claves básicas esperadas
    -- (Flexible para permitir evolución del formato)
    IF NOT (
        generated_lesson ? 'title' OR
        generated_lesson ? 'content' OR
        generated_lesson ? 'summary'
    ) THEN
        RAISE EXCEPTION 'generated_lesson debe contener al menos una de las claves: title, content, summary';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE 'plpgsql';

-- Agregar constraint para validar generated_lesson
-- FIX v1.1: Usar pg_constraint en lugar de information_schema.check_constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.conname = 'valid_generated_lesson'
        AND t.relname = 'sandbox_generations'
    ) THEN
        ALTER TABLE sandbox_generations 
        ADD CONSTRAINT valid_generated_lesson 
        CHECK (validate_generated_lesson(generated_lesson));
        
        RAISE NOTICE '✅ Constraint de validación generated_lesson agregado';
    ELSE
        RAISE NOTICE '✅ Constraint generated_lesson ya existe';
    END IF;
END $$;

-- ================================================================================
-- PASO 9: VALIDACIÓN FINAL COMPLETA
-- ================================================================================

DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    column_count INTEGER := 0;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
    constraint_count INTEGER := 0;
    trigger_count INTEGER := 0;
    rls_enabled BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== VALIDACIÓN FINAL TABLA sandbox_generations ===';
    
    -- Verificar que la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sandbox_generations'
    ) INTO table_exists;
    
    -- Contar columnas
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'sandbox_generations';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'sandbox_generations';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'sandbox_generations';
    
    -- Contar constraints - FIX v1.1: Usar pg_constraint correctamente
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'sandbox_generations'
    AND c.contype = 'c';  -- 'c' = check constraint
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'sandbox_generations';
    
    -- Verificar que RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'sandbox_generations';
    
    -- Reporte detallado
    RAISE NOTICE '📊 MÉTRICAS DE VALIDACIÓN:';
    RAISE NOTICE '   • Tabla sandbox_generations existe: %', table_exists;
    RAISE NOTICE '   • Columnas creadas: % (esperadas: 8)', column_count;
    RAISE NOTICE '   • Índices creados: % (esperados: 3)', index_count;
    RAISE NOTICE '   • Políticas RLS: % (esperadas: 4)', policy_count;
    RAISE NOTICE '   • Constraints: % (esperada: 1)', constraint_count;
    RAISE NOTICE '   • Triggers: % (esperados: 2)', trigger_count;
    RAISE NOTICE '   • RLS habilitado: %', rls_enabled;
    
    -- Validación de estructura de columnas específica
    IF table_exists THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna id (UUID, PK) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'user_id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna user_id (UUID, FK) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'custom_content' AND data_type = 'text'
        ) THEN
            RAISE NOTICE '   ✅ Columna custom_content (TEXT) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'title' 
            AND data_type = 'character varying'
        ) THEN
            RAISE NOTICE '   ✅ Columna title (VARCHAR) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'generated_lesson' AND data_type = 'jsonb'
        ) THEN
            RAISE NOTICE '   ✅ Columna generated_lesson (JSONB) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'metadata' AND data_type = 'jsonb'
        ) THEN
            RAISE NOTICE '   ✅ Columna metadata (JSONB) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generations' AND column_name = 'created_at' 
            AND data_type = 'timestamp with time zone'
        ) THEN
            RAISE NOTICE '   ✅ Columna created_at (TIMESTAMPTZ) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sandbox_generators' AND column_name = 'updated_at' 
            AND data_type = 'timestamp with time zone'
        ) THEN
            RAISE NOTICE '   ✅ Columna updated_at (TIMESTAMPTZ) creada correctamente';
        END IF;
    END IF;
    
    -- Verificar foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sandbox_generations' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '   ✅ Foreign key a auth.users(id) creado correctamente';
    END IF;
    
    -- Verificar función de limpieza automática
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'cleanup_old_sandbox_generations'
    ) THEN
        RAISE NOTICE '   ✅ Función cleanup_old_sandbox_generations creada';
    END IF;
    
    -- Verificar función de validación
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'validate_generated_lesson'
    ) THEN
        RAISE NOTICE '   ✅ Función validate_generated_lesson creada';
    END IF;
    
    -- Evaluación final
    IF table_exists AND column_count = 8 AND index_count >= 3 AND policy_count >= 4 
       AND constraint_count >= 1 AND trigger_count >= 2 AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 FASE 1 COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '✅ Tabla sandbox_generations creada con esquema completo';
        RAISE NOTICE '✅ Campo title implementado para mejor UX en historial';
        RAISE NOTICE '✅ Índice compuesto (user_id, created_at DESC) para performance';
        RAISE NOTICE '✅ RLS configurado para seguridad granular por usuario';
        RAISE NOTICE '✅ Triggers automáticos: updated_at + limpieza 20 generaciones';
        RAISE NOTICE '✅ Validación JSONB garantiza estructura correcta';
        RAISE NOTICE '✅ Limpieza automática mantiene solo últimas 20 generaciones/usuario';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 LISTO PARA FASE 2: Implementación de Backend API';
        RAISE NOTICE '📋 Próximo paso: Crear endpoints POST/GET /api/v1/sandbox/history';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ FASE 1 INCOMPLETA - Revisar métricas anteriores';
        RAISE NOTICE 'Posibles problemas:';
        IF NOT table_exists THEN RAISE NOTICE '   • Tabla no fue creada'; END IF;
        IF column_count != 8 THEN RAISE NOTICE '   • Columnas incorrectas (esperadas 8, encontradas %)', column_count; END IF;
        IF index_count < 3 THEN RAISE NOTICE '   • Índices faltantes'; END IF;
        IF policy_count < 4 THEN RAISE NOTICE '   • Políticas RLS faltantes'; END IF;
        IF trigger_count < 2 THEN RAISE NOTICE '   • Triggers faltantes'; END IF;
        IF NOT rls_enabled THEN RAISE NOTICE '   • RLS no habilitado'; END IF;
    END IF;
    
    RAISE NOTICE '=== FIN VALIDACIÓN FASE 1 ===';
END $$;

-- ================================================================================
-- MIGRACIÓN 003 COMPLETADA - TABLA sandbox_generations (v1.1)
-- ================================================================================
-- 
-- VERSIÓN 1.1 CHANGELOG:
-- • FIX: Corregida query en PASO 8 para usar pg_constraint en lugar de information_schema
-- • FIX: Corregida query en PASO 9 para contar constraints usando pg_constraint
-- 
-- TABLA CREADA: sandbox_generations con las siguientes columnas:
-- • id (UUID, PK) - Identificador único auto-generado
-- • user_id (UUID, FK) - Referencia a auth.users(id) con CASCADE DELETE
-- • custom_content (TEXT, NOT NULL) - Contenido de entrada del usuario
-- • title (VARCHAR(100), NOT NULL) - Título generado (primeras 5-7 palabras)
-- • generated_lesson (JSONB, NOT NULL) - Lección completa generada
-- • metadata (JSONB) - Metadata adicional extensible
-- • created_at (TIMESTAMPTZ) - Timestamp de creación
-- • updated_at (TIMESTAMPTZ) - Timestamp de última actualización automática
--
-- CARACTERÍSTICAS TÉCNICAS:
-- • JSONB VALIDATION garantiza estructura básica del generated_lesson
-- • TRIGGER automático actualiza updated_at en cada UPDATE
-- • TRIGGER automático de limpieza mantiene solo últimas 20 generaciones/usuario
-- • ÍNDICE COMPUESTO (user_id, created_at DESC) para consultas optimizadas
--
-- SEGURIDAD:
-- • RLS habilitado con políticas granulares por usuario
-- • Foreign key cascade delete para integridad referencial
-- • Políticas para SELECT, INSERT, UPDATE, DELETE
--
-- PERFORMANCE:
-- • Índice compuesto principal (user_id, created_at DESC)
-- • Índices individuales para user_id y created_at DESC
-- • Optimizado para consultas de historial ordenado por fecha
--
-- LÓGICA DE NEGOCIO:
-- • Limpieza automática: Solo se mantienen las últimas 20 generaciones por usuario
-- • Ordenamiento: Descendente por fecha (más recientes primero)
-- • Título UX: Campo dedicado para mostrar en listas de historial
--
-- READY FOR FASE 2: IMPLEMENTACIÓN DE BACKEND API /api/v1/sandbox/history
-- ================================================================================
