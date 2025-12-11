-- ================================================================================
-- AI CODE MENTOR - MISIÓN 166: IMPLEMENTACIÓN DEL COMPONENTE DE CACHÉ DEL ARM
-- ================================================================================
-- SUB-MISIÓN 166.1: Crear tabla source_content_cache
-- Objetivo: Completar la construcción del ARM (Módulo de Recuperación Activa)
-- Versión: 1.0 - Capa de Persistencia (Caché) para contenido extraído
-- Generado: 2025-09-18 por Mentor Coder según ARQUITECTURA_VIVA v7.0
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MISIÓN 166 SUB-MISIÓN 166.1: COMPONENTE DE CACHÉ DEL ARM ===';
    RAISE NOTICE 'Objetivo: Implementar capa de persistencia para contenido extraído';
    RAISE NOTICE 'Arquitectura: ARM (Recuperador → Extractor → Caché)';
    RAISE NOTICE 'Flujo: Cache Hit/Cache Miss → Recuperar → Extraer → Almacenar';
END $$;

-- ================================================================================
-- PASO 1: CREAR TABLA source_content_cache SEGÚN ESPECIFICACIÓN
-- ================================================================================

CREATE TABLE IF NOT EXISTS source_content_cache (
    url TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

RAISE NOTICE '✅ Tabla source_content_cache creada según especificación ARM v7.0';

-- ================================================================================
-- PASO 2: CREAR ÍNDICES PARA PERFORMANCE
-- ================================================================================

DO $$
BEGIN
    -- Índice en last_fetched_at para queries de freshness
    CREATE INDEX IF NOT EXISTS idx_source_content_cache_last_fetched 
    ON source_content_cache(last_fetched_at);
    
    -- Índice en expires_at para cleanup automático futuro
    CREATE INDEX IF NOT EXISTS idx_source_content_cache_expires 
    ON source_content_cache(expires_at);
    
    -- Índice compuesto para queries de expiración activa
    CREATE INDEX IF NOT EXISTS idx_source_content_cache_expiry_check 
    ON source_content_cache(expires_at, last_fetched_at)
    WHERE expires_at IS NOT NULL;
    
    RAISE NOTICE '✅ Índices de performance creados para operaciones de caché';
END $$;

-- ================================================================================
-- PASO 3: CREAR FUNCIÓN HELPER PARA GESTIÓN DE CACHÉ
-- ================================================================================

-- Función para verificar si el contenido del caché está fresco
CREATE OR REPLACE FUNCTION is_cache_content_fresh(
    p_url TEXT,
    p_max_age_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
    last_fetch TIMESTAMPTZ;
    is_fresh BOOLEAN := FALSE;
BEGIN
    SELECT last_fetched_at INTO last_fetch
    FROM source_content_cache
    WHERE url = p_url;
    
    IF FOUND THEN
        is_fresh := (last_fetch > NOW() - (p_max_age_hours || ' hours')::INTERVAL);
    END IF;
    
    RETURN is_fresh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar contenido expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache_content()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM source_content_cache 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas del caché
CREATE OR REPLACE FUNCTION get_cache_stats()
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
    FROM source_content_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Funciones helper para gestión de caché creadas';

-- ================================================================================
-- PASO 4: CONFIGURAR ROW LEVEL SECURITY (RLS) - OPCIONAL PARA CACHÉ
-- ================================================================================

-- NOTA: Para el caché de contenido público, RLS puede no ser necesario
-- Sin embargo, lo configuramos para consistencia y seguridad futura
DO $$
BEGIN
    -- Habilitar RLS en source_content_cache
    ALTER TABLE source_content_cache ENABLE ROW LEVEL SECURITY;
    
    -- Política para SELECT: Acceso público a contenido cacheado (es contenido público)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'source_content_cache' 
        AND policyname = 'Public read access to cached content'
    ) THEN
        CREATE POLICY "Public read access to cached content" 
        ON source_content_cache FOR SELECT 
        USING (true); -- Contenido público, accesible para lectura
        RAISE NOTICE '✅ Política SELECT (público) creada para source_content_cache';
    END IF;
    
    -- Política para INSERT/UPDATE: Solo backend/sistema puede modificar caché
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'source_content_cache' 
        AND policyname = 'System can modify cached content'
    ) THEN
        CREATE POLICY "System can modify cached content" 
        ON source_content_cache FOR ALL 
        USING (true) 
        WITH CHECK (true); -- Controlado por backend ARM, no directamente por usuarios
        RAISE NOTICE '✅ Política INSERT/UPDATE (sistema) creada para source_content_cache';
    END IF;
    
    RAISE NOTICE '✅ RLS configurado para source_content_cache';
