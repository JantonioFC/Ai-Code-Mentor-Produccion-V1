# Portfolio Characterization Tests - Suite E2E
**Misión 219.0** | Fecha: 2025-10-11

## 📋 Resumen Ejecutivo

Suite completa de tests de caracterización para el módulo **Portfolio & Gestión Profesional**, implementada siguiendo los principios de `TESTING_BEST_PRACTICES.md` y usando arquitectura modular con helpers reutilizables.

### Cobertura de Tests

| Suite | Tests | Descripción |
|-------|-------|-------------|
| **Renderizado y Navegación** | P1-P5 | Validación de renderizado, tabs, secciones y ProtectedRoute |
| **Estados del Sistema** | P6-P10 | Manejo de estados vacío, loading, errores y diferentes volúmenes de datos |
| **Integración con Contexto** | P11-P15 | Consumo correcto de ProjectTrackingContext y cálculo de niveles |
| **Operaciones Críticas** | P16-P20 | Export Portfolio (PDF/HTML/MD) y Reset de Sistema |
| **Smoke Test** | P-SMOKE | Flujo integral end-to-end |

**Total: 21 tests** (20 críticos + 1 smoke test)

---

## 🏗️ Arquitectura de Tests

### Estructura de Archivos

```
e2e/
├── portfolio-characterization.spec.js  # Suite principal (21 tests)
├── helpers/
│   └── portfolio-helpers.js            # Funciones auxiliares reutilizables
└── fixtures/
    ├── empty-context.json              # Estado sin evidencias
    ├── minimal-context.json            # Estado con 3 evidencias
    └── full-context.json               # Estado con 18 evidencias
```

### Helpers Disponibles

#### Setup y Mocking
- `setupPortfolioTest(page, contextType)` - Configuración completa con contexto y auth
- `mockProjectTrackingContext(page, type)` - Mock del contexto de tracking
- `mockAuthentication(page)` - Mock de sesión de Supabase
- `mockExportPortfolioAPI(page, options)` - Mock de API de exportación
- `mockResetSystemAPI(page, options)` - Mock de API de reset

#### Assertions y Navegación
- `expectTabToBeActive(page, tabName)` - Verifica tab activo
- `switchToTab(page, tabName)` - Cambia entre tabs
- `expectHeaderMetrics(page, expectedTotal)` - Verifica métricas del header
- `expectCompetencyLevel(page, level, name, icon)` - Verifica nivel de competencia
- `waitForVisible(page, selector, timeout)` - Espera con timeout personalizado

---

## 🎯 Tests Críticos Detallados

### Suite 1: Renderizado y Navegación (P1-P5)

#### P1 - Renderizado del Componente Principal
**Objetivo:** Verificar que el componente se renderiza con título y navegación  
**Precondiciones:** Context minimal  
**Pasos:**
1. Navegar a `/portfolio`
2. Verificar título "Portfolio & Gestión Profesional"
3. Verificar presencia de tabs de navegación

**Assertions:**
- ✓ Título principal visible
- ✓ Tab "Export Portfolio" visible
- ✓ Tab "Gestión de Ciclos" visible

---

#### P2 - Cambio entre Tabs
**Objetivo:** Validar navegación entre tabs sin errores  
**Precondiciones:** Context minimal  
**Pasos:**
1. Verificar tab "Export Portfolio" activo por defecto
2. Cambiar a "Gestión de Ciclos"
3. Verificar contenido del nuevo tab
4. Volver a "Export Portfolio"

**Assertions:**
- ✓ Tab correcto marcado como activo (CSS class)
- ✓ Contenido cambia según tab seleccionado
- ✓ Sin errores en consola

---

#### P3 - Secciones en Export Portfolio
**Objetivo:** Verificar estructura del tab de exportación  
**Precondiciones:** Context minimal  
**Assertions:**
- ✓ Título "Exportar Portfolio Profesional"
- ✓ Selector de formato visible
- ✓ Opciones PDF, HTML, Markdown disponibles

---

