# Casos de Prueba E2E - Módulo Portfolio
## Misión 219.0 - Fase 2

**Fecha:** 2025-10-10  
**Analista:** Mentor Coder  
**Objetivo:** Documentar casos de prueba en formato Dado-Cuando-Entonces para suite E2E

---

## ORGANIZACIÓN DE TESTS

Los tests están organizados por **prioridad** y **área funcional**:

- **CRÍTICO** (P0): Funcionalidad esencial que debe funcionar
- **IMPORTANTE** (P1): Funcionalidades principales del módulo
- **OPCIONAL** (P2): Casos edge y variaciones

---

## CATEGORÍA 1: RENDERIZADO Y NAVEGACIÓN BÁSICA

### ✅ PORTFOLIO-001: Renderizado inicial de la página portfolio (CRÍTICO)

**Dado** un usuario autenticado  
**Cuando** navega a la página `/portfolio`  
**Entonces:**
- La página debe cargar exitosamente (status 200)
- Debe renderizar el componente PrivateLayout
- Debe mostrar el título "Portfolio & Gestión Profesional"
- Debe renderizar el componente PortfolioManagementSystem
- Debe mostrar las estadísticas generales (4 cards con evidencias, tipos, competencias, ciclo)

---

### ✅ PORTFOLIO-002: Sistema de tabs de navegación (CRÍTICO)

**Dado** un usuario en la página `/portfolio`  
**Cuando** la página carga  
**Entonces:**
- Deben renderizarse exactamente 2 tabs: "Export Portfolio" y "Gestión de Ciclos"
- El tab "Export Portfolio" debe estar activo por defecto (fondo azul-púrpura)
- El tab "Gestión de Ciclos" debe estar inactivo (fondo blanco)
- El tab "Gestión de Ciclos" debe mostrar un badge "AVANZADO"

---

### ✅ PORTFOLIO-003: Cambio entre tabs (CRÍTICO)

**Dado** un usuario en la página `/portfolio` con el tab "Export Portfolio" activo  
**Cuando** hace click en el tab "Gestión de Ciclos"  
**Entonces:**
- El tab "Gestión de Ciclos" debe activarse (fondo azul-púrpura)
- El tab "Export Portfolio" debe desactivarse (fondo blanco)
- Debe renderizarse el componente ResetSystem
- NO debe renderizarse el componente PortfolioExportSystem

---

### ✅ PORTFOLIO-004: Volver al tab de Export (CRÍTICO)

**Dado** un usuario en la página `/portfolio` con el tab "Gestión de Ciclos" activo  
**Cuando** hace click en el tab "Export Portfolio"  
**Entonces:**
- El tab "Export Portfolio" debe activarse (fondo azul-púrpura)
- El tab "Gestión de Ciclos" debe desactivarse (fondo blanco)
- Debe renderizarse el componente PortfolioExportSystem
- NO debe renderizarse el componente ResetSystem

---

## CATEGORÍA 2: SISTEMA DE EXPORTACIÓN (PortfolioExportSystem)

### ✅ PORTFOLIO-005: Renderizado del sistema de exportación (CRÍTICO)

**Dado** un usuario en el tab "Export Portfolio"  
**Cuando** el componente carga  
**Entonces:**
- Debe mostrar el header "Sistema de Exportación de Portfolio"
- Debe renderizar la sección "Vista General del Portfolio" con 4 estadísticas
- Debe renderizar la sección "Estructura del Portfolio" con 6 secciones documentadas
- Debe renderizar el formulario de "Configuración de Exportación"
- Debe mostrar el panel de ayuda e información

---

### ✅ PORTFOLIO-006: Formulario de configuración de exportación (CRÍTICO)

**Dado** un usuario en el tab "Export Portfolio"  
**Cuando** observa el formulario de configuración  
**Entonces:**
- Debe renderizar un select/dropdown de "Formato de Exportación" con 3 opciones: PDF, HTML, GitHub Pages
- Debe renderizar un input de texto "Nombre del Estudiante" con placeholder
- Debe renderizar 3 checkboxes de contenido:
  - "Entradas de Templates (DDE, PAS, HRC, IRP)" (marcado por defecto)
  - "Módulos de Aprendizaje y Lecciones" (marcado por defecto)
  - "Métricas y Análisis de Progreso" (desmarcado por defecto)
