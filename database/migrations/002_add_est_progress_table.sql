-- ================================================================================
-- AI CODE MENTOR - MISIÓN 157: PERSISTENCIA DEL ESQUEMA SEMANAL DE TRABAJO (EST)
-- ================================================================================
-- FASE 1: Capa de Datos - Tabla est_progress
-- Objetivo: Implementar persistencia para checklist interactivo del EST
-- Versión: 1.0 - Implementación inicial
-- Generado: 2025-09-16 por Mentor Coder según directiva Supervisor
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MISIÓN 157 FASE 1: CREANDO TABLA est_progress ===';
    RAISE NOTICE 'Objetivo: Persistir progreso del checklist EST por usuario y semana';
END $$;

-- ================================================================================
-- PASO 1: CREAR TABLA est_progress
-- ================================================================================

CREATE TABLE IF NOT EXISTS est_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    semana_id INTEGER NOT NULL,
    checked_state JSONB NOT NULL DEFAULT '{"ejercicios": false, "miniProyecto": false, "dma": false, "commits": false}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Un registro único por usuario y semana
    UNIQUE(user_id, semana_id)
);

-- ================================================================================
-- PASO 2: CREAR FUNCIÓN TRIGGER PARA updated_at
-- ================================================================================

-- Crear función si no existe (reutilizable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ================================================================================
-- PASO 3: CREAR TRIGGER PARA ACTUALIZAR updated_at
-- ================================================================================

DO $$
BEGIN
    -- Crear trigger para updated_at automático
    DROP TRIGGER IF EXISTS update_est_progress_updated_at ON est_progress;
    CREATE TRIGGER update_est_progress_updated_at
        BEFORE UPDATE ON est_progress
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Trigger update_est_progress_updated_at creado';
END $$;

-- ================================================================================
-- PASO 4: CREAR ÍNDICES PARA PERFORMANCE
-- ================================================================================

DO $$
BEGIN
    -- Índice compuesto principal (user_id, semana_id) - CRÍTICO para consultas
    CREATE INDEX IF NOT EXISTS idx_est_progress_user_semana 
    ON est_progress(user_id, semana_id);
    
    -- Índice para búsquedas por usuario
    CREATE INDEX IF NOT EXISTS idx_est_progress_user_id 
    ON est_progress(user_id);
    
    -- Índice para ordenamiento por fecha de actualización
    CREATE INDEX IF NOT EXISTS idx_est_progress_updated_at 
    ON est_progress(updated_at);
    
    -- Índice para semana_id (útil para reportes por semana)
    CREATE INDEX IF NOT EXISTS idx_est_progress_semana_id 
    ON est_progress(semana_id);
    
    RAISE NOTICE '✅ Índices de performance creados exitosamente';
END $$;

-- ================================================================================
-- PASO 5: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ================================================================================

-- Habilitar RLS en la tabla
ALTER TABLE est_progress ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
DO $$
BEGIN
    -- Política para SELECT: usuarios pueden ver solo su propio progreso EST
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'est_progress' 
        AND policyname = 'Users can view own EST progress'
    ) THEN
        CREATE POLICY "Users can view own EST progress" 
        ON est_progress FOR SELECT 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política SELECT creada';
    END IF;
    
    -- Política para INSERT: usuarios pueden insertar solo en su nombre
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'est_progress' 
        AND policyname = 'Users can insert own EST progress'
    ) THEN
        CREATE POLICY "Users can insert own EST progress" 
        ON est_progress FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Política INSERT creada';
    END IF;
    
    -- Política para UPDATE: usuarios pueden actualizar solo su progreso
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'est_progress' 
        AND policyname = 'Users can update own EST progress'
    ) THEN
        CREATE POLICY "Users can update own EST progress" 
        ON est_progress FOR UPDATE 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política UPDATE creada';
    END IF;
    
    -- Política para DELETE: usuarios pueden eliminar solo su progreso
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'est_progress' 
        AND policyname = 'Users can delete own EST progress'
    ) THEN
        CREATE POLICY "Users can delete own EST progress" 
        ON est_progress FOR DELETE 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política DELETE creada';
    END IF;
    
    RAISE NOTICE '✅ RLS configurado exitosamente para est_progress';