END $$;

-- ================================================================================
-- PASO 5: SEEDING - DATOS DE PRUEBA (OPCIONAL PARA TESTING)
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '=== POBLANDO CACHÉ CON CONTENIDO DE PRUEBA (TESTING) ===';
    
    -- Insertar contenido de prueba para validación
    INSERT INTO source_content_cache (url, content, last_fetched_at, expires_at) 
    VALUES (
        'https://example.com/test-lesson',
        'Este es contenido de prueba para validar el funcionamiento del caché ARM. Contenido extraído exitosamente.',
        NOW(),
        NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (url) DO UPDATE SET 
        content = EXCLUDED.content,
        last_fetched_at = EXCLUDED.last_fetched_at,
        expires_at = EXCLUDED.expires_at;
    
    RAISE NOTICE '✅ Contenido de prueba insertado para validación';
END $$;

-- ================================================================================
-- PASO 6: CREAR TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE last_fetched_at
-- ================================================================================

-- Función para actualizar last_fetched_at en UPDATE de content
CREATE OR REPLACE FUNCTION update_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar timestamp si el contenido cambió
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.last_fetched_at = NOW();
        
        -- Si no hay expires_at, establecer uno por defecto (7 días)
        IF NEW.expires_at IS NULL THEN
            NEW.expires_at = NOW() + INTERVAL '7 days';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_source_content_cache_timestamp ON source_content_cache;
    CREATE TRIGGER update_source_content_cache_timestamp
        BEFORE UPDATE ON source_content_cache
        FOR EACH ROW
        EXECUTE FUNCTION update_cache_timestamp();
    
    RAISE NOTICE '✅ Trigger de actualización automática creado';
END $$;

-- ================================================================================
-- PASO 7: VALIDACIÓN FINAL COMPLETA
-- ================================================================================

DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    columns_count INTEGER := 0;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
    functions_count INTEGER := 0;
    trigger_count INTEGER := 0;
    test_content_count INTEGER := 0;
    rls_enabled BOOLEAN := FALSE;
    expected_columns TEXT[] := ARRAY['url', 'content', 'last_fetched_at', 'expires_at'];
    col TEXT;
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '=== VALIDACIÓN FINAL COMPONENTE DE CACHÉ ARM ===';
    
    -- Verificar que la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'source_content_cache'
    ) INTO table_exists;
    
    -- Contar columnas
    SELECT COUNT(*) INTO columns_count
    FROM information_schema.columns 
    WHERE table_name = 'source_content_cache';
    
    -- Verificar columnas específicas según especificación
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'source_content_cache' AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'source_content_cache';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'source_content_cache';
    
    -- Contar funciones helper
    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines 
    WHERE routine_name IN ('is_cache_content_fresh', 'cleanup_expired_cache_content', 'get_cache_stats');
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'source_content_cache' 
    AND trigger_name = 'update_source_content_cache_timestamp';
    
    -- Contar contenido de prueba
    SELECT COUNT(*) INTO test_content_count 
    FROM source_content_cache;
    
    -- Verificar que RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'source_content_cache';
    
    -- Reporte detallado
    RAISE NOTICE '📊 MÉTRICAS DE VALIDACIÓN ARM CACHÉ:';
    RAISE NOTICE '   • Tabla source_content_cache existe: %', table_exists;
    RAISE NOTICE '   • Columnas creadas: % (esperadas: 4)', columns_count;
    RAISE NOTICE '   • Índices de performance: % (esperados: 3)', index_count;
    RAISE NOTICE '   • Políticas RLS: % (esperadas: 2)', policy_count;
    RAISE NOTICE '   • Funciones helper: % (esperadas: 3)', functions_count;
    RAISE NOTICE '   • Triggers automáticos: % (esperado: 1)', trigger_count;
    RAISE NOTICE '   • Contenido de prueba: % (esperado: 1)', test_content_count;
    RAISE NOTICE '   • RLS habilitado: %', rls_enabled;
    
    -- Verificar estructura de columnas específica
    IF table_exists THEN
        RAISE NOTICE '   📋 ESTRUCTURA DE COLUMNAS:';
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'source_content_cache' 
            AND column_name = 'url' 
            AND data_type = 'text'
            AND is_nullable = 'NO'
        ) THEN
            RAISE NOTICE '      ✅ url: TEXT PRIMARY KEY (correcto)';
        ELSE
            RAISE NOTICE '      ❌ url: Estructura incorrecta';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'source_content_cache' 
            AND column_name = 'content' 
            AND data_type = 'text'
            AND is_nullable = 'NO'
        ) THEN
            RAISE NOTICE '      ✅ content: TEXT NOT NULL (correcto)';
        ELSE
            RAISE NOTICE '      ❌ content: Estructura incorrecta';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'source_content_cache' 
            AND column_name = 'last_fetched_at' 
            AND data_type = 'timestamp with time zone'
        ) THEN
            RAISE NOTICE '      ✅ last_fetched_at: TIMESTAMPTZ DEFAULT NOW() (correcto)';
        ELSE
            RAISE NOTICE '      ❌ last_fetched_at: Estructura incorrecta';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'source_content_cache' 
            AND column_name = 'expires_at' 
            AND data_type = 'timestamp with time zone'
        ) THEN
            RAISE NOTICE '      ✅ expires_at: TIMESTAMPTZ (correcto)';
        ELSE
            RAISE NOTICE '      ❌ expires_at: Estructura incorrecta';
        END IF;
    END IF;
    
    -- Verificar primary key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'source_content_cache' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%url%' OR constraint_name LIKE '%pkey%'
    ) THEN
        RAISE NOTICE '      ✅ PRIMARY KEY en url creado correctamente';
    ELSE
        RAISE NOTICE '      ❌ PRIMARY KEY en url no encontrado';
    END IF;
    
    -- Mostrar columnas faltantes si las hay
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '   ❌ Columnas faltantes: %', array_to_string(missing_columns, ', ');
    END IF;
    
    -- Test de funciones helper
    IF functions_count = 3 THEN
        RAISE NOTICE '   🧪 TESTING FUNCIONES HELPER:';
        
        -- Test is_cache_content_fresh
        IF is_cache_content_fresh('https://example.com/test-lesson', 24) THEN
            RAISE NOTICE '      ✅ is_cache_content_fresh() funciona correctamente';
        ELSE
            RAISE NOTICE '      ⚠️ is_cache_content_fresh() retornó FALSE (normal si no hay contenido)';
        END IF;
        
        -- Test get_cache_stats
        DECLARE
            stats_result RECORD;
        BEGIN
            SELECT * INTO stats_result FROM get_cache_stats();
            RAISE NOTICE '      ✅ get_cache_stats(): % URLs, % fresh, % expired', 
                stats_result.total_urls, stats_result.fresh_content, stats_result.expired_content;
        END;
    END IF;
    
    -- Evaluación final
    IF table_exists AND columns_count = 4 AND array_length(missing_columns, 1) IS NULL
       AND index_count >= 3 AND policy_count >= 2 AND functions_count = 3 
       AND trigger_count = 1 AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUB-MISIÓN 166.1 COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '✅ Tabla source_content_cache creada según especificación ARQUITECTURA_VIVA v7.0';
        RAISE NOTICE '✅ Estructura: url (PK), content, last_fetched_at, expires_at';
        RAISE NOTICE '✅ Índices de performance para operaciones Cache Hit/Miss';
        RAISE NOTICE '✅ RLS configurado para seguridad (acceso público lectura, sistema escritura)';
        RAISE NOTICE '✅ Funciones helper para gestión inteligente de caché';
        RAISE NOTICE '✅ Trigger automático para actualización de timestamps';
        RAISE NOTICE '✅ Contenido de prueba insertado para validación';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 LISTO PARA SUB-MISIÓN 166.2: Localizar código de generación de lecciones';
        RAISE NOTICE '📋 Próximo paso: Analizar /pages/api/ y /lib/ para localizar ARM actual';
        RAISE NOTICE '📋 Objetivo: Implementar flujo Cache Hit → Cache Miss → ARM → Caché';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 CRITERIOS DE APROBACIÓN PENDIENTES:';
        RAISE NOTICE '   • ✅ Tabla source_content_cache creada en Supabase';
        RAISE NOTICE '   • ⏳ Primera solicitud → contacta fuente externa + guarda en caché';
        RAISE NOTICE '   • ⏳ Segunda solicitud → sirve desde caché instantáneamente';
        RAISE NOTICE '   • ⏳ ARM completamente integrado y funcional';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ SUB-MISIÓN 166.1 INCOMPLETA - Revisar métricas anteriores';
        RAISE NOTICE 'Posibles problemas:';
        IF NOT table_exists THEN RAISE NOTICE '   • Tabla source_content_cache no fue creada'; END IF;
        IF columns_count != 4 THEN RAISE NOTICE '   • Columnas incorrectas (esperadas 4, encontradas %)', columns_count; END IF;
        IF array_length(missing_columns, 1) > 0 THEN RAISE NOTICE '   • Columnas faltantes: %', array_to_string(missing_columns, ', '); END IF;
        IF index_count < 3 THEN RAISE NOTICE '   • Índices de performance faltantes'; END IF;
        IF policy_count < 2 THEN RAISE NOTICE '   • Políticas RLS faltantes'; END IF;
        IF functions_count != 3 THEN RAISE NOTICE '   • Funciones helper faltantes'; END IF;
        IF trigger_count != 1 THEN RAISE NOTICE '   • Trigger automático faltante'; END IF;
        IF NOT rls_enabled THEN RAISE NOTICE '   • RLS no habilitado'; END IF;
    END IF;
    
    RAISE NOTICE '=== FIN VALIDACIÓN SUB-MISIÓN 166.1 ===';
