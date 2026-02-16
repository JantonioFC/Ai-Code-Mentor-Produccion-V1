# Test Master - AI Code Mentor

**Proyecto:** AI Code Mentor Beta Test
**Stack:** Next.js 15.4 | React 18.3 | TailwindCSS | SQLite | Gemini AI
**Fecha:** 15 de Febrero, 2026
**Estado:** Activo

---

## 1. Estrategia de Testing

Este documento define las skills de Antigravity que se utilizan para garantizar la calidad del proyecto AI Code Mentor. Las skills están organizadas por prioridad y fase de desarrollo.

---

## 2. Skills de Testing

### Nivel 1 - Imprescindibles

| Skill | Propósito | Alcance |
|-------|-----------|---------|
| `playwright-skill` | Automatización de browser con auto-detección de dev server (localhost:3000) | E2E: login, dashboard, sandbox, plantillas |
| `e2e-testing-patterns` | Patrones E2E con Playwright: selectores estables, data de test, paralelización | Flujos críticos de usuario completos |
| `javascript-testing-patterns` | Jest + Testing Library para unit e integration tests | Componentes React, hooks, utils, API routes |
| `unit-testing-test-generate` | Generación automática de tests unitarios con cobertura de edge cases | Servicios, controladores, lib/, hooks/ |
| `webapp-testing` | Testing local de Next.js con screenshots, logs de consola y debugging UI | Validación visual y funcional en desarrollo |

### Nivel 2 - Muy Valiosas

| Skill | Propósito | Alcance |
|-------|-----------|---------|
| `testing-patterns` | Patrones Jest: factories, mocking strategies, fixtures | Mocking de Gemini API, SQLite, auth |
| `test-driven-development` | Metodología TDD obligatoria para nuevas features | Desarrollo de features nuevas |
| `tdd-workflow` | Ciclo Red-Green-Refactor estructurado | Workflow diario de desarrollo |
| `test-fixing` | Resolución sistemática de tests fallidos con agrupación por error | Mantenimiento de test suites |
| `api-testing-observability-api-mock` | Mocking de API routes para tests aislados | API routes en pages/api/ |
| `systematic-debugging` | Debugging estructurado antes de proponer fixes | Investigación de fallos |

### Nivel 3 - De Apoyo

| Skill | Propósito | Alcance |
|-------|-----------|---------|
| `screen-reader-testing` | Testing de accesibilidad con VoiceOver/NVDA | Cumplimiento WCAG en UI |
| `dependency-upgrade` | Actualización segura de frameworks de testing | Upgrades de Playwright, Jest, Next.js |
| `performance-testing-review-ai-review` | Review de rendimiento con análisis AI | Optimización de carga y respuesta |
| `debugger` | Debugging especializado de errores y comportamiento inesperado | Fallos en producción y staging |
| `tdd-orchestrator` | Gobernanza TDD multi-agente | Coordinación de testing en equipo |

---

## 3. Áreas de Cobertura

### 3.1 Frontend (E2E + Componentes)

| Área | Skills Principales | Tests Objetivo |
|------|-------------------|----------------|
| Landing Page (`/`) | `playwright-skill`, `e2e-testing-patterns` | Renderizado, CTA, navegación |
| Login/Register (`/login`) | `playwright-skill`, `webapp-testing` | Flujo auth, validaciones, demo rápido |
| Dashboard (`/panel-de-control`) | `e2e-testing-patterns`, `webapp-testing` | Tabs, analytics, fases F0-F7 |
| Sandbox (Generación AI) | `playwright-skill`, `javascript-testing-patterns` | Streaming, selección, generación |
| Plantillas (`/plantillas`) | `e2e-testing-patterns` | Listado, preview, aplicar template |
| Device Flow (`/connect`) | `playwright-skill` | Autorización VS Code |

### 3.2 Backend (Unit + Integration)

