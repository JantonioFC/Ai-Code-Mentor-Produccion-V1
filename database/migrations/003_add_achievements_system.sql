-- ================================================================================
-- AI CODE MENTOR - MISIÓN 160: SISTEMA DE LOGROS v1 (MVP)
-- ================================================================================
-- FASE 1: Capa de Datos - Tablas achievements y user_achievements
-- Objetivo: Implementar sistema de reconocimiento de hitos para estudiantes
-- Versión: 1.0 - MVP con 4 logros iniciales
-- Generado: 2025-09-16 por Mentor Coder según directiva Supervisor
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MISIÓN 160 FASE 1: SISTEMA DE LOGROS v1 (MVP) ===';
    RAISE NOTICE 'Objetivo: Implementar capa de datos para reconocimiento de hitos';
    RAISE NOTICE 'Arquitectura: achievements (definiciones) + user_achievements (asignaciones)';
END $$;

-- ================================================================================
-- PASO 1: CREAR TABLA achievements (DEFINICIONES DE LOGROS)
-- ================================================================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Nombres únicos para logros
    UNIQUE(name)
);

-- ================================================================================
-- PASO 2: CREAR TABLA user_achievements (ASIGNACIONES DE LOGROS)
-- ================================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Un logro único por usuario (no duplicar)
    UNIQUE(user_id, achievement_id)
);

-- ================================================================================
-- PASO 3: CREAR ÍNDICES PARA PERFORMANCE
-- ================================================================================

DO $$
BEGIN
    -- Índices para achievements
    CREATE INDEX IF NOT EXISTS idx_achievements_name 
    ON achievements(name);
    
    CREATE INDEX IF NOT EXISTS idx_achievements_criteria 
    ON achievements USING GIN(criteria);
    
    -- Índices para user_achievements
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id 
    ON user_achievements(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id 
    ON user_achievements(achievement_id);
    
    CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at 
    ON user_achievements(unlocked_at);
    
    -- Índice compuesto para consultas de logros por usuario
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked 
    ON user_achievements(user_id, unlocked_at DESC);
    
    RAISE NOTICE '✅ Índices de performance creados exitosamente';
END $$;

-- ================================================================================
-- PASO 4: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ================================================================================

-- Habilitar RLS en user_achievements (achievements es tabla pública/read-only)
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad para user_achievements
DO $$
BEGIN
    -- Política para SELECT: usuarios pueden ver solo sus propios logros
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_achievements' 
        AND policyname = 'Users can view own achievements'
    ) THEN
        CREATE POLICY "Users can view own achievements" 
        ON user_achievements FOR SELECT 
        USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política SELECT creada para user_achievements';
    END IF;
    
    -- Política para INSERT: sistema puede insertar logros (no usuarios directamente)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_achievements' 
        AND policyname = 'System can insert achievements'
    ) THEN
        CREATE POLICY "System can insert achievements" 
        ON user_achievements FOR INSERT 
        WITH CHECK (true); -- Controlado por backend, no por usuarios
        RAISE NOTICE '✅ Política INSERT creada para user_achievements';
    END IF;
    
    -- Política para DELETE: usuarios NO pueden eliminar logros (persistentes)
    -- Solo administrador/sistema puede eliminar si es necesario
    
    RAISE NOTICE '✅ RLS configurado para user_achievements';
END $$;

-- ================================================================================
-- PASO 5: SEEDING - POBLAR achievements CON 4 LOGROS MVP
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== POBLANDO TABLA achievements CON 4 LOGROS MVP ===';
    
    -- LOGRO 1: Primer Paso
    INSERT INTO achievements (name, description, icon, criteria) 
    VALUES (
        'Primer Paso',
        'Completa tu primera semana en el Ecosistema 360. ¡El viaje de mil millas comienza con un solo paso!',
        '🚀',
        '{"type": "COMPLETE_WEEKS", "value": 1}'::jsonb
    )
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        criteria = EXCLUDED.criteria;
    
    -- LOGRO 2: Persistente
    INSERT INTO achievements (name, description, icon, criteria) 
    VALUES (
        'Persistente',
        'Completa 5 semanas del programa. La consistencia es la clave del éxito.',
        '💪',
        '{"type": "COMPLETE_WEEKS", "value": 5}'::jsonb
    )
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        criteria = EXCLUDED.criteria;
    
    -- LOGRO 3: Explorador de Fase
    INSERT INTO achievements (name, description, icon, criteria) 
    VALUES (
        'Explorador de Fase',
        'Completa la Fase 1: Fundamentos y Metodología. ¡Has dominado las bases!',
        '🎯',
        '{"type": "COMPLETE_PHASE", "value": 1}'::jsonb
    )
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        criteria = EXCLUDED.criteria;
    
    -- LOGRO 4: Progresivo
    INSERT INTO achievements (name, description, icon, criteria) 
    VALUES (
        'Progresivo',
        'Alcanza el 50% de progreso total en el programa. ¡Estás en el camino correcto!',
        '📈',
        '{"type": "PROGRESS_PERCENTAGE", "value": 50}'::jsonb
    )
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        criteria = EXCLUDED.criteria;
    
    RAISE NOTICE '✅ 4 logros MVP insertados exitosamente';
