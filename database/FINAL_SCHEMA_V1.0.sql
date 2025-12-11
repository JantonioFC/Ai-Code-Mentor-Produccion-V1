-- ================================================================================
-- AI CODE MENTOR V5 - REBUILD SCHEMA SCRIPT V11 (LÓGICA CORREGIDA)
-- ================================================================================
-- MISIÓN 107.1: CORRECCIÓN LÓGICA CRÍTICA - attempts_count y optimizaciones
-- Objetivo: Corregir lógica defectuosa del trigger attempts_count + mejoras menores
-- Versión: 11.0 LÓGICA CORREGIDA - Arquitectura depurada según análisis técnico
-- Correcciones: Trigger attempts_count, validación precisa, verificaciones optimizadas
-- Generado: 2025-09-10 por Mentor Coder según revisión Arquitecto Supervisor
-- ================================================================================
--
-- CORRECCIONES IMPLEMENTADAS:
-- ❌ FALLA CRÍTICA CORREGIDA: attempts_count lógica defectuosa eliminada del trigger
-- ✅ LÓGICA CORREGIDA: attempts_count se maneja por aplicación, no por trigger
-- ✅ VALIDACIÓN PRECISA: user_profiles = 8 columnas exactas (no >= 7)
-- ✅ VERIFICACIÓN OPTIMIZADA: Redundancia del Paso 3 eliminada
-- ✅ DEPENDENCIA VERIFICADA: auth.users existencia confirmada
--
-- ESTE SCRIPT CORRIGE LA FALLA LÓGICA Y APLICA OPTIMIZACIONES TÉCNICAS
-- ================================================================================

-- ================================================================================
-- SECCIÓN 0: DIAGNÓSTICO Y VERIFICACIÓN DE DEPENDENCIAS
-- ================================================================================

DO $$
DECLARE
    user_profiles_exists BOOLEAN := FALSE;
    auth_users_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== DIAGNÓSTICO Y VERIFICACIÓN DE DEPENDENCIAS ===';
    
    -- VERIFICACIÓN CRÍTICA: auth.users debe existir para foreign keys
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO auth_users_exists;
    
    IF auth_users_exists THEN
        RAISE NOTICE '✅ Dependencia crítica: auth.users EXISTE';
    ELSE
        RAISE NOTICE '❌ FALLO CRÍTICO: auth.users NO EXISTE';
        RAISE NOTICE '🔧 SOLUCIÓN: Verificar configuración Supabase Auth';
        RAISE EXCEPTION 'Script detenido: auth.users es requerido para foreign keys';
    END IF;
    
    -- Verificar si user_profiles existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) INTO user_profiles_exists;
    
    IF user_profiles_exists THEN
        RAISE NOTICE '⚠️ Tabla user_profiles: EXISTE - Verificando estructura...';
    ELSE
        RAISE NOTICE '❌ Tabla user_profiles: NO EXISTE - Se creará completa';
    END IF;
    
    -- Verificar otras tablas críticas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
        RAISE NOTICE '✅ Tabla quiz_attempts: EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabla quiz_attempts: NO EXISTE - Se creará';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_lesson_progress') THEN
        RAISE NOTICE '✅ Tabla user_lesson_progress: EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabla user_lesson_progress: NO EXISTE - Se creará';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_exercise_progress') THEN
        RAISE NOTICE '✅ Tabla user_exercise_progress: EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabla user_exercise_progress: NO EXISTE - Se creará';
    END IF;
    
    RAISE NOTICE '=== FIN DIAGNÓSTICO ===';
END $$;

-- ================================================================================
-- SECCIÓN 1: CREAR/MODIFICAR TABLA user_profiles - OPTIMIZADO
-- ================================================================================

