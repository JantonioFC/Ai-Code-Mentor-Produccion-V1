# PRD de Mejora: Hardening + Modernización

**Producto:** AI Code Mentor  
**Versión:** v1.0  
**Fecha:** 25 de febrero de 2026  
**Estado:** Propuesto para ejecución  
**Tipo:** PRD de mejora técnica (no funcional)

---

## 1) Resumen Ejecutivo

Este PRD define un ciclo de mejora para elevar la confiabilidad, seguridad operativa y mantenibilidad del proyecto sin alterar la propuesta de valor educativa.

El enfoque es:
1. **Cerrar riesgos críticos de seguridad** en endpoints operativos.
2. **Reducir deuda técnica visible** (artefactos legacy y configuraciones desalineadas).
3. **Acelerar evolución arquitectónica** hacia App Router/API moderna.

Resultado esperado: menor superficie de riesgo, menor costo de mantenimiento y mayor velocidad de entrega para features de producto.

---

## 2) Problema a Resolver

Actualmente existen señales de deuda y riesgo técnico que impactan producción:

- Endpoints operativos expuestos sin controles de acceso robustos.
- Artefactos de backup/disabled versionados en repositorio principal.
- Desalineación entre stack real y documentación/configuración.
- Coexistencia prolongada de patrones API legacy y nuevos.

Estas condiciones aumentan:
- Riesgo de incidentes de seguridad.
- Riesgo de regresiones en despliegues.
- Fricción para onboarding y desarrollo.

---

## 3) Objetivos

### 3.1 Objetivos de negocio/ingeniería

- Reducir riesgo operativo y de seguridad en APIs sensibles.
- Mejorar higiene del repositorio para disminuir ruido y errores humanos.
- Alinear documentación, tooling y stack para ejecución predecible.
- Definir ruta concreta de migración API hacia App Router.

### 3.2 Objetivos medibles (KPIs)

- **0 endpoints críticos sin protección** (auth + autorización por rol).
- **0 archivos legacy versionados** con sufijos `.backup`, `.bak`, `.disabled` en ramas principales.
- **100% de scripts/documentación alineados** con versión real de framework.
- **>= 25% de endpoints API legacy priorizados** con plan de migración definido y tickets creados.

---

## 4) No Objetivos

- No rediseñar UI/UX del producto.
- No reescribir todo el backend en un único sprint.
- No migrar toda la base de datos ni cambiar proveedor.
- No incorporar nuevos features funcionales de aprendizaje en esta fase.

---

## 5) Alcance

### 5.1 In Scope

1. **Hardening de endpoints operativos críticos**
   - Protección de endpoints de backup, cache clear y operaciones administrativas.
   - Revisión de método HTTP permitido, autenticación, autorización y trazabilidad.

2. **Higiene de repositorio y deuda visible**
   - Eliminación/archivo fuera de rama principal de artefactos legacy.
   - Reglas de ignore para entornos generados localmente.
   - Fortalecimiento de hooks de calidad (lint/test mínimo por commit).

3. **Alineación técnica y documental**
   - Alineación de README/roadmap y configuración a stack real.
   - Normalización de reglas de linting y convenciones mínimas.

4. **Ruta de modernización API**
   - Inventario de endpoints legacy.
   - Priorización por criticidad/uso.
   - Plan incremental de migración a App Router.

### 5.2 Out of Scope

- Refactor total de todos los servicios en `lib/`.
- Re-estructuración completa del dominio pedagógico.
- Migración total a TypeScript estricto en esta iteración.

---

## 6) Requisitos Funcionales

### RF-01 Seguridad de endpoints críticos
- Todo endpoint operativo debe requerir autenticación válida.
- Endpoints administrativos deben requerir rol explícito (`admin` o equivalente).
- Deben devolver códigos HTTP consistentes (`401`, `403`, `405`, `500`) y payload estándar.

### RF-02 Control de cambios y limpieza técnica
- No se aceptan nuevos archivos `*.backup`, `*.bak`, `*.disabled` en rama principal.
- Los archivos existentes deben eliminarse o moverse a rutas de archivo no productivas.

