# Análisis Exploratorio - Módulo Portfolio
## Misión 219.0 - Fase 1

**Fecha:** 2025-10-10  
**Analista:** Mentor Coder  
**Objetivo:** Caracterizar el comportamiento actual del módulo /portfolio para crear suite de tests E2E

---

## 1. ESTRUCTURA DE LA PÁGINA

### Archivo Principal
- `pages/portfolio.js` - Página principal que orquesta el módulo

### Componentes Utilizados
1. **ProtectedRoute** - Requiere autenticación
2. **PrivateLayout** - Layout con navegación y branding
3. **PortfolioManagementSystem** - Componente orquestador principal

---

## 2. ARQUITECTURA DEL MÓDULO

### PortfolioManagementSystem (Orquestador)
**Ubicación:** `components/ProjectTracking/PortfolioManagementSystem.js`

**Responsabilidad:**
- Sistema de tabs con 2 secciones principales
- Muestra estadísticas generales del portfolio
- Gestiona navegación entre Export y Reset

**Sub-componentes:**
1. **PortfolioExportSystem** (Tab 1 - "Export Portfolio")
2. **ResetSystem** (Tab 2 - "Gestión de Ciclos")

**Contexto:**
- Usa `ProjectTrackingContext` para obtener:
  - `dashboardData`
  - `entryCounts` (contador de evidencias por tipo)
  - `recentEntries`
  - `loading`

**Estados Visuales:**
- Header con resumen (evidencias totales, competencias, ciclos, estructura)
- Tabs de navegación (activo/inactivo)
- Panel de ayuda y guía

---

### PortfolioExportSystem (Exportación)
**Ubicación:** `components/ProjectTracking/PortfolioExportSystem.js`

**Responsabilidad:**
- Exportar portfolio profesional en múltiples formatos
- Configurar contenido y opciones de exportación
- Gestionar descarga de archivos generados

**Formatos de Exportación:**
1. **PDF** - Documento profesional
2. **HTML** - Página web
3. **GitHub Pages** - ZIP con archivos deployables

**Configuraciones:**
- `format` - Formato de exportación (pdf/html/github)
- `studentName` - Nombre del estudiante
- `includeTemplates` - Incluir entradas de templates (DDE, PAS, HRC, IRP)
- `includeModules` - Incluir módulos y lecciones
- `includeAnalytics` - Incluir métricas y análisis

**Estados del Componente:**
1. **Configuración** (default) - Seleccionar opciones
2. **Exportando** (isExporting=true) - Barra de progreso activa
3. **Completado** (completed=true) - Mostrar descarga
4. **Error** (error!=null) - Mostrar mensaje de error

**API Endpoint:**
- `POST /api/export-portfolio` - Genera el portfolio

**Elementos Visuales:**
- Overview del portfolio (evidencias, tipos, competencia, fase)
- Estructura del portfolio (6 secciones documentadas)
- Formulario de configuración
- Barra de progreso durante exportación
- Botón de descarga al completar
- Panel de ayuda e información

---

### ResetSystem (Reset de Ciclos)
**Ubicación:** `components/ProjectTracking/ResetSystem.js`

**Responsabilidad:**
- Gestionar ciclos curriculares de 24 meses
- Archivar o eliminar datos de ciclo actual
- Iniciar nuevo ciclo desde Fase 1

**Tipos de Reset:**
1. **Soft** (Recomendado) - Archiva datos, reinicia contadores
2. **Selectivo** - Control granular de componentes a resetear
3. **Hard** - Eliminación completa, irreversible

**Configuraciones:**
- `resetType` - Tipo de reset (soft/selective/hard)
- `archiveData` - Archivar datos actuales
- `resetCompetencies` - Resetear nivel de competencias
- `resetPhaseProgress` - Resetear progreso de fases
- `resetModules` - Resetear módulos cargados
- `preserveSettings` - Preservar configuraciones personales
- `exportBeforeReset` - Exportar portfolio antes del reset
- `newCycleStartDate` - Fecha de inicio del nuevo ciclo

**Flujo de Confirmación (4 pasos):**
1. **Paso 0:** Configuración - Seleccionar tipo y opciones
2. **Paso 1:** Vista Previa - Comparar estado actual vs. después del reset
3. **Paso 2:** Confirmación Final - Advertencia con detalle de cambios
4. **Paso 3:** Ejecución - Proceso con barra de progreso

**Estados del Componente:**
- `confirmationStep` (0-3) - Paso actual del flujo
- `isProcessing` - Reset en progreso
- `completed` - Reset completado exitosamente
- `error` - Error durante reset

**API Endpoint:**
- `POST /api/reset-system` - Ejecuta el reset

**Elementos Visuales:**
- Estado del ciclo actual (evidencias, templates, competencia, duración)
- Estructura del ciclo curricular (6 fases documentadas)
- Formulario de configuración (Paso 0)
- Vista previa comparativa (Paso 1)
- Resumen del reset (Paso 1)
- Confirmación final con advertencia (Paso 2)
- Barra de progreso (Paso 3)
- Descarga de archivos (archivo + backup) (Paso 3)
- Panel de ayuda

---

## 3. DATOS Y CONTEXTO

### ProjectTrackingContext
**Ubicación:** `contexts/ProjectTrackingContext.js`

**Proporciona:**
- `dashboardData` - Datos generales del dashboard
- `entryCounts` - Objeto con contadores de evidencias por tipo
- `recentEntries` - Lista de entradas recientes
- `loading` - Estado de carga
- `refreshData()` - Función para recargar datos

**Cálculos Derivados:**
```javascript
// Total de evidencias
const totalEntries = Object.values(entryCounts).reduce((sum, count) => sum + count, 0);

// Nivel de competencia
const competencyLevel = {
  totalEntries >= 15 → { level: 4, name: 'Avanzado', icon: '🏆' }
  totalEntries >= 10 → { level: 3, name: 'Intermedio', icon: '🌳' }
  totalEntries >= 5  → { level: 2, name: 'Básico', icon: '🌿' }
  else               → { level: 1, name: 'Principiante', icon: '🌱' }
}

// Fase actual (basado en evidencias)
const currentPhase = Math.min(Math.floor(totalEntries / 5) + 1, 6);
```

---

## 4. FUNCIONALIDADES OBSERVABLES

### Navegación
1. Acceder a `/portfolio` requiere autenticación
2. Sistema de tabs para cambiar entre Export y Reset
3. Tab activo muestra fondo degradado (azul-púrpura)
4. Tab inactivo muestra fondo blanco con hover gris

### Sistema de Export
1. **Selección de formato** - Radio buttons/select (PDF, HTML, GitHub)
2. **Configuración de nombre** - Input text para nombre del estudiante
3. **Opciones de contenido** - Checkboxes para incluir templates, módulos, analytics
4. **Botón de exportar:**
   - Disabled si `totalEntries === 0` o `loading === true`
   - Enabled muestra gradiente y hover effect
   - Click activa proceso de exportación
5. **Barra de progreso** - Muestra pasos: 10% → 30% → 80% → 100%
6. **Descarga** - Botón verde "Descargar Portfolio" al completar
7. **Estados de error** - Card roja con botón "Reintentar"

### Sistema de Reset
1. **Navegación multi-paso:**
   - Botón "Vista Previa →" (Paso 0 → 1)
   - Botón "← Volver" (Paso 1 → 0, etc.)
   - Botón "Confirmar Reset →" (Paso 1 → 2)
   - Botón "EJECUTAR RESET" rojo (Paso 2 → 3)

2. **Paso 0 - Configuración:**
   - Radio buttons para tipo de reset (soft/selective/hard)
   - Checkboxes condicionales si "selective"
   - Checkboxes de opciones adicionales
   - Input date para fecha de inicio

3. **Paso 1 - Vista Previa:**
   - Grid comparativo (Actual vs. Después)
   - Card amarilla con resumen
   - Contadores dinámicos

4. **Paso 2 - Confirmación Final:**
   - Icono de advertencia ⚠️
   - Card roja con detalles
   - Botón rojo destacado "EJECUTAR RESET"

5. **Paso 3 - Ejecución:**
   - Barra de progreso (10% → 30% → 80% → 100%)
   - Al completar: icono 🎉, botones de descarga
   - Error: icono ❌, botón "Intentar de Nuevo"

### Elementos Interactivos
1. **Tabs de navegación** - Click cambia vista
2. **Radio buttons** - Selección única de opciones
3. **Checkboxes** - Múltiples selecciones
4. **Inputs** - Text y Date
5. **Botones:**
   - Exportar portfolio
   - Descargar archivo
   - Navegar entre pasos
   - Ejecutar reset
   - Reintentar
   - Finalizar

---

## 5. ESTADOS Y VARIACIONES

### Estados del Portfolio
| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Sin evidencias** | `totalEntries === 0` | Botones disabled, mensajes "crear evidencias" |
| **Con pocas evidencias** | `totalEntries < 5` | Nivel Principiante, Fase 1 |
| **Evidencias medias** | `5 <= totalEntries < 10` | Nivel Básico, Fase 2-3 |
| **Muchas evidencias** | `totalEntries >= 10` | Nivel Intermedio/Avanzado, Fase 3+ |
| **Loading** | `loading === true` | Botones disabled, spinner visible |