-- PASO 1: Crear tabla completa si no existe
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    display_name VARCHAR(255),
    bio TEXT,
    learning_goals TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Agregar columnas faltantes individualmente
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CORRIGIENDO ESTRUCTURA user_profiles ===';
    
    -- email
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'email'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN email VARCHAR(255);
        RAISE NOTICE '✅ Columna email agregada';
    ELSE
        RAISE NOTICE '✅ Columna email ya existe';
    END IF;
    
    -- display_name
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'display_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(255);
        RAISE NOTICE '✅ Columna display_name agregada';
    ELSE
        RAISE NOTICE '✅ Columna display_name ya existe';
    END IF;
    
    -- bio
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'bio'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN bio TEXT;
        RAISE NOTICE '✅ Columna bio agregada';
    ELSE
        RAISE NOTICE '✅ Columna bio ya existe';
    END IF;
    
    -- learning_goals
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'learning_goals'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN learning_goals TEXT;
        RAISE NOTICE '✅ Columna learning_goals agregada';
    ELSE
        RAISE NOTICE '✅ Columna learning_goals ya existe';
    END IF;
    
    -- preferences
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'preferences'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Columna preferences agregada';
    ELSE
        RAISE NOTICE '✅ Columna preferences ya existe';
    END IF;
    
    -- created_at (CRÍTICO PARA ÍNDICES)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'created_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Columna created_at agregada (CRÍTICA PARA ÍNDICES)';
    ELSE
        RAISE NOTICE '✅ Columna created_at ya existe';
    END IF;
    
    -- updated_at (CRÍTICO PARA TRIGGERS)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Columna updated_at agregada (CRÍTICA PARA TRIGGERS)';
    ELSE
        RAISE NOTICE '✅ Columna updated_at ya existe';
    END IF;
    
    RAISE NOTICE '=== FIN CORRECCIÓN user_profiles ===';
END $$;

-- PASO 3: CREAR FUNCIÓN TRIGGER (SOLO UNA VEZ)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASO 4: CREAR ÍNDICES CON VERIFICACIÓN DEFENSIVA (SIN VERIFICACIÓN REDUNDANTE)
DO $$
BEGIN
    -- Índice email (solo si existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'email'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
        RAISE NOTICE '✅ Índice idx_user_profiles_email creado';
    ELSE
        RAISE NOTICE '⚠️ Índice email omitido - columna no existe';
    END IF;
    
    -- Índice created_at (solo si existe) - PREVIENE ERROR 42703
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'created_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
        RAISE NOTICE '✅ Índice idx_user_profiles_created_at creado (ERROR 42703 PREVENIDO)';
    ELSE
        RAISE NOTICE '⚠️ Índice created_at omitido - columna no existe (PREVIENE ERROR 42703)';
    END IF;
END $$;

-- PASO 5: CREAR TRIGGER SOLO SI COLUMNA updated_at EXISTE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_user_profiles_updated_at creado';
    ELSE
        RAISE NOTICE '⚠️ Trigger updated_at omitido - columna no existe';
    END IF;
    
    RAISE NOTICE '✅ user_profiles: Configuración optimizada completada';
END $$;

-- ================================================================================
-- SECCIÓN 2: CREAR/VERIFICAR TABLA quiz_attempts  
-- ================================================================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(255) NOT NULL,
    question_index INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quiz_attempts_user_id_fkey' 
        AND table_name = 'quiz_attempts'
    ) THEN
        ALTER TABLE quiz_attempts 
        ADD CONSTRAINT quiz_attempts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Foreign key agregada a quiz_attempts';
    END IF;
    
    RAISE NOTICE '✅ Tabla quiz_attempts: Estructura verificada';
END $$;

-- Crear índices con verificación defensiva
DO $$
BEGIN
    -- Índices básicos (estas columnas siempre existen en CREATE TABLE)
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson_id ON quiz_attempts(lesson_id);
    
    -- Índice created_at con verificación defensiva
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' AND column_name = 'created_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at);
        RAISE NOTICE '✅ Índices quiz_attempts creados exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Índice created_at omitido en quiz_attempts';
    END IF;
END $$;

-- ================================================================================
-- SECCIÓN 3: CREAR TABLA user_lesson_progress
-- ================================================================================

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_seconds INTEGER DEFAULT 0,
    progress_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Crear triggers con verificación defensiva
DO $$
BEGIN
    -- Trigger updated_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_lesson_progress' AND column_name = 'updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_user_lesson_progress_updated_at ON user_lesson_progress;
        CREATE TRIGGER update_user_lesson_progress_updated_at
            BEFORE UPDATE ON user_lesson_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger updated_at creado para user_lesson_progress';
    END IF;
END $$;

-- Función específica para completed_at
CREATE OR REPLACE FUNCTION set_lesson_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger completed_at
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_lesson_progress' AND column_name = 'completed_at'
    ) THEN
        DROP TRIGGER IF EXISTS set_user_lesson_progress_completed_at ON user_lesson_progress;
        CREATE TRIGGER set_user_lesson_progress_completed_at
            BEFORE UPDATE ON user_lesson_progress
            FOR EACH ROW
            EXECUTE FUNCTION set_lesson_completed_at();
        RAISE NOTICE '✅ Trigger completed_at creado para user_lesson_progress';
    END IF;