- El valor por defecto del formato debe ser "PDF Profesional"

---

### ✅ PORTFOLIO-007: Botón de exportar - estado disabled (CRÍTICO)

**Dado** un usuario en el tab "Export Portfolio"  
**Y** el contexto tiene `totalEntries === 0` (sin evidencias)  
**Cuando** observa el botón de exportar  
**Entonces:**
- El botón debe estar disabled
- El botón debe mostrar el texto "Necesitas evidencias para exportar"
- El botón debe tener estilo gris (no degradado)

---

### ✅ PORTFOLIO-008: Botón de exportar - estado enabled (CRÍTICO)

**Dado** un usuario en el tab "Export Portfolio"  
**Y** el contexto tiene `totalEntries > 0` (con evidencias)  
**Cuando** observa el botón de exportar  
**Entonces:**
- El botón debe estar enabled
- El botón debe mostrar el texto "Exportar Portfolio PDF (X evidencias)" donde X es el total
- El botón debe tener fondo degradado (verde-azul-púrpura)
- El botón debe tener efecto hover con escala

---

### ✅ PORTFOLIO-009: Cambio de formato de exportación (IMPORTANTE)

**Dado** un usuario en el tab "Export Portfolio"  
**Cuando** cambia el select de formato de "PDF" a "HTML"  
**Entonces:**
- El botón de exportar debe actualizar su texto a "Exportar Portfolio HTML (X evidencias)"

---

### ✅ PORTFOLIO-010: Cambio de checkboxes de contenido (IMPORTANTE)

**Dado** un usuario en el tab "Export Portfolio"  
**Cuando** desmarca el checkbox "Entradas de Templates"  
**Entonces:**
- El checkbox debe mostrar el estado desmarcado
- El estado interno debe actualizarse (`includeTemplates: false`)

---

### ✅ PORTFOLIO-011: Click en exportar portfolio (CRÍTICO - Happy Path)

**Dado** un usuario en el tab "Export Portfolio"  
**Y** tiene evidencias (`totalEntries > 0`)  
**Y** ha configurado el nombre del estudiante  
**Cuando** hace click en "Exportar Portfolio PDF"  
**Entonces:**
- El botón de exportar debe desaparecer
- Debe aparecer una sección "Estado de Exportación"
- Debe mostrarse una barra de progreso iniciando en 10%
- Debe mostrarse el texto "Preparando datos para exportación..."

---

### ✅ PORTFOLIO-012: Progreso de exportación (CRÍTICO)

**Dado** un proceso de exportación en curso  
**Cuando** el proceso avanza  
**Entonces:**
- La barra de progreso debe actualizarse: 10% → 30% → 80% → 100%
- Los mensajes deben cambiar:
  - 10%: "Preparando datos para exportación..."
  - 30%: "Generando portfolio PDF..."
  - 80%: "Finalizando exportación..."
  - 100%: "Exportación completada exitosamente"

---

### ✅ PORTFOLIO-013: Exportación completada exitosamente (CRÍTICO)

**Dado** un proceso de exportación que finaliza exitosamente  
**Cuando** la exportación se completa  
**Entonces:**
- Debe mostrarse un icono de éxito 🎉
- Debe mostrarse el título "Portfolio Exportado Exitosamente"
- Debe renderizarse metadata de la exportación (formato, tamaño, páginas)
- Debe mostrarse un botón verde "Descargar Portfolio"
- Debe mostrarse un botón gris "Finalizar"

---

### ✅ PORTFOLIO-014: Descarga del portfolio exportado (CRÍTICO)

**Dado** una exportación completada exitosamente  
**Cuando** hace click en el botón "Descargar Portfolio"  
**Entonces:**
- Debe iniciarse la descarga de un archivo
- El nombre del archivo debe contener "portfolio-ecosistema360"
- El nombre del archivo debe contener el formato (pdf/html/github)

---

### ✅ PORTFOLIO-015: Finalizar proceso de exportación (IMPORTANTE)

**Dado** una exportación completada exitosamente  
**Cuando** hace click en el botón "Finalizar"  
**Entonces:**
- La sección "Estado de Exportación" debe desaparecer
- El formulario de configuración debe volver a mostrarse
- El botón "Exportar Portfolio" debe volver a estar visible

---

### ✅ PORTFOLIO-016: Error en exportación (IMPORTANTE)

