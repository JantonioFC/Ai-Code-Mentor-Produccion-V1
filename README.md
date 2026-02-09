# 🎓 AI Code Mentor

**Tu mentor de programación impulsado por IA — Aprende a tu ritmo con lecciones personalizadas.**

[![Build Status](https://github.com/JantonioFC/ai-code-mentor-beta-test/actions/workflows/ci.yml/badge.svg)](https://github.com/JantonioFC/ai-code-mentor-beta-test/actions)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tech Stack](#-tech-stack)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Arquitectura](#-arquitectura)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contribuir](#-contribuir)

---

## ✨ Características

| Característica | Descripción |
|:---------------|:------------|
| 🧠 **Lecciones Personalizadas** | IA genera contenido adaptado a tu nivel y preferencias |
| 📊 **Seguimiento de Progreso** | Visualiza tu avance con métricas detalladas |
| 🔄 **RAG Avanzado** | Búsqueda semántica con chunking y reranking |
| ⚖️ **Evaluación LLM-as-Judge** | Métricas formales de calidad (ROUGE/BLEU) |
| 📄 **Exportar a PDF** | Descarga lecciones y reportes de progreso |
| 🎨 **Multimodal** | Genera diagramas Mermaid e imágenes |
| 🛡️ **Anti-Alucinación** | Clarity Gate para respuestas verificables |
| 🧩 **Extensión VS Code** | Chat integrado, Comandos (/test, /fix) y Apply Fix |
| 🌍 **Multilenguaje** | Soporte para Python, Rust, Go, Java, C# (via Extension) |

---

## 🛠 Tech Stack

| Capa | Tecnología |
|:-----|:-----------|
| **Framework** | [Next.js 15.4](https://nextjs.org/) + React 18 |
| **Estilos** | [TailwindCSS 3](https://tailwindcss.com/) |
| **Base de Datos** | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) |
| **IA** | [Gemini 2.5](https://ai.google.dev/) (Flash/Pro) |
| **Auth** | JWT + bcryptjs ([ver ADR-001](docs/adr/ADR-001-custom-jwt-auth.md)) |
| **Testing** | Jest (130+ tests) + Playwright |
| **CI/CD** | GitHub Actions |
| **Monitoring** | [Sentry](https://sentry.io/) |

---

## 📦 Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** 18 o superior ([descargar](https://nodejs.org/))
- **npm** 9+ (incluido con Node.js)
- **Git** ([descargar](https://git-scm.com/))
- **API Key de Gemini** ([obtener gratis](https://aistudio.google.com/app/apikey))

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/JantonioFC/ai-code-mentor-beta-test.git
cd ai-code-mentor-beta-test

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu GEMINI_API_KEY

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

> **Nota:** El script `npm run dev` ejecuta automáticamente las migraciones de base de datos.

---

## 🔧 Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

### Requeridas

| Variable | Descripción | Cómo obtenerla |
|----------|-------------|----------------|
| `GEMINI_API_KEY` | API Key de Google Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `JWT_SECRET` | Secreto para tokens JWT | Ejecutar `openssl rand -hex 32` |

### Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `GEMINI_MODEL_NAME` | Modelo Gemini a usar | `gemini-2.5-flash` |
| `FAL_API_KEY` | Generación de imágenes | - |
| `NODE_ENV` | Entorno de ejecución | `development` |

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (incluye migraciones) |
| `npm run build` | Compila para producción |
| `npm start` | Inicia servidor de producción |
| `npm test` | Ejecuta tests unitarios (Jest) |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run test:e2e:ui` | Tests E2E con interfaz visual |
| `npm run create:demo-user` | Crea usuario de demo |

---

## 🏗 Arquitectura

```
ai-code-mentor/
├── components/         # Componentes React reutilizables (73)
├── pages/              # Rutas Next.js + API endpoints
│   ├── api/v1/         # API RESTful versionada
│   └── ...             # Páginas de la aplicación
├── lib/                # Lógica de negocio (95 archivos)
│   ├── ai/             # Router IA con Circuit Breaker
│   ├── db/             # SQLite + Migraciones
│   ├── evaluation/     # LLM-as-Judge, métricas
│   ├── memory/         # Entity Memory, consolidación
│   ├── rag/            # Reranker, SemanticChunker
│   └── services/       # LessonService, SmartGenerator
├── hooks/              # Custom React hooks
├── contexts/           # React Context providers
├── __tests__/          # Tests unitarios (Jest)
├── e2e/                # Tests E2E (Playwright)
├── docs/               # Documentación
│   ├── adr/            # Architecture Decision Records
│   ├── api/            # OpenAPI specification
│   └── walkthroughs/   # Guías paso a paso
└── scripts/            # Scripts de utilidad
```

### Flujo de Datos

```
Usuario → Next.js Page → API Route → LessonService → GeminiRouter → Gemini API
                                          ↓
                              SQLite ← RAG Pipeline ← Memory System
```

---

## 📡 API Endpoints

### Lecciones

| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| POST | `/api/v1/lessons/generate` | Genera una lección personalizada |
| POST | `/api/v1/lessons/feedback` | Envía feedback de lección |
| GET | `/api/v1/lessons/:id` | Obtiene una lección por ID |

### Autenticación

| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| POST | `/api/v1/auth/login` | Inicia sesión |
| POST | `/api/v1/auth/register` | Registra usuario |
| GET | `/api/v1/auth/user` | Obtiene usuario actual |

### Monitoring

| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| GET | `/api/v1/metrics` | Métricas del sistema (JSON) |
| GET | `/api/v1/metrics?format=prometheus` | Formato Prometheus |

> 📚 **Documentación completa:** Ver [docs/api/openapi.yaml](docs/api/openapi.yaml) para especificación OpenAPI 3.0.

---

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm test

# Con cobertura
npm run test:coverage

# Watch mode (desarrollo)
npm run test:watch
```

### Tests End-to-End

```bash
# Ejecutar tests E2E
npm run test:e2e

# Con interfaz visual
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug
```

**Cobertura actual:** 130+ tests cubriendo lógica de negocio e integración IA.

---

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configura las variables de entorno en el dashboard de Vercel.

### Docker

```bash
# Build
docker build -t ai-code-mentor .

# Run
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=xxx \
  -e JWT_SECRET=xxx \
  ai-code-mentor
```

### Manual (VPS)

```bash
npm run build
npm start
```

---

## 🔧 Troubleshooting

### Error: "GEMINI_API_KEY not configured"

**Solución:** Verifica que `.env.local` existe y contiene `GEMINI_API_KEY=tu_key`.

```bash
cat .env.local | grep GEMINI
```

### Error: "Database is locked"

**Solución:** Solo puede haber una conexión activa a SQLite. Cierra otras instancias del servidor.

```bash
# Matar procesos en puerto 3000
kill $(lsof -t -i:3000)
npm run dev
```

### Error: "Module not found"

**Solución:** Reinstalar dependencias:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests E2E fallan

**Solución:** Instalar navegadores de Playwright:

```bash
npx playwright install
```

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guía completa.

```bash
# 1. Fork y clonar
git clone https://github.com/TU_USUARIO/ai-code-mentor-beta-test.git

# 2. Crear rama
git checkout -b feature/mi-feature

# 3. Hacer cambios y testear
npm test

# 4. Commit y push
git push origin feature/mi-feature

# 5. Crear Pull Request
```

---

## 📝 Licencia

**Copyright © 2026 AI Code Mentor Team. All Rights Reserved.**

Ver [LICENSE](LICENSE) para detalles.

---

**Versión:** v24.0-stable  
**Estado:** ✅ Production Ready  
**Última actualización:** Febrero 2026

---

## 📚 Documentación Adicional

- [📐 Architecture Decision Records](docs/adr/README.md) - Decisiones técnicas clave
- [📡 API Reference (OpenAPI)](docs/api/README.md) - Documentación de endpoints
- [📖 Downgrade Walkthrough](docs/walkthroughs/downgrade-walkthrough.md) - Guía de estabilización
