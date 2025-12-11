# SANDBOX CON HISTORIAL Y EXPORTACIÓN

## Sistema Completo de Generación de Lecciones con IA

**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready  
**Última Actualización:** 2025-10-09

---

## 🎯 ¿QUÉ ES?

El **Sandbox de Aprendizaje** es un sistema completo que permite a los usuarios crear lecciones interactivas personalizadas utilizando IA (Google Gemini), guardarlas en un historial personal, y exportarlas a formato Markdown.

### **Características Principales:**

- 🤖 **Generación con IA:** Crea lecciones estructuradas sobre cualquier tema
- 📚 **Historial Personal:** Guarda y recupera hasta 20 generaciones
- 📥 **Exportación:** Descarga lecciones en formato Markdown (.md)
- 🔒 **Seguro:** Row Level Security, autenticación JWT
- ⚡ **Rápido:** Generación en ~25 segundos, guardado instantáneo

---

## 📸 CAPTURAS

```
┌─────────────────────────────────────────────────────────────────┐
│ SANDBOX DE APRENDIZAJE                        [Usuario: Juan]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────┐  │
│  │                             │  │  📚 Historial (5)      │  │
│  │  Escribe aquí tu contenido  │  │  ┌──────────────────┐  │  │
│  │  sobre cualquier tema...    │  │  │ Python: Intro... │  │  │
│  │                             │  │  │ Hace 5 min       │  │  │
│  │  (Mínimo 50 caracteres)     │  │  └──────────────────┘  │  │
│  │                             │  │  ┌──────────────────┐  │  │
│  │                             │  │  │ React: Hooks...  │  │  │
│  │                             │  │  │ Hace 1 hora      │  │  │
│  └─────────────────────────────┘  │  └──────────────────┘  │  │
│                                   │  ┌──────────────────┐  │  │
│   [🚀 Generar Lección]            │  │ Java: Historia.. │  │  │
│                                   │  │ Hace 2 días      │  │  │
│  ┌─────────────────────────────┐  │  └──────────────────┘  │  │
│  │ 📖 Lección Generada         │  └────────────────────────┘  │
│  │                             │                              │
│  │ # Python: Introducción      │                              │
│  │                             │                              │
│  │ ## Conceptos Clave          │                              │
│  │ ...                         │                              │
│  │                             │                              │
│  │ 🎯 Ejercicios (3)           │                              │
│  │ ...                         │                              │
│  │                             │                              │
│  │ [📥 Exportar .md] [🧹 Limpiar] │                          │
│  └─────────────────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 INICIO RÁPIDO

### **1. Acceder al Sandbox**

```bash
# Iniciar servidor
npm run dev

# Abrir en navegador
http://localhost:3000/sandbox
```

### **2. Generar tu Primera Lección**

1. **Escribe** contenido sobre un tema (>50 caracteres)
2. **Clic** en "Generar Lección Interactiva"
3. **Espera** ~25 segundos
4. **¡Listo!** Tu lección personalizada está lista

### **3. (Opcional) Iniciar Sesión**

Para guardar en historial y recuperar después:
```
Botón "Iniciar Sesión" → Autenticarse con Supabase
```

### **4. Exportar Lección**

```
Clic en "Exportar .md" → Archivo se descarga automáticamente
```

---

## 📚 DOCUMENTACIÓN COMPLETA

### **Para Usuarios:**
- 📖 [Guía de Usuario Completa](./USER_GUIDE_SANDBOX.md)
  - Primeros pasos
  - Generar lecciones
  - Usar el historial
  - Exportar a Markdown
  - Consejos y FAQ

### **Para Desarrolladores:**
- 🔧 [Documentación Técnica](./TECHNICAL_DOCUMENTATION_SANDBOX.md)
  - Arquitectura
  - APIs y Contratos
  - Base de datos
  - Decisiones técnicas
  - Bugs corregidos

### **Testing:**
- 🧪 [Guía de Testing Manual](./TESTING_MANUAL_SANDBOX.md)
- 🤖 [Testing E2E Automatizado](./TESTING_FASE_5_README.md)

### **Changelog:**
- 📝 [Changelog Completo - Misión 216.0](./CHANGELOG_MISSION_216.md)

---

## 🏗️ ARQUITECTURA

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND                             │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Sandbox   │  │   History   │  │     Export      │  │
│  │  Widget    │  │   Panel     │  │     Button      │  │
│  └─────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
└────────┼─────────────────┼────────────────────┼──────────┘
         │                 │                    │
         ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND API                           │
│  /api/sandbox/generate    /api/v1/sandbox/history       │
│         │                         │                      │
│         ▼                         ▼                      │
│  ┌──────────────┐        ┌───────────────┐             │
│  │  Gemini AI   │        │  Supabase DB  │             │
│  └──────────────┘        └───────────────┘             │
└──────────────────────────────────────────────────────────┘
```

### **Stack Tecnológico:**

- **Frontend:** React + Next.js + Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL (Supabase)
- **IA:** Google Gemini 2.5 Flash
- **Autenticación:** Supabase Auth (JWT)

