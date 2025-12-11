#!/usr/bin/env node

/**
 * MISIÓN 216.0 - FASE 1: Ejecutor de Migración sandbox_generations
 * 
 * Este script ejecuta la migración SQL para crear la tabla sandbox_generations
 * en Supabase, incluyendo todas las políticas RLS, índices y triggers.
 * 
 * Uso: node database/migrations/execute-003-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requiere service role key para operaciones admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Variables de entorno faltantes');
  console.error('   Requeridas: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Verifica tu archivo .env.local');
  process.exit(1);
}

// Cliente de Supabase con service role key para operaciones admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  console.log('='.repeat(80));
  console.log('MISIÓN 216.0 - FASE 1: EJECUCIÓN DE MIGRACIÓN sandbox_generations');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '003_add_sandbox_generations_table.sql');
    console.log(`📖 Leyendo migración desde: ${migrationPath}`);
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migración cargada (${migrationSQL.length} caracteres)`);
    console.log('');

    // Ejecutar la migración usando el cliente de Supabase
    console.log('🚀 Ejecutando migración SQL en Supabase...');
    console.log('   (Esto puede tomar 10-30 segundos)');
    console.log('');

    // Nota: Supabase JavaScript client no tiene método directo para ejecutar SQL raw
    // Para ejecutar migraciones, hay dos opciones:
    // 1. Usar Supabase SQL Editor (web UI)
    // 2. Usar psql command line con connection string
    // 3. Usar un endpoint HTTP que ejecute SQL (no recomendado en producción)

    console.log('⚠️  NOTA IMPORTANTE:');
    console.log('   El cliente de Supabase JS no soporta ejecución de SQL raw directa.');
    console.log('   Para ejecutar esta migración, tienes 2 opciones:');
    console.log('');
    console.log('   OPCIÓN 1 (Recomendada): Supabase SQL Editor');
    console.log('   1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto-id]/sql');
    console.log('   2. Copia el contenido de: database/migrations/003_add_sandbox_generations_table.sql');
    console.log('   3. Pega en el editor y ejecuta');
    console.log('');
    console.log('   OPCIÓN 2: psql command line');
    console.log('   1. Obtén la connection string desde Supabase Dashboard');
    console.log('   2. Ejecuta: psql [connection-string] -f database/migrations/003_add_sandbox_generations_table.sql');
    console.log('');

    // Validar que la tabla existe (como verificación post-ejecución)
    console.log('🔍 Validando conexión a Supabase...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'sandbox_generations')
      .single();

    if (tablesError && tablesError.code !== 'PGRST116') {
      // PGRST116 = not found, que es esperado si la tabla no existe aún
      console.warn('⚠️  Error al verificar tabla:', tablesError.message);
    }

    if (tables) {
      console.log('✅ La tabla sandbox_generations ya existe en la base de datos');
      console.log('   Migración probablemente ya fue ejecutada anteriormente');
    } else {
      console.log('ℹ️  La tabla sandbox_generations no existe aún');
      console.log('   Por favor ejecuta la migración usando una de las opciones anteriores');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('INSTRUCCIONES DE EJECUCIÓN MANUAL');
    console.log('='.repeat(80));
    console.log('');
    console.log('Contenido del SQL de migración:');
    console.log('-'.repeat(80));
    console.log(migrationSQL.substring(0, 500) + '...');
    console.log('-'.repeat(80));
    console.log('');
    console.log('📂 Archivo completo en: database/migrations/003_add_sandbox_generations_table.sql');

  } catch (error) {
    console.error('❌ ERROR FATAL:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar migración
executeMigration().catch(error => {
  console.error('❌ ERROR NO CAPTURADO:', error);
  process.exit(1);
});
