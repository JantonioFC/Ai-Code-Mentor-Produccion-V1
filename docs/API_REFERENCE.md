# 📚 Referencia de API - AI Code Mentor

**Versión:** 2.0  
**Base URL:** `/api/`  
**Última actualización:** 2025-12-07

---

## 🔐 Autenticación

La mayoría de endpoints requieren autenticación via Supabase JWT.

**Header requerido:**
```
Authorization: Bearer <supabase-jwt-token>
```

---

## 🤖 AI Analysis (v2)

### POST /api/v2/analyze

Analiza código con el router resiliente (fallback automático).

**Request:**
```json
{
  "code": "function hello() { console.log('Hello'); }",
  "language": "javascript",
  "phase": "fase-1",
  "analysisType": "general"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "feedback": "...",
    "strengths": ["..."],
    "improvements": ["..."],
    "examples": ["..."],
    "score": 7.5
  },
  "metadata": {
    "model": "gemini-1.5-pro",
    "tokensUsed": 1234,
    "latency": 2500,
    "phase": "fase-1",
    "routerVersion": "2.0.0"
  }
}
```

**Parámetros:**

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `code` | string | - | Código a analizar (requerido) |
| `language` | string | `javascript` | Lenguaje del código |
| `phase` | string | `fase-1` | Fase del estudiante (fase-0 a fase-7) |
| `analysisType` | string | `general` | Tipo: general, debug, performance, architecture |

---

### GET /api/v2/health

Verifica estado del sistema de IA.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T...",
  "version": "2.0.0",
  "router": {
    "initialized": true,
    "loadedProviders": ["gemini-1.5-pro", "gemini-1.5-flash"],
    "cacheSize": 5
  },
  "models": {
    "available": 3,
    "list": [
      { "name": "gemini-1.5-pro", "displayName": "Gemini 1.5 Pro", "priority": 1 }
    ]
  },
  "usage": {
    "period": "24 horas",
    "totalRequests": 42,
    "successRate": "95.24%"
  }
}
```

---

## 🔬 AI Analysis (v1 - Legacy)

### POST /api/analyze

Análisis de código (versión legacy, sin router).

**Request:**
```json
{
  "code": "...",
  "analysisType": "general"
}
```

**Response:**
```json
{
  "analysis": "...",
  "provider": "gemini",
  "level": 2,
  "model": "gemini-2.5-flash",
  "type": "general",
  "timestamp": "..."
}
```

---

## 📚 Curriculum

### GET /api/curriculum

Obtiene estructura completa del curriculum.

### GET /api/v1/phases/:phaseId/modules

Obtiene módulos de una fase (lazy loading).

### GET /api/v1/lessons/:weekId

Obtiene detalles de una semana.

---

## 📊 Progress

### GET /api/progress/summary

Obtiene resumen de progreso del usuario.

### POST /api/update-progress

Actualiza progreso del usuario.

---

## 🔧 Sistema

### POST /api/clear-cache

Limpia cache de lecciones.

### GET /api/health

Health check básico del sistema.

---

## 📝 IRP (Peer Review)

### POST /api/v1/irp/reviews

Crea nueva solicitud de revisión.

### GET /api/v1/irp/reviews

Obtiene historial de revisiones.

### GET /api/v1/irp/reviews/:id

Obtiene detalles de una revisión.

---

## 🔢 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 405 | Method Not Allowed |
| 429 | Too Many Requests - Rate limit alcanzado |
| 500 | Internal Server Error |

---

## 📊 Rate Limits

| Endpoint | Límite |
|----------|--------|
| `/api/v2/analyze` | 60 req/min por usuario |
| `/api/analyze` | 60 req/min por usuario |
| Otros | 100 req/min |

---

## 🔗 SDKs y Wrappers

### JavaScript (Cliente)

```javascript
// Ejemplo de uso
const response = await fetch('/api/v2/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    code: myCode,
    language: 'javascript',
    phase: 'fase-1'
  })
});

const data = await response.json();
console.log(data.analysis.feedback);
```