**Dado** un proceso de exportación que falla  
**Cuando** ocurre un error durante la exportación  
**Entonces:**
- Debe mostrarse un icono de advertencia ⚠️
- Debe mostrarse el título "Error en la Exportación"
- Debe mostrarse el mensaje de error específico
- Debe mostrarse un botón "Reintentar"

---

## CATEGORÍA 3: SISTEMA DE RESET (ResetSystem)

### ✅ PORTFOLIO-017: Renderizado del sistema de reset (CRÍTICO)

**Dado** un usuario en el tab "Gestión de Ciclos"  
**Cuando** el componente carga  
**Entonces:**
- Debe mostrar el header "Sistema de Reset de Ciclo Curricular"
- Debe renderizar la sección "Estado del Ciclo Actual" con 4 estadísticas
- Debe renderizar la sección "Estructura del Ciclo Curricular" con 6 fases
- Debe renderizar el formulario de configuración (Paso 0)

---

### ✅ PORTFOLIO-018: Advertencia para usuarios con evidencias (IMPORTANTE)

**Dado** un usuario en el tab "Gestión de Ciclos"  
**Y** tiene evidencias (`totalEntries > 0`)  
**Cuando** el componente carga  
**Entonces:**
- Debe mostrarse una advertencia amarilla "Funcionalidad Avanzada"
- La advertencia debe recomendar exportar el portfolio antes del reset
- La advertencia debe mostrar el total de evidencias actuales

---

### ✅ PORTFOLIO-019: Formulario de configuración - Paso 0 (CRÍTICO)

**Dado** un usuario en el tab "Gestión de Ciclos" en el Paso 0  
**Cuando** observa el formulario  
**Entonces:**
- Debe renderizar el título "Configuración del Reset"
- Debe renderizar 3 radio buttons de tipo de reset:
  - "Suave (Recomendado)" - fondo verde
  - "Selectivo" - fondo azul
  - "Completo" - fondo rojo
- El tipo "Suave" debe estar seleccionado por defecto
- Debe renderizar 5 checkboxes de opciones adicionales
- Debe renderizar un input de fecha "Fecha de inicio del nuevo ciclo"
- Debe renderizar un botón "Vista Previa →"

---

### ✅ PORTFOLIO-020: Cambio de tipo de reset (IMPORTANTE)

**Dado** un usuario en el Paso 0 del reset  
**Cuando** selecciona el radio button "Selectivo"  
**Entonces:**
- El radio button "Selectivo" debe marcarse
- Los radio buttons "Suave" y "Completo" deben desmarcarse
- Debe aparecer una sección azul "Componentes a Resetear" con 3 checkboxes adicionales:
  - "Resetear nivel de competencias"
  - "Resetear progreso de fases"
  - "Resetear módulos cargados"

---

### ✅ PORTFOLIO-021: Botón "Vista Previa" disabled (IMPORTANTE)

**Dado** un usuario en el Paso 0 del reset  
**Y** el contexto tiene `totalEntries === 0`  
**Cuando** observa el botón "Vista Previa"  
**Entonces:**
- El botón debe estar disabled
- El botón debe tener estilo gris

---

### ✅ PORTFOLIO-022: Navegación a Paso 1 - Vista Previa (CRÍTICO)

**Dado** un usuario en el Paso 0 del reset  
**Y** tiene evidencias (`totalEntries > 0`)  
**Cuando** hace click en "Vista Previa →"  
**Entonces:**
- El título debe cambiar a "Vista Previa del Reset"
- Debe renderizarse un grid con 2 columnas:
  - "Estado Actual" (azul) - evidencias, templates, competencia
  - "Después del Reset" (verde) - valores predichos
- Debe renderizarse una card amarilla "Resumen del Reset" con detalles de configuración
- Debe renderizarse un botón "← Volver"
- Debe renderizarse un botón "Confirmar Reset →" (naranja)

---

### ✅ PORTFOLIO-023: Navegación hacia atrás - Paso 1 a Paso 0 (CRÍTICO)

**Dado** un usuario en el Paso 1 (Vista Previa)  
**Cuando** hace click en "← Volver"  
**Entonces:**
- Debe volver al Paso 0
- Debe renderizarse el formulario de configuración
- La configuración previa debe mantenerse

---

### ✅ PORTFOLIO-024: Navegación a Paso 2 - Confirmación Final (CRÍTICO)