---

## 🔌 APIS

### **API 1: Generación**

```bash
POST /api/sandbox/generate

# Request
{
  "customContent": "Python es un lenguaje..."
}

# Response (200 OK)
{
  "title": "Python: Lenguaje de Programación",
  "lesson": "# Python...",
  "exercises": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "..."
    }
  ],
  "generatedAt": "2025-10-09T16:40:19.000Z",
  "inputLength": 350
}
```

### **API 2: Historial (Obtener)**

```bash
GET /api/v1/sandbox/history
Authorization: Bearer <jwt_token>

# Response (200 OK)
{
  "success": true,
  "data": {
    "generations": [
      {
        "id": "uuid",
        "title": "Python: Intro",
        "custom_content": "...",
        "generated_lesson": "...",
        "created_at": "2025-10-09T..."
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "hasMore": false
    }
  }
}
```

### **API 3: Historial (Guardar)**

```bash
POST /api/v1/sandbox/history
Authorization: Bearer <jwt_token>

# Request
{
  "customContent": "...",
  "generatedLesson": {
    "title": "...",
    "lesson": "...",
    "exercises": [...]
  }
}

# Response (201 Created)
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "created_at": "2025-10-09T..."
  }
}
```

**Más detalles:** Ver [Documentación Técnica](./TECHNICAL_DOCUMENTATION_SANDBOX.md)

---

## 🗄️ BASE DE DATOS

### **Tabla: sandbox_generations**

```sql
CREATE TABLE sandbox_generations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    custom_content TEXT NOT NULL,      -- Input del usuario
    generated_title TEXT NOT NULL,     -- Título generado
    generated_lesson TEXT NOT NULL,    -- Lección completa
    generated_exercises JSONB NOT NULL, -- Array de ejercicios
    metadata JSONB DEFAULT '{}',       -- Info adicional
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_id ON sandbox_generations(user_id);
CREATE INDEX idx_created_at ON sandbox_generations(created_at DESC);

-- Row Level Security
ALTER TABLE sandbox_generations ENABLE ROW LEVEL SECURITY;
```

**Más detalles:** Ver [Documentación Técnica](./TECHNICAL_DOCUMENTATION_SANDBOX.md)

---

## 🔒 SEGURIDAD

### **Row Level Security (RLS)**

```sql
-- Usuarios solo ven sus propias generaciones
CREATE POLICY "Users view own"
    ON sandbox_generations FOR SELECT
    USING (auth.uid() = user_id);

-- Usuarios solo crean sus propias generaciones
CREATE POLICY "Users create own"
    ON sandbox_generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

### **Validaciones**

- ✅ Contenido: 50-50,000 caracteres
- ✅ JWT token válido para endpoints protegidos
- ✅ Límite de 20 generaciones por usuario
- ✅ Sanitización de input

---

## ⚡ PERFORMANCE

| Operación | Tiempo | Estado |
|-----------|--------|--------|
| Generación | ~25s | ✅ < 35s |
| Guardado | ~500ms | ✅ < 2s |
| Carga Historial | ~300ms | ✅ < 2s |
| Exportación | < 100ms | ✅ < 1s |

### **Optimizaciones**

- ✅ Índices en DB (user_id, created_at)
- ✅ Paginación (máx 20 resultados)
- ✅ Exportación client-side (sin servidor)
- ✅ RLS policies eficientes

---

## 🧪 TESTING

### **Automatizado**

```bash
# Script E2E completo
node scripts/test-sandbox-e2e-flow.js <JWT_TOKEN>