| Área | Skills Principales | Tests Objetivo |
|------|-------------------|----------------|
| Auth API (`/api/auth/*`) | `unit-testing-test-generate`, `testing-patterns` | Login, register, refresh, logout |
| Lessons API (`/api/v1/lessons/*`) | `api-testing-observability-api-mock` | Generate, stream, feedback |
| Analytics API (`/api/v1/analytics/*`) | `javascript-testing-patterns` | Overview, feedback metrics |
| Profile API (`/api/v1/profile/*`) | `unit-testing-test-generate` | CRUD, GDPR delete |
| Sandbox History (`/api/v1/sandbox/*`) | `testing-patterns` | Save, list, delete |
| Export (`/api/export-*`) | `api-testing-observability-api-mock` | PDF, HTML, ZIP generation |

### 3.3 Servicios Core

| Servicio | Skills Principales | Tests Objetivo |
|----------|-------------------|----------------|
| `lib/auth-local.js` | `unit-testing-test-generate` | JWT, bcrypt, tokens |
| `lib/services/SmartLessonGenerator.js` | `testing-patterns`, `api-testing-observability-api-mock` | RAG, Gemini mock, streaming |
| `lib/db.js` | `unit-testing-test-generate` | SQLite operations, migrations |
| `lib/services/feedbackService.js` | `javascript-testing-patterns` | Rating, difficulty, analytics |
| `lib/rag/ContentRetriever.js` | `testing-patterns` | Semantic search, indexing |

---

## 4. Ejecución por Fases

### Fase 1 - Fundación (Prioritaria)
1. `unit-testing-test-generate` → Generar tests para `lib/auth-local.js` y `lib/db.js`
2. `playwright-skill` → Tests E2E de login, registro y acceso demo
3. `javascript-testing-patterns` → Tests de hooks (`useAuth`, `useStreamingLesson`)

### Fase 2 - Cobertura Core
4. `e2e-testing-patterns` → Flujos completos: login → dashboard → sandbox → generar lección
5. `api-testing-observability-api-mock` → Mock de Gemini API para tests de lecciones
6. `testing-patterns` → Factories y fixtures para datos de test

### Fase 3 - Calidad Avanzada
7. `webapp-testing` → Screenshots de regresión visual
8. `screen-reader-testing` → Auditoría de accesibilidad
9. `performance-testing-review-ai-review` → Análisis de rendimiento

### Fase 4 - Mantenimiento Continuo ✅

**Estado:** Completada (15 Feb 2026)

**Herramientas implementadas:**

| Herramienta | Archivo | Propósito |
|-------------|---------|-----------|
| Husky + lint-staged | `.husky/pre-commit` | Pre-commit hooks que ejecutan Jest en archivos modificados |
| Test Health Report | `scripts/test-health.js` | Reporte consolidado Jest + Playwright (pass/fail/skip/slow) |
| TDD Workflow | `scripts/tdd-new-feature.sh` | Genera template Red-Green-Refactor + Jest watch |
| CI Health Step | `.github/workflows/ci.yml` | Step "Test Health Report" en pipeline |

**Scripts disponibles:**
```bash
npm run test:health   # Reporte consolidado de salud
npm run tdd -- <name> # Crear nuevo feature con TDD workflow
```

**Dependencias actualizadas:**
- `@playwright/test` → latest patch
- `@babel/preset-env` → latest minor
- `@types/node`, `@types/react` → latest patches

**Mejoras CI:**
- Eliminado step duplicado "Security Audit"
- Agregado step "Test Health Report" post unit-tests

10. `test-fixing` → Resolución de tests rotos tras cambios
11. `tdd-workflow` → TDD para todas las features nuevas
12. `dependency-upgrade` → Actualización de dependencias con tests

---

## 5. Comandos de Referencia

```bash
# Unit tests (Jest)
npm test
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug

# Smoke tests
npm run test:smoke

# Verificar setup E2E
npm run test:e2e:verify
```

---

## 6. Métricas Objetivo

| Métrica | Objetivo |
|---------|----------|
| Cobertura Unit Tests | > 70% en lib/ y services/ |
| Tests E2E pasando | 100% de flujos críticos |
| Tiempo de ejecución E2E | < 5 minutos |
| Tests de accesibilidad | WCAG 2.1 AA |
| Regresión visual | 0 diferencias no aprobadas |
