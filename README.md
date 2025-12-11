# 🎓 AI Code Mentor - Ecosistema 360 | Plataforma Educativa Completa

## 📋 Descripción

**AI Code Mentor - Ecosistema 360** es una plataforma completa de aprendizaje autogestionado que implementa la metodología educativa **Ecosistema 360** con **Simbiosis Crítica Humano-IA**. 

Combina un currículo estructurado de 24 meses (8 fases: F0-F7) con herramientas profesionales de gestión de portfolio, plantillas educativas y analíticas de progreso avanzadas.

## 🏗️ Arquitectura Actual: v19.3 - Sandbox Improvements

**Sistema Operacional:** Plataforma educativa completa basada en **Next.js Monolith** con **Supabase** integrado, **Router IA Resiliente**, **Soporte Multi-Dominio** y **Sistema de Plugins**.

### Características Principales:
- ✅ **Currículo Completo:** 100 semanas, 8 fases, múltiples módulos estructurados
- ✅ **Soporte Multi-Dominio:** Programación, Lógica, Bases de Datos, Matemáticas
- ✅ **Sandbox Mejorado:** Selector de dominio contextual, historial persistente 🆕
- ✅ **API Counter Local:** Reset a medianoche hora local del usuario 🆕
- ✅ **Sistema de Plugins:** Arquitectura extensible con PluginManager
- ✅ **Base de Datos Unificada:** Supabase (Auth + IRP) + SQLite (Curriculum)
- ✅ **API Estable v2.1:** API Routes Integradas (v1 legacy + v2 resiliente)
- ✅ **Serverless Ready:** Arquitectura de puerto único (3000), lista para Vercel
- ✅ **Router IA Resiliente v19.1:** Fallback automático Gemini Pro → Flash
- ✅ **Auto-Discovery de Modelos:** Detección automática de modelos Google AI
- ✅ **Sistema IRP Integrado v19.0:** Revisión por Pares (IA) sin microservicios externos
- ✅ **Analíticas Dedicadas:** Ruta `/analiticas` con Dashboard de Progreso y Logros
- ✅ **Persistencia Local:** IndexedDB para historial y borradores

### Stack Tecnológico (v19.2):
- **Frontend:** Next.js 15+ + React 18 + TailwindCSS
- **Backend:** Next.js API Routes (Serverless Functions)
- **Base de Datos:** 
  - **Supabase (PostgreSQL):** Usuarios, Perfiles, IRP, Métricas
  - **SQLite:** Contenido estático del currículo (Performance optimizada)
  - **IndexedDB (Cliente):** Historial de análisis, borradores
- **Autenticación:** Supabase Auth (@supabase/ssr) + JWT Bearer Tokens
- **Testing:** Jest + Playwright E2E Integration Suite 🆕
- **IA Integration:** Gemini 1.5 Pro/Flash (via Router Resiliente)
- **Extensibilidad:** Sistema de Plugins (IPlugin + PluginManager) 🆕

## 🚀 Instalación y Configuración

### Prerrequisitos:
- Node.js 18+ instalado
- Cuenta de Supabase (URL y Anon Key)
- API key de Gemini (Google AI Studio)

### Pasos de Instalación:

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/ai-code-mentor-v5.git
cd ai-code-mentor-v5
```

2. **Instalar dependencias:**
```bash
# Solo se requiere una instalación en la raíz (Arquitectura Unificada)
npm install
```

3. **Configurar variables de entorno (.env.local):**
```bash
cp .env.example .env.local
```

Configura las variables esenciales:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key

# AI Services
GEMINI_API_KEY=tu-gemini-api-key

# Auth & Security
JWT_SECRET=tu-secreto-compartido
```

4. **Inicializar Base de Datos (Supabase):**
   - Ejecuta el script SQL ubicado en `supabase/migrations/irp_migration.sql` en el SQL Editor de tu proyecto Supabase.
   - Esto creará las tablas necesarias (`irp_review_requests`, `irp_peer_reviews`, etc.).

5. **Iniciar el ecosistema:**
```bash
# Comando único (Puerto 3000)
npm run dev
```

