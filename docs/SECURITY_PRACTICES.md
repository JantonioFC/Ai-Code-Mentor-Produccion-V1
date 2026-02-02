
# Prácticas de Seguridad API

**Versión**: 1.0
**Estado**: En Vigor
**Alcance**: Todos los endpoints bajo `/api/v1/`.

---

## 1. Autenticación y Autorización

### Estándar: JWT (JSON Web Tokens)
*   **Algoritmo**: HS256 (mínimo). Recomendado RS256 para producción distribuida.
*   **Expiración**:
    *   `Access Token`: 15 minutos.
    *   `Refresh Token`: 7 días (Rotación estricta).
*   **Transporte**: `Authorization: Bearer <token>` header obligatoria.
*   **Almacenamiento**:
    *   **Cliente**: `HttpOnly` Secure Cookies (Previene XSS). NO usar `localStorage`.

### Control de Acceso (RBAC)
*   **Middleware**: `verifyToken` debe ejecutarse antes de cualquier lógica de negocio.
*   **Propiedad**: Los usuarios solo pueden acceder/modificar sus propios recursos (`userId` check).

## 2. Protección de Infraestructura

### Rate Limiting (Token Bucket)
Para prevenir fuerza bruta y DDoS L7:
*   **Global**: 100 requests / 15 min por IP.
*   **Auth (Login/Register)**: 5 requests / 15 min por IP.
*   **Generación IA**: 10 requests / dia (Free Tier).

### Headers de Seguridad (Helmet)
Configuración obligatoria en `vercel.json` o middleware:
*   `X-Content-Type-Options: nosniff`
*   `X-Frame-Options: DENY`
*   `Strict-Transport-Security` (HSTS)
*   `Content-Security-Policy`: Default `'self'`.

## 3. Validación de Datos (Input Hygiene)

### Zod Schemas
Todo endpoint debe validar `req.body` y `req.query` contra un esquema Zod estricto.
*   **Sanitización**: `.trim()`, escape de HTML para campos de texto libre.
*   **Tipado**: Rechazar propiedades desconocidas (`.strict()`).

### Inyección
*   **SQL**: Uso obligatorio de Primitivas de ORM (Prisma/TypeORM) o Consultas Parametrizadas. NUNCA concatenar strings en SQL.
*   **Prompt Injection**: Input del usuario pasa por `ClarityGate` antes de llegar al LLM.

## 4. Gestión de Secretos
*   Nunca commitear `.env`.
*   Rotación de `JWT_SECRET` en caso de compromiso.
*   API Keys de terceros (OpenAI, Gemini) inyectadas solo en tiempo de ejecución (Server-side).

## 5. Auditoría y Logging
*   Loggear fallos de autenticación (sin password).
*   Loggear errores 500 con Stack Trace (solo en dev/staging).
*   Monitoreo de anomalías en consumo de tokens.