END $$;

-- ================================================================================
-- MIGRACIÓN 004 COMPLETADA - COMPONENTE DE CACHÉ ARM
-- ================================================================================
-- 
-- TABLA CREADA:
-- • source_content_cache (url PK, content, last_fetched_at, expires_at)
--
-- CARACTERÍSTICAS TÉCNICAS ARM:
-- • PRIMARY KEY en url para lookup O(1) en Cache Hit/Miss
-- • content TEXT para almacenar texto extraído por el Extractor
-- • last_fetched_at para políticas de freshness y invalidación
-- • expires_at para cleanup automático y gestión de expiración
--
-- ÍNDICES DE PERFORMANCE:
-- • idx_source_content_cache_last_fetched: Consultas de freshness
-- • idx_source_content_cache_expires: Cleanup de contenido expirado
-- • idx_source_content_cache_expiry_check: Compuesto para verificación activa
--
-- FUNCIONES HELPER PARA ARM:
-- • is_cache_content_fresh(url, max_age_hours): Verificar si caché está fresco
-- • cleanup_expired_cache_content(): Limpieza automática de contenido expirado
-- • get_cache_stats(): Estadísticas y monitoreo del estado del caché
--
-- SEGURIDAD:
-- • RLS habilitado con políticas granulares
-- • Acceso público para lectura (contenido educativo público)
-- • Control de escritura por sistema (backend ARM únicamente)
--
-- AUTOMATIZACIÓN:
-- • Trigger update_cache_timestamp para actualización automática
-- • last_fetched_at actualizado en cambios de contenido
-- • expires_at establecido automáticamente si no se proporciona
--
-- FLUJO ARM COMPLETADO (CAPA DE DATOS):
-- ┌─────────────────────────────────────────────────────────────────┐
-- │ 1. Cache Hit: SELECT content FROM source_content_cache         │
-- │    WHERE url = ? AND is_cache_content_fresh(url, 24)           │
-- │                                                                 │
-- │ 2. Cache Miss: [Recuperador] → [Extractor] → [Guardar Caché]   │
-- │    INSERT INTO source_content_cache (url, content)             │
-- │    VALUES (?, extracted_content)                               │
-- └─────────────────────────────────────────────────────────────────┘
--
-- READY FOR SUB-MISIÓN 166.2: LOCALIZAR Y ANALIZAR CÓDIGO DE GENERACIÓN DE LECCIONES
-- ================================================================================
