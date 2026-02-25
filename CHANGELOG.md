
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Testing Fase 1: Fundación (2026-02-15)

**98 tests nuevos** — Total del proyecto: **225 tests pasando**.

#### Unit Tests (Jest) — 84 tests

- `tests/unit/auth-local.test.js` — 33 tests
  - generateToken, verifyToken (válido, Bearer, null, expirado, inválido)
  - generateTokenPair (access + refresh, almacenamiento DB, expiración 30d)
  - registerUser (duplicado, creación exitosa, transacción, error genérico)
  - loginUser (exitoso con tokens, error en excepción)
  - refreshAccessToken (válido, inválido, expirado, usuario no encontrado)
  - revokeRefreshToken (éxito, fallo)
  - verifyPAT (formato inválido, no encontrado, usuario no encontrado, válido, last_used_at)

- `tests/unit/db.test.js` — 22 tests
  - Inicialización (WAL mode, foreign keys)
  - query, get, run, exec, transaction
  - find (WHERE, múltiples condiciones, sin WHERE, columnas custom)
  - findOne (LIMIT 1, sin match)
  - insert (multi-columna, columna única)
  - update (SET + WHERE, múltiples columnas)
  - close (con/sin instancia abierta)

- `tests/components/useAuth.test.js` — 15 tests
  - Context (error fuera de AuthProvider, estado loading)
  - checkSession (válida, inválida, error de red)
  - signIn (exitoso, credenciales inválidas, fallo de red)
  - signUp (exitoso, display_name, fallido)
  - signOut (limpieza + redirect, API fallida)
  - session (autenticado, null sin auth)

- `tests/components/useStreamingLesson.test.js` — 14 tests
  - Estado inicial, streamLesson (SSE parsing, chunks, progress, end, error)
  - Error handling (HTTP, network, isStreaming)
  - reset, state reset en nuevo stream

#### E2E Tests (Playwright) — 14 tests

- `e2e/auth-flow.spec.js` — 14 tests
  - Login Flow: carga de página, validación, demo credentials, credenciales inválidas
  - Quick Demo Access: redirect a dashboard, estado loading
  - Registration: tab registro, validación 6 chars, email duplicado, registro exitoso
  - Tab Switching: alternancia login/signup, volver al inicio
  - Logout: cierre de sesión desde dashboard
  - Protected Routes: redirect sin auth

#### Documentación

- `TEST_MASTER.md` — Plan maestro de testing (16 skills, 4 fases, métricas objetivo)

### Fixed

- Creado `sentry.client.config.js` — Faltaba tras migración a `instrumentation-client.ts`, causaba error 500 en dev server (`pages/_app.js` línea 2 aún lo importaba)

### Known Issues

- `lib/auth-local.js:89` — `loginUser()` no verifica password y no maneja usuario inexistente, causa `TypeError: Cannot read properties of undefined (reading 'id')` cuando el demo user no está seeded en la DB local

## [0.9.0] - 2026-02-01 (Round 4: Enterprise Ready)
### Added
- **State Management**: Zustand store (`lib/store/lessonStore.ts`) for complex session state.
- **Launch**: `LAUNCH_PLAN.md` and `ROADMAP.md` (RICE prioritized).
- **Docs**: `docs/ARCHITECTURE_DIAGRAMS.md` with Mermaid graphs.
- **Templates**: GitHub Issue Templates for bugs/features.

### Changed
- **API**: Migrated `APIWrapper.js` to strictly typed `APIWrapper.ts`.
- **UI**: Refactored `Button` and `Modal` for Accessibility (ARIA, Touch Targets).
- **Standards**: Enforced coding standards via `CONTRIBUTING.md`.

## [0.8.0] - 2026-02-01 (Round 3: Professional Standards)
### Added
- **Testing**: Jest Unit Tests for Agentic Logic (`SmartLessonGenerator`).
- **Docs**: OpenAPI Schema generation support.

### Changed
- **Config**: Migrated core config to TypeScript (`unifiedConfig.ts`).
- **Backend**: Implemented Layered Architecture (`LessonController`, `BaseController`).

## [0.5.0] - 2026-01-31 (Round 2: Architecture & Design)
### Added
- **Observability**: Metrics and Tracing stack.
- **E2E**: Playwright foundation.

### Changed
- **UI**: Complete "Industrial" Design Overhaul.
- **Architecture**: Clean Architecture decoupling.

## [0.1.0] - 2026-01-30 (Round 1: Data & AI)
### Added
- **RAG**: Semantic Chunker, Reranker, Query Expander.
- **Agent**: Smart Lesson Generator with Clarity Gate (0.7 threshold).
- **Memory**: User Entity Memory and Consolidation.
- **Eval**: LLM-as-a-Judge implementation.