#### P4 - Secciones en Gestión de Ciclos
**Objetivo:** Verificar estructura del tab de gestión  
**Precondiciones:** Context minimal  
**Assertions:**
- ✓ Título "Gestión de Ciclos de Aprendizaje"
- ✓ Sección "Estado Actual del Sistema"
- ✓ Botón "Iniciar Nuevo Ciclo"

---

#### P5 - ProtectedRoute sin Autenticación
**Objetivo:** Validar protección de ruta  
**Precondiciones:** Sin mock de autenticación  
**Assertions:**
- ✓ Redirige a `/login` o `/auth`
- ✓ No muestra contenido protegido

---

### Suite 2: Estados del Sistema (P6-P10)

#### P6 - Estado Vacío (0 evidencias)
**Objetivo:** Manejo de estado inicial sin datos  
**Context:** `empty-context.json`  
**Assertions:**
- ✓ Métrica muestra 0 evidencias
- ✓ Nivel "Principiante 🌱"
- ✓ Mensaje "No hay evidencias registradas"

---

#### P7 - Estado con Pocas Evidencias (1-5)
**Objetivo:** Manejo de estado con datos mínimos  
**Context:** `minimal-context.json` (3 evidencias)  
**Assertions:**
- ✓ Métrica muestra 3 evidencias
- ✓ Nivel "Básico 🌿"

---

#### P8 - Estado con Muchas Evidencias (15+)
**Objetivo:** Manejo de estado con datos abundantes  
**Context:** `full-context.json` (18 evidencias)  
**Assertions:**
- ✓ Métrica muestra 18 evidencias
- ✓ Nivel "Avanzado 🏆"

---

#### P9 - Estado de Loading
**Objetivo:** Indicador visual durante operaciones asíncronas  
**Precondiciones:** Mock de API con delay de 2s  
**Assertions:**
- ✓ Spinner o mensaje "Generando..." visible
- ✓ Desaparece al completar operación

---

#### P10 - Manejo de Errores de API
**Objetivo:** Mensajes claros en caso de fallo  
**Precondiciones:** Mock de API con error  
**Assertions:**
- ✓ Mensaje de error visible
- ✓ Texto específico del error mostrado
- ✓ Sin crash de aplicación

---

### Suite 3: Integración con Contexto (P11-P15)

#### P11 - Consumo de entryCounts
**Objetivo:** Verificar lectura correcta del contexto  
**Context:** `full-context.json`  
**Assertions:**
- ✓ Total de evidencias = 18
- ✓ Desglose por tipo visible (5 DDE, 4 peer reviews, etc.)

---

#### P12 - Cálculo de Nivel de Competencia
**Objetivo:** Algoritmo de niveles según evidencias  
**Test Cases:**
- 0 evidencias → Nivel 1 (Principiante 🌱)
- 3 evidencias → Nivel 2 (Básico 🌿)
- 18 evidencias → Nivel 4 (Avanzado 🏆)

---

#### P13 - Estado Loading del Contexto
**Objetivo:** UI responde a contexto.loading=true  
**Assertions:**
- ✓ Spinner visible mientras loading=true

---

#### P14 - Error del Contexto
**Objetivo:** UI muestra contexto.error si existe  
**Assertions:**
- ✓ Mensaje de error visible
- ✓ Texto del error mostrado

---

#### P15 - Actualización Reactiva del Contexto
**Objetivo:** UI se actualiza cuando cambia el contexto  
**Pasos:**
1. Verificar estado inicial (3 evidencias)
2. Simular actualización del contexto (15 evidencias)
3. Refrescar página
4. Verificar nuevo estado

---

### Suite 4: Operaciones Críticas (P16-P20)

#### P16 - Export Portfolio: PDF
**Objetivo:** Exportación exitosa en formato PDF  
**Pasos:**
1. Seleccionar formato PDF
2. Click en "Exportar Portfolio"
3. Esperar respuesta de API

**Assertions:**
- ✓ Mensaje de éxito visible
- ✓ Link de descarga disponible
- ✓ Request a API con formato correcto

---

#### P17 - Export Portfolio: HTML
**Objetivo:** Exportación exitosa en formato HTML  
**Assertions:**
- ✓ Mensaje de éxito visible
- ✓ Link de descarga disponible

