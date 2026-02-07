/**
 * SCRIPT: AUTO-SETUP (LOCAL FIRST)
 * 
 * Este script automatiza el setup de la base de datos LOCAL (SQLite).
 * Ya no depende de Supabase.
 * 
 * Uso: Se ejecuta automáticamente con `npm run dev`
 */

const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./init-sqlite'); // Reutilizamos la lógica de init

// Colores para consola
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};
const log = (msg, color = 'reset') => console.log(`${c[color]}${msg}${c.reset}`);

async function autoSetup() {
    console.log('');
    log('╔══════════════════════════════════════════════════════════╗', 'cyan');
    log('║           🔧 AUTO-SETUP - AI CODE MENTOR (LOCAL)         ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════╝', 'cyan');

    // 1. Inicializar SQLite (Esquema + Datos)
    log('🗄️  [SQLITE] Comprobando base de datos local...', 'dim');
    try {
        // [Task 2.6] Realizar backup antes de cualquier operación de setup
        const backupService = require('../lib/db/BackupService');
        if (fs.existsSync(path.join(process.cwd(), 'database', 'sqlite', 'curriculum.db'))) {
            log('🛡️  [BACKUP] Realizando respaldo preventivo...', 'dim');
            await backupService.runBackup();
        }

        // initDatabase maneja su propia lógica de "si existe no hago nada salvo --force"
        initDatabase();

        // [Task 2.4/3.3] Ejecutar migraciones para asegurar esquema actualizado (ej: refresh_tokens)
        log('🚀 [MIGRATIONS] Comprobando actualizaciones de esquema...', 'dim');
        const migrate = require('../lib/db/migrate');
        migrate();
    } catch (e) {
        log(`⚠️  Error inicializando SQLite o backup: ${e.message}`, 'yellow');
    }

    log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
    log('║              🚀 SETUP COMPLETADO                         ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════╝\n', 'cyan');
}

// Ejecutar
autoSetup().catch(err => {
    log(`⚠️  Error: ${err.message}`, 'yellow');
});
