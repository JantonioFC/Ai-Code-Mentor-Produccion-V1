const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existe (para desarrollo local)
// En producción (Vercel), estas ya estarán en process.env
try {
    if (fs.existsSync('.env.local')) {
        const envConfig = require('dotenv').parse(fs.readFileSync('.env.local'));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    // Ignorar error si dotenv no está instalado o falla carga local
    // En CI/Prod esto no es crítico si las vars ya están en el entorno
}

const requiredVars = [
    'GEMINI_API_KEY',
    'JWT_SECRET',
    'NEXT_PUBLIC_SENTRY_DSN'
    // 'SUPABASE_URL', // Comentado por ahora si estamos moviéndonos a local
    // 'SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.error('❌ Error: Faltan variables de entorno requeridas:');
    missingVars.forEach(key => {
        console.error(`   - ${key}`);
    });
    console.error('\nAsegúrate de configurar estas variables en tu archivo .env.local o en la configuración de Vercel.\n');
    process.exit(1);
}

console.log('✅ Validación de entorno exitosa: Todas las variables requeridas están presentes.');