---

#### P18 - Export Portfolio: Markdown
**Objetivo:** Exportación exitosa en formato Markdown  
**Assertions:**
- ✓ Mensaje de éxito visible
- ✓ Link de descarga disponible

---

#### P19 - Fallo en Exportación
**Objetivo:** Manejo robusto de errores de API  
**Preconditions:** Mock de API con error 500  
**Assertions:**
- ✓ Mensaje de error visible
- ✓ NO hay link de descarga
- ✓ Usuario puede reintentar

---

#### P20 - Reset de Sistema
**Objetivo:** Flujo completo de reinicio con confirmación  
**Pasos:**
1. Ir a tab "Gestión de Ciclos"
2. Click en "Iniciar Nuevo Ciclo"
3. Verificar modal de confirmación
4. Confirmar reset
5. Esperar respuesta

**Assertions:**
- ✓ Modal de confirmación visible
- ✓ Mensaje "¿Estás seguro?"
- ✓ Mensaje de éxito al completar
- ✓ Links de descarga: archivo + backup
- ✓ Nuevo ciclo ID visible

---

### Smoke Test (P-SMOKE)

#### Flujo Integral End-to-End
**Objetivo:** Validar flujo completo sin errores  
**Pasos:**
1. Cargar portfolio con 18 evidencias
2. Verificar métricas del header
3. Exportar portfolio en PDF
4. Cambiar a tab Gestión de Ciclos
5. Volver a tab Export Portfolio

**Assertions:**
- ✓ Sin errores de consola
- ✓ Todas las transiciones fluidas
- ✓ Datos consistentes en toda la sesión

---

## 🚀 Ejecución de Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests del portfolio
npx playwright test e2e/portfolio-characterization.spec.js

# Ejecutar con UI mode (recomendado para debug)
npx playwright test e2e/portfolio-characterization.spec.js --ui

# Ejecutar un test específico
npx playwright test e2e/portfolio-characterization.spec.js -g "P1"

# Ejecutar una suite específica
npx playwright test e2e/portfolio-characterization.spec.js -g "Renderizado"

# Modo headed (ver el navegador)
npx playwright test e2e/portfolio-characterization.spec.js --headed

# Generar reporte HTML
npx playwright test e2e/portfolio-characterization.spec.js --reporter=html
```

### Debug Individual

```bash
# Debug de un test específico
npx playwright test e2e/portfolio-characterization.spec.js -g "P16" --debug
```

---

## 📊 Métricas de Calidad

### Coverage Esperado
- **Componentes:** PortfolioManagementSystem, ExportPortfolio, CycleManagement
- **Hooks:** useProjectTracking
- **APIs:** /api/export-portfolio, /api/reset-system
- **States:** Empty, Loading, Error, Success

### Criterios de Aceptación
✅ Todos los tests (21/21) deben pasar  
✅ Sin warnings en consola  
✅ Sin errores de timeout  
✅ Tiempo de ejecución < 5 minutos  

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'helpers/portfolio-helpers'"
**Solución:** Verificar que el archivo existe en `e2e/helpers/`

### Error: "page.locator(...) timed out"
**Solución:** 
1. Verificar que la app está corriendo en `localhost:3000`
2. Aumentar timeout en `waitForVisible()`
3. Verificar selectores CSS

### Tests fallan aleatoriamente
**Solución:**
1. Agregar `await page.waitForTimeout(500)` después de clicks
2. Usar `waitForLoadState('networkidle')` antes de assertions
3. Verificar race conditions en mocks

---

## 📚 Referencias

- **Contrato de API:** `Documento de Contrato de API v1.6.md`
- **Arquitectura:** `ARQUITECTURA_VIVA/ARQUITECTURA_VIVA_v15.0.md`
- **Testing Guidelines:** `TESTING_BEST_PRACTICES.md`
- **Playwright Docs:** https://playwright.dev/

---

## ✍️ Autor y Mantenimiento

**Creado por:** Mentor Coder  
**Misión:** 219.0  
**Fecha:** 2025-10-11  
**Versión:** 1.0  

**Última actualización:** Implementación inicial completa de 21 tests