### Estados de Exportación
| Estado | Indicadores Visuales |
|--------|---------------------|
| **Configuración** | Formulario activo, botón "Exportar" |
| **Exportando** | Barra de progreso, texto de paso actual |
| **Completado** | Icono 🎉, metadata, botón "Descargar" |
| **Error** | Icono ⚠️, mensaje de error, botón "Reintentar" |

### Estados de Reset
| Estado | Indicadores Visuales |
|--------|---------------------|
| **Paso 0** | Formulario de configuración |
| **Paso 1** | Grid comparativo, resumen |
| **Paso 2** | Advertencia grande, confirmación final |
| **Paso 3 - Procesando** | Barra de progreso |
| **Paso 3 - Completado** | Icono 🎉, enlaces de descarga |
| **Paso 3 - Error** | Icono ❌, mensaje, botón "Intentar de Nuevo" |

---

## 6. POSIBLES CASOS EDGE

### Sin Autenticación
- Redirección automática a login (ProtectedRoute)

### Sin Datos en Contexto
- `loading === true` → Botones disabled
- `entryCounts === {}` → totalEntries = 0
- Mensajes indicando necesidad de crear evidencias

### Durante Procesos Asíncronos
- Botones disabled
- Barras de progreso visibles
- Textos de estado actualizándose

### Errores de API
- Export falla → Mensaje de error en card roja
- Reset falla → Mensaje de error con botón reintentar

### Navegación
- Cambiar tab durante export → Export continúa en background
- Cambiar tab durante reset → Reset continúa

---

## 7. DEPENDENCIAS EXTERNAS

### Contextos
- `ProjectTrackingContext` - Datos principales
- `AuthContext` (via ProtectedRoute) - Autenticación

### API Endpoints (REQUERIDOS para tests de integración)
- `POST /api/export-portfolio`
- `POST /api/reset-system`

**NOTA:** Para tests E2E de caracterización, estos endpoints deben estar implementados o mockeados.

---

## 8. RESUMEN DE ELEMENTOS A TESTEAR

### Elementos Visibles (DOM)
- [ ] Header del portfolio con título y estadísticas
- [ ] Tabs de navegación (Export, Reset)
- [ ] Tab activo tiene estilos correctos
- [ ] Estadísticas generales (4 cards)
- [ ] PortfolioExportSystem visible al cargar
- [ ] ResetSystem visible al cambiar tab

### PortfolioExportSystem
- [ ] Select/dropdown de formato
- [ ] Input de nombre del estudiante
- [ ] Checkboxes de contenido (3)
- [ ] Botón "Exportar Portfolio"
- [ ] Botón disabled cuando totalEntries = 0
- [ ] Barra de progreso durante export
- [ ] Botón "Descargar Portfolio" al completar
- [ ] Mensaje de error si falla

### ResetSystem
- [ ] Radio buttons de tipo de reset (3)
- [ ] Checkboxes de opciones
- [ ] Input de fecha
- [ ] Botón "Vista Previa"
- [ ] Grid comparativo en Paso 1
- [ ] Botones de navegación (Volver, Confirmar)
- [ ] Advertencia en Paso 2
- [ ] Botón "EJECUTAR RESET" rojo
- [ ] Barra de progreso en Paso 3
- [ ] Botones de descarga al completar

### Interacciones
- [ ] Click en tab cambia vista
- [ ] Click en "Exportar" inicia proceso
- [ ] Click en "Descargar" descarga archivo
- [ ] Click en "Vista Previa" avanza paso
- [ ] Click en "Volver" retrocede paso
- [ ] Click en "EJECUTAR RESET" inicia reset
- [ ] Cambios en configuración actualizan preview

---

## 9. CONCLUSIONES

### Complejidad del Módulo
- **Alta:** Múltiples sub-componentes con estados complejos
- **Flujos multi-paso:** Reset con 4 pasos de confirmación
- **Interacciones API:** 2 endpoints críticos
- **Estados dinámicos:** Basados en datos del contexto

### Recomendaciones para Testing
1. **Mockear ProjectTrackingContext** para controlar estados
2. **Mockear API endpoints** para respuestas predecibles
3. **Testear cada estado** del flujo de Reset por separado
4. **Verificar elementos visuales** en cada paso
5. **Testear interacciones** de navegación entre tabs y pasos
6. **Validar estados disabled/enabled** según condiciones

### Prioridades de Testing
1. **CRÍTICO:** Navegación básica y renderizado inicial
2. **CRÍTICO:** Flujo completo de Export (happy path)
3. **CRÍTICO:** Flujo completo de Reset (happy path)
4. **IMPORTANTE:** Estados de error
5. **IMPORTANTE:** Estados edge (sin evidencias, loading)
6. **OPCIONAL:** Variaciones de configuración

---

**Análisis completado.**  
**Próximo paso:** Fase 2 - Redacción de Casos de Prueba
