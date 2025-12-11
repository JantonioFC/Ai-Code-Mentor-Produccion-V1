# Checklist de Pre-Validación - Tests Portfolio
**Misión 219.0** | Tests de Caracterización

## ✅ Antes de Ejecutar los Tests

### 1. Verificar Servidor de Desarrollo

```bash
# El servidor DEBE estar corriendo en localhost:3000
npm run dev
```

**Verificación Manual:**
- [ ] Abrir http://localhost:3000 en el navegador
- [ ] Verificar que la aplicación carga correctamente
- [ ] NO debe haber errores en consola del navegador

---

### 2. Verificar Estructura de Archivos

```bash
# Todos estos archivos deben existir:
e2e/
├── portfolio-characterization.spec.js    ✓
├── helpers/
│   └── portfolio-helpers.js              ✓
├── fixtures/
│   ├── empty-context.json                ✓
│   ├── minimal-context.json              ✓
│   └── full-context.json                 ✓
└── PORTFOLIO_TESTS_README.md             ✓
```

**Verificación:**
- [ ] Todos los archivos existen
- [ ] No hay errores de sintaxis (ejecutar `node -c archivo.js`)

---

### 3. Verificar Dependencias

```bash
# Playwright debe estar instalado
npx playwright --version
```

**Versión Esperada:** v1.40.0 o superior

**Verificación:**
- [ ] Playwright instalado correctamente
- [ ] Browsers de Playwright instalados: `npx playwright install`

---

### 4. Verificar Base de Datos (Opcional)

```bash
# curriculum.db debe existir
ls -la curriculum.db
```

**Verificación:**
- [ ] curriculum.db existe (320KB aprox)
- [ ] Sin archivos .db-wal o .db-shm bloqueados

---

### 5. Verificar Variables de Entorno

```bash
# .env.local debe tener las variables necesarias
cat .env.local
```

**Variables Requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (si es necesario)

**Verificación:**
- [ ] Todas las variables definidas
- [ ] Sin valores vacíos o placeholders

---

### 6. Limpiar Estado Previo (Recomendado)

```bash
# Limpiar reportes anteriores
rm -rf playwright-report test-results e2e-results.xml

# Limpiar caché de Playwright
npx playwright clear-cache
```

**Verificación:**
- [ ] Directorios de reportes eliminados
- [ ] Fresh start para nueva ejecución

---

## 🚀 Ejecución de Tests

### Opción 1: Ejecución Completa (Recomendado)

```bash
node validate-mission-219.js
```

**Este script:**
- ✓ Verifica prerrequisitos
- ✓ Ejecuta todos los 21 tests
- ✓ Genera reportes (HTML + XML + Markdown)
- ✓ Muestra resumen ejecutivo

---

### Opción 2: Ejecución Manual

```bash
# Ejecutar todos los tests
npx playwright test e2e/portfolio-characterization.spec.js

# O con UI mode (debug interactivo)
npx playwright test e2e/portfolio-characterization.spec.js --ui
```

---

### Opción 3: Ejecución por Suites

```bash
# Solo tests de renderizado (P1-P5)
npx playwright test e2e/portfolio-characterization.spec.js -g "Renderizado"

# Solo tests de estados (P6-P10)
npx playwright test e2e/portfolio-characterization.spec.js -g "Estados"

# Solo tests de integración (P11-P15)
npx playwright test e2e/portfolio-characterization.spec.js -g "Integración"

# Solo tests de operaciones críticas (P16-P20)
npx playwright test e2e/portfolio-characterization.spec.js -g "Operaciones"

# Solo smoke test
npx playwright test e2e/portfolio-characterization.spec.js -g "SMOKE"
```

---

### Opción 4: Debug Individual

```bash
# Debug de un test específico
npx playwright test e2e/portfolio-characterization.spec.js -g "P1" --debug

# Ejecutar con headed mode (ver navegador)
npx playwright test e2e/portfolio-characterization.spec.js -g "P1" --headed
```

---

## 📊 Verificar Resultados

### Después de la Ejecución

1. **Reportes Generados:**
   ```
   playwright-report/index.html          ← Reporte visual completo
   e2e-results.xml                       ← Resultados en formato XML
   VALIDATION_REPORT_MISSION_219.md      ← Resumen ejecutivo
   ```

2. **Ver Reporte HTML:**
   ```bash
   npx playwright show-report
   ```

3. **Verificar XML (para CI/CD):**
   ```bash
   cat e2e-results.xml
   ```

---

## 🔧 Troubleshooting Común

### Error: "Cannot connect to http://localhost:3000"

**Solución:**
```bash
# Asegurarse que el servidor está corriendo
npm run dev

# En otra terminal, ejecutar los tests
node validate-mission-219.js
```

---

### Error: "Cannot find module './helpers/portfolio-helpers'"

**Solución:**
```bash
# Verificar estructura de archivos
ls -la e2e/helpers/

# Reinstalar dependencias si es necesario
npm install
```

---

### Tests fallan por timeout

**Solución:**
```bash
# Aumentar timeout en playwright.config.js
# O ejecutar con timeout mayor:
npx playwright test e2e/portfolio-characterization.spec.js --timeout=60000
```

---

### Errores aleatorios en algunos tests

**Solución:**
```bash
# Ejecutar en modo secuencial (no paralelo)
npx playwright test e2e/portfolio-characterization.spec.js --workers=1

# O con retries:
npx playwright test e2e/portfolio-characterization.spec.js --retries=2
```

---

## 📈 Métricas de Éxito

### Criterios de Aceptación

- ✅ **21/21 tests pasan** (100% success rate)
- ✅ **Tiempo de ejecución < 5 minutos**
- ✅ **0 warnings en consola**
- ✅ **0 errores no manejados**
- ✅ **Reportes generados correctamente**

### Si Todos los Tests Pasan

**¡Felicidades!** 🎉

La suite de tests está completa y funcional. Próximos pasos:

1. Commit de los tests a Git
2. Integrar en pipeline CI/CD
3. Documentar en CHANGELOG.md
4. Actualizar TESTING_BEST_PRACTICES.md si es necesario

---

## 📝 Notas Adicionales

### Mocks y Fixtures

Los tests usan mocks para:
- ✓ Autenticación de Supabase
- ✓ ProjectTrackingContext con diferentes estados
- ✓ APIs de exportación y reset

**No se requiere base de datos real** para ejecutar estos tests.

### Coverage

Esta suite cubre:
- ✓ Renderizado de componentes
- ✓ Navegación entre tabs
- ✓ Estados del sistema (vacío, loading, error, success)
- ✓ Integración con contextos
- ✓ Operaciones críticas (export, reset)
- ✓ Flujos end-to-end

---

**Última actualización:** 2025-10-11
**Autor:** Mentor Coder - Misión 219.0