# Tests:
# 1. Servidor operacional
# 2. Generación de lección
# 3. Guardado en historial
# 4. Recuperación
# 5. Múltiples generaciones
# 6. Validación completa
```

### **Manual**

Ver [Guía de Testing Manual](./TESTING_MANUAL_SANDBOX.md)

**Checklist:**
- ✅ Generación relevante
- ✅ Guardado automático
- ✅ Panel de historial
- ✅ Restauración
- ✅ Exportación .md
- ✅ UI/UX responsive
- ✅ Casos edge

---

## 🐛 BUGS CONOCIDOS Y CORREGIDOS

### **Corregidos en v1.0.0:**

| Bug | Síntoma | Estado |
|-----|---------|--------|
| **BUG-216-1** | Encoding UTF-8 corrupto | ✅ RESUELTO |
| **BUG-216-2** | Filename mal normalizado | ✅ RESUELTO |
| **BUG-216-3** | Fecha incorrecta | ✅ RESUELTO |
| **BUG-216-4** | Parser JSON | ✅ RESUELTO |

**Detalles:** Ver [Changelog](./CHANGELOG_MISSION_216.md)

### **Bugs Actuales:**

❌ Ninguno conocido

---

## 🚧 LIMITACIONES

### **Actuales:**

1. **Límite de Gemini API**
   - 1500 requests/día (free tier)
   - Si se excede: Error 429

2. **Límite de Generaciones**
   - 20 generaciones máximo por usuario
   - Eliminar antiguas para crear nuevas

3. **Formatos de Exportación**
   - Solo Markdown (.md)
   - No PDF, DOCX, HTML

4. **Performance**
   - Generación: 20-35 segundos (depende de Gemini)
   - No hay cache de generaciones

---

## 🎯 ROADMAP (FUTURO)

### **v1.1.0 (Planeado)**

- [ ] Funcionalidad de eliminación de generaciones
- [ ] Búsqueda en historial
- [ ] Más formatos de exportación (PDF, DOCX)

### **v1.2.0 (Planeado)**

- [ ] Compartir generaciones (URLs públicas)
- [ ] Generaciones colaborativas
- [ ] Analytics de uso

### **v2.0.0 (Futuro)**

- [ ] Múltiples modelos de IA (GPT-4, Claude)
- [ ] Personalización de prompts
- [ ] Templates de lecciones

---

## 📝 CHANGELOG

Ver [Changelog Completo](./CHANGELOG_MISSION_216.md)

### **v1.0.0 - 2025-10-09**

#### **Agregado:**
- ✅ Generación de lecciones con Gemini AI
- ✅ Historial personal (hasta 20 generaciones)
- ✅ Exportación a Markdown con encoding UTF-8
- ✅ Panel lateral de historial
- ✅ Restauración de generaciones
- ✅ Row Level Security
- ✅ Middleware de autenticación
- ✅ Testing E2E automatizado
- ✅ Documentación completa

#### **Corregido:**
- ✅ Encoding UTF-8 en exportación
- ✅ Normalización de nombres de archivo
- ✅ Fecha incorrecta en metadata
- ✅ Parser JSON robusto

---

## 🛠️ DESARROLLO

### **Requisitos:**

- Node.js 18+
- PostgreSQL (Supabase)
- API Key de Google Gemini

### **Instalación:**

```bash
# Clonar repositorio
git clone <repo>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local:
# - GEMINI_API_KEY=<tu_key>
# - NEXT_PUBLIC_SUPABASE_URL=<url>
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>

# Ejecutar migraciones
psql -d <database> -f database/migrations/003_add_sandbox_generations_table.sql

# Iniciar servidor
npm run dev
```

### **Estructura de Archivos:**

```
ai-code-mentor-v5/
├─ pages/
│  └─ api/
│     ├─ sandbox/
│     │  └─ generate.js          # Generación con Gemini
│     └─ v1/
│        └─ sandbox/
│           └─ history.js         # CRUD de historial
│
├─ components/
│  └─ Sandbox/
│     ├─ SandboxWidget.js        # UI principal
│     ├─ HistoryPanel.js         # Panel lateral
│     └─ ExportButton.js         # Botón exportación
│
├─ database/
│  └─ migrations/
│     └─ 003_add_sandbox_generations_table.sql
│
├─ docs/
│  ├─ TECHNICAL_DOCUMENTATION_SANDBOX.md
│  ├─ USER_GUIDE_SANDBOX.md
│  ├─ TESTING_MANUAL_SANDBOX.md
│  └─ CHANGELOG_MISSION_216.md
│
└─ scripts/
   └─ test-sandbox-e2e-flow.js   # Testing automatizado
```

---

## 🤝 CONTRIBUIR

### **Reportar Bugs:**

1. Verificar que el bug no esté ya reportado
2. Crear issue con:
   - Descripción clara
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica

### **Proponer Features:**

1. Crear issue con:
   - Descripción del feature
   - Justificación (¿por qué es útil?)
   - Propuesta de implementación

### **Pull Requests:**

1. Fork del repositorio
2. Crear branch: `feature/nueva-funcionalidad`
3. Commit con mensajes claros
4. Tests pasando
5. Documentación actualizada
6. PR con descripción detallada

---

## 📄 LICENCIA

[MIT License](../LICENSE)

---

## 👥 EQUIPO

**Desarrollado por:**
- Mentor Coder - Implementación completa

**Agradecimientos:**
- Google Gemini API
- Supabase Team
- Next.js Team
- Comunidad Open Source

---

## 📞 CONTACTO Y SOPORTE

**Documentación:**
- [Guía de Usuario](./USER_GUIDE_SANDBOX.md)
- [Documentación Técnica](./TECHNICAL_DOCUMENTATION_SANDBOX.md)
- [FAQ](./USER_GUIDE_SANDBOX.md#preguntas-frecuentes)

**Bugs y Soporte:**
- GitHub Issues
- Email: [soporte@aicodementor.com]

---

## 🎓 APRENDE MÁS

**Tutoriales:**
- [Cómo crear tu primera lección](./USER_GUIDE_SANDBOX.md#generar-tu-primera-lección)
- [Mejores prácticas](./USER_GUIDE_SANDBOX.md#consejos-y-mejores-prácticas)

**Videos:**
- [Demo del Sandbox](#) _(próximamente)_
- [Uso avanzado del historial](#) _(próximamente)_

---

**¡Feliz aprendizaje! 🚀**

---

**Última Actualización:** 2025-10-09  
**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready
