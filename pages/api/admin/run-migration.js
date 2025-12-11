// pages/api/admin/run-migration.js
import { createClient } from '@supabase/supabase-js';

// Usamos las credenciales de servicio para tener permisos de administrador
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Script consolidado y definitivo que crea todo lo necesario
const MIGRATION_SQL = `
  -- ===================================================================
  -- SCRIPT DE MIGRACIÓN CONSOLIDADO - ECOSISTEMA 360
  -- Crea y configura los sistemas de Logros y Caché del ARM
  -- ===================================================================

  -- === SECCIÓN 1: SISTEMA DE LOGROS ===
  CREATE TABLE IF NOT EXISTS public.achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      criteria JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS public.user_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE,
      unlocked_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, achievement_id)
  );

  INSERT INTO public.achievements (id, name, description, icon, criteria) VALUES
  ('FASE_0_COMPLETADA', 'Cimientos Sólidos', 'Completaste exitosamente la Fase 0.', '🏛️', '{ "type": "FASE_COMPLETADA", "fase": 0 }'),
  ('PRIMEROS_PASOS_PYTHON', 'Hola, Serpiente', 'Completaste la primera semana de Python.', '🐍', '{ "type": "SEMANA_COMPLETADA", "semana": 14 }')
  ON CONFLICT (id) DO NOTHING;

  ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Allow authenticated users to read achievements" ON public.achievements;
  CREATE POLICY "Allow authenticated users to read achievements"
  ON public.achievements FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "Allow user to read their own achievements" ON public.user_achievements;
  CREATE POLICY "Allow user to read their own achievements"
  ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

  -- === SECCIÓN 2: SISTEMA DE CACHÉ DEL ARM ===
  CREATE TABLE IF NOT EXISTS public.source_content_cache (
      url TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ
  );

  ALTER TABLE public.source_content_cache ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public read access to cached content" ON public.source_content_cache;
  CREATE POLICY "Public read access to cached content"
  ON public.source_content_cache FOR SELECT USING (true);

  DROP POLICY IF EXISTS "System can modify cached content" ON public.source_content_cache;
  CREATE POLICY "System can modify cached content"
  ON public.source_content_cache FOR ALL USING (true) WITH CHECK (true);
`;

export default async function handler(req, res) {
  // Medida de seguridad simple para evitar ejecuciones accidentales
  if (req.query.secret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  try {
    console.log('🚀 Ejecutando migración consolidada desde la API...');
    const { error } = await supabaseAdmin.sql(MIGRATION_SQL);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Migración completada exitosamente.');
    res.status(200).json({ success: true, message: 'Migración ejecutada exitosamente. Las tablas han sido creadas y configuradas.' });
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al ejecutar la migración.', details: error.message });
  }
}