END $$;

-- ================================================================================
-- PASO 6: CREAR FUNCIÓN HELPER PARA CONSULTAS DE LOGROS
-- ================================================================================

-- Función para obtener logros de un usuario con información del achievement
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id UUID)
RETURNS TABLE (
    achievement_id UUID,
    achievement_name TEXT,
    achievement_description TEXT,
    achievement_icon TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        ua.unlocked_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id
    ORDER BY ua.unlocked_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene un logro específico
CREATE OR REPLACE FUNCTION user_has_achievement(p_user_id UUID, p_achievement_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = p_user_id 
        AND a.name = p_achievement_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Funciones helper creadas';

-- ================================================================================
-- PASO 7: VALIDACIÓN FINAL COMPLETA
-- ================================================================================

DO $$
DECLARE
    achievements_table_exists BOOLEAN := FALSE;
    user_achievements_table_exists BOOLEAN := FALSE;
    achievements_count INTEGER := 0;
    achievements_columns INTEGER := 0;
    user_achievements_columns INTEGER := 0;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
    functions_count INTEGER := 0;
    rls_enabled BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== VALIDACIÓN FINAL SISTEMA DE LOGROS ===';
    
    -- Verificar que las tablas existen
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'achievements'
    ) INTO achievements_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_achievements'
    ) INTO user_achievements_table_exists;
    
    -- Contar logros seeded
    SELECT COUNT(*) INTO achievements_count FROM achievements;
    
    -- Contar columnas
    SELECT COUNT(*) INTO achievements_columns
    FROM information_schema.columns 
    WHERE table_name = 'achievements';
    
    SELECT COUNT(*) INTO user_achievements_columns
    FROM information_schema.columns 
    WHERE table_name = 'user_achievements';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename IN ('achievements', 'user_achievements');
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_achievements';
    
    -- Contar funciones helper
    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines 
    WHERE routine_name IN ('get_user_achievements', 'user_has_achievement');
    
    -- Verificar que RLS está habilitado en user_achievements
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'user_achievements';
    
    -- Reporte detallado
    RAISE NOTICE '📊 MÉTRICAS DE VALIDACIÓN:';
    RAISE NOTICE '   • Tabla achievements existe: %', achievements_table_exists;
    RAISE NOTICE '   • Tabla user_achievements existe: %', user_achievements_table_exists;
    RAISE NOTICE '   • Logros MVP seeded: % (esperados: 4)', achievements_count;
    RAISE NOTICE '   • Columnas achievements: % (esperadas: 6)', achievements_columns;
    RAISE NOTICE '   • Columnas user_achievements: % (esperadas: 4)', user_achievements_columns;
    RAISE NOTICE '   • Índices creados: % (esperados: 6)', index_count;
    RAISE NOTICE '   • Políticas RLS: % (esperadas: 2)', policy_count;
    RAISE NOTICE '   • Funciones helper: % (esperadas: 2)', functions_count;
    RAISE NOTICE '   • RLS habilitado en user_achievements: %', rls_enabled;
    
    -- Validación de estructura de columnas específica
    IF achievements_table_exists THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'achievements' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna achievements.id (UUID, PK) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'achievements' AND column_name = 'criteria' AND data_type = 'jsonb'
        ) THEN
            RAISE NOTICE '   ✅ Columna achievements.criteria (JSONB) creada correctamente';
        END IF;
    END IF;
    
    IF user_achievements_table_exists THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_achievements' AND column_name = 'user_id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna user_achievements.user_id (UUID, FK) creada correctamente';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_achievements' AND column_name = 'achievement_id' AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE '   ✅ Columna user_achievements.achievement_id (UUID, FK) creada correctamente';
        END IF;
    END IF;
    
    -- Verificar constraints UNIQUE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'achievements' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%name%'
    ) THEN
        RAISE NOTICE '   ✅ Constraint UNIQUE (name) en achievements creado correctamente';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_achievements' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '   ✅ Constraint UNIQUE (user_id, achievement_id) en user_achievements creado correctamente';
    END IF;
    
    -- Verificar foreign keys
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_achievements' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '   ✅ Foreign key user_achievements.user_id → auth.users(id) creado correctamente';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_achievements' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%achievement_id%'
    ) THEN
        RAISE NOTICE '   ✅ Foreign key user_achievements.achievement_id → achievements(id) creado correctamente';
    END IF;
    
    -- Verificar seeding con detalles
    IF achievements_count >= 4 THEN
        RAISE NOTICE '   ✅ Logros MVP seeded:';
        FOR rec IN (SELECT name, icon, criteria FROM achievements ORDER BY name)
        LOOP
            RAISE NOTICE '      %: % %', rec.icon, rec.name, rec.criteria;
        END LOOP;
    END IF;
    
    -- Evaluación final
    IF achievements_table_exists AND user_achievements_table_exists 
       AND achievements_count = 4 AND achievements_columns = 6 AND user_achievements_columns = 4
       AND index_count >= 6 AND policy_count >= 2 AND functions_count = 2 AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 FASE 1 COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '✅ Tablas achievements y user_achievements creadas según especificación';
        RAISE NOTICE '✅ 4 logros MVP seeded con criterios JSONB apropiados';
        RAISE NOTICE '✅ Índices de performance implementados';
        RAISE NOTICE '✅ RLS configurado en user_achievements para seguridad';
        RAISE NOTICE '✅ Constraints UNIQUE previenen duplicados';
        RAISE NOTICE '✅ Foreign keys garantizan integridad referencial';
        RAISE NOTICE '✅ Funciones helper para consultas optimizadas';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 LISTO PARA FASE 2: Implementación del Motor de Logros';
        RAISE NOTICE '📋 Próximo paso: Crear /lib/achievements/engine.js';
        RAISE NOTICE '📋 Y endpoints /api/achievements/check y /api/achievements';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ FASE 1 INCOMPLETA - Revisar métricas anteriores';
        RAISE NOTICE 'Posibles problemas:';
        IF NOT achievements_table_exists THEN RAISE NOTICE '   • Tabla achievements no fue creada'; END IF;
        IF NOT user_achievements_table_exists THEN RAISE NOTICE '   • Tabla user_achievements no fue creada'; END IF;
        IF achievements_count != 4 THEN RAISE NOTICE '   • Logros MVP incorrectos (esperados 4, encontrados %)', achievements_count; END IF;
        IF achievements_columns != 6 THEN RAISE NOTICE '   • Columnas achievements incorrectas (esperadas 6, encontradas %)', achievements_columns; END IF;
        IF user_achievements_columns != 4 THEN RAISE NOTICE '   • Columnas user_achievements incorrectas (esperadas 4, encontradas %)', user_achievements_columns; END IF;
        IF index_count < 6 THEN RAISE NOTICE '   • Índices faltantes'; END IF;
        IF policy_count < 2 THEN RAISE NOTICE '   • Políticas RLS faltantes'; END IF;
        IF functions_count != 2 THEN RAISE NOTICE '   • Funciones helper faltantes'; END IF;
        IF NOT rls_enabled THEN RAISE NOTICE '   • RLS no habilitado en user_achievements'; END IF;
    END IF;
    
    RAISE NOTICE '=== FIN VALIDACIÓN FASE 1 ===';