6. **Verificar instalación:**
   - Abre `http://localhost:3000`
   - Health Check IA: `http://localhost:3000/api/v2/health` 🆕
   - Health Check IRP: `http://localhost:3000/api/v1/irp/health`

## 🧪 Testing y Validación (Actualizado v19.0)

### Testing E2E:
Validación completa de integración UI + API + Auth.

```bash
# Ejecutar suite de integración IRP
npx playwright test e2e/irp-integration.spec.js

# Ejecutar suite completa
npx playwright test
```

### Script de Verificación Pre-Test:
```bash
node e2e/verify-setup.js
```

## 🎯 Funcionalidades Implementadas

### ✅ **Router IA Resiliente (v19.1)** 🆕
- **Fallback Automático:** Gemini Pro → Flash → Error con reintentos
- **Auto-Discovery:** Detecta modelos disponibles via Google AI API
- **Cache Inteligente:** Respuestas cacheadas 1 hora
- **Prompts Dinámicos:** Personalizados por fase del estudiante (F0-F7)
- **API v2:** Nuevos endpoints resilientes (`/api/v2/analyze`, `/api/v2/health`)

### ✅ **Persistencia Local (v19.1)**
- **IndexedDB:** Almacenamiento de historial de análisis
- **Borradores Auto-guardados:** Nunca pierdas tu código
- **Backups:** Sistema de respaldo automático semanal

### ✅ **Soporte Multi-Dominio (v19.2)** 🆕
- **Dominios:** Programación, Lógica, Bases de Datos, Matemáticas
- **Selector UI:** Dropdown en header de zona privada
- **Persistencia:** localStorage para preferencia de dominio
- **Constraints Dinámicos:** Restricciones pedagógicas por nivel

### ✅ **Sistema de Plugins (v19.2)** 🆕
- **Interfaz IPlugin:** Contrato estándar para extensiones
- **PluginManager:** Registro, ciclo de vida, dependencias
- **Pipeline:** preProcess → analyze → postProcess

### ✅ **Sistema IRP Integrado (v19.0)**
- **Arquitectura:** Módulo interno de Next.js (`lib/services/irp`). Elimina microservicios complejos.
- **Base de Datos:** Tablas nativas en Supabase.
- **IA Reviewer:** Motor de revisión automática con Gemini 1.5.
- **API Unificada:** Endpoints estandarizados en `/api/v1/irp/*`.

### ✅ **Dashboard de Progreso del Estudiante**
- Visualización multidimensional del progreso.
- Métricas de competencias y habilidades.
- Analytics avanzados con gráficos interactivos.

### ✅ **Sistema de Logros Gamificados** Framework de logros y badges automáticos.
### ✅ **Sandbox de Experimentación:** Entorno seguro para pruebas de código.

## 📊 Currículo Ecosistema 360 (24 Meses)

(Estructura curricular completa mantenida de v18.0)
- **Fase 0:** Cimentación (Pre-start)
- **Fase 1:** Fundamentos de Programación (6 meses)
- **Fase 2:** Frontend Básico (4 meses)
- **Fase 3:** Frontend Interactivo (5 meses)
- **Fase 4:** Backend Profesional (4 meses)
- **Fase 5:** DevOps y Cloud (4 meses)
- **Fase 6:** Especialización IA/Data (2 meses)
- **Fase 7:** Proyecto Integrador

## 🔧 Troubleshooting

### **Error: "Auth session missing" en Tests**
- Asegúrate de usar los utilitarios de mock auth o el token de prueba E2E configurado.

### **Error: "Tablas no encontradas"**
- Verifica que hayas ejecutado `supabase/migrations/irp_migration.sql`.

## 📝 Licencia y Contribuciones

### **Licencia:** MIT

### **Contribuciones:**
Las contribuciones son bienvenidas siguiendo el **REFACTORING_MANIFESTO.md**. Priorizamos la simplicidad (KISS) y la estabilidad.

---

**Última actualización:** Diciembre 7, 2025  
**Versión:** v19.2 - Multi-Domain & Plugins  
**Estado:** ✅ **CERTIFICADO** - Monolito Next.js con Router IA, Multi-Dominio, Sistema de Plugins, y 88 tests pasando.
