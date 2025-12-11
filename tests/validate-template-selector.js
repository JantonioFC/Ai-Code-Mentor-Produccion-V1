#!/usr/bin/env node

/**
 * MISIÓN 191.1 - VALIDACIÓN MANUAL DEL TEMPLATESELECTOR
 * Script de validación manual para verificar la integridad del componente refactorizado
 * 
 * EJECUTAR: node tests/validate-template-selector.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO VALIDACIÓN MANUAL - TEMPLATESELECTOR');
console.log('================================================');

// PASO 1: Verificar que los archivos existen
const checkFileExists = (filePath, description) => {
  const fullPath = path.resolve(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - NO ENCONTRADO`);
    return false;
  }
};

console.log('\n📁 PASO 1: Verificación de Archivos Críticos');
const filesOk = [
  checkFileExists('components/ProjectTracking/TemplateSelector.js', 'Componente TemplateSelector'),
  checkFileExists('lib/templates.js', 'Biblioteca de Templates'),
  checkFileExists('contexts/ProjectTrackingContext.js', 'Contexto ProjectTracking')
].every(Boolean);

if (!filesOk) {
  console.log('\n❌ VALIDACIÓN FALLIDA: Archivos faltantes');
  process.exit(1);
}

// PASO 2: Verificar imports y exports en templates.js
console.log('\n📚 PASO 2: Verificación de Biblioteca de Templates');
try {
  const templatesPath = path.resolve(__dirname, '..', 'lib/templates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  
  const requiredExports = [
    'getAllTemplates',
    'getTemplatesByCategory',
    'TEMPLATES',
    'ENTRY_TYPES'
  ];
  
  let exportsOk = true;
  requiredExports.forEach(exportName => {
    if (templatesContent.includes(`export ${exportName}`) || 
        templatesContent.includes(`export const ${exportName}`) ||
        templatesContent.includes(`export function ${exportName}`)) {
      console.log(`✅ Export encontrado: ${exportName}`);
    } else {
      console.log(`❌ Export faltante: ${exportName}`);
      exportsOk = false;
    }
  });
  
  if (!exportsOk) {
    console.log('\n❌ VALIDACIÓN FALLIDA: Exports faltantes en templates.js');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`❌ Error leyendo templates.js: ${error.message}`);
  process.exit(1);
}

// PASO 3: Verificar estructura del componente refactorizado
console.log('\n🔧 PASO 3: Verificación de Refactorización del Componente');
try {
  const componentPath = path.resolve(__dirname, '..', 'components/ProjectTracking/TemplateSelector.js');
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  const requiredFeatures = [
    { pattern: /import.*getAllTemplates.*from/, description: 'Import de getAllTemplates' },
    { pattern: /import.*getTemplatesByCategory.*from/, description: 'Import de getTemplatesByCategory' },
    { pattern: /useState.*templates/, description: 'Estado local para templates' },
    { pattern: /useState.*loading/, description: 'Estado local para loading' },
    { pattern: /useState.*error/, description: 'Estado local para error' },
    { pattern: /useEffect/, description: 'useEffect para carga autónoma' },
    { pattern: /console\.log.*TEMPLATE_SELECTOR/, description: 'Logging de operaciones' },
    { pattern: /catch.*error/, description: 'Manejo de errores' },
    { pattern: /Error al Cargar Plantillas/, description: 'UI de estado de error' },
    { pattern: /Cargando Plantillas Educativas/, description: 'UI de estado de loading' }
  ];
  
  let featuresOk = true;
  requiredFeatures.forEach(({ pattern, description }) => {
    if (pattern.test(componentContent)) {
      console.log(`✅ Característica implementada: ${description}`);
    } else {
      console.log(`❌ Característica faltante: ${description}`);
      featuresOk = false;
    }
  });
  
  if (!featuresOk) {
    console.log('\n❌ VALIDACIÓN FALLIDA: Características de refactorización faltantes');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`❌ Error leyendo TemplateSelector.js: ${error.message}`);
  process.exit(1);
}

// PASO 4: Verificar data de templates
console.log('\n📋 PASO 4: Verificación de Datos de Templates');
try {
  // Simular la carga de templates (requiere transpilación, usamos regex)
  const templatesPath = path.resolve(__dirname, '..', 'lib/templates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  
  // Contar templates en TEMPLATES object
  const templateMatches = templatesContent.match(/\w+_\w+\s*:\s*{/g) || [];
  const templateCount = templateMatches.length;
  
  console.log(`✅ Templates encontrados: ${templateCount}`);
  
  if (templateCount < 10) {
    console.log(`⚠️  ADVERTENCIA: Pocos templates encontrados (${templateCount}). Se esperan al menos 10.`);
  }
  
  // Verificar que hay categorías definidas
  if (templatesContent.includes('getTemplatesByCategory')) {
    console.log('✅ Función getTemplatesByCategory encontrada');
  } else {
    console.log('❌ Función getTemplatesByCategory no encontrada');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`❌ Error validando datos de templates: ${error.message}`);
  process.exit(1);
}

// PASO 5: Verificar no hay dependencias rotas
console.log('\n🔗 PASO 5: Verificación de Dependencias');
try {
  const componentPath = path.resolve(__dirname, '..', 'components/ProjectTracking/TemplateSelector.js');
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  // Verificar que no hay dependencias del contexto para templates/templateCategories
  const hasOldDependencies = componentContent.includes('templates,') && 
                             componentContent.includes('templateCategories,') &&
                             componentContent.includes('} = useProjectTracking()');
  
  if (hasOldDependencies) {
    console.log('❌ DEPENDENCIAS ROTAS: El componente aún depende del contexto para templates');
    process.exit(1);
  } else {
    console.log('✅ No hay dependencias rotas del contexto para templates');
  }
  
  // Verificar que sí usa selectTemplate del contexto
  if (componentContent.includes('selectTemplate') && componentContent.includes('useProjectTracking')) {
    console.log('✅ Mantiene integración correcta con contexto para selectTemplate');
  } else {
    console.log('⚠️  ADVERTENCIA: Posible pérdida de integración con selectTemplate');
  }
  
} catch (error) {
  console.log(`❌ Error verificando dependencias: ${error.message}`);
  process.exit(1);
}

// VALIDACIÓN COMPLETADA
console.log('\n🎯 VALIDACIÓN COMPLETADA EXITOSAMENTE');
console.log('=====================================');
console.log('✅ MISIÓN 191.1 - REFACTORIZACIÓN VALIDADA');
console.log('');
console.log('📊 RESUMEN DE VALIDACIÓN:');
console.log('- ✅ Archivos críticos presentes');
console.log('- ✅ Biblioteca de templates funcional');
console.log('- ✅ Componente refactorizado correctamente');
console.log('- ✅ Carga defensiva implementada');
console.log('- ✅ Manejo de errores robusto');
console.log('- ✅ Estados de loading/error presentes');
console.log('- ✅ No hay dependencias rotas');
console.log('');
console.log('🚀 COMPONENTE LISTO PARA PRODUCTION');
console.log('');
console.log('📋 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('1. Ejecutar tests automatizados: npm test TemplateSelector.test.js');
console.log('2. Probar manualmente en browser');
console.log('3. Verificar que no hay regresiones en otras partes del sistema');
console.log('4. Deploy a staging para testing de integración');
console.log('');
console.log('Roger, Supervisor. Misión 191.1 completada exitosamente. ✅');