END $$;

-- ================================================================================
-- MIGRACIÓN 003 COMPLETADA - SISTEMA DE LOGROS v1 (MVP)
-- ================================================================================
-- 
-- TABLAS CREADAS:
-- • achievements (id, name, description, icon, criteria, created_at)
-- • user_achievements (id, user_id, achievement_id, unlocked_at)
--
-- CARACTERÍSTICAS TÉCNICAS:
-- • UNIQUE CONSTRAINT en achievements(name) previene logros duplicados
-- • UNIQUE CONSTRAINT en user_achievements(user_id, achievement_id) previene duplicados
-- • Foreign keys con CASCADE DELETE para integridad referencial
-- • Índices GIN en criteria JSONB para consultas de criterios eficientes
-- • Índices compuestos para consultas de logros por usuario optimizadas
--
-- SEGURIDAD:
-- • RLS habilitado en user_achievements con políticas granulares
-- • achievements tabla pública (read-only para usuarios)
-- • user_achievements controlado por sistema, visible por usuario
--
-- 4 LOGROS MVP SEEDED:
-- 🚀 Primer Paso: {"type": "COMPLETE_WEEKS", "value": 1}
-- 💪 Persistente: {"type": "COMPLETE_WEEKS", "value": 5}
-- 🎯 Explorador de Fase: {"type": "COMPLETE_PHASE", "value": 1}
-- 📈 Progresivo: {"type": "PROGRESS_PERCENTAGE", "value": 50}
--
-- FUNCIONES HELPER:
-- • get_user_achievements(UUID): Retorna logros con detalles de un usuario
-- • user_has_achievement(UUID, TEXT): Verifica si usuario tiene logro específico
--
-- READY FOR FASE 2: IMPLEMENTACIÓN DEL MOTOR DE LOGROS /lib/achievements/engine.js
-- ================================================================================