END $$;

-- ================================================================================
-- PASO 6: VALIDACIÓN DE ESQUEMA JSONB checked_state
-- ================================================================================

-- Función para validar estructura del checked_state
CREATE OR REPLACE FUNCTION validate_checked_state(checked_state JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que contiene las 4 claves esperadas del EST
    IF NOT (
        checked_state ? 'ejercicios' AND
        checked_state ? 'miniProyecto' AND
        checked_state ? 'dma' AND
        checked_state ? 'commits'
    ) THEN
        RAISE EXCEPTION 'checked_state debe contener las claves: ejercicios, miniProyecto, dma, commits';
    END IF;
    
    -- Verificar que todos los valores son boolean
    IF NOT (
        jsonb_typeof(checked_state->'ejercicios') = 'boolean' AND
        jsonb_typeof(checked_state->'miniProyecto') = 'boolean' AND
        jsonb_typeof(checked_state->'dma') = 'boolean' AND
        jsonb_typeof(checked_state->'commits') = 'boolean'
    ) THEN
        RAISE EXCEPTION 'Todos los valores en checked_state deben ser boolean';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE 'plpgsql';

-- Agregar constraint para validar checked_state
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_checked_state'
        AND table_name = 'est_progress'
    ) THEN
        ALTER TABLE est_progress 
        ADD CONSTRAINT valid_checked_state 
        CHECK (validate_checked_state(checked_state));
        
        RAISE NOTICE '✅ Constraint de validación checked_state agregado';
    ELSE
        RAISE NOTICE '✅ Constraint checked_state ya existe';
    END IF;
END $$;

-- ================================================================================
-- PASO 7: VALIDACIÓN FINAL COMPLETA
-- ================================================================================

DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    column_count INTEGER := 0;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
    constraint_count INTEGER := 0;
    trigger_exists BOOLEAN := FALSE;
    rls_enabled BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== VALIDACIÓN FINAL TABLA est_progress ===';
    
    -- Verificar que la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'est_progress'
    ) INTO table_exists;
    
    -- Contar columnas
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'est_progress';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'est_progress';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'est_progress';
    
    -- Contar constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.check_constraints 
    WHERE table_name = 'est_progress';
    
    -- Verificar trigger
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_est_progress_updated_at'
    ) INTO trigger_exists;
    
    -- Verificar que RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'est_progress';
    
    -- Reporte detallado
    RAISE NOTICE '📊 MÉTRICAS DE VALIDACIÓN:';
    RAISE NOTICE '   • Tabla est_progress existe: %', table_exists;
    RAISE NOTICE '   • Columnas creadas: % (esperadas: 5)', column_count;
    RAISE NOTICE '   • Índices creados: % (esperadas: 4)', index_count;
    RAISE NOTICE '   • Políticas RLS: % (esperadas: 4)', policy_count;
    RAISE NOTICE '   • Constraints: % (esperada: 1+)', constraint_count;
    RAISE NOTICE '   • Trigger updated_at: %', trigger_exists;
    RAISE NOTICE '   • RLS habilitado: %', rls_enabled;
    
    -- Validación de estructura de columnas específica
    IF table_exists THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'est_progress' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna id (UUID, PK) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'est_progress' AND column_name = 'user_id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna user_id (UUID, FK) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'est_progress' AND column_name = 'semana_id' AND data_type = 'integer'
        ) THEN
            RAISE NOTICE '   ✅ Columna semana_id (INTEGER) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'est_progress' AND column_name = 'checked_state' AND data_type = 'jsonb'
        ) THEN
            RAISE NOTICE '   ✅ Columna checked_state (JSONB) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'est_progress' AND column_name = 'updated_at' 
            AND data_type = 'timestamp with time zone'
        ) THEN
            RAISE NOTICE '   ✅ Columna updated_at (TIMESTAMPTZ) creada correctamente';
        END IF;
    END IF;
    
    -- Verificar constraint UNIQUE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'est_progress' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '   ✅ Constraint UNIQUE (user_id, semana_id) creado correctamente';
    END IF;
    
    -- Verificar foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'est_progress' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '   ✅ Foreign key a auth.users(id) creado correctamente';
    END IF;
    
    -- Evaluación final
    IF table_exists AND column_count = 5 AND index_count >= 4 AND policy_count >= 4 
       AND constraint_count >= 1 AND trigger_exists AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 FASE 1 COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '✅ Tabla est_progress creada con esquema completo según especificación';
        RAISE NOTICE '✅ Índice compuesto (user_id, semana_id) implementado para performance';
        RAISE NOTICE '✅ RLS configurado para seguridad granular por usuario';
        RAISE NOTICE '✅ Trigger automático updated_at configurado';
        RAISE NOTICE '✅ Constraint UNIQUE previene duplicados usuario+semana';
        RAISE NOTICE '✅ Validación JSONB garantiza estructura correcta del checklist';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 LISTO PARA FASE 2: Implementación de Backend API';
        RAISE NOTICE '📋 Próximo paso: Crear /api/est/[weekId].js con handlers GET/POST';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ FASE 1 INCOMPLETA - Revisar métricas anteriores';
        RAISE NOTICE 'Posibles problemas:';
        IF NOT table_exists THEN RAISE NOTICE '   • Tabla no fue creada'; END IF;
        IF column_count != 5 THEN RAISE NOTICE '   • Columnas incorrectas (esperadas 5, encontradas %)', column_count; END IF;
        IF index_count < 4 THEN RAISE NOTICE '   • Índices faltantes'; END IF;
        IF policy_count < 4 THEN RAISE NOTICE '   • Políticas RLS faltantes'; END IF;
        IF NOT trigger_exists THEN RAISE NOTICE '   • Trigger updated_at faltante'; END IF;
        IF NOT rls_enabled THEN RAISE NOTICE '   • RLS no habilitado'; END IF;
    END IF;
    
    RAISE NOTICE '=== FIN VALIDACIÓN FASE 1 ===';
END $$;

-- ================================================================================
-- MIGRACIÓN 002 COMPLETADA - TABLA est_progress
-- ================================================================================
-- 
-- TABLA CREADA: est_progress con las siguientes columnas:
-- • id (UUID, PK) - Identificador único auto-generado
-- • user_id (UUID, FK) - Referencia a auth.users(id) con CASCADE DELETE
-- • semana_id (INTEGER, NOT NULL) - Identificador de la semana (1-100)
-- • checked_state (JSONB, NOT NULL) - Estado del checklist EST con default
-- • updated_at (TIMESTAMPTZ) - Timestamp de última actualización automática
--
-- CARACTERÍSTICAS TÉCNICAS:
-- • UNIQUE CONSTRAINT en (user_id, semana_id) previene duplicados
-- • JSONB VALIDATION garantiza estructura correcta del checklist EST
-- • TRIGGER automático actualiza updated_at en cada UPDATE
-- • ÍNDICE COMPUESTO (user_id, semana_id) para consultas optimizadas
--
-- SEGURIDAD:
-- • RLS habilitado con políticas granulares por usuario
-- • Foreign key cascade delete para integridad referencial
-- • Políticas para SELECT, INSERT, UPDATE, DELETE
--
-- PERFORMANCE:
-- • Índice compuesto principal (user_id, semana_id)
-- • Índices individuales para user_id, semana_id, updated_at
-- • Optimizado para consultas de progreso por usuario y semana
--
-- ESTRUCTURA JSONB checked_state DEFAULT:
-- {
--   "ejercicios": false,
--   "miniProyecto": false,
--   "dma": false,
--   "commits": false
-- }
--
-- READY FOR FASE 2: IMPLEMENTACIÓN DE BACKEND API /api/est/[weekId].js
-- ================================================================================