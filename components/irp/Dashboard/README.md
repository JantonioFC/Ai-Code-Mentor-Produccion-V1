# Dashboard de Métricas IRP - Fase 3 (Integración con API Real)

> Sistema de visualización de métricas de revisión por pares conectado con el microservicio IRP

## 📋 Índice

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Características](#características)
- [Instalación](#instalación)
- [Uso](#uso)
- [Endpoints del Microservicio](#endpoints-del-microservicio)
- [Componentes](#componentes)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Descripción

Dashboard interactivo para visualizar métricas de desempeño en el sistema de **Revisión por Pares (IRP)** del Ecosistema 360. 

**Estado Actual:** Fase 3 - Completamente integrado con API real del microservicio IRP.

### Misión
Misión 204.0 - Dashboard de Métricas IRP

### Fases Completadas
- ✅ **Fase 1:** Wireframes y estructura base
- ✅ **Fase 2:** Componentes interactivos y lógica de negocio
- ✅ **Fase 3:** Integración con API real del microservicio IRP
- ⏳ **Fase 4:** Gráficos avanzados y visualizaciones (pendiente)
- ⏳ **Fase 5:** Exportación y reportes (pendiente)

---

## 🏗️ Arquitectura

### Diagrama de Integración

```
┌──────────────────────────────────────┐
│  FRONTEND (Next.js)                  │
│  ┌────────────────────────────────┐  │
│  │  pages/dashboard-irp.js        │  │
│  │  - useAuth (autenticación)     │  │
│  │  - useUserMetrics (datos)      │  │
│  │  - Componentes UI              │  │
│  └────────────────────────────────┘  │
│             │                        │
│             │ HTTP + JWT Token       │
│             ▼                        │
└──────────────────────────────────────┘
             │
             │ Bearer Authentication
             ▼
┌──────────────────────────────────────┐
│  MICROSERVICIO IRP (Express)         │
│  http://localhost:3001/api/v1        │
│  ┌────────────────────────────────┐  │
│  │  GET /reviews/metrics/:userId  │  │
│  │  GET /reviews/history          │  │
│  │  POST /reviews/request         │  │
│  │  POST /reviews/:id/submit      │  │
│  └────────────────────────────────┘  │
│             │                        │
│             ▼                        │
│  ┌────────────────────────────────┐  │
│  │  PostgreSQL Database           │  │
│  │  (via Prisma ORM)              │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Flujo de Autenticación

1. Usuario inicia sesión → **Supabase Auth**
2. Frontend obtiene `access_token` de Supabase
3. Frontend llama a `/api/v1/auth/translate-token` para obtener token interno
4. Token interno se usa en todas las peticiones al microservicio IRP
5. Microservicio valida token y responde con datos

---

## ✨ Características

### Métricas de Revisor
- Total de revisiones completadas
- Tiempo promedio de revisión
- Calificación promedio otorgada
- Quality score (1-5)
- Tasa de puntualidad

### Métricas de Autor
- Total de revisiones recibidas
- Calificación promedio recibida
- Tendencia de mejora (positive/stable/negative)
- Tasa de respuesta al feedback

### Historial de Revisiones
- Tabla paginada con todas las revisiones
- Filtros por rol (autor/revisor)
- Filtros por estado (completadas/pendientes)
- Ordenamiento configurable
- Vista detallada de cada revisión

### Panel de Insights
- Sugerencias personalizadas de mejora
- Alertas de bajo rendimiento
- Felicitaciones por logros

### Selector de Período
- Última semana
- Último mes
- Último trimestre
- Último año
- Todo el tiempo

---

## 🚀 Instalación

### Prerequisitos

1. **Node.js** >= 16.x
2. **npm** >= 8.x
3. **Microservicio IRP** corriendo en `http://localhost:3001`
4. **PostgreSQL** configurado para el microservicio

### Pasos de Instalación

```bash
# 1. Clonar el repositorio (si aún no lo has hecho)
git clone <repo-url>
cd ai-code-mentor-v5

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales:
# NEXT_PUBLIC_SUPABASE_URL=<tu-supabase-url>
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-supabase-key>

# 4. Iniciar microservicio IRP (en otra terminal)
cd microservicio-irp
npm install
npm start

# 5. Iniciar el frontend
npm run dev
```

### Validar Instalación

```bash
# IMPORTANTE: Ejecutar desde la RAÍZ del proyecto principal
# (C:\dev\ai-code-mentor-v5), NO desde microservicio-irp

cd C:\dev\ai-code-mentor-v5
node scripts/validate-irp-integration.js
```

---

## 📖 Uso

### Acceder al Dashboard

1. Navega a: `http://localhost:3000/dashboard-irp`
2. Inicia sesión con tu usuario
3. El dashboard se cargará automáticamente con tus métricas

### Indicadores de Estado

El dashboard muestra un indicador visual de conexión:

- 🟢 **Verde:** Conectado al microservicio IRP
- 🟡 **Amarillo:** Modo offline (microservicio no disponible)

### Interactuar con el Dashboard

#### Cambiar Período
Usa el selector de período en la parte superior para filtrar métricas por tiempo.

#### Filtrar Historial
En la sección de historial, usa los filtros para:
- Ver solo revisiones como autor o como revisor
- Filtrar por estado (completadas/pendientes)
- Ordenar por fecha, rating o proyecto

#### Refrescar Datos
Haz clic en el botón "🔄 Refrescar" para obtener los datos más recientes.

---

## 🔌 Endpoints del Microservicio

### GET /api/v1/reviews/metrics/:userId

Obtiene métricas de un usuario.

**Query Parameters:**
- `period`: week | month | quarter | year | all (default: all)
- `start_date`: Fecha ISO 8601 (opcional)
- `end_date`: Fecha ISO 8601 (opcional)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Respuesta 200:**
```json
{
  "user_id": "uuid",
  "reviewer_metrics": {
    "total_reviews_completed": 15,
    "average_review_time_hours": 2.5,
    "average_rating_given": 4.2,
    "quality_score": 4.5,
    "punctuality_rate": 0.93
  },
  "author_metrics": {
    "total_reviews_received": 12,
    "average_rating_received": 4.1,
    "improvement_trend": "positive",
    "response_to_feedback_rate": 0.85
  },
  "peer_points": {
    "total_earned": 150,
    "current_level": 3,
    "next_level_threshold": 200
  },
  "period_info": {
    "period": "month",
    "start_date": "2024-09-05T00:00:00Z",
    "end_date": "2024-10-05T23:59:59Z",
    "is_filtered": true
  }
}
```

### GET /api/v1/reviews/history

Obtiene historial de revisiones.

**Query Parameters:**
- `role`: author | reviewer | both (default: both)
- `status`: pending | completed | all (default: all)
- `phase`: 0-8 (opcional)
- `sort_by`: date | rating | project (default: date)
- `sort_order`: asc | desc (default: desc)
- `limit`: 1-100 (default: 20)
- `offset`: >=0 (default: 0)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Respuesta 200:**
```json
{
  "total_reviews": 45,
  "reviews": [
    {
      "review_id": "uuid",
      "project_name": "Sistema de Blog",
      "role": "reviewer",
      "author_name": "Juan Pérez",
      "status": "completed",
      "submitted_at": "2024-10-01T15:30:00Z",
      "calificacion_promedio": 4.3,
      "phase": 2,
      "week": 5
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false,
    "limit": 20,
    "offset": 0
  },
  "filters_applied": {
    "role": "both",
    "status": "all",
    "phase": null
  },
  "sorting": {
    "sort_by": "date",
    "sort_order": "desc"
  }
}
```

---

## 🧩 Componentes

### Componentes Principales

#### `pages/dashboard-irp.js`
Página principal del dashboard. Orquesta todos los componentes y gestiona el estado global.

#### `components/irp/Dashboard/MetricsSummary.jsx`
Cards de resumen con métricas clave (total revisiones, promedios, etc.)

#### `components/irp/Dashboard/ReviewerMetrics.jsx`
Sección dedicada a métricas como revisor.

#### `components/irp/Dashboard/AuthorMetrics.jsx`
Sección dedicada a métricas como autor.

#### `components/irp/Dashboard/ReviewHistory.jsx`
Tabla de historial con filtros y paginación.

#### `components/irp/Dashboard/InsightPanel.jsx`
Panel de sugerencias y recomendaciones personalizadas.

#### `components/irp/Dashboard/PeriodSelector.jsx`
Selector de período de tiempo para filtrar datos.

### Hooks Personalizados

#### `hooks/useUserMetrics.js`

```javascript
import { useUserMetrics } from '../hooks/useUserMetrics';

const {
  metrics,      // Objeto con todas las métricas
  loading,      // Boolean de estado de carga
  error,        // Error si ocurrió
  lastUpdated,  // Fecha de última actualización
  refresh       // Función para refrescar datos
} = useUserMetrics(userId, {
  period: 'month',
  autoRefresh: true,
  refreshInterval: 300000, // 5 minutos
  token: internalToken
});
```

#### `hooks/useReviewHistory` (dentro de useUserMetrics.js)

```javascript
const {
  history,       // Array de revisiones
  pagination,    // Info de paginación
  loading,       // Boolean de estado de carga
  error,         // Error si ocurrió
  loadNextPage,  // Cargar siguiente página
  loadPrevPage,  // Cargar página anterior
  refresh        // Refrescar historial
} = useReviewHistory({
  role: 'both',
  status: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
  limit: 10,
  token: internalToken
});
```

---

## 🧪 Testing

### Tests Automáticos

Ejecutar el script de validación:

```bash
node scripts/validate-irp-integration.js
```

Este script verifica:
- ✅ Microservicio IRP está corriendo
- ✅ Endpoint de métricas responde
- ✅ Endpoint de historial responde
- ✅ Estructura de respuestas es correcta

### Tests Manuales

1. **Autenticación:**
   - Iniciar sesión
   - Verificar que el indicador muestra "Conectado"
   - Verificar que las métricas se cargan

2. **Métricas:**
   - Cambiar período
   - Verificar que los números cambian
   - Refrescar datos

3. **Historial:**
   - Aplicar filtros
   - Cambiar ordenamiento
   - Navegar páginas
   - Ver detalles de revisión

4. **Manejo de Errores:**
   - Apagar microservicio
   - Verificar que el indicador muestra "Modo offline"
   - Verificar que se muestran mensajes de error claros

---

## 🔧 Troubleshooting

### Problema: "Error de conexión. Verifica que el microservicio IRP esté corriendo"

**Solución:**
```bash
# Verificar que el microservicio está corriendo
cd microservicio-irp
npm start

# Verificar que responde
curl http://localhost:3001/api/v1/health
```

### Problema: "No autorizado. Por favor, inicia sesión nuevamente"

**Solución:**
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. Si persiste, verificar configuración de Supabase en `.env.local`

### Problema: "Timeout: La petición tardó demasiado"

**Posibles causas:**
- Base de datos del microservicio lenta
- Muchos datos a procesar
- Conexión de red lenta

**Solución:**
- Verificar estado de PostgreSQL
- Reducir el período de consulta (usar "semana" en lugar de "todo el tiempo")

### Problema: Indicador siempre en "Modo offline"

**Solución:**
1. Verificar que el token se está obteniendo correctamente
2. Verificar logs del navegador (F12 → Console)
3. Verificar que `/api/v1/auth/translate-token` existe y funciona

### Problema: Los datos no se actualizan

**Solución:**
1. Hacer clic en "🔄 Refrescar"
2. Verificar que `autoRefresh` está habilitado
3. Revisar logs del navegador para errores

---

## 📚 Referencias

- [Contrato de API v1.0 (Servicio IRP)](../../Contrato%20de%20API%20v1.0%20(Servicio%20IRP).md)
- [Arquitectura Viva v13.2](../../ARQUITECTURA_VIVA/ARQUITECTURA_VIVA_v13.2.md)
- [CHANGELOG](./CHANGELOG.md)

---

## 👥 Contribución

Este dashboard es parte del Ecosistema 360. Para contribuir:

1. Leer el [REFACTORING_MANIFESTO.md](../../REFACTORING_MANIFESTO.md)
2. Seguir los principios de la [Arquitectura Viva](../../ARQUITECTURA_VIVA)
3. Mantener la calidad de código
4. Agregar tests para nuevas funcionalidades

---

## 📝 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo de cambios.

**Última actualización:** 2025-10-05 (Fase 3)  
**Versión:** 3.0.0  
**Autor:** Mentor Coder  
**Misión:** 204.0 - Dashboard de Métricas IRP
