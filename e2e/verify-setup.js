#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN PRE-EJECUCIÓN E2E
 * Misión 188: Implementación Suite de Pruebas E2E
 * 
 * PROPÓSITO: Verificar que todos los prerrequisitos están cumplidos
 * antes de ejecutar la suite de pruebas Playwright.
 * 
 * PRINCIPIO: "Verificar antes de Actuar" - Falla Rápido
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 VERIFICACIÓN PRE-EJECUCIÓN E2E - AI CODE MENTOR');
console.log('================================================');

const checks = {
  files: false,
  server: false,
  dependencies: false,
  playwright: false
};

/**
 * VERIFICACIÓN 1: Archivos de configuración
 */
async function checkFiles() {
  console.log('\\n📁 Verificando archivos de configuración...');
  
  const requiredFiles = [
    'playwright.config.js',
    'e2e/ai-code-mentor.spec.js',
    'package.json'
  ];

  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - FALTANTE`);
      allFilesExist = false;
    }
  }

  checks.files = allFilesExist;
  return allFilesExist;
}

/**
 * VERIFICACIÓN 2: Servidor de desarrollo
 */
async function checkServer() {
  console.log('\\n🌐 Verificando servidor de desarrollo...');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Servidor ejecutándose en http://localhost:3000');
        checks.server = true;
        resolve(true);
      } else {
        console.log(`❌ Servidor responde con código: ${res.statusCode}`);
        checks.server = false;
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log('❌ Servidor no accesible en http://localhost:3000');
      console.log('   💡 Ejecutar: npm run dev');
      checks.server = false;
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Timeout conectando al servidor');
      req.destroy();
      checks.server = false;
      resolve(false);
    });
  });
}

/**
 * VERIFICACIÓN 3: Dependencias de Node.js
 */
async function checkDependencies() {
  console.log('\\n📦 Verificando dependencias...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Verificar que Playwright está en devDependencies
    const hasPlaywright = packageJson.devDependencies && 
                         (packageJson.devDependencies['@playwright/test'] || 
                          packageJson.devDependencies['playwright']);
    
    if (hasPlaywright) {
      console.log('✅ Playwright presente en devDependencies');
    } else {
      console.log('❌ Playwright no encontrado en devDependencies');
    }

    // Verificar que node_modules existe
    const nodeModulesExists = fs.existsSync('node_modules');
    if (nodeModulesExists) {
      console.log('✅ node_modules presente');
    } else {
      console.log('❌ node_modules faltante - Ejecutar: npm install');
    }

    // Verificar scripts E2E
    const hasE2EScripts = packageJson.scripts && packageJson.scripts['test:e2e'];
    if (hasE2EScripts) {
      console.log('✅ Scripts E2E configurados');
    } else {
      console.log('❌ Scripts E2E no encontrados');
    }

    checks.dependencies = hasPlaywright && nodeModulesExists && hasE2EScripts;
    return checks.dependencies;

  } catch (error) {
    console.log('❌ Error leyendo package.json:', error.message);
    checks.dependencies = false;
    return false;
  }
}

/**
 * VERIFICACIÓN 4: Instalación de Playwright
 */
async function checkPlaywright() {
  console.log('\\n🎭 Verificando instalación de Playwright...');
  
  try {
    // Verificar si el módulo puede ser requerido
    const playwright = require('@playwright/test');
    console.log('✅ @playwright/test disponible');

    // Verificar archivos de configuración de Playwright
    const configExists = fs.existsSync('playwright.config.js');
    if (configExists) {
      console.log('✅ playwright.config.js presente');
    } else {
      console.log('❌ playwright.config.js faltante');
    }

    checks.playwright = !!playwright && configExists;
    return checks.playwright;

  } catch (error) {
    console.log('❌ @playwright/test no disponible');
    console.log('   💡 Ejecutar: npm install');
    console.log('   💡 Luego: npx playwright install');
    checks.playwright = false;
    return false;
  }
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function main() {
  const startTime = Date.now();
  
  // Ejecutar todas las verificaciones
  await checkFiles();
  await checkServer();
  await checkDependencies();
  await checkPlaywright();

  // Reporte final
  console.log('\\n📊 REPORTE DE VERIFICACIÓN');
  console.log('==========================');
  
  const results = [
    ['Archivos de configuración', checks.files],
    ['Servidor de desarrollo', checks.server],
    ['Dependencias Node.js', checks.dependencies],
    ['Instalación Playwright', checks.playwright]
  ];

  let allPassed = true;
  results.forEach(([name, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!passed) allPassed = false;
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\\n⏱️  Verificación completada en ${duration}s`);

  if (allPassed) {
    console.log('\\n🎉 SISTEMA LISTO PARA EJECUTAR PRUEBAS E2E');
    console.log('💡 Ejecutar: npm run test:e2e');
    process.exit(0);
  } else {
    console.log('\\n🚨 ACCIÓN REQUERIDA - Resolver los problemas marcados');
    console.log('\\n📋 PASOS DE SOLUCIÓN:');
    
    if (!checks.dependencies) {
      console.log('1. Ejecutar: npm install');
      console.log('2. Ejecutar: npx playwright install');
    }
    
    if (!checks.server) {
      console.log('3. En terminal separada: npm run dev');
    }
    
    if (!checks.files) {
      console.log('4. Verificar que todos los archivos de configuración estén presentes');
    }

    console.log('5. Volver a ejecutar este script: node e2e/verify-setup.js');
    process.exit(1);
  }
}

// Ejecutar verificación
main().catch(error => {
  console.error('💥 Error durante verificación:', error.message);
  process.exit(1);
});