END $$;

-- Crear índices con verificación defensiva
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(completed);
    
    -- Índices de timestamp con verificación
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_lesson_progress' AND column_name = 'completed_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed_at ON user_lesson_progress(completed_at);
        RAISE NOTICE '✅ Índices user_lesson_progress creados exitosamente';
    END IF;
END $$;

-- ================================================================================
-- SECCIÓN 4: CREAR TABLA user_exercise_progress - LÓGICA CORREGIDA
-- ================================================================================

CREATE TABLE IF NOT EXISTS user_exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id VARCHAR(255) NOT NULL,
    lesson_id VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    attempts_count INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0 CHECK (best_score >= 0 AND best_score <= 100),
    time_spent_seconds INTEGER DEFAULT 0,
    solution_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- Crear trigger updated_at con verificación
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_exercise_progress' AND column_name = 'updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_user_exercise_progress_updated_at ON user_exercise_progress;
        CREATE TRIGGER update_user_exercise_progress_updated_at
            BEFORE UPDATE ON user_exercise_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger updated_at creado para user_exercise_progress';
    END IF;
END $$;

-- ✅ CORRECCIÓN CRÍTICA: Función exercise completed_at SIN attempts_count automático
CREATE OR REPLACE FUNCTION set_exercise_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- ✅ LÓGICA CORREGIDA: Solo maneja completed_at, NO attempts_count
    IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
        -- ❌ LÍNEA PROBLEMÁTICA ELIMINADA: NEW.attempts_count = NEW.attempts_count + 1;
    ELSIF NEW.completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger completed_at con lógica corregida
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_exercise_progress' AND column_name = 'completed_at'
    ) THEN
        DROP TRIGGER IF EXISTS set_user_exercise_progress_completed_at ON user_exercise_progress;
        CREATE TRIGGER set_user_exercise_progress_completed_at
            BEFORE UPDATE ON user_exercise_progress
            FOR EACH ROW
            EXECUTE FUNCTION set_exercise_completed_at();
        RAISE NOTICE '✅ Trigger completed_at creado (LÓGICA CORREGIDA: attempts_count manejado por aplicación)';
    END IF;
END $$;

