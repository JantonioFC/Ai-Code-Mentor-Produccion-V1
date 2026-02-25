# Matriz de Migración API (Pages Router -> App Router)

Este documento detalla el plan incremental para migrar los endpoints legacy ubicados en `pages/api/` hacia el nuevo enrutador `app/api/` en Next.js.
Forma parte de la Fase 3 del *PRD de Mejora: Hardening + Modernización*.

## Criterios de Clasificación

- **Criticidad:** Alta (operaciones de usuario, datos sensibles), Media (operaciones de progreso/estado), Baja (utilitarios, testing, salud).
- **Complejidad:** Alta (múltiples dependencias, flujos complejos de IA), Media (CRUD estándar), Baja (respuestas estáticas o simples).
- **Orden:** Prioridad de migración (Fase Piloto, Fase 1, Fase 2, etc.).

## Inventario de Endpoints y Priorización

| Endpoint (`pages/api/...`) | Dominio | Criticidad | Complejidad | Fase Sugerida |
| :--- | :--- | :---: | :---: | :--- |
| `/health.js` | Sistema | Baja | Baja | **Fase Piloto** |
| `/hello.js` | Sistema | Baja | Baja | **Fase Piloto** |
| `/clear-cache.js` | Admin | Media | Baja | Fase 1 |
| `/delete-module.js` | Admin | Alta | Media | Fase 1 |
| `/reset-system.js` | Admin | Alta | Media | Fase 1 |
| `/auth/login.js` | Auth | Alta | Media | Fase 2 |
| `/auth/logout.js` | Auth | Alta | Media | Fase 2 |
| `/auth/user.js` | Auth | Alta | Media | Fase 2 |
| `/curriculum/index.js` | Core | Alta | Alta | Fase 3 |
| `/generate-lesson.js` | Core IA | Alta | Alta | Fase 3 |
| `/v1/analytics/*` | Analytics | Media | Media | Fase 4 |
| `/auto-save-system.js` | Tracking | Media | Alta | Fase 4 |

*(Nota: Los más de 60 endpoints detectados se han agrupado en dominios clave por cuestiones de legibilidad operativa. El orden anterior aborda desde el menor riesgo operativo hacia el corazón funcional del sistema).*

## Plan Incremental

1. **Fase Piloto:** Migrar `health.js` y `hello.js`. Validar que el middleware global y el enrutamiento de Next.js App Router (Route Handlers) funcionan correctamente sin interferir con las rutas del Pages Router coexistentes.
2. **Post-Piloto:** Actualizar de manera progresiva los endpoints operativos (Admin) revisados en la Fase 1 de Hardening. Esto nos brinda práctica con extracción de tokens usando los métodos estandarizados del App Router.
3. **Plan de Deprecación:** 
   - Publicar advertencias en los logs (`console.warn`) en cada endpoint legacy que sea accedido.
   - Establecer una fecha o release límite para eliminar la carpeta `pages/api/` definitivamente tras completar la Fase 4.