**Dado** un usuario en el Paso 1 (Vista Previa)  
**Cuando** hace click en "Confirmar Reset →"  
**Entonces:**
- El título debe cambiar a "Confirmación Final"
- Debe mostrarse un icono de advertencia grande ⚠️
- Debe mostrarse el mensaje "Estás a punto de resetear tu ciclo curricular"
- Debe renderizarse una card roja con detalles del reset:
  - Qué se mantendrá
  - Qué se reseteará
  - Fecha del nuevo ciclo
- Debe renderizarse un botón "← Revisar"
- Debe renderizarse un botón rojo destacado "EJECUTAR RESET"

---

### ✅ PORTFOLIO-025: Navegación hacia atrás - Paso 2 a Paso 1 (CRÍTICO)

**Dado** un usuario en el Paso 2 (Confirmación Final)  
**Cuando** hace click en "← Revisar"  
**Entonces:**
- Debe volver al Paso 1 (Vista Previa)
- Debe mostrarse el grid comparativo
- La configuración debe mantenerse

---

### ✅ PORTFOLIO-026: Ejecución del reset - Paso 3 (CRÍTICO - Happy Path)

**Dado** un usuario en el Paso 2 (Confirmación Final)  
**Cuando** hace click en "EJECUTAR RESET"  
**Entonces:**
- El título debe cambiar a "Ejecutando Reset"
- Debe mostrarse una barra de progreso iniciando en 10%
- Debe mostrarse el texto "Preparando reset del ciclo curricular..."
- El confirmationStep debe cambiar a 3

---

### ✅ PORTFOLIO-027: Progreso del reset (CRÍTICO)

**Dado** un proceso de reset en curso  
**Cuando** el proceso avanza  
**Entonces:**
- La barra de progreso debe actualizarse: 10% → 30% → 80% → 100%
- Los mensajes deben cambiar:
  - 10%: "Inicializando proceso de reset..."
  - 30%: "Ejecutando reset soft/selective/hard..."
  - 80%: "Finalizando reset y actualizando sistema..."
  - 100%: "Reset completado - Nuevo ciclo iniciado"

---

### ✅ PORTFOLIO-028: Reset completado exitosamente (CRÍTICO)

**Dado** un proceso de reset que finaliza exitosamente  
**Cuando** el reset se completa  
**Entonces:**
- Debe mostrarse un icono de éxito 🎉
- Debe mostrarse el título "Reset Completado Exitosamente"
- Debe mostrarse el mensaje "Reset completado - Nuevo ciclo iniciado"
- Debe renderizarse información del nuevo ciclo:
  - Link "Descargar archivo" (si archiveUrl existe)
  - Link "Descargar backup" (si preResetExportUrl existe)
  - Nuevo ID de ciclo
  - Estado: "Listo para comenzar Fase 1 - Fundamentos"
- Debe mostrarse un botón azul "Finalizar"

---

### ✅ PORTFOLIO-029: Descarga de archivos del reset (IMPORTANTE)

**Dado** un reset completado exitosamente con archival  
**Cuando** hace click en "Descargar archivo"  
**Entonces:**
- Debe iniciarse la descarga de un archivo ZIP
- El nombre debe contener "cycle-archive"

---

### ✅ PORTFOLIO-030: Finalizar proceso de reset (IMPORTANTE)

**Dado** un reset completado exitosamente  
**Cuando** hace click en "Finalizar"  
**Entonces:**
- Debe volver al Paso 0 (Configuración)
- El formulario debe mostrarse en estado inicial
- Los datos del contexto deben haberse actualizado (refreshData llamado)

---

### ✅ PORTFOLIO-031: Error en reset (IMPORTANTE)

**Dado** un proceso de reset que falla  
**Cuando** ocurre un error durante el reset  
**Entonces:**
- Debe mostrarse un icono de error ❌
- Debe mostrarse el título "Error en el Reset"
- Debe mostrarse el mensaje de error específico
- Debe mostrarse un botón "Intentar de Nuevo"

---

## CATEGORÍA 4: ESTADOS EDGE Y CASOS ESPECIALES

### ✅ PORTFOLIO-032: Usuario sin autenticar (CRÍTICO)

**Dado** un usuario NO autenticado  
**Cuando** intenta acceder a `/portfolio`  
**Entonces:**
- Debe ser redirigido a la página de login
- NO debe renderizarse el componente PortfolioManagementSystem