### RF-03 Validaciones automáticas mínimas
- Lint y pruebas mínimas deben ejecutarse en pre-commit o CI para rutas de código fuente.

### RF-04 Plan de migración API
- Debe existir matriz de endpoints legacy con:
  - criticidad,
  - dependencia,
  - complejidad,
  - orden sugerido de migración.

---

## 7) Requisitos No Funcionales

- **Seguridad:** principio de menor privilegio para operaciones sensibles.
- **Observabilidad:** logging estructurado de intentos fallidos y operaciones admin.
- **Mantenibilidad:** documentación técnica consistente y rastreable.
- **Compatibilidad:** cambios sin romper clientes actuales (deprecación gradual).

---

## 8) User Stories Técnicas

1. Como **maintainer**, quiero que endpoints de operación estén protegidos para evitar uso indebido.
2. Como **desarrollador**, quiero un repositorio limpio de artefactos legacy para trabajar sin ruido.
3. Como **equipo de producto**, queremos documentación alineada al estado real para planificar correctamente.
4. Como **arquitectura**, queremos un plan de migración API incremental para modernizar sin detener entregas.

---

## 9) Criterios de Aceptación

- [x] Endpoints críticos auditados y protegidos con auth + rol.
- [x] Tests de integración cubren casos `401/403/405` en endpoints endurecidos.
- [x] Artefactos legacy eliminados de rama principal.
- [x] Reglas de ignore y calidad actualizadas y validadas.
- [x] Documento de migración API publicado con fases y priorización.
- [x] CI verde en rama de integración.

---

## 10) Plan de Entrega (3 fases)

### Fase 1 — Seguridad y Riesgo Inmediato (Semana 1)
- Hardening de endpoints críticos.
- Estandarización de respuestas de error.
- Logging de seguridad básico.

### Fase 2 — Higiene y Alineación (Semana 2)
- Limpieza de artefactos legacy.
- Ajustes de ignore/lint-staged/documentación.
- Verificación de scripts de calidad.

### Fase 3 — Modernización API Guiada (Semana 3)
- Matriz de migración endpoint por endpoint.
- Implementación piloto de migración (1-2 dominios).
- Plan de deprecación y comunicación técnica.

---

## 11) Riesgos y Mitigaciones

- **Riesgo:** endurecimiento rompe flujos internos no autenticados.  
  **Mitigación:** rollout por feature flag + pruebas de integración.

- **Riesgo:** limpieza de archivos legacy borra contexto útil.  
  **Mitigación:** preservar en historial git/etiquetas de release.

- **Riesgo:** migración API parcial genera inconsistencia.  
  **Mitigación:** contrato común de errores y versionado explícito.

---

## 12) Dependencias

- Definición clara de política de roles/autorización.
- Capacidad de ejecutar pruebas de integración en CI.
- Acuerdo de equipo sobre estrategia de migración incremental.

---

## 13) Métricas de Éxito Post-Release (30 días)

- 0 incidentes por acceso no autorizado en endpoints operativos.
- Reducción de PRs con cambios de “limpieza accidental”.
- Menor tiempo promedio de revisión técnica en PRs de backend.
- Mayor estabilidad del pipeline CI (fallos no determinísticos a la baja).

---

## 14) Checklist de Go/No-Go

- [x] Endpoints críticos protegidos y probados.
- [x] CI y lint estables.
- [x] Documentación actualizada.
- [x] Plan de migración API aprobado.
- [x] Comunicación interna de cambios completada.

---

## 15) Decisiones Abiertas

1. ¿Se aplicará middleware único de auth/role o validación por endpoint?
2. ¿Qué SLA de migración tendrá cada dominio API legacy?
3. ¿Qué cobertura mínima exigiremos para aceptar cambios en endpoints críticos?

---

> Este PRD está diseñado para ejecutarse sin frenar roadmap funcional y con impacto técnico visible en 2-3 semanas.
