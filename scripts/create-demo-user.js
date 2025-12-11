/**
 * SCRIPT: CREAR USUARIO DEMO PARA TESTS E2E
 * 
 * Propósito: Registrar usuario demo@aicodementor.com con password demo123
 * para que los tests E2E puedan autenticarse correctamente.
 * 
 * Uso: node scripts/create-demo-user.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración
const DEMO_EMAIL = 'demo@aicodementor.com';
const DEMO_PASSWORD = 'demo123';
const DEMO_DISPLAY_NAME = 'Usuario Demo';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createDemoUser() {
  log('\n🚀 INICIANDO CREACIÓN DE USUARIO DEMO\n', 'cyan');

  // Verificar variables de entorno
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('❌ ERROR: Variables de entorno de Supabase no encontradas', 'red');
    log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local', 'yellow');
    process.exit(1);
  }

  // Crear cliente de Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  log('📋 Credenciales del usuario demo:', 'blue');
  log(`   Email: ${DEMO_EMAIL}`, 'blue');
  log(`   Password: ${DEMO_PASSWORD}`, 'blue');
  log(`   Display Name: ${DEMO_DISPLAY_NAME}\n`, 'blue');

  try {
    // Paso 1: Intentar iniciar sesión para verificar si ya existe
    log('🔍 Verificando si el usuario demo ya existe...', 'yellow');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });

    if (signInData?.user && !signInError) {
      log('✅ El usuario demo YA EXISTE y las credenciales funcionan correctamente', 'green');
      log(`   User ID: ${signInData.user.id}`, 'green');
      log(`   Email: ${signInData.user.email}`, 'green');
      log('\n🎯 No es necesario crear el usuario. Los tests E2E deberían funcionar.\n', 'cyan');
      
      // Cerrar sesión
      await supabase.auth.signOut();
      return;
    }

    // Paso 2: Si no existe, crear el usuario
    log('📝 Usuario demo no existe. Procediendo a crearlo...', 'yellow');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      options: {
        data: {
          display_name: DEMO_DISPLAY_NAME
        }
      }
    });

    if (signUpError) {
      log(`❌ ERROR al crear usuario en Supabase Auth: ${signUpError.message}`, 'red');
      
      // Verificar si el error es porque el usuario ya existe
      if (signUpError.message.includes('already registered')) {
        log('ℹ️  El usuario ya está registrado pero la contraseña es incorrecta.', 'yellow');
        log('   Opciones:', 'yellow');
        log('   1. Usa el panel de Supabase para resetear la contraseña', 'yellow');
        log('   2. Elimina el usuario y ejecuta este script de nuevo', 'yellow');
      }
      
      process.exit(1);
    }

    if (!signUpData.user) {
      log('❌ ERROR: No se pudo crear el usuario (respuesta vacía)', 'red');
      process.exit(1);
    }

    log('✅ Usuario creado exitosamente en Supabase Auth', 'green');
    log(`   User ID: ${signUpData.user.id}`, 'green');
    log(`   Email: ${signUpData.user.email}`, 'green');

    // Paso 3: Esperar a que la sesión se propague
    log('\n⏳ Esperando propagación de sesión (2 segundos)...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 4: Crear perfil en base de datos (si es necesario)
    log('📄 Intentando crear perfil en base de datos...', 'yellow');
    
    // Nota: Esto requiere que el endpoint /api/profile esté disponible
    // y que el servidor Next.js esté corriendo
    const profileResponse = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signUpData.session?.access_token}`,
      },
      body: JSON.stringify({
        display_name: DEMO_DISPLAY_NAME,
        email: DEMO_EMAIL,
      }),
    });

    const profileResult = await profileResponse.json();

    if (profileResult.success) {
      log('✅ Perfil creado exitosamente en base de datos', 'green');
    } else {
      log(`⚠️  Warning: Usuario creado en Auth pero error en perfil: ${profileResult.error}`, 'yellow');
      log('   El usuario podrá autenticarse, pero puede haber datos incompletos', 'yellow');
      
      // Intentar retry
      log('\n🔄 Intentando crear perfil nuevamente (retry)...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryResponse = await fetch('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signUpData.session?.access_token}`,
        },
        body: JSON.stringify({
          display_name: DEMO_DISPLAY_NAME,
          email: DEMO_EMAIL,
        }),
      });

      const retryResult = await retryResponse.json();
      
      if (retryResult.success) {
        log('✅ Perfil creado exitosamente en retry', 'green');
      } else {
        log(`⚠️  Retry también falló: ${retryResult.error}`, 'yellow');
        log('   Puedes crear el perfil manualmente o el sistema lo creará en el primer login', 'yellow');
      }
    }

    // Verificar que el usuario puede autenticarse
    log('\n🔍 Verificando que las credenciales funcionan...', 'yellow');
    
    await supabase.auth.signOut(); // Cerrar sesión anterior
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });

    if (verifyError) {
      log(`❌ ERROR: Las credenciales no funcionan: ${verifyError.message}`, 'red');
      process.exit(1);
    }

    log('✅ Verificación exitosa: Las credenciales funcionan correctamente', 'green');
    await supabase.auth.signOut();

    log('\n🎉 USUARIO DEMO CREADO EXITOSAMENTE\n', 'green');
    log('📋 Resumen:', 'cyan');
    log(`   ✅ Usuario creado en Supabase Auth`, 'green');
    log(`   ✅ Perfil creado en base de datos (o pendiente)`, 'green');
    log(`   ✅ Credenciales verificadas y funcionando`, 'green');
    log(`\n🧪 Los tests E2E ahora deberían funcionar correctamente.\n`, 'cyan');

  } catch (error) {
    log(`\n❌ ERROR INESPERADO: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
createDemoUser().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