---

### ✅ PORTFOLIO-033: Estado de loading (IMPORTANTE)

**Dado** un usuario en la página `/portfolio`  
**Y** el contexto tiene `loading === true`  
**Cuando** observa la página  
**Entonces:**
- El botón "Exportar Portfolio" debe estar disabled
- El texto del botón debe mostrar "Cargando..."

---

### ✅ PORTFOLIO-034: Sin evidencias - mensaje en estadísticas (OPCIONAL)

**Dado** un usuario con `totalEntries === 0`  
**Cuando** observa las estadísticas generales  
**Entonces:**
- La card de "Evidencias" debe mostrar 0
- La card de "Competencia" debe mostrar nivel 1 - Principiante 🌱

---

### ✅ PORTFOLIO-035: Niveles de competencia (OPCIONAL)

**Dado** un usuario con diferentes cantidades de evidencias  
**Cuando** observa las estadísticas  
**Entonces:**
- `totalEntries < 5`: Nivel 1 - Principiante 🌱
- `5 <= totalEntries < 10`: Nivel 2 - Básico 🌿
- `10 <= totalEntries < 15`: Nivel 3 - Intermedio 🌳
- `totalEntries >= 15`: Nivel 4 - Avanzado 🏆

---

### ✅ PORTFOLIO-036: Cambio de tab durante exportación (OPCIONAL)

**Dado** una exportación en curso  
**Cuando** el usuario cambia al tab "Gestión de Ciclos"  
**Entonces:**
- El tab debe cambiar correctamente
- La exportación debe continuar en background
- Al volver al tab "Export Portfolio", debe mostrarse el estado de exportación en curso

---

### ✅ PORTFOLIO-037: Cambio de tab durante reset (OPCIONAL)

**Dado** un reset en curso (Paso 3, procesando)  
**Cuando** el usuario cambia al tab "Export Portfolio"  
**Entonces:**
- El tab debe cambiar correctamente
- El reset debe continuar en background
- Al volver al tab "Gestión de Ciclos", debe mostrarse el estado de reset en curso

---

### ✅ PORTFOLIO-038: Reset tipo "Selectivo" - Checkboxes personalizados (OPCIONAL)

**Dado** un usuario en Paso 0 con tipo "Selectivo" seleccionado  
**Cuando** marca solo "Resetear nivel de competencias"  
**Y** navega a "Vista Previa"  
**Entonces:**
- En "Después del Reset", competencia debe mostrar "L1 - Principiante"
- En "Después del Reset", fase debe mostrar "Actual" o la fase preservada

---

## RESUMEN DE CASOS DE PRUEBA

### Por Prioridad
- **CRÍTICO (P0):** 23 casos
- **IMPORTANTE (P1):** 12 casos
- **OPCIONAL (P2):** 7 casos

**TOTAL:** 42 casos de prueba documentados

### Por Categoría
- **Renderizado y Navegación Básica:** 4 casos
- **Sistema de Exportación:** 12 casos
- **Sistema de Reset:** 15 casos
- **Estados Edge y Casos Especiales:** 7 casos

---

## RECOMENDACIONES PARA IMPLEMENTACIÓN

### Prioridad de Implementación
1. **Fase 1 (Críticos):** PORTFOLIO-001 a PORTFOLIO-004, PORTFOLIO-005 a PORTFOLIO-014, PORTFOLIO-017, PORTFOLIO-019, PORTFOLIO-022 a PORTFOLIO-028, PORTFOLIO-032
2. **Fase 2 (Importantes):** PORTFOLIO-009, PORTFOLIO-010, PORTFOLIO-015, PORTFOLIO-016, etc.
3. **Fase 3 (Opcionales):** PORTFOLIO-034 a PORTFOLIO-038

### Consideraciones Técnicas
- **Mockear contexto:** Usar mocks para controlar `entryCounts`, `loading`, `refreshData`
- **Mockear API:** Interceptar llamadas a `/api/export-portfolio` y `/api/reset-system`
- **Esperas asíncronas:** Usar `waitFor` para barras de progreso
- **Timeouts:** Configurar timeouts adecuados para procesos multi-paso

---

**Redacción de casos de prueba completada.**  
**Próximo paso:** Fase 3 - Implementación de Scripts de Test con Playwright