-- Crear índices con verificación defensiva
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_exercise_progress_user_id ON user_exercise_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_exercise_progress_exercise_id ON user_exercise_progress(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_user_exercise_progress_lesson_id ON user_exercise_progress(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_user_exercise_progress_completed ON user_exercise_progress(completed);
    
    -- Índice completed_at con verificación
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_exercise_progress' AND column_name = 'completed_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_exercise_progress_completed_at ON user_exercise_progress(completed_at);
        RAISE NOTICE '✅ Índices user_exercise_progress creados exitosamente';
    END IF;
END $$;

-- ================================================================================
-- SECCIÓN 5: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ================================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- RLS para user_profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    -- RLS para quiz_attempts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Users can view own quiz attempts') THEN
        CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Users can insert own quiz attempts') THEN
        CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- RLS para user_lesson_progress
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can view own lesson progress') THEN
        CREATE POLICY "Users can view own lesson progress" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can insert own lesson progress') THEN
        CREATE POLICY "Users can insert own lesson progress" ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can update own lesson progress') THEN
        CREATE POLICY "Users can update own lesson progress" ON user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- RLS para user_exercise_progress
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_exercise_progress' AND policyname = 'Users can view own exercise progress') THEN
        CREATE POLICY "Users can view own exercise progress" ON user_exercise_progress FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_exercise_progress' AND policyname = 'Users can insert own exercise progress') THEN
        CREATE POLICY "Users can insert own exercise progress" ON user_exercise_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_exercise_progress' AND policyname = 'Users can update own exercise progress') THEN
        CREATE POLICY "Users can update own exercise progress" ON user_exercise_progress FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    RAISE NOTICE '✅ Políticas RLS configuradas exitosamente';
END $$;

-- ================================================================================
-- SECCIÓN 6: VALIDACIÓN FINAL PRECISA
-- ================================================================================

DO $$
DECLARE
    table_count INTEGER := 0;
    policy_count INTEGER := 0;
    trigger_count INTEGER := 0;
    index_count INTEGER := 0;
    user_profiles_columns INTEGER := 0;
BEGIN
    RAISE NOTICE '=== VALIDACIÓN FINAL PRECISA ===';
    
    -- Contar tablas principales
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('user_profiles', 'quiz_attempts', 'user_lesson_progress', 'user_exercise_progress');
    
    -- ✅ CORRECCIÓN: Contar columnas exactas (= 8, no >= 7)
    SELECT COUNT(*) INTO user_profiles_columns
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('user_profiles', 'quiz_attempts', 'user_lesson_progress', 'user_exercise_progress');
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%' OR trigger_name LIKE '%completed_at%';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename IN ('user_profiles', 'quiz_attempts', 'user_lesson_progress', 'user_exercise_progress');
    
    -- Reporte final
    RAISE NOTICE '📊 MÉTRICAS DEL ESQUEMA:';
    RAISE NOTICE '   • Tablas principales: % de 4', table_count;
    RAISE NOTICE '   • Columnas user_profiles: % (esperadas: 8)', user_profiles_columns;
    RAISE NOTICE '   • Políticas RLS: %', policy_count;
    RAISE NOTICE '   • Triggers: %', trigger_count;
    RAISE NOTICE '   • Índices: %', index_count;
    
    -- ✅ VALIDACIÓN PRECISA: = 8 columnas exactas, no >= 7
    IF table_count = 4 AND user_profiles_columns = 8 AND policy_count >= 10 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 MIGRACIÓN PERFECTA!';
        RAISE NOTICE '✅ ERROR 42703 RESUELTO - Orden defensivo implementado';
        RAISE NOTICE '✅ LÓGICA CORREGIDA - attempts_count manejado por aplicación';
        RAISE NOTICE '✅ VALIDACIÓN PRECISA - 8 columnas exactas confirmadas';
        RAISE NOTICE '✅ DEPENDENCIAS VERIFICADAS - auth.users confirmado';
        RAISE NOTICE '✅ OPTIMIZACIONES APLICADAS - Verificaciones redundantes eliminadas';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 PRÓXIMOS PASOS CRÍTICOS:';
        RAISE NOTICE '1. Ejecutar smoke test: npm run dev';
        RAISE NOTICE '2. Corregir 3 líneas FK en /pages/api/profile.js:';
        RAISE NOTICE '   Líneas 126, 132, 138: .eq(''id'', userId) → .eq(''user_id'', userId)';
        RAISE NOTICE '3. IMPORTANTE: attempts_count debe incrementarse desde la aplicación';
        RAISE NOTICE '   NO por trigger automático (lógica corregida)';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 SCRIPT V11 COMPLETADO - LÓGICA CORREGIDA EXITOSA!';
    ELSIF user_profiles_columns != 8 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ ESTRUCTURA INCOMPLETA: user_profiles tiene % columnas, esperadas 8', user_profiles_columns;
        RAISE NOTICE 'Columnas faltantes detectadas. Verificar proceso de ALTER TABLE.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ MIGRACIÓN PARCIAL: Revisar métricas anteriores';
        RAISE NOTICE 'Tablas: %, Columnas: %, Políticas: %', table_count, user_profiles_columns, policy_count;
    END IF;
    
    RAISE NOTICE '=== FIN VALIDACIÓN FINAL ===';
END $$;

-- ================================================================================
-- SCRIPT COMPLETADO - VERSIÓN 11.0 LÓGICA CORREGIDA
-- ================================================================================
-- 
-- CORRECCIONES CRÍTICAS IMPLEMENTADAS EN V11.0:
-- ❌ FALLA LÓGICA CORREGIDA: attempts_count ya NO se incrementa automáticamente
-- ✅ LÓGICA APROPIADA: attempts_count debe manejarse desde la capa de aplicación
-- ✅ VALIDACIÓN PRECISA: user_profiles = 8 columnas exactas (no >= 7)
-- ✅ DEPENDENCIAS VERIFICADAS: auth.users existencia confirmada antes de continuar
-- ✅ OPTIMIZACIÓN: Verificación redundante del Paso 3 eliminada
-- ✅ ERROR 42703 PREVENIDO: Verificación defensiva de columnas mantenida
--
-- NOTA CRÍTICA PARA DESARROLLO:
-- La columna attempts_count en user_exercise_progress debe incrementarse
-- desde la aplicación (API) cada vez que un usuario envía una respuesta,
-- NO automáticamente cuando completed = TRUE.
--
-- SCRIPT V11 LÓGICAMENTE CORRECTO Y TÉCNICAMENTE OPTIMIZADO
-- ================================================================